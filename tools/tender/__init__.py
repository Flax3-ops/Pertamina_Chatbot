"""
Tender Module for Pertamina Patra Niaga Dokumen Tender Generation.
"""

try:
    from tools.tender.schema import DokumenTenderData, DOKUMEN_TENDER_JSON_SCHEMA
    from tools.tender.docx import render_tender_to_docx
    from tools.tender.generator import generate_tender_document, export_tender_to_docx
except ModuleNotFoundError:
    from .schema import DokumenTenderData, DOKUMEN_TENDER_JSON_SCHEMA
    from .docx import render_tender_to_docx
    from .generator import generate_tender_document, export_tender_to_docx

__all__ = [
    "DokumenTenderData",
    "DOKUMEN_TENDER_JSON_SCHEMA",
    "render_tender_to_docx",
    "generate_tender_document",
    "export_tender_to_docx",
]

