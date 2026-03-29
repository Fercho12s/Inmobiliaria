"""
carousel_gen.py — Genera slides de carrusel 1080x1080 para Instagram.

Estructura:
  Slide 1   : Foto principal + precio + título + badge tipo (igual estilo que Instagram image)
  Slides 2-N: Fotos adicionales con watermark VENDRIXA + número de slide
  Último     : Tarjeta de contacto — fondo oscuro, datos del agente, branding VENDRIXA
"""
import io
import os
from pathlib import Path
from typing import List

import requests
from PIL import Image, ImageDraw, ImageFont

SIZE  = (1080, 1080)
GOLD  = (201, 169, 110)
WHITE = (255, 255, 255)
BLACK = (0,   0,   0)
DARK  = (14,  18,  28)

FONT_BOLD    = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def _fetch_pil(url_or_path: str) -> Image.Image | None:
    p = Path(url_or_path)

    # Ruta absoluta en disco
    if p.is_absolute() and p.exists():
        try:
            return Image.open(str(p)).convert("RGB")
        except Exception:
            return None

    # Ruta relativa (ej. "generated/enhanced/abc.jpg") — resolver contra CWD
    if not p.is_absolute():
        resolved = Path.cwd() / p
        if resolved.exists():
            try:
                return Image.open(str(resolved)).convert("RGB")
            except Exception:
                return None

    # URL relativa /uploads/... — buscar el archivo localmente
    if url_or_path.startswith("/uploads/"):
        local = Path(os.getenv("OUTPUT_DIR", "./generated")) / "uploads" / url_or_path[len("/uploads/"):]
        if local.exists():
            try:
                return Image.open(str(local)).convert("RGB")
            except Exception:
                return None
        # Fallback: resolver la ruta relativa del OUTPUT_DIR
        local2 = (Path.cwd() / local)
        if local2.exists():
            try:
                return Image.open(str(local2)).convert("RGB")
            except Exception:
                return None

    # URL HTTP/HTTPS
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


