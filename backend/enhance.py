"""
enhance.py — Mejora automática de imágenes con IA.

Cadena de fallback:
  1. ClipDrop Image Upscaling  (clipdrop-api.co)   ← principal
  2. DeepAI Super-Resolution   (api.deepai.org)     ← fallback
  3. Imagen original sin cambios                    ← último recurso

Caché: SHA-256(bytes) → generated/enhanced/{hash}.jpg
       Si ya fue procesada no se vuelve a llamar a ninguna API.
"""
import asyncio
import hashlib
import io
import os
from pathlib import Path
from typing import Optional

import httpx
from PIL import Image

# ── Endpoints de las APIs ──────────────────────────────────────────────────────
CLIPDROP_URL  = "https://clipdrop-api.co/image-upscaling/v1/upscale"
DEEPAI_URL    = "https://api.deepai.org/api/torch-srgan"
HF_MODEL_URL  = "https://api-inference.huggingface.co/models/caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr"

# Cambia este string para invalidar toda la caché global (p.ej. al actualizar la lógica)
_CACHE_VER = "v1"


# ── Utilidades internas ────────────────────────────────────────────────────────

def _cache_dir() -> Path:
    d = Path(os.getenv("OUTPUT_DIR", "./generated")) / "enhanced"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _cache_key(img_bytes: bytes) -> str:
    return hashlib.sha256(img_bytes + _CACHE_VER.encode()).hexdigest()[:24]


def _to_jpeg(raw: bytes) -> bytes:
    """Normaliza cualquier formato (webp, png, etc.) a JPEG calidad 92."""
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=92, optimize=True)
        return buf.getvalue()
    except Exception:
        return raw  # devolver tal cual si falla la conversión


def _target_size(img_bytes: bytes, max_px: int = 4096) -> tuple[int, int]:
    """
    Dimensiones objetivo para ClipDrop: 2× el original
    sin superar max_px en ningún eje (mantiene proporción).
    """
    try:
        img = Image.open(io.BytesIO(img_bytes))
        w, h = img.size
        factor = min(2.0, max_px / max(w, h, 1))
        return max(1, int(w * factor)), max(1, int(h * factor))
    except Exception:
        return 2048, 1536


async def _read_source(url: str, uploads_dir: str) -> Optional[bytes]:
    """Lee bytes de /uploads/… (local) o de una URL HTTP."""
    if url.startswith("/uploads/"):
        src = Path(uploads_dir) / url.replace("/uploads/", "")
        if src.exists():
            return src.read_bytes()
        return None
    if url.startswith(("http://", "https://")):
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                r = await c.get(url)
                r.raise_for_status()
                return r.content
        except Exception:
            pass
    return None


# ── Mejora local (sin API) ────────────────────────────────────────────────────

def _pillow_enhance(img_bytes: bytes) -> bytes:
    """
    Upscale 2× con LANCZOS + sharpen con UnsharpMask.
    Sin APIs externas, siempre disponible como último recurso.
    """
    from PIL import ImageFilter
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size
        # Upscale 2× (tope 4096px para no generar archivos gigantes)
        factor = min(2.0, 4096 / max(w, h, 1))
        new_size = (max(1, int(w * factor)), max(1, int(h * factor)))
        img = img.resize(new_size, Image.LANCZOS)
        # Sharpen: radio 1.5, amount 1.2, threshold 3
        img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=95, optimize=True, subsampling=0)
        return buf.getvalue()
    except Exception as exc:
        print(f"[enhance] Pillow fallback exc: {exc}")
        return img_bytes


# ── Backends ──────────────────────────────────────────────────────────────────

async def _clipdrop(img_bytes: bytes) -> Optional[bytes]:
    """
    Upscaling con ClipDrop (sync).
    Retorna bytes JPEG mejorados, o None si falla / sin clave.
    Códigos relevantes:
      402 → sin créditos   429 → rate-limit   400 → imagen demasiado grande
    """
    api_key = os.getenv("CLIPDROP_API_KEY", "").strip()
    if not api_key:
        return None

    tw, th = _target_size(img_bytes)
    try:
        async with httpx.AsyncClient(timeout=90) as c:
            r = await c.post(
                CLIPDROP_URL,
                headers={"x-api-key": api_key},
                data={"target_width": str(tw), "target_height": str(th)},
                files={"image_file": ("photo.jpg", img_bytes, "image/jpeg")},
            )
        if r.status_code == 200:
            return _to_jpeg(r.content)
        print(f"[enhance] ClipDrop {r.status_code}: {r.text[:200]}")
        return None
    except Exception as exc:
        print(f"[enhance] ClipDrop exc: {exc}")
        return None


