"""
FastAPI Router for Google Drive Knowledge Base Synchronization.
Provides endpoints to check auth status, update folder config,
trigger delta sync to PostgreSQL, and list synced files.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from tools.gdrive.auth import (
    get_auth_status,
    disconnect_google_drive,
    authenticate_google_drive,
    save_token_data,
)
from tools.gdrive.sync import (
    load_gdrive_config,
    save_gdrive_config,
    sync_google_drive,
    _load_manifest,
)
from rag.doc_loader import list_active_documents

router = APIRouter(prefix="/api/gdrive", tags=["Google Drive Knowledge Base"])


class GDriveConfigPayload(BaseModel):
    folder_id: str = Field(min_length=1, description="Google Drive Folder ID or URL")


class GDriveTokenPayload(BaseModel):
    token_json: str = Field(min_length=1, description="Raw JSON content of token.json")


class GDriveSyncPayload(BaseModel):
    folder_id: Optional[str] = Field(default=None, description="Optional override for Folder ID")
    collection_name: Optional[str] = Field(default="knowledge_base", description="Vector collection name")


@router.get("/status")
def status():
    """
    Returns current Google Drive connection status and sync configuration.
    """
    auth_info = get_auth_status()
    cfg = load_gdrive_config()
    manifest = _load_manifest()

    return {
        "status": "success",
        "is_authenticated": auth_info.get("is_authenticated", False),
        "email": auth_info.get("email"),
        "has_credentials_file": auth_info.get("has_credentials_file", False),
        "token_exists": auth_info.get("token_exists", False),
        "error": auth_info.get("error"),
        "folder_id": cfg.get("folder_id", ""),
        "last_sync": cfg.get("last_sync"),
        "total_synced_files": len(manifest),
    }


@router.post("/config")
def update_config(payload: GDriveConfigPayload):
    """
    Updates the configured Google Drive Folder ID.
    """
    raw = payload.folder_id.strip()
    # Extract folder ID if full Google Drive URL was pasted
    clean_id = raw
    if "folders/" in raw:
        clean_id = raw.split("folders/")[-1].split("?")[0].split("/")[0]

    if not clean_id:
        raise HTTPException(status_code=400, detail="Folder ID tidak valid.")

    cfg = load_gdrive_config()
    cfg["folder_id"] = clean_id
    save_gdrive_config(cfg)

    return {
        "status": "success",
        "folder_id": clean_id,
        "message": "Konfigurasi Google Drive berhasil disimpan.",
    }


@router.post("/sync")
def trigger_sync(payload: Optional[GDriveSyncPayload] = None):
    """
    Runs smart delta sync from Google Drive folder to PostgreSQL vector store.
    Synchronous def allows FastAPI to run this in its worker threadpool.
    """
    cfg = load_gdrive_config()
    target_folder = ""
    if payload and payload.folder_id and payload.folder_id.strip():
        target_folder = payload.folder_id.strip()
    else:
        target_folder = cfg.get("folder_id", "")

    if not target_folder:
        raise HTTPException(
            status_code=400,
            detail="Folder ID Google Drive belum dikonfigurasi. Masukkan Folder ID terlebih dahulu.",
        )

    collection = (payload.collection_name if payload and payload.collection_name else "knowledge_base")

    result = sync_google_drive(
        folder_id=target_folder,
        target_dir="./data",
        collection_name=collection,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message", "Sinkronisasi gagal."))

    return result


@router.get("/files")
def list_files():
    """
    Returns list of synced files from the Google Drive manifest and active documents in PostgreSQL.
    """
    manifest = _load_manifest()
    active_docs = list_active_documents()

    files = []
    for f_id, meta in manifest.items():
        files.append({
            "file_id": f_id,
            "filename": meta.get("name"),
            "md5": meta.get("md5"),
            "modified_time": meta.get("modified_time"),
            "synced_at": meta.get("synced_at"),
            "local_path": meta.get("local_path"),
        })

    return {
        "status": "success",
        "total_manifest": len(files),
        "total_active_in_db": len(active_docs),
        "files": files,
        "active_documents": active_docs,
    }


@router.post("/disconnect")
def disconnect():
    """
    Disconnects the Google Drive account by removing token.json.
    """
    try:
        disconnect_google_drive()
        return {"status": "success", "message": "Akun Google Drive berhasil diputuskan."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect")
async def connect_google_drive():
    """
    Triggers interactive Google OAuth 2.0 flow.
    Runs local server and opens browser for user to log in and grant Google Drive permissions.
    """
    try:
        await run_in_threadpool(authenticate_google_drive, port=0)
        auth_info = get_auth_status()
        if not auth_info.get("is_authenticated"):
            raise HTTPException(
                status_code=400,
                detail=auth_info.get("error") or "Gagal menyelesaikan otorisasi Google Drive.",
            )
        return {
            "status": "success",
            "message": f"Akun Google Drive ({auth_info.get('email') or 'Terhubung'}) berhasil dihubungkan!",
            "email": auth_info.get("email"),
            "is_authenticated": True,
        }
    except Exception as e:
        detail_msg = str(e)
        if "Timeout" in detail_msg or "timeout" in detail_msg:
            detail_msg = "Waktu otorisasi habis (timeout). Silakan klik coba lagi."
        raise HTTPException(status_code=500, detail=detail_msg)


@router.post("/token")
def upload_token(payload: GDriveTokenPayload):
    """
    Allows pasting token.json contents directly (useful for headless cloud server environments).
    """
    try:
        auth_info = save_token_data(payload.token_json)
        return {
            "status": "success",
            "message": f"Token berhasil disimpan! Terhubung sebagai: {auth_info.get('email') or 'Akun Google'}",
            "email": auth_info.get("email"),
            "is_authenticated": True,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