def _w(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    return draw.textbbox((0, 0), text, font=font)[2]


def _h(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def _shadow_text(draw, xy, text, font, fill, offset=4):
    sx, sy = xy
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            a = max(0, 180 - (abs(dx) + abs(dy)) * 30)
            draw.text((sx + offset + dx, sy + offset + dy), text, font=font, fill=(0, 0, 0, a))
    draw.text((sx + offset, sy + offset), text, font=font, fill=(0, 0, 0, 200))
    draw.text(xy, text, font=font, fill=fill)


def _brand_watermark(draw: ImageDraw.ImageDraw, f_brand):
    """Watermark VENDRIXA abajo a la derecha."""
    PAD = 40
    x = PAD
    brand_x = x
    for ch in "VENDRIXA":
        draw.text((brand_x, SIZE[1] - PAD - 28), ch, font=f_brand, fill=(*GOLD, 180))
        brand_x += _w(draw, ch, f_brand) + 2


def _slide_cover(listing) -> Image.Image:
    """Slide 1: foto principal con overlay premium + precio + título + badge."""
    images = listing.images or []
    if images:
        fetched = _fetch_pil(images[0])
        bg = _crop_square(fetched).resize(SIZE, Image.LANCZOS) if fetched else Image.new("RGB", SIZE, DARK)
    else:
        bg = Image.new("RGB", SIZE, DARK)

    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ov_d = ImageDraw.Draw(overlay)

    # Degradado superior ligero
    for y in range(220):
        a = int(70 * (1 - y / 220))
        ov_d.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, a))

    # Degradado inferior fuerte
    grad_start = int(SIZE[1] * 0.38)
    for y in range(grad_start, SIZE[1]):
        t = (y - grad_start) / (SIZE[1] - grad_start)
        a = int(60 + t ** 1.1 * 220)
        ov_d.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, min(255, a)))

    canvas = Image.alpha_composite(bg.convert("RGBA"), overlay)
    draw   = ImageDraw.Draw(canvas)

    f_brand = _font(FONT_BOLD, 28)
    f_badge = _font(FONT_BOLD, 26)
    f_price = _font(FONT_BOLD, 88)
    f_curr  = _font(FONT_BOLD, 32)
    f_title = _font(FONT_REGULAR, 34)
    f_loc   = _font(FONT_REGULAR, 26)
    f_sv    = _font(FONT_BOLD, 52)
    f_sl    = _font(FONT_REGULAR, 22)

    PAD = 68

    # Brand top-left
    brand_x = PAD
    for ch in "VENDRIXA":
        draw.text((brand_x, PAD), ch, font=f_brand, fill=(*GOLD, 255))
        brand_x += _w(draw, ch, f_brand) + 3

    # Badge top-right
    badge_txt = "EN VENTA" if listing.listingType in ("sale", "venta") else "EN RENTA"
    bw = _w(draw, badge_txt, f_badge) + 36
    bh = _h(draw, badge_txt, f_badge) + 18
    bx = SIZE[0] - PAD - bw
    draw.rounded_rectangle([bx, PAD - 4, bx + bw, PAD - 4 + bh], radius=6, fill=(*GOLD, 255))
    draw.text((bx + 18, PAD + 5), badge_txt, font=f_badge, fill=(*WHITE, 255))

    # Precio
    price_txt = f"${listing.price:,.0f}"
    y_price   = SIZE[1] - PAD - 340
    _shadow_text(draw, (PAD, y_price), price_txt, f_price, (*WHITE, 255))
    ph = _h(draw, price_txt, f_price)
    cx = PAD + _w(draw, price_txt, f_price) + 12
    cy = y_price + ph - _h(draw, listing.currency, f_curr) - 8
    draw.text((cx, cy), listing.currency, font=f_curr, fill=(*GOLD, 255))

    # Título
    y_title = y_price + ph + 8
    title   = listing.title[:40] + "..." if len(listing.title) > 40 else listing.title
    _shadow_text(draw, (PAD, y_title), title, f_title, (255, 255, 255, 210))

    # Ubicación
    y_loc = y_title + _h(draw, title, f_title) + 10
    loc   = f"/ {listing.city}, {listing.state}"[:42]
    _shadow_text(draw, (PAD, y_loc), loc, f_loc, (255, 255, 255, 180))

    # Separador
    sep_y = y_loc + _h(draw, loc, f_loc) + 28
    draw.line([(PAD, sep_y), (SIZE[0] - PAD, sep_y)], fill=(255, 255, 255, 55), width=1)

    # Stats
    stats = []
    if listing.bedrooms:  stats.append((str(listing.bedrooms),          "RECÁMARAS"))
    if listing.bathrooms: stats.append((str(int(listing.bathrooms)),    "BAÑOS"))
    if listing.area:      stats.append((f"{listing.area:,.0f}",         f"{listing.areaUnit} ÁREA"))

    y_stats   = sep_y + 24
    col_width = (SIZE[0] - PAD * 2) // max(len(stats), 1)
    x = PAD
    for i, (val, lbl) in enumerate(stats):
        _shadow_text(draw, (x, y_stats), val, f_sv, (*WHITE, 255), offset=3)
        vh = _h(draw, val, f_sv)
        draw.text((x, y_stats + vh + 6), lbl, font=f_sl, fill=(255, 255, 255, 150))
        if i < len(stats) - 1:
            div_x = x + col_width - 18
            draw.line([(div_x, y_stats), (div_x, y_stats + vh + 30)], fill=(255, 255, 255, 20), width=1)
        x += col_width

    # Slide indicator (1 de N) — se actualiza al guardar
    draw.text((SIZE[0] - PAD - 30, PAD + 4), "1", font=_font(FONT_BOLD, 22), fill=(*WHITE, 120))

    return canvas.convert("RGB")


def _slide_photo(img_url_or_path: str, slide_num: int, total: int) -> Image.Image:
    """Slides intermedios: foto limpia con watermark mínimo."""
    fetched = _fetch_pil(img_url_or_path)
    if fetched:
        bg = _crop_square(fetched).resize(SIZE, Image.LANCZOS)
    else:
        bg = Image.new("RGB", SIZE, DARK)

    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ov_d = ImageDraw.Draw(overlay)
    # Solo vignette muy suave en bordes
    for y in range(120):
        a = int(40 * (1 - y / 120))
        ov_d.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, a))
    for y in range(SIZE[1] - 120, SIZE[1]):
        a = int(80 * ((y - (SIZE[1] - 120)) / 120))
        ov_d.line([(0, y), (SIZE[0], y)], fill=(0, 0, 0, a))

    canvas = Image.alpha_composite(bg.convert("RGBA"), overlay)
    draw   = ImageDraw.Draw(canvas)

    f_brand = _font(FONT_BOLD, 22)
    f_num   = _font(FONT_BOLD, 20)

    _brand_watermark(draw, f_brand)

    # Indicador de slide
    indicator = f"{slide_num}/{total}"
    ix = SIZE[0] - 48 - _w(draw, indicator, f_num)
    draw.text((ix, 40), indicator, font=f_num, fill=(255, 255, 255, 120))

    return canvas.convert("RGB")