async def _deepai(img_bytes: bytes) -> Optional[bytes]:
    """
    Super-resolución con DeepAI torch-srgan (4×).
    Retorna bytes JPEG mejorados, o None si falla / sin clave.
    """
    api_key = os.getenv("DEEPAI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(
                DEEPAI_URL,
                headers={"api-key": api_key},
                files={"image": ("photo.jpg", img_bytes, "image/jpeg")},
            )
        if r.status_code != 200:
            print(f"[enhance] DeepAI {r.status_code}: {r.text[:200]}")
            return None

        out_url = r.json().get("output_url")
        if not out_url:
            return None

        async with httpx.AsyncClient(timeout=60) as c2:
            r2 = await c2.get(out_url)
            r2.raise_for_status()
        return _to_jpeg(r2.content)
    except Exception as exc:
        print(f"[enhance] DeepAI exc: {exc}")
        return None


async def _huggingface(img_bytes: bytes) -> Optional[bytes]:
    """
    Super-resolución 4× con HuggingFace Inference API (Swin2SR).
    Gratuito con límites renovables; sin créditos prepagados.
    Maneja 503 (modelo cargando) con un reintento tras 20 s.
    """
    api_key = os.getenv("HF_API_KEY", "").strip()
    if not api_key:
        return None
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "image/jpeg",
    }
    try:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(HF_MODEL_URL, headers=headers, content=img_bytes)

        if r.status_code == 200:
            return _to_jpeg(r.content)

        if r.status_code == 503:
            # Modelo frío — esperar y reintentar una sola vez
            print("[enhance] HuggingFace modelo cargando, reintentando en 25 s…")
            await asyncio.sleep(25)
            async with httpx.AsyncClient(timeout=120) as c:
                r = await c.post(HF_MODEL_URL, headers=headers, content=img_bytes)
            if r.status_code == 200:
                return _to_jpeg(r.content)

        print(f"[enhance] HuggingFace {r.status_code}: {r.text[:200]}")
        return None
    except Exception as exc:
        print(f"[enhance] HuggingFace exc: {exc}")
        return None


# ── API pública ────────────────────────────────────────────────────────────────

async def enhance_url(url: str, uploads_dir: Optional[str] = None) -> str:
    """
    Mejora una imagen (path /uploads/… o URL HTTP).

    Flujo:
      1. Leer bytes de la fuente
      2. Consultar caché → si existe, retornar ruta cacheada
      3. ClipDrop → DeepAI → original (fallback)
      4. Guardar resultado en caché y retornar ruta local absoluta

    Retorna la URL original si ninguna API está disponible o ambas fallan.
    """
    udir = uploads_dir or os.path.join(
        os.getenv("OUTPUT_DIR", "./generated"), "uploads"
    )

    img_bytes = await _read_source(url, udir)
    if not img_bytes:
        return url  # no se pudo leer la fuente

    # Verificar caché
    key  = _cache_key(img_bytes)
    dest = _cache_dir() / f"{key}.jpg"
    if dest.exists():
        return str(dest)

    # 1. ClipDrop
    enhanced = await _clipdrop(img_bytes)

    # 2. DeepAI fallback
    if enhanced is None:
        enhanced = await _deepai(img_bytes)

    # 3. HuggingFace fallback
    if enhanced is None:
        enhanced = await _huggingface(img_bytes)

    # 4. Mejora local con Pillow (sharpen + upscale 2×) — siempre disponible
    if enhanced is None:
        enhanced = _pillow_enhance(img_bytes)

    dest.write_bytes(enhanced)
    return str(dest)


async def enhance_listing_images(
    images: list[str],
    uploads_dir: Optional[str] = None,
) -> list[str]:
    """
    Mejora hasta 6 imágenes de un listado con máx. 2 peticiones simultáneas.
    Si no hay ninguna clave configurada, retorna la lista original intacta.
    """
    if not images:
        return list(images)

    sem = asyncio.Semaphore(2)

    async def bounded(img: str) -> str:
        async with sem:
            return await enhance_url(img, uploads_dir=uploads_dir)

    return list(await asyncio.gather(*[bounded(img) for img in images[:6]]))
