"""
storage.py — Supabase Storage para archivos generados.

Si SUPABASE_URL / SUPABASE_SERVICE_KEY no están configuradas,
todas las funciones retornan None y el backend sigue usando disco local.
"""
import os
from pathlib import Path

import requests

SUPABASE_URL        = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET              = "vendrixa"

_CONTENT_TYPES = {
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".pdf":  "application/pdf",
    ".mp4":  "video/mp4",
}


def enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def upload(local_path: str, remote_key: str) -> str | None:
    """
    Sube un archivo local a Supabase Storage.
    Retorna la URL pública o None si falla / no está configurado.
    """
    if not enabled():
        return None

    suffix = Path(local_path).suffix.lower()
    ct     = _CONTENT_TYPES.get(suffix, "application/octet-stream")

    with open(local_path, "rb") as f:
        data = f.read()

    url  = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{remote_key}"
    resp = requests.post(
        url, data=data,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type":  ct,
            "x-upsert":      "true",
        },
        timeout=60,
    )

    if resp.status_code in (200, 201):
        return public_url(remote_key)

    return None


def public_url(remote_key: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{remote_key}"


def exists(remote_key: str) -> bool:
    if not enabled():
        return False
    try:
        r = requests.head(public_url(remote_key), timeout=5)
        return r.status_code == 200
    except Exception:
        return False
