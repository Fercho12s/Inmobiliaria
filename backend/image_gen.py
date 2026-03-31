"""
image_gen.py — Genera imagen 1080x1080 premium para Instagram usando Pillow
"""
import io
import os
from pathlib import Path
from typing import Optional

import requests
from PIL import Image, ImageDraw, ImageFont

SIZE   = (1080, 1080)
GOLD   = (201, 169, 110)
WHITE  = (255, 255, 255)
BLACK  = (0,   0,   0)

_BOLD_PATHS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
_REGULAR_PATHS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]

_font_cache: dict = {}


def _font(paths_or_path, size: int) -> ImageFont.FreeTypeFont:
    paths = paths_or_path if isinstance(paths_or_path, list) else [paths_or_path]
    key = (tuple(paths), size)
    if key in _font_cache:
        return _font_cache[key]
    for p in paths:
        try:
            f = ImageFont.truetype(p, size)
            _font_cache[key] = f
            return f
        except Exception:
            continue
    try:
        f = ImageFont.load_default(size=size)
    except TypeError:
        f = ImageFont.load_default()
    _font_cache[key] = f
    return f


def _fetch_pil(url_or_path: str) -> Optional[Image.Image]:
    p = Path(url_or_path)
    if p.is_absolute() and p.exists():
        try:
            return Image.open(str(p)).convert("RGB")
        except Exception:
            return None
    if not p.is_absolute():
        resolved = Path.cwd() / p
        if resolved.exists():
            try:
                return Image.open(str(resolved)).convert("RGB")
            except Exception:
                return None
    if url_or_path.startswith("/uploads/"):
        local = Path(os.getenv("OUTPUT_DIR", "./generated")) / "uploads" / url_or_path[len("/uploads/"):]
        if local.exists():
            try:
                return Image.open(str(local)).convert("RGB")
            except Exception:
                return None
        local2 = Path.cwd() / local
        if local2.exists():
            try:
                return Image.open(str(local2)).convert("RGB")
            except Exception:
                return None
    try:
        r = requests.get(url_or_path, timeout=10)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception:
        return None


def _crop_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    s = min(w, h)
    return img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))


def _shadow_text(draw: ImageDraw.ImageDraw, xy, text, font, fill, shadow=(0, 0, 0), offset=4, blur_passes=2):
    """Texto con sombra suave más pronunciada (glow + shadow multicapa)."""
    sx, sy = xy
    # Capa exterior de glow/sombra difusa
    for dx in range(-blur_passes, blur_passes + 1):
        for dy in range(-blur_passes, blur_passes + 1):
            a = max(0, 200 - (abs(dx) + abs(dy)) * 28)
            draw.text((sx + offset + dx, sy + offset + dy), text, font=font, fill=(*shadow, a))
    # Sombra interna más definida
    draw.text((sx + offset, sy + offset), text, font=font, fill=(*shadow, 220))
    draw.text(xy, text, font=font, fill=fill)


def _rounded_rect(draw: ImageDraw.ImageDraw, bbox, radius: int, fill):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill)