def _slide_contact(listing, total: int) -> Image.Image:
    """Último slide: tarjeta de contacto premium sobre fondo oscuro."""
    bg   = Image.new("RGB", SIZE, DARK)
    draw = ImageDraw.Draw(bg)

    # Líneas decorativas de fondo
    for i in range(0, SIZE[0], 80):
        draw.line([(i, 0), (i, SIZE[1])], fill=(255, 255, 255, 4), width=1)
    for i in range(0, SIZE[1], 80):
        draw.line([(0, i), (SIZE[0], i)], fill=(255, 255, 255, 4), width=1)

    f_vendrixa = _font(FONT_BOLD,    72)
    f_label    = _font(FONT_BOLD,    22)
    f_value    = _font(FONT_REGULAR, 38)
    f_small    = _font(FONT_REGULAR, 26)
    f_tagline  = _font(FONT_REGULAR, 28)

    # VENDRIXA centrado grande
    brand_chars = "VENDRIXA"
    brand_w = sum(_w(draw, c, f_vendrixa) + 4 for c in brand_chars) - 4
    bx = (SIZE[0] - brand_w) // 2
    for ch in brand_chars:
        draw.text((bx, 180), ch, font=f_vendrixa, fill=(*GOLD, 255))
        bx += _w(draw, ch, f_vendrixa) + 4

    # Línea dorada
    draw.line([(140, 310), (SIZE[0] - 140, 310)], fill=(*GOLD, 80), width=1)

    # Tagline
    tagline = "PROPIEDADES EXCLUSIVAS"
    tw = _w(draw, tagline, f_tagline)
    draw.text(((SIZE[0] - tw) // 2, 336), tagline, font=f_tagline, fill=(255, 255, 255, 100))

    # Agente
    agent_name = listing.agentName or ""
    aw = _w(draw, agent_name, f_value)
    draw.text(((SIZE[0] - aw) // 2, 480), agent_name, font=f_value, fill=(*WHITE, 255))

    # Datos de contacto
    contact_items = []
    if listing.agentPhone: contact_items.append(listing.agentPhone)
    if listing.agentEmail: contact_items.append(listing.agentEmail)

    y_c = 560
    for item in contact_items:
        iw = _w(draw, item, f_small)
        draw.text(((SIZE[0] - iw) // 2, y_c), item, font=f_small, fill=(255, 255, 255, 170))
        y_c += 52

    # Línea inferior
    draw.line([(140, y_c + 30), (SIZE[0] - 140, y_c + 30)], fill=(*GOLD, 50), width=1)

    # Slide indicator
    f_num = _font(FONT_BOLD, 20)
    indicator = f"{total}/{total}"
    ix = SIZE[0] - 60 - _w(draw, indicator, f_num)
    draw.text((ix, 48), indicator, font=f_num, fill=(255, 255, 255, 120))

    # VENDRIXA watermark bottom-left
    f_brand_sm = _font(FONT_BOLD, 22)
    _brand_watermark(draw, f_brand_sm)

    return bg


def generate_carousel(listing, output_dir: str) -> List[str]:
    """
    Genera los slides del carrusel y los guarda en output_dir.
    Devuelve lista de rutas absolutas a los JPEGs.
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    images  = listing.images or []
    paths: List[str] = []

    # Slide 1 — portada con foto principal
    total = 1 + max(len(images) - 1, 0) + 1  # cover + extras + contact
    slide1 = _slide_cover(listing)
    p1 = os.path.join(output_dir, f"slide_01.jpg")
    slide1.save(p1, "JPEG", quality=95, subsampling=0)
    paths.append(p1)

    # Slides intermedios — fotos adicionales
    for i, img_url in enumerate(images[1:], start=2):
        slide = _slide_photo(img_url, i, total)
        p = os.path.join(output_dir, f"slide_{i:02d}.jpg")
        slide.save(p, "JPEG", quality=95, subsampling=0)
        paths.append(p)

    # Último slide — contacto
    slide_last = _slide_contact(listing, total)
    p_last = os.path.join(output_dir, f"slide_{total:02d}.jpg")
    slide_last.save(p_last, "JPEG", quality=95, subsampling=0)
    paths.append(p_last)

    return paths


def get_carousel_dir(listing_id: int, output_dir: str) -> str:
    return os.path.join(output_dir, "carousels", str(listing_id))
