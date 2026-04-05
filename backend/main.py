import os
import secrets
import shutil
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import httpx
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
import schemas
import auth
import ai
import pdf_gen
import image_gen
import carousel_gen
import instagram as ig_module
import video_gen
import enhance as enhance_module
import storage
from database import Base, engine, get_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)   # create new tables
    auth.run_migrations(engine)              # add missing columns to existing tables
    db = next(get_db())
    try:
        auth.seed_admin(db)
        auth.seed_demo(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Vendrixa API", version="1.0.0", lifespan=lifespan)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=500)
_extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        *_extra_origins,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR   = os.getenv("OUTPUT_DIR", "./generated")
UPLOADS_DIR  = Path(OUTPUT_DIR) / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _listing_dir(listing_id: int) -> Path:
    """Carpeta exclusiva para todos los archivos generados de una propiedad."""
    d = Path(OUTPUT_DIR) / str(listing_id)
    d.mkdir(parents=True, exist_ok=True)
    return d

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


def _require_demo_for_guest(listing: models.Listing, current_user: Optional[models.User]) -> None:
    """Raise 403 if a guest is trying to access a non-demo listing."""
    if not current_user and not listing.is_demo:
        raise HTTPException(
            status_code=403,
            detail="Regístrate para acceder a esta propiedad.",
        )


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/healthz")
def health():
    return {"status": "ok"}


# ── Assets — qué archivos ya fueron generados para una propiedad ─────────────

@app.get("/api/listings/{listing_id}/assets")
def get_listing_assets(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    base         = Path(OUTPUT_DIR) / str(listing_id)
    carousel_dir = base / "carousel"
    video_status = video_gen.get_status(listing_id)

    if storage.enabled():
        img_exists      = storage.exists(f"{listing_id}/instagram.jpg")
        pdf_exists      = storage.exists(f"{listing_id}/pdf.pdf")
        video_exists    = storage.exists(f"{listing_id}/video.mp4")
        carousel_count  = sum(1 for i in range(1, 50) if storage.exists(f"{listing_id}/carousel/slide_{i:02d}.jpg"))
    else:
        img_exists     = (base / "instagram.jpg").exists()
        pdf_exists     = (base / "pdf.pdf").exists()
        video_exists   = (base / "video.mp4").exists()
        carousel_slides = sorted(carousel_dir.glob("slide_*.jpg")) if carousel_dir.exists() else []
        carousel_count  = len(carousel_slides)

    return {
        "image":    img_exists,
        "carousel": {"exists": carousel_count > 0, "count": carousel_count},
        "video":    {"exists": video_exists, "status": video_status.get("status", "idle")},
        "pdf":      pdf_exists,
    }


# ── Geocoding proxy (evita CORS de Nominatim en el browser) ──────────────────

@app.get("/api/geocode")
async def geocode(q: str = Query(..., description="Ciudad o dirección a buscar")):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "json", "limit": 1},
            headers={"User-Agent": "Vendrixa/1.0 (real-estate-app)"},
        )
    return r.json()


# ── Auth ──────────────────────────────────────────────────────────────────────

_IS_PROD = bool(os.getenv("DATABASE_URL"))


