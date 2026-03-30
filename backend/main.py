import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
import schemas
import ai
import pdf_gen
import image_gen
import carousel_gen
import instagram as ig_module
import video_gen
import enhance as enhance_module
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vendrixa API", version="1.0.0")

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR   = os.getenv("OUTPUT_DIR", "./generated")
UPLOADS_DIR  = Path(OUTPUT_DIR) / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


class _WithImages:
    """Proxy sobre el modelo SQLAlchemy que sobreescribe .images con rutas mejoradas."""
    def __init__(self, base, images: list):
        self._base  = base
        self.images = images
    def __getattr__(self, name):
        return getattr(self._base, name)


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_IMAGE_EXTS  = {"jpg", "jpeg", "png", "webp", "gif"}


def _get_or_404(listing_id: int, db: Session):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return listing


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/healthz")
def health():
    return {"status": "ok"}


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.get("/api/auth/user")
def get_user():
    return {"user": None, "isAuthenticated": False}

@app.get("/api/login")
def login():
    return RedirectResponse(url="/")

@app.get("/api/logout")
def logout():
    return RedirectResponse(url="/")


# ── Upload de imágenes ────────────────────────────────────────────────────────

@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Tipo de archivo no permitido. Usa JPG, PNG o WebP.")
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        ext = "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOADS_DIR / filename
    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return {"url": f"/uploads/{filename}"}


# ── Listings CRUD ─────────────────────────────────────────────────────────────

@app.get("/api/listings", response_model=List[schemas.Listing])
def get_listings(
    skip:  int          = Query(0,    ge=0),
    limit: int          = Query(100,  ge=1, le=500),
    q:     Optional[str]= Query(None, description="Buscar en título/dirección"),
    city:  Optional[str]= Query(None),
    type:  Optional[str]= Query(None, description="listingType: sale|rent"),
    db:    Session      = Depends(get_db),
):
    query = db.query(models.Listing)
    if q:
        like = f"%{q}%"
        query = query.filter(
            models.Listing.title.ilike(like) |
            models.Listing.address.ilike(like) |
            models.Listing.city.ilike(like)
        )
    if city:
        query = query.filter(models.Listing.city.ilike(f"%{city}%"))
    if type:
        query = query.filter(models.Listing.listingType == type)
    return query.order_by(models.Listing.id.desc()).offset(skip).limit(limit).all()


@app.get("/api/listings/{listing_id}", response_model=schemas.Listing)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    return _get_or_404(listing_id, db)


