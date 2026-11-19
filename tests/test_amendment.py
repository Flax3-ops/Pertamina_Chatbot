"""Unit test for Pertamina contract amendment builder and annexes."""
from __future__ import annotations

import unittest
from docx import Document
from tools.amendment.builder import build_amendment_docx, format_rupiah_lengkap, angka_ke_terbilang
from tools.amendment.extractor import extract_context_from_contract


class AmendmentBuilderTestCase(unittest.TestCase):
    def setUp(self):
        self.mock_contract = {
            "id": "contr-test-ikn-001",
            "project_name": "Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara",
            "contract_ref": "SP-068/PND900000/2024-S0",
        }
        self.extracted = extract_context_from_contract(self.mock_contract)

    def test_extract_context_defaults(self):
        """Verifikasi ekstraksi data konteks menyertakan data default Lampiran B, C, D, G."""
        self.assertEqual("Amendemen II", self.extracted["amendment_level"])
        self.assertEqual(839, self.extracted["mpp_hari"])
        self.assertEqual(749, self.extracted["mpl_hari"])
        self.assertEqual(90, self.extracted["mpa_hari"])
        self.assertEqual("01 April 2026", self.extracted["mpl_tanggal"])
        self.assertEqual("30 Juni 2026", self.extracted["mpa_tanggal"])
        self.assertEqual("25 Juni 2027", self.extracted["tanggal_akhir_kontrak"])
        self.assertTrue(len(self.extracted["dokumen_pengadaan"]) >= 4)

    def test_build_docx_complete_package(self):
        """Verifikasi dokumen amandemen yang dihasilkan memuat Pokok-Pokok Kontrak dan semua Lampiran."""
        docx_bytes = build_amendment_docx(self.extracted)
        self.assertTrue(len(docx_bytes) > 20000)

        # Parse generated docx
        import io
        doc = Document(io.BytesIO(docx_bytes))
        full_text = "\n".join([p.text for p in doc.paragraphs])

        # Verifikasi Preamble & Pokok-Pokok Kontrak
        self.assertIn("POKOK-POKOK KONTRAK", full_text)
        self.assertIn("PT Pertamina Patra Niaga", full_text)
        self.assertIn("PT PGAS Solution", full_text)
        self.assertIn("SP-068/PND900000/2024-S0", full_text)
        self.assertIn("PORTAL AUTENTIFIKASI", full_text)

        # Verifikasi Lampiran B-I
        self.assertIn("Lampiran B-I AMENDEMEN II", full_text)
        self.assertIn("LINGKUP PEKERJAAN", full_text)
        self.assertIn("VIII. Pekerjaan Persiapan", full_text)
        self.assertIn("IX. Pekerjaan sipil dan struktur", full_text)
        self.assertIn("X. Pekerjaan mekanikal dan pemipaan", full_text)
        self.assertIn("XI. Pekerjaan Elektrikal", full_text)
        self.assertIn("XII. HSE / Fire Fighting", full_text)

        # Verifikasi Lampiran C-I
        self.assertIn("Lampiran C-I AMENDEMEN II", full_text)
        self.assertIn("HARGA KONTRAK DAN KETENTUAN PEMBAYARAN", full_text)
        self.assertIn("28.642.900.000", full_text)
        self.assertIn("KETENTUAN PEMBAYARAN:", full_text)

        # Verifikasi Lampiran D-II
        self.assertIn("Lampiran D-II AMENDEMEN II", full_text)
        self.assertIn("JANGKA WAKTU DAN JADWAL PELAKSANAAN PEKERJAAN", full_text)
        self.assertIn("MASA PENYELESAIAN PEKERJAAN (MPP) adalah selama 839", full_text)
        self.assertIn("Masa Penyelesaian Lingkup (MPL) adalah selama 749", full_text)
        self.assertIn("Masa Penyelesaian Administrasi (MPA) adalah selama 90", full_text)
        self.assertIn("01 April 2026", full_text)
        self.assertIn("30 Juni 2026", full_text)
        self.assertIn("25 Juni 2027", full_text)

        # Verifikasi Lampiran G-II
        self.assertIn("Lampiran G-II AMENDEMEN II", full_text)
        self.assertIn("LAIN-LAIN", full_text)
        self.assertIn("9. DOKUMEN PENGADAAN", full_text)
        self.assertIn("War Room dan Pembahasan Pengajuan Amendemen", full_text)
        self.assertIn("Berita Acara Klarifikasi dan Negosiasi", full_text)

        # Verifikasi Divider Page
        self.assertIn("LAMPIRAN\nAMENDEMEN", full_text)

        # Verifikasi Tabel Rekapitulasi Harga di Lampiran C-I
        self.assertTrue(len(doc.tables) >= 2)
        rekap_table = doc.tables[1]
        self.assertEqual(15, len(rekap_table.rows))
        self.assertEqual(4, len(rekap_table.columns))

    def test_custom_schedule_and_price(self):
        """Verifikasi kustomisasi nilai kontrak dan jadwal kalkulasi otomatis."""
        custom_params = dict(self.extracted)
        custom_params["nilai_pekerjaan_baru"] = 50000000000
        custom_params["mpp_hari"] = 1000
        custom_params["mpl_hari"] = 900
        custom_params["mpa_hari"] = 100
        custom_params["mpl_tanggal"] = "15 Mei 2027"
        custom_params["mpa_tanggal"] = "23 Agustus 2027"

        docx_bytes = build_amendment_docx(custom_params)
        import io
        doc = Document(io.BytesIO(docx_bytes))
        full_text = "\n".join([p.text for p in doc.paragraphs])

        self.assertIn("50.000.000.000", full_text)
        self.assertIn("1000 (seribu) HARI KALENDER", full_text)
        self.assertIn("900 (sembilan ratus) HARI KALENDER", full_text)
        self.assertIn("15 Mei 2027", full_text)
        self.assertIn("23 Agustus 2027", full_text)


if __name__ == "__main__":
    unittest.main()