@app.post("/api/auth/login")
def login_with_credentials(
    data: schemas.LoginInput,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = auth.create_token(user.id)
    response.set_cookie(
        key="vendrixa_token",
        value=token,
        httponly=True,
        secure=_IS_PROD,
        samesite="lax",
        max_age=86400 * auth.TOKEN_HOURS,
        path="/",
    )
    return {"user": auth.user_to_dict(user), "isAuthenticated": True}


@app.get("/api/auth/user")
def get_auth_user(current_user: Optional[models.User] = Depends(auth.get_optional_user)):
    if not current_user:
        return {"user": None, "isAuthenticated": False}
    return {"user": auth.user_to_dict(current_user), "isAuthenticated": True}


@app.get("/api/login")
def login_redirect():
    return RedirectResponse(url="/login")


@app.get("/api/logout")
def logout(response: Response):
    response.delete_cookie("vendrixa_token", path="/")
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
    remote_url = storage.upload(str(dest), f"uploads/{filename}")
    return {"url": remote_url or f"/uploads/{filename}"}


# ── Listings CRUD ─────────────────────────────────────────────────────────────

@app.get("/api/listings", response_model=List[schemas.Listing])
def get_listings(
    skip:  int           = Query(0,    ge=0),
    limit: int           = Query(100,  ge=1, le=500),
    q:     Optional[str] = Query(None, description="Buscar en título/dirección"),
    city:  Optional[str] = Query(None),
    type:  Optional[str] = Query(None, description="listingType: sale|rent"),
    db:    Session       = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    if not current_user:
        # Guest: only the demo listing
        return db.query(models.Listing).filter(models.Listing.is_demo == True).all()  # noqa: E712

    query = db.query(models.Listing)
    if current_user.role != "admin":
        query = query.filter(models.Listing.owner_id == current_user.id)

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
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)
    return listing


@app.post("/api/listings", response_model=schemas.Listing, status_code=201)
def create_listing(
    data: schemas.CreateListingInput,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    if not current_user:
        guest_id = request.cookies.get("vendrixa_guest")
        if not guest_id:
            guest_id = secrets.token_hex(16)
        else:
            existing = db.query(models.Listing).filter(
                models.Listing.guest_session_id == guest_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=429,
                    detail="Como visitante solo puedes insertar una propiedad. Regístrate para agregar más.",
                )
        listing = models.Listing(**data.model_dump(), guest_session_id=guest_id)
        db.add(listing)
        db.commit()
        db.refresh(listing)
        response.set_cookie(
            key="vendrixa_guest",
            value=guest_id,
            max_age=86400 * 30,
            httponly=True,
            samesite="lax",
            path="/",
        )
        return listing
    else:
        listing = models.Listing(**data.model_dump(), owner_id=current_user.id)
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing


@app.delete("/api/listings/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    listing = _get_or_404(listing_id, db)
    db.delete(listing)
    db.commit()


# ── Generación IA ─────────────────────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/generate", response_model=schemas.Listing)
def generate_content(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)

    if not current_user:
        if not listing.is_demo:
            raise HTTPException(
                status_code=403,
                detail="Solo puedes generar contenido para la propiedad demo. Regístrate para usar esta función.",
            )
        if listing.generatedDescription:
            raise HTTPException(
                status_code=403,
                detail="El contenido demo ya fue generado. Regístrate para regenerar.",
            )

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
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing    = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    if not current_user and refresh:
        raise HTTPException(status_code=403, detail="Regístrate para regenerar archivos.")

    remote_key = f"{listing_id}/pdf.pdf"
    out        = str(_listing_dir(listing_id) / "pdf.pdf")

    if not refresh:
        if storage.enabled() and storage.exists(remote_key):
            return RedirectResponse(storage.public_url(remote_key))
        if not storage.enabled() and Path(out).exists():
            return FileResponse(out, media_type="application/pdf",
                                filename=f"vendrixa-propiedad-{listing_id}.pdf")

    enhanced = await enhance_module.enhance_listing_images(
        listing.images or [], uploads_dir=str(UPLOADS_DIR)
    )
    try:
        pdf_gen.generate_pdf(_WithImages(listing, enhanced), out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {e}")

    remote_url = storage.upload(out, remote_key)
    if remote_url:
        return RedirectResponse(remote_url)
    return FileResponse(out, media_type="application/pdf",
                        filename=f"vendrixa-propiedad-{listing_id}.pdf")


# ── Imagen Instagram ──────────────────────────────────────────────────────────

@app.get("/api/listings/{listing_id}/image/instagram")
async def download_instagram_image(
    listing_id: int,
    refresh: bool = Query(False, description="Forzar regeneración ignorando caché"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing    = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    if not current_user and refresh:
        raise HTTPException(status_code=403, detail="Regístrate para regenerar archivos.")

    remote_key = f"{listing_id}/instagram.jpg"
    out        = str(_listing_dir(listing_id) / "instagram.jpg")

    if not refresh:
        if storage.enabled() and storage.exists(remote_key):
            return RedirectResponse(storage.public_url(remote_key))
        if not storage.enabled() and Path(out).exists():
            return FileResponse(out, media_type="image/jpeg",
                                filename=f"vendrixa-instagram-{listing_id}.jpg")

    enhanced = await enhance_module.enhance_listing_images(
        listing.images or [], uploads_dir=str(UPLOADS_DIR)
    )
    try:
        image_gen.generate_instagram_image(_WithImages(listing, enhanced), out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando imagen: {e}")

    remote_url = storage.upload(out, remote_key)
    if remote_url:
        return RedirectResponse(remote_url)
    return FileResponse(out, media_type="image/jpeg",
                        filename=f"vendrixa-instagram-{listing_id}.jpg")


# ── Publicar en Instagram ─────────────────────────────────────────────────────

@app.post("/api/listings/{listing_id}/instagram/publish")
async def publish_instagram(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    listing  = _get_or_404(listing_id, db)
    img_path = str(_listing_dir(listing_id) / "instagram.jpg")

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
async def publish_video_instagram(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
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
async def generate_carousel(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    if not current_user:
        # Block regeneration for guests: check if carousel already exists
        if storage.enabled():
            already = storage.exists(f"{listing_id}/carousel/slide_01.jpg")
        else:
            cdir = Path(carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR))
            already = cdir.exists() and any(cdir.glob("slide_*.jpg"))
        if already:
            raise HTTPException(
                status_code=403,
                detail="El carrusel demo ya fue generado. Regístrate para regenerar.",
            )

    carousel_dir = carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR)

    # Borrar carrusel anterior si existe
    if Path(carousel_dir).exists():
        shutil.rmtree(carousel_dir)

    # Resolver imágenes a rutas locales absolutas
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

    for i, p in enumerate(paths):
        storage.upload(str(p), f"{listing_id}/carousel/slide_{i + 1:02d}.jpg")

    slide_urls = [f"/api/listings/{listing_id}/carousel/{i + 1}" for i in range(len(paths))]
    return {"slides": slide_urls, "count": len(paths)}


@app.get("/api/listings/{listing_id}/carousel/{slide_num}")
def get_carousel_slide(
    listing_id: int,
    slide_num: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    remote_key = f"{listing_id}/carousel/slide_{slide_num:02d}.jpg"
    if storage.enabled():
        if storage.exists(remote_key):
            return RedirectResponse(storage.public_url(remote_key))
        raise HTTPException(status_code=404, detail="Slide no generado")
    carousel_dir = carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR)
    path = os.path.join(carousel_dir, f"slide_{slide_num:02d}.jpg")
    if not Path(path).exists():
        raise HTTPException(status_code=404, detail="Slide no generado")
    return FileResponse(path, media_type="image/jpeg")


@app.post("/api/listings/{listing_id}/carousel/publish")
async def publish_carousel(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    listing      = _get_or_404(listing_id, db)
    carousel_dir = carousel_gen.get_carousel_dir(listing_id, OUTPUT_DIR)

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
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    if not current_user:
        # Block regeneration for guests if video already exists
        old_video = Path(video_gen.get_video_path(listing_id))
        if old_video.exists():
            raise HTTPException(
                status_code=403,
                detail="El video demo ya fue generado. Regístrate para regenerar.",
            )

    status  = video_gen.get_status(listing_id)

    if status.get("status") == "rendering":
        return {"status": "rendering", "progress": status.get("progress", 0)}

    old_video = Path(video_gen.get_video_path(listing_id))
    if old_video.exists():
        old_video.unlink()

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
def video_status(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)
    return video_gen.get_status(listing_id)


@app.get("/api/listings/{listing_id}/video")
def download_video(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    listing = _get_or_404(listing_id, db)
    _require_demo_for_guest(listing, current_user)

    path = video_gen.get_video_path(listing_id)
    if not Path(path).exists():
        raise HTTPException(status_code=404, detail="Video no generado todavía")
    return FileResponse(
        path,
        media_type="video/mp4",
        filename=f"vendrixa-reel-{listing_id}.mp4",
    )