def _w(draw, text, font) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def _h(draw, text, font) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def generate_instagram_image(listing, output_path: str):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # ── Fondo ─────────────────────────────────────────────────────────────────
    images = listing.images or []
    bg: Image.Image
    if images:
        fetched = _fetch_pil(images[0])
        bg = _crop_square(fetched).resize(SIZE, Image.LANCZOS) if fetched else Image.new("RGB", SIZE, (18, 18, 24))
    else:
        bg = Image.new("RGB", SIZE, (18, 18, 24))

    # ── Overlay degradado (sin blur — foto nítida + gradiente oscuro) ─────────
    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    # Vignette superior — más alta y más oscura para que el branding se lea bien
    for y in range(290):
        a = int(90 * (1 - y / 290))
        ov_draw.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, a))

    # Degradado inferior más agresivo (comienza en 33% para mayor contraste del texto)
    grad_start = int(SIZE[1] * 0.33)
    for y in range(grad_start, SIZE[1]):
        t = (y - grad_start) / (SIZE[1] - grad_start)
        a = int(50 + t ** 1.1 * 225)
        ov_draw.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, min(255, a)))

    canvas = Image.alpha_composite(bg.convert("RGBA"), overlay)
    draw   = ImageDraw.Draw(canvas)

    # ── Fuentes ───────────────────────────────────────────────────────────────
    f_brand  = _font(_BOLD_PATHS,    32)
    f_badge  = _font(_BOLD_PATHS,    28)
    f_price  = _font(_BOLD_PATHS,    96)
    f_curr   = _font(_BOLD_PATHS,    36)
    f_title  = _font(_REGULAR_PATHS, 36)
    f_loc    = _font(_REGULAR_PATHS, 30)
    f_sv     = _font(_BOLD_PATHS,    58)
    f_sl     = _font(_REGULAR_PATHS, 24)

    PAD = 72

    # ── VENDRIXA — top left (letra a letra con tracking manual) ──────────────
    brand_x = PAD
    for ch in "VENDRIXA":
        draw.text((brand_x, PAD), ch, font=f_brand, fill=(*GOLD, 255))
        brand_x += _w(draw, ch, f_brand) + 3  # +3px extra tracking entre letras
    brand_w = brand_x - PAD - 3
    draw.line([(PAD, PAD + _h(draw, "V", f_brand) + 6), (PAD + brand_w, PAD + _h(draw, "V", f_brand) + 6)],
              fill=(*GOLD, 100), width=1)

    # ── Badge — top right (oro redondeado) ────────────────────────────────────
    badge_txt = "EN VENTA" if listing.listingType == "sale" else "EN RENTA"
    bw = _w(draw, badge_txt, f_badge) + 40
    bh = _h(draw, badge_txt, f_badge) + 20
    bx = SIZE[0] - PAD - bw
    by = PAD - 4
    _rounded_rect(draw, [bx, by, bx + bw, by + bh], radius=8, fill=(*GOLD, 255))
    draw.text((bx + 20, by + 10), badge_txt, font=f_badge, fill=(*WHITE, 255))

    # ── Precio hero ───────────────────────────────────────────────────────────
    price_val  = listing.price or 0
    price_num  = f"${price_val:,.0f}" if price_val else "Consultar"
    curr_label = listing.currency or "DOP"

    y_price = SIZE[1] - PAD - 370
    _shadow_text(draw, (PAD, y_price), price_num, f_price, (*WHITE, 255), offset=4, blur_passes=2)

    # Moneda (pequeña, oro) — alineada con base del precio
    ph = _h(draw, price_num, f_price)
    ch = _h(draw, curr_label, f_curr)
    cx = PAD + _w(draw, price_num, f_price) + 14
    cy = y_price + ph - ch - 10
    draw.text((cx, cy), curr_label, font=f_curr, fill=(*GOLD, 255))

    # ── Título ────────────────────────────────────────────────────────────────
    y_title = y_price + ph + 10
    title   = listing.title or "Propiedad"
    if len(title) > 42:
        title = title[:39] + "..."
    _shadow_text(draw, (PAD, y_title), title, f_title, (255, 255, 255, 210), offset=3, blur_passes=2)

    # ── Ubicación ─────────────────────────────────────────────────────────────
    y_loc = y_title + _h(draw, title, f_title) + 12
    loc   = f"{listing.city or ''}, {listing.state or ''}".strip(", ")
    if len(loc) > 40:
        loc = loc[:37] + "..."
    _shadow_text(draw, (PAD, y_loc), f"/ {loc}", f_loc, (255, 255, 255, 195), offset=3, blur_passes=1)

    # ── Separador ─────────────────────────────────────────────────────────────
    sep_y = y_loc + _h(draw, loc, f_loc) + 32
    draw.line([(PAD, sep_y), (SIZE[0] - PAD, sep_y)], fill=(255, 255, 255, 60), width=1)

    # ── Stats row ─────────────────────────────────────────────────────────────
    stats = []
    if listing.bedrooms:
        stats.append((str(listing.bedrooms), "RECÁMARAS"))
    if listing.bathrooms:
        stats.append((str(int(listing.bathrooms)), "BAÑOS"))
    if listing.area:
        stats.append((f"{listing.area:,.0f}", f"{listing.areaUnit}  ÁREA"))

    y_stats   = sep_y + 28
    x         = PAD
    col_width = (SIZE[0] - PAD * 2) // max(len(stats), 1)

    for i, (val, lbl) in enumerate(stats):
        _shadow_text(draw, (x, y_stats), val, f_sv, (*WHITE, 255), offset=3)
        vh = _h(draw, val, f_sv)
        draw.text((x, y_stats + vh + 8), lbl, font=f_sl, fill=(255, 255, 255, 160))

        # Divisor vertical entre stats
        if i < len(stats) - 1:
            div_x = x + col_width - 20
            draw.line(
                [(div_x, y_stats), (div_x, y_stats + vh + 8 + _h(draw, lbl, f_sl))],
                fill=(255, 255, 255, 22), width=1,
            )
        x += col_width

    # ── Línea inferior + agente ───────────────────────────────────────────────
    bot_sep = SIZE[1] - PAD - 54
    draw.line([(PAD, bot_sep), (SIZE[0] - PAD, bot_sep)], fill=(255, 255, 255, 45), width=1)
    agent_parts = [x for x in [listing.agentName, listing.agentPhone] if x]
    agent_line  = "  ·  ".join(agent_parts) if agent_parts else ""
    draw.text((PAD, bot_sep + 14), agent_line, font=f_sl, fill=(255, 255, 255, 155))

    canvas.convert("RGB").save(output_path, "JPEG", quality=97, subsampling=0)