@app.post("/api/listings", response_model=schemas.Listing, status_code=201)
def create_listing(data: schemas.CreateListingInput, db: Session = Depends(get_db)):
    listing = models.Listing(**data.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@app.delete("/api/listings/{listing_id}", status_code=204)
def delete_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = _get_or_404(listing_id, db)
    db.delete(listing)
    db.commit()


# ── Generación IA ─────────────────────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/generate", response_model=schemas.Listing)
def generate_content(listing_id: int, db: Session = Depends(get_db)):
    listing = _get_or_404(listing_id, db)
    try:
        generated = ai.generate_listing_content(listing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar contenido: {e}")

    listing.generatedDescription = generated.get("description")
    listing.instagramCaption     = generated.get("instagram_caption")
    listing.attractivenessScore  = generated.get("attractiveness_score")
    listing.priceLevel           = generated.get("price_level")
    db.commit()
    db.refresh(listing)
    return listing


# ── PDF ───────────────────────────────────────────────────────────────────────

@app.get("/api/listings/{listing_id}/pdf")
async def download_pdf(
    listing_id: int,
    refresh: bool = Query(False, description="Forzar regeneración ignorando caché"),
    db: Session = Depends(get_db),
):
    listing = _get_or_404(listing_id, db)
    out = os.path.join(OUTPUT_DIR, "pdfs", f"{listing_id}.pdf")

    # Servir desde caché si ya existe (primera carga es la lenta — enhancement)
    if not refresh and Path(out).exists():
        return FileResponse(
            out,
            media_type="application/pdf",
            filename=f"vendrixa-propiedad-{listing_id}.pdf",
        )

    enhanced = await enhance_module.enhance_listing_images(
        listing.images or [], uploads_dir=str(UPLOADS_DIR)
    )
    try:
        pdf_gen.generate_pdf(_WithImages(listing, enhanced), out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {e}")
    return FileResponse(
        out,
        media_type="application/pdf",
        filename=f"vendrixa-propiedad-{listing_id}.pdf",
    )


# ── Imagen Instagram ──────────────────────────────────────────────────────────

@app.get("/api/listings/{listing_id}/image/instagram")
async def download_instagram_image(
    listing_id: int,
    refresh: bool = Query(False, description="Forzar regeneración ignorando caché"),
    db: Session = Depends(get_db),
):
    listing = _get_or_404(listing_id, db)
    out = os.path.join(OUTPUT_DIR, "images", f"{listing_id}_instagram.jpg")

    if not refresh and Path(out).exists():
        return FileResponse(
            out,
            media_type="image/jpeg",
            filename=f"vendrixa-instagram-{listing_id}.jpg",
        )

    enhanced = await enhance_module.enhance_listing_images(
        listing.images or [], uploads_dir=str(UPLOADS_DIR)
    )
    try:
        image_gen.generate_instagram_image(_WithImages(listing, enhanced), out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando imagen: {e}")
    return FileResponse(
        out,
        media_type="image/jpeg",
        filename=f"vendrixa-instagram-{listing_id}.jpg",
    )


# ── Publicar en Instagram ─────────────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/instagram/publish")
async def publish_instagram(listing_id: int, db: Session = Depends(get_db)):
    listing  = _get_or_404(listing_id, db)
    img_path = os.path.join(OUTPUT_DIR, "images", f"{listing_id}_instagram.jpg")

    if not Path(img_path).exists():
        enhanced = await enhance_module.enhance_listing_images(
            listing.images or [], uploads_dir=str(UPLOADS_DIR)
        )
        try:
            image_gen.generate_instagram_image(_WithImages(listing, enhanced), img_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generando imagen: {e}")

    caption = listing.instagramCaption or listing.title
    try:
        result = await ig_module.publish_to_instagram(img_path, caption)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"success": True, "result": result}


# ── Publicar Video en Instagram ───────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/video/instagram/publish")
async def publish_video_instagram(listing_id: int, db: Session = Depends(get_db)):
    listing    = _get_or_404(listing_id, db)
    video_path = video_gen.get_video_path(listing_id)

    if not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="Video no generado todavía")

    caption = listing.instagramCaption or listing.title or ""
    short   = caption.split("\n")[0] if caption else listing.title

    try:
        result = await ig_module.publish_video_to_instagram(video_path, short)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"success": True, "result": result}


# ── Carrusel ─────────────────────────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/carousel/generate")
async def generate_carousel(listing_id: int, db: Session = Depends(get_db)):
    listing = _get_or_404(listing_id, db)
    carousel_dir = carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR)

    # Resolver imágenes a rutas locales absolutas (sin enhancement para evitar fallos de red)
    images = listing.images or []
    resolved: list[str] = []
    for url in images:
        if url.startswith("/uploads/"):
            local = UPLOADS_DIR / url[len("/uploads/"):]
            resolved.append(str(local.resolve()) if local.exists() else url)
        else:
            resolved.append(url)

    try:
        paths = carousel_gen.generate_carousel(_WithImages(listing, resolved), carousel_dir)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Error generando carrusel: {e}\n{traceback.format_exc()}")

    slide_urls = [f"/api/listings/{listing_id}/carousel/{i + 1}" for i in range(len(paths))]
    return {"slides": slide_urls, "count": len(paths)}


@app.get("/api/listings/{listing_id}/carousel/{slide_num}")
def get_carousel_slide(listing_id: int, slide_num: int):
    carousel_dir = carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR)
    path = os.path.join(carousel_dir, f"slide_{slide_num:02d}.jpg")
    if not Path(path).exists():
        raise HTTPException(status_code=404, detail="Slide no generado")
    return FileResponse(path, media_type="image/jpeg")


@app.post("/api/listings/{listing_id}/carousel/publish")
async def publish_carousel(listing_id: int, db: Session = Depends(get_db)):
    listing      = _get_or_404(listing_id, db)
    carousel_dir = carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR)

    # Recopilar todos los slides existentes en orden
    slide_paths = sorted(Path(carousel_dir).glob("slide_*.jpg")) if Path(carousel_dir).exists() else []
    if not slide_paths:
        raise HTTPException(status_code=404, detail="Carrusel no generado todavía")

    caption = listing.instagramCaption or listing.title or ""
    try:
        result = await ig_module.publish_carousel_to_instagram(
            [str(p) for p in slide_paths], caption
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"success": True, "result": result}


# ── Video (Remotion) ──────────────────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/video/generate")
async def generate_video(
    listing_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    listing = _get_or_404(listing_id, db)
    status  = video_gen.get_status(listing_id)

    if status.get("status") == "rendering":
        return {"status": "rendering", "progress": status.get("progress", 0)}

    listing_data = {
        "title":        listing.title,
        "price":        listing.price,
        "currency":     listing.currency,
        "listingType":  listing.listingType,
        "propertyType": listing.propertyType,
        "bedrooms":     listing.bedrooms,
        "bathrooms":    listing.bathrooms,
        "area":         listing.area,
        "areaUnit":     listing.areaUnit,
        "city":         listing.city,
        "state":        listing.state,
        "images":       listing.images or [],
        "agentName":    listing.agentName,
        "agentPhone":   listing.agentPhone,
        "agentEmail":   listing.agentEmail,
    }

    background_tasks.add_task(video_gen.render_video, listing_id, listing_data)
    return {"status": "rendering", "progress": 0}


@app.get("/api/listings/{listing_id}/video/status")
def video_status(listing_id: int):
    return video_gen.get_status(listing_id)


@app.get("/api/listings/{listing_id}/video")
def download_video(listing_id: int):
    path = video_gen.get_video_path(listing_id)
    if not Path(path).exists():
        raise HTTPException(status_code=404, detail="Video no generado todavía")
    return FileResponse(
        path,
        media_type="video/mp4",
        filename=f"vendrixa-reel-{listing_id}.mp4",
    )
