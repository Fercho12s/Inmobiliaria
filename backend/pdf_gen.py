"""
pdf_gen.py — Genera brochure PDF premium usando Chromium headless + HTML/CSS
"""
import base64
import os
import subprocess
import tempfile
from pathlib import Path

import requests

CHROMIUM = os.getenv("REMOTION_CHROME_EXECUTABLE", "chromium")


def _fetch_b64(url_or_path: str) -> str | None:
    p = Path(url_or_path)
    if p.is_absolute() and p.exists():
        try:
            data = p.read_bytes()
            b64  = base64.b64encode(data).decode()
            return f"data:image/jpeg;base64,{b64}"
        except Exception:
            return None
    # URL HTTP
    try:
        r = requests.get(url_or_path, timeout=10)
        r.raise_for_status()
        ct  = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
        b64 = base64.b64encode(r.content).decode()
        return f"data:{ct};base64,{b64}"
    except Exception:
        return None


def _build_html(listing, imgs_b64: list[str]) -> str:
    op        = "EN VENTA" if listing.listingType == "sale" else "EN RENTA"
    price_fmt = f"${listing.price:,.0f} {listing.currency}"
    location  = f"{listing.address}, {listing.city}"
    area_str  = f"{listing.area:,.0f}"
    cover     = imgs_b64[0] if imgs_b64 else ""

    # Descripción
    desc_html = ""
    if listing.generatedDescription:
        for p in listing.generatedDescription.split("\n"):
            if p.strip():
                desc_html += f"<p>{p.strip()}</p>"
    if not desc_html:
        desc_html = "<p>Propiedad disponible. Contáctenos para más información.</p>"

    # Amenidades — SVG check en lugar de carácter Unicode
    CHECK_SVG = (
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" '
        'xmlns="http://www.w3.org/2000/svg">'
        '<circle cx="8" cy="8" r="7.5" stroke="#C9A96E" stroke-width="1"/>'
        '<polyline points="4.5,8.5 7,11 11.5,5.5" stroke="#C9A96E" '
        'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
        '</svg>'
    )
    am_html = ""
    if listing.amenities:
        for a in listing.amenities:
            am_html += f'<div class="am-item"><span class="am-check">{CHECK_SVG}</span>{a}</div>'

    # Galería
    gal_html = ""
    for b64 in imgs_b64[1:7]:
        gal_html += f'<img src="{b64}" class="gal-img"/>'

    # Páginas opcionales
    am_page = ""
    if am_html:
        am_page = f"""
        <div class="page">
          <div class="ph"><span class="brand">Vendrixa</span><span class="pnum">04</span></div>
          <div class="sec-label">Amenidades</div>
          <h2>Lo que incluye</h2>
          <div class="am-grid">{am_html}</div>
        </div>"""

    gal_page = ""
    if gal_html:
        gal_page = f"""
        <div class="page">
          <div class="ph"><span class="brand">Vendrixa</span><span class="pnum">05</span></div>
          <div class="sec-label">Galería</div>
          <h2>La propiedad</h2>
          <div class="gal-grid">{gal_html}</div>
        </div>"""

    cover_img = (f'<img src="{cover}" style="width:100%;height:100%;object-fit:cover;display:block;"/>'
                 if cover else
                 '<div style="width:100%;height:100%;background:#1a1a22;"></div>')

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  @page {{ margin:0; size:A4; }}
  body {{ font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#1a1a1a; background:#fff; }}

  /* ─── PORTADA ──────────────────────────────────────────── */
  .cover {{
    width:210mm; height:297mm; position:relative;
    overflow:hidden; page-break-after:always; background:#0B0B0F;
  }}
  .cover-overlay {{
    position:absolute; inset:0;
    background:linear-gradient(
      to bottom,
      rgba(0,0,0,0.08) 0%,
      rgba(0,0,0,0.10) 35%,
      rgba(0,0,0,0.70) 65%,
      rgba(0,0,0,0.93) 100%
    );
  }}
  .cover-content {{
    position:absolute; bottom:0; left:0; right:0;
    padding:54px 52px 62px;
  }}
  .badge {{
    display:inline-block; background:#C9A96E; color:#fff;
    font-size:10px; font-weight:700; letter-spacing:3px;
    padding:7px 16px; border-radius:3px; margin-bottom:28px;
    text-transform:uppercase;
  }}
  .cover-price {{
    font-size:56px; font-weight:900; color:#fff;
    line-height:1; margin-bottom:16px; letter-spacing:-2px;
  }}
  .cover-title {{
    font-size:20px; font-weight:300; color:rgba(255,255,255,0.80);
    margin-bottom:10px; letter-spacing:0.2px;
  }}
  .cover-loc {{
    font-size:13px; color:rgba(255,255,255,0.48);
    font-weight:300; letter-spacing:0.5px;
  }}
  .cover-stats {{
    display:flex; gap:48px; margin-top:34px;
    padding-top:28px; border-top:1px solid rgba(255,255,255,0.12);
  }}
  .cs-val {{ font-size:30px; font-weight:800; color:#fff; display:block; letter-spacing:-0.5px; }}
  .cs-lbl {{
    font-size:9px; font-weight:500; letter-spacing:2px;
    text-transform:uppercase; color:rgba(255,255,255,0.38);
    margin-top:4px; display:block;
  }}
  .cover-brand {{
    position:absolute; top:40px; left:52px;
    font-size:13px; font-weight:700; letter-spacing:4px;
    color:#C9A96E; text-transform:uppercase;
  }}

  /* ─── PÁGINAS INTERNAS ─────────────────────────────────── */
  .page {{
    width:210mm; min-height:297mm; padding:50px 52px 54px;
    page-break-after:always; position:relative;
  }}
  .page:last-child {{ page-break-after:auto; }}
  .ph {{
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:46px; padding-bottom:18px;
    border-bottom:1.5px solid #F0EDE8;
  }}
  .brand   {{ font-size:12px; font-weight:700; letter-spacing:3.5px; color:#C9A96E; text-transform:uppercase; }}
  .pnum    {{ font-size:11px; color:#CCCCCC; font-weight:300; }}
  .sec-label {{
    font-size:9px; font-weight:700; letter-spacing:3px;
    text-transform:uppercase; color:#C9A96E; margin-bottom:14px;
  }}
  h2 {{
    font-size:30px; font-weight:800; color:#0B0B0F;
    margin-bottom:30px; letter-spacing:-0.5px; line-height:1.15;
  }}

  /* Descripción */
  .desc p {{
    font-size:13px; line-height:1.9; color:#3C3C3C;
    font-weight:300; margin-bottom:16px; max-width:570px;
  }}

  /* Stats grid */
  .stats {{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }}
  .stat {{
    background:#F8F7F4; border:1px solid #EDEAE4;
    border-radius:8px; padding:26px 18px; text-align:center;
    border-top:3px solid #C9A96E;
  }}
  .s-icon  {{ display:block; margin:0 auto 12px; width:28px; height:28px; }}
  .s-icon svg {{ width:28px; height:28px; }}
  .s-val   {{
    font-size:32px; font-weight:900; color:#0B0B0F;
    display:block; letter-spacing:-1px; line-height:1;
  }}
  .s-val-sm {{ font-size:18px; letter-spacing:-0.3px; }}
  .s-lbl   {{
    font-size:9px; font-weight:600; letter-spacing:2px;
    text-transform:uppercase; color:#AAAAAA; margin-top:8px; display:block;
  }}

  /* Amenidades */
  .am-grid {{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }}
  .am-item {{
    font-size:12.5px; color:#3a3a3a; padding:13px 16px;
    background:#F8F7F4; border-radius:6px; border:1px solid #EDEAE4;
    display:flex; align-items:center; gap:10px;
  }}
  .am-check {{ display:flex; align-items:center; flex-shrink:0; }}

  /* Galería */
  .gal-grid {{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }}
  .gal-img  {{ width:100%; height:170px; object-fit:cover; border-radius:6px; display:block; }}

  /* Contacto */
  .contact-page {{ background:#0B0B0F !important; }}
  .contact-page .ph    {{ border-bottom-color:rgba(255,255,255,0.08); }}
  .contact-page .brand {{ color:#C9A96E; }}
  .contact-page .pnum  {{ color:rgba(255,255,255,0.3); }}
  .contact-page .sec-label {{ color:rgba(201,169,110,0.7); }}
  .contact-page h2     {{ color:#fff; }}
  .crow {{
    display:flex; align-items:center; gap:24px;
    padding:20px 0; border-bottom:1px solid rgba(255,255,255,0.07);
  }}
  .crow:last-child {{ border-bottom:none; }}
  .clbl {{
    font-size:9px; font-weight:600; letter-spacing:2.5px;
    text-transform:uppercase; color:rgba(255,255,255,0.28);
    width:90px; flex-shrink:0;
  }}
  .cval {{ font-size:18px; font-weight:300; color:#fff; letter-spacing:0.2px; }}
  .cta {{
    margin-top:60px; font-size:13px; color:rgba(255,255,255,0.32);
    font-weight:300; line-height:1.8;
  }}
  .cta strong {{ color:#C9A96E; font-weight:600; display:block; font-size:16px; margin-bottom:6px; }}

  @media print {{
    * {{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }}
  }}
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  {cover_img}
  <div class="cover-overlay"></div>
  <div class="cover-brand">Vendrixa</div>
  <div class="cover-content">
    <div class="badge">{op}</div>
    <div class="cover-price">{price_fmt}</div>
    <div class="cover-title">{listing.title}</div>
    <div class="cover-loc">— {location}</div>
    <div class="cover-stats">
      <div><span class="cs-val">{listing.bedrooms}</span><span class="cs-lbl">Recámaras</span></div>
      <div><span class="cs-val">{int(listing.bathrooms)}</span><span class="cs-lbl">Baños</span></div>
      <div><span class="cs-val">{area_str}</span><span class="cs-lbl">{listing.areaUnit}</span></div>
    </div>
  </div>
</div>

<!-- DESCRIPCIÓN -->
<div class="page">
  <div class="ph"><span class="brand">Vendrixa</span><span class="pnum">02</span></div>
  <div class="sec-label">Descripción</div>
  <h2>{listing.title}</h2>
  <div class="desc">{desc_html}</div>
</div>

<!-- DATOS CLAVE -->
<div class="page">
  <div class="ph"><span class="brand">Vendrixa</span><span class="pnum">03</span></div>
  <div class="sec-label">Características</div>
  <h2>Datos de la propiedad</h2>
  <div class="stats">
    <div class="stat">
      <span class="s-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
      <span class="s-val s-val-sm">{price_fmt}</span>
      <span class="s-lbl">Precio</span>
    </div>
    <div class="stat">
      <span class="s-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v11h18V9"/><path d="M3 9a9 9 0 0 1 18 0"/><line x1="12" y1="9" x2="12" y2="20"/></svg></span>
      <span class="s-val">{listing.bedrooms}</span>
      <span class="s-lbl">Recámaras</span>
    </div>
    <div class="stat">
      <span class="s-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 12a8 8 0 0 1 16 0v7H4v-7z"/><line x1="4" y1="19" x2="4" y2="21"/><line x1="20" y1="19" x2="20" y2="21"/></svg></span>
      <span class="s-val">{int(listing.bathrooms)}</span>
      <span class="s-lbl">Baños</span>
    </div>
    <div class="stat">
      <span class="s-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></span>
      <span class="s-val">{area_str}</span>
      <span class="s-lbl">{listing.areaUnit.upper()}</span>
    </div>
    <div class="stat">
      <span class="s-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
      <span class="s-val s-val-sm">{listing.propertyType}</span>
      <span class="s-lbl">Tipo</span>
    </div>
    <div class="stat">
      <span class="s-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></span>
      <span class="s-val" style="font-size:15px;letter-spacing:0px">{op}</span>
      <span class="s-lbl">Operación</span>
    </div>
  </div>
</div>

{am_page}
{gal_page}

<!-- CONTACTO -->
<div class="page contact-page">
  <div class="ph"><span class="brand">Vendrixa</span><span class="pnum">Contacto</span></div>
  <div class="sec-label">Agente</div>
  <h2>Hablemos de esta propiedad</h2>
  <div>
    <div class="crow"><span class="clbl">Agente</span><span class="cval">{listing.agentName}</span></div>
    <div class="crow"><span class="clbl">Teléfono</span><span class="cval">{listing.agentPhone}</span></div>
    <div class="crow"><span class="clbl">Email</span><span class="cval">{listing.agentEmail}</span></div>
  </div>
  <div class="cta">
    <strong>Contáctanos para más información</strong>
    Estamos disponibles para agendar una visita<br>
    o resolver cualquier consulta sobre esta propiedad.
  </div>
</div>

</body>
</html>"""


def generate_pdf(listing, output_path: str):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    imgs_b64 = []
    for url in (listing.images or [])[:7]:
        b64 = _fetch_b64(url)
        if b64:
            imgs_b64.append(b64)

    html = _build_html(listing, imgs_b64)

    with tempfile.NamedTemporaryFile(
        suffix=".html", delete=False, mode="w", encoding="utf-8"
    ) as f:
        f.write(html)
        tmp_html = f.name

    try:
        subprocess.run(
            [
                CHROMIUM,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--run-all-compositor-stages-before-draw",
                "--print-to-pdf-no-header",
                f"--print-to-pdf={output_path}",
                f"file://{tmp_html}",
            ],
            capture_output=True,
            timeout=45,
            check=True,
        )
    except subprocess.CalledProcessError:
        # Fallback: versión anterior de chromium sin --headless=new
        subprocess.run(
            [
                CHROMIUM,
                "--headless",
                "--disable-gpu",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--print-to-pdf-no-header",
                f"--print-to-pdf={output_path}",
                f"file://{tmp_html}",
            ],
            capture_output=True,
            timeout=45,
            check=True,
        )
    finally:
        os.unlink(tmp_html)
