"""Unit test for Pertamina DP3 (Dokumen Pendukung Pemilihan Pengadaan) extraction and integration."""
from __future__ import annotations

import io
import zipfile
import unittest
import docx
import pandas as pd
from fastapi.testclient import TestClient

from tools.tender.extractor import extract_dp3_info
from api.main import app


class Dp3ExtractionTestCase(unittest.TestCase):
    def setUp(self):
        # 1. Create dummy DOCX
        doc = docx.Document()
        doc.add_heading("Spesifikasi Teknis Tangki Timbun DPPU", level=1)
        doc.add_paragraph("Pekerjaan mencakup fabrikasi dan instalasi 2 unit tangki Avtur kapasitas 1000 KL.")
        doc.add_paragraph("Kualifikasi personil: Wajib memiliki sertifikat CSMS Kategori High dan Welder 6G.")
        buf_docx = io.BytesIO()
        doc.save(buf_docx)
        self.docx_bytes = buf_docx.getvalue()

        # 2. Create dummy Excel
        df = pd.DataFrame({
            "Item": ["Pipa Carbon Steel 8 inch", "Gate Valve ANSI 150"],
            "Spesifikasi": ["ASTM A106 Gr. B", "API 600 Flanged"],
            "Jumlah": [120, 4]
        })
        buf_xlsx = io.BytesIO()
        with pd.ExcelWriter(buf_xlsx, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Spesifikasi", index=False)
        self.xlsx_bytes = buf_xlsx.getvalue()

        # 3. Create dummy TXT
        self.txt_bytes = (
            "Standar HSSE: Kontraktor harus menerapkan Golden Rules Pertamina dan CSMS Level High. "
            "Jadwal pelaksanaan: Maksimal 180 hari kalender sejak SPMK."
        ).encode("utf-8")

        # 4. Create dummy ZIP containing files + an unsupported .dwg
        buf_zip = io.BytesIO()
        with zipfile.ZipFile(buf_zip, "w") as zf:
            zf.writestr("spesifikasi_teknis.docx", self.docx_bytes)
            zf.writestr("standar_hsse.txt", self.txt_bytes)
            zf.writestr("denah_layout.dwg", b"DUMMY_CAD_BINARY_DATA")
        self.zip_bytes = buf_zip.getvalue()

    def test_extract_dp3_files_and_zip(self):
        """Verifikasi extract_dp3_info dapat mengekstrak docx, txt, dan zip serta melewati file .dwg."""
        files = [
            ("lampiran_material.xlsx", self.xlsx_bytes),
            ("paket_dokumen_dp3.zip", self.zip_bytes),
        ]
        result = extract_dp3_info(files)

        self.assertIn("files_processed", result)
        self.assertIn("files_skipped", result)
        self.assertIn("dp3_summary", result)

        processed_names = [f["filename"] for f in result["files_processed"]]
        self.assertIn("lampiran_material.xlsx", processed_names)
        self.assertIn("spesifikasi_teknis.docx", processed_names)
        self.assertIn("standar_hsse.txt", processed_names)

        # File dwg harus dilewati secara aman
        skipped_names = [s["filename"] for s in result["files_skipped"]]
        self.assertIn("denah_layout.dwg", skipped_names)

        # Summary harus memuat informasi penting
        self.assertTrue(len(result["dp3_summary"]) > 20)

    def test_extract_dp3_empty_input(self):
        """Verifikasi extract_dp3_info menangani input kosong dengan aman."""
        result = extract_dp3_info([])
        self.assertEqual([], result["files_processed"])
        self.assertEqual([], result["files_skipped"])
        self.assertEqual("", result["dp3_summary"])


class Dp3ApiEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

        # Minimal RKS docx
        doc = docx.Document()
        doc.add_heading("RENCANA KERJA DAN SYARAT-SYARAT (RKS)", level=1)
        doc.add_paragraph("Pengadaan Pekerjaan EPC Pembangunan DPPU Nusantara IKN")
        buf = io.BytesIO()
        doc.save(buf)
        self.rks_bytes = buf.getvalue()

        # DP3 text
        self.dp3_text = (
            "Lingkup Khusus: Pengadaan dan pemasangan skid hydrant pit valve. "
            "Syarat Vendor: Memiliki CSMS kategori Tinggi dan Sertifikasi Migas."
        ).encode("utf-8")

    def test_extract_context_with_dp3(self):
        """Verifikasi endpoint /api/tender/extract-context menerima dp3_files dan mereturn ringkasan DP3."""
        files = [
            ("rks_file", ("RKS_IKN.docx", self.rks_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            ("dp3_files", ("Syarat_Khusus_DP3.txt", self.dp3_text, "text/plain")),
        ]

        response = self.client.post("/api/tender/extract-context", files=files)
        self.assertEqual(200, response.status_code)

        data = response.json()
        self.assertEqual("success", data.get("status"))
        self.assertIn("combined_context_summary", data)
        self.assertIn("base_context_summary", data)
        self.assertIn("dp3_summary", data)
        self.assertIn("dp3_files_processed", data)
        self.assertTrue(len(data["dp3_files_processed"]) >= 1)
        self.assertEqual("Syarat_Khusus_DP3.txt", data["dp3_files_processed"][0]["filename"])
        self.assertIn("DOKUMEN PENDUKUNG (DP3)", data["combined_context_summary"])


if __name__ == "__main__":
    unittest.main()
