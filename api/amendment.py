"""
FastAPI Router for Pertamina Contract Amendment Generation.
Provides RESTful endpoints for the React frontend:
- GET  /api/amendment/contracts                - list available contracts (+ default IKN template)
- GET  /api/amendment/contract-context/{id}    - get pre-filled context parameters
- POST /api/amendment/generate                 - generate complete DOCX with Lampiran B-I, C-I, D-II, G-II
- GET  /api/amendment/download/{filename}      - download generated DOCX file
- GET  /api/amendment/list                     - list recent generated amendments
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from tools.tender.contract_archive import ContractArchive
from tools.amendment.archive import AmendmentArchive
from tools.amendment.builder import build_amendment_docx
from tools.amendment.extractor import extract_context_from_contract

router = APIRouter(prefix="/api/amendment", tags=["amendment"])

OUTPUT_DIR = Path("./output")


class AmendmentGenerateRequest(BaseModel):
    contract_id: Optional[str] = "template_ikn"
    project_name: str = Field(default="Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara", min_length=1)
    contract_ref: str = "SP-068/PND900000/2024-S0"
    contract_date: str = "25 April 2024"
    amendment_level: str = "Amendemen II"
    tanggal_amendemen: str = ""
    company_name: str = "PT Pertamina Patra Niaga"
    company_office: str = "Jakarta Selatan dan berkantor pusat di Gedung Wisma Tugu II Lantai 2, Jalan HR. Rasuna Said Kav. C7-9, Kota Administrasi Jakarta Selatan, Provinsi DKI Jakarta"
    company_rep_name: str = "Riki Madyanto"
    company_rep_title: str = "Sr. Manager Opt. & Maint. Kalimantan"
    contractor_name: str = "PT PGAS Solution"
    contractor_office: str = "Jakarta Pusat dan berkantor pusat di Jakarta"
    contractor_rep_name: str = "Heru Indriatno"
    contractor_rep_title: str = "Direktur Teknik dan Pengembangan"
    nilai_pekerjaan_baru: float = Field(default=28642900000.0, ge=0)
    tanggal_sp3mk: str = "14 Maret 2024"
    nomor_sp3mk: str = "SP3MK-007/PND900000/2024-S0"
    durasi_bulan_pemeliharaan: int = 6
    tanggal_berlaku_amendemen: str = "04 September 2025"
    mpp_hari: int = 839
    mpl_hari: int = 749
    mpa_hari: int = 90
    mpl_tanggal: str = "01 April 2026"
    mpa_tanggal: str = "30 Juni 2026"
    durasi_kontrak_hari: int = 180
    tanggal_akhir_kontrak: str = "25 Juni 2027"
    lingkup_pekerjaan: Optional[str] = None
    tambahan_pekerjaan: Optional[str] = None
    dasar_dokumen: Optional[List[str]] = None
    dokumen_pengadaan: Optional[List[str]] = None
    portal_autentifikasi: str = "https://tte.komdigi.go.id/verifyPDF"


@router.get("/contracts")
def list_available_contracts():
    """
    Returns contracts available in Gudang Kontrak plus the official DPPU IKN template.
    """
    items = [
        {
            "id": "template_ikn",
            "project_name": "Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara",
            "contract_ref": "SP-068/PND900000/2024-S0",
            "contract_date": "25 April 2024",
            "contractor_name": "PT PGAS Solution",
            "is_default_template": True,
        }
    ]
    try:
        archive = ContractArchive()
        db_contracts = archive.list()
        for c in db_contracts:
            items.append({
                "id": c["id"],
                "project_name": c["project_name"],
                "contract_ref": c.get("contract_filename", ""),
                "contract_date": c.get("created_at", "")[:10] if c.get("created_at") else "",
                "contractor_name": "Kontraktor Terdaftar",
                "is_default_template": False,
            })
    except Exception:
        pass
    return {"contracts": items}


@router.get("/contract-context/{contract_id}")
def get_contract_context(contract_id: str):
    """
    Returns initial extracted parameters and default annex data for the selected contract.
    """
    if contract_id == "template_ikn":
        contract_data = {
            "id": "template_ikn",
            "project_name": "Pembangunan DPPU Nusantara Ibu Kota Negara (IKN) – Penajam Paser Utara",
            "contract_ref": "SP-068/PND900000/2024-S0",
            "docx": b"",
        }
    else:
        try:
            archive = ContractArchive()
            contract_data = archive.get(contract_id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Kontrak tidak ditemukan: {e}")

    extracted = extract_context_from_contract(contract_data)
    return {"context": extracted}


@router.post("/generate")
def generate_amendment(payload: AmendmentGenerateRequest):
    """
    Generates complete DOCX amendment package (Pokok-Pokok Kontrak + Lampiran B-I, C-I, D-II, G-II & Divider).
    """
    try:
        params = payload.model_dump()
        docx_bytes = build_amendment_docx(params)

        amend_id = ""
        try:
            archive = AmendmentArchive()
            amend_id = archive.save(
                project_name=payload.project_name,
                amendment_level=payload.amendment_level,
                amendment_docx=docx_bytes,
                contract_draft_id=payload.contract_id if payload.contract_id != "template_ikn" else None,
                metadata=params,
            )
        except Exception:
            # Fallback if DB is unavailable: generate random ID and save file to disk
            from uuid import uuid4
            amend_id = uuid4().hex

        clean_proj = re.sub(r"[^\w\s-]", "", payload.project_name).strip()[:25].replace(" ", "_")
        clean_lvl = payload.amendment_level.replace(" ", "_")
        filename = f"{clean_lvl}_{clean_proj}_{amend_id[:8]}.docx"

        # Ensure saved to ./output directory
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_file = OUTPUT_DIR / filename
        out_file.write_bytes(docx_bytes)

        return {
            "status": "success",
            "message": "Dokumen Amandemen berhasil digenerate lengkap dengan Lampiran B-I, C-I, D-II, G-II, dan Lembar Pembatas!",
            "filename": filename,
            "download_url": f"/api/amendment/download/{filename}",
            "amendment_id": amend_id,
            "project_name": payload.project_name,
            "amendment_level": payload.amendment_level,
            "annexes": [
                "Pokok-Pokok Kontrak (3 Halaman & Tabel Tanda Tangan)",
                "Lampiran B-I (Lingkup Pekerjaan Persiapan, Sipil, Mekanikal, Elektrikal, HSE)",
                "Lampiran C-I (Tabel Rekapitulasi Harga 15 Baris & Margin 8%)",
                f"Lampiran D-II (Jadwal MPP {payload.mpp_hari} Hari, MPL {payload.mpl_hari} Hari, MPA {payload.mpa_hari} Hari)",
                "Lampiran G-II (4 Dokumen Pengadaan & Berita Acara)",
                "Lembar Pembatas Resmi (LAMPIRAN AMENDEMEN)"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyusun dokumen amandemen: {e}") from e


@router.get("/download/{filename}")
def download_amendment_docx(filename: str):
    """
    Serves the generated amendment DOCX file for download.
    """
    safe_filename = os.path.basename(filename)
    file_path = OUTPUT_DIR / safe_filename

    if not file_path.exists():
        candidates = list(OUTPUT_DIR.glob(f"**/{safe_filename}"))
        if candidates:
            file_path = candidates[0]
        else:
            raise HTTPException(status_code=404, detail=f"File amandemen {safe_filename} tidak ditemukan.")

    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        content_disposition_type="attachment",
    )


@router.get("/list")
def list_amendments():
    """
    Returns list of recently generated amendments.
    """
    try:
        archive = AmendmentArchive()
        return {"amendments": archive.list()}
    except Exception:
        return {"amendments": []}
