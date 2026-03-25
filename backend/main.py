from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import ai
from database import Base, engine, get_db

# Crear tablas al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vendrixa API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/healthz")
def health():
    return {"status": "ok"}


# ── Auth (sin autenticación real por ahora) ───────────────────────────────────

@app.get("/api/auth/user")
def get_user():
    return {"user": None, "isAuthenticated": False}


@app.get("/api/login")
def login():
    return RedirectResponse(url="/")


@app.get("/api/logout")
def logout():
    return RedirectResponse(url="/")


# ── Listings ─────────────────────────────────────────────────────────────────

@app.get("/api/listings", response_model=List[schemas.Listing])
def get_listings(db: Session = Depends(get_db)):
    return db.query(models.Listing).order_by(models.Listing.id.desc()).all()


@app.get("/api/listings/{listing_id}", response_model=schemas.Listing)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return listing


@app.post("/api/listings", response_model=schemas.Listing, status_code=201)
def create_listing(data: schemas.CreateListingInput, db: Session = Depends(get_db)):
    listing = models.Listing(**data.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@app.post("/api/listings/{listing_id}/generate", response_model=schemas.Listing)
def generate_content(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")

    try:
        generated = ai.generate_listing_content(listing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar contenido: {str(e)}")

    listing.generatedDescription = generated.get("description")
    listing.instagramCaption = generated.get("instagram_caption")
    listing.attractivenessScore = generated.get("attractiveness_score")
    listing.priceLevel = generated.get("price_level")

    db.commit()
    db.refresh(listing)
    return listing
