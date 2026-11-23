"""Helper script to authenticate Google Drive OAuth 2.0 locally from terminal."""
from __future__ import annotations

import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from tools.gdrive.auth import authenticate_google_drive, get_auth_status, TOKEN_PATH


def main():
    print("=" * 60)
    print("Pertamina Chatbot - Google Drive OAuth 2.0 Authenticator")
    print("=" * 60)

    # If stale token exists and is invalid, remove it
    status = get_auth_status()
    if not status.get("is_authenticated") and TOKEN_PATH.exists():
        print("Menghapus token lama yang telah kadaluarsa / dicabut...")
        TOKEN_PATH.unlink(missing_ok=True)

    print("\nMembuka browser untuk otorisasi Google Drive...")
    print("Pastikan Anda mencentang (ceklis) izin akses Google Drive di halaman persetujuan Google.\n")

    try:
        creds = authenticate_google_drive(port=0)
        new_status = get_auth_status()
        if new_status.get("is_authenticated"):
            print("\n" + "=" * 60)
            print(f"SUKSES! Akun Google Drive berhasil terhubung: {new_status.get('email')}")
            print(f"Berkas token disimpan di: {TOKEN_PATH.resolve()}")
            print("=" * 60)
        else:
            print("\nPERINGATAN: Autentikasi selesai namun status belum valid.")
            if new_status.get("error"):
                print("Error:", new_status.get("error"))
    except Exception as e:
        print("\nERROR saat autentikasi:", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
