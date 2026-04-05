from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginInput(BaseModel):
    email: str
    password: str


class AuthUser(BaseModel):
    id: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role: str = "agent"
    profileImageUrl: Optional[str] = None


class AuthResponse(BaseModel):
    user: Optional[AuthUser]
    isAuthenticated: bool


class CreateListingInput(BaseModel):
    title: str
    price: float
    currency: str = "MXN"
    listingType: str
    propertyType: str
    bedrooms: int = 0
    bathrooms: float = 0
    halfBathrooms: int = 0
    parkingSpots: int = 0
    floorLevel: Optional[int] = None
    floors: Optional[int] = None
    area: float
    areaUnit: str = "m2"
    address: str
    city: str
    state: str
    description: Optional[str] = None
    amenities: Optional[List[str]] = []
    images: Optional[List[str]] = []
    agentName: str
    agentPhone: str
    agentEmail: str


class Listing(CreateListingInput):
    model_config = ConfigDict(from_attributes=True)

    id: int
    generatedDescription: Optional[str] = None
    instagramCaption: Optional[str] = None
    attractivenessScore: Optional[int] = None
    priceLevel: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
