from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, JSON, Index
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String,  unique=True, index=True, nullable=False)
    hashed_password = Column(String,  nullable=False)
    first_name      = Column(String,  nullable=True)
    last_name       = Column(String,  nullable=True)
    role            = Column(String,  default="agent")   # admin | agent
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, server_default=func.now())


class Listing(Base):
    __tablename__ = "listings"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String,  nullable=False)
    price         = Column(Float,   nullable=False)
    currency      = Column(String,  default="MXN")
    listingType   = Column(String,  nullable=False)
    propertyType  = Column(String,  nullable=False)
    bedrooms      = Column(Integer, default=0)
    bathrooms     = Column(Float,   default=0)
    halfBathrooms = Column(Integer, default=0)
    parkingSpots  = Column(Integer, default=0)
    floorLevel    = Column(Integer, nullable=True)
    floors        = Column(Integer, nullable=True)
    area          = Column(Float,   nullable=False)
    areaUnit      = Column(String,  default="m2")
    address       = Column(String,  nullable=False)
    city          = Column(String,  nullable=False)
    state         = Column(String,  nullable=False)
    description   = Column(String,  nullable=True)
    amenities     = Column(JSON,    default=list)
    images        = Column(JSON,    default=list)
    agentName     = Column(String,  nullable=False)
    agentPhone    = Column(String,  nullable=False)
    agentEmail    = Column(String,  nullable=False)
    generatedDescription = Column(String,  nullable=True)
    instagramCaption     = Column(String,  nullable=True)
    attractivenessScore  = Column(Integer, nullable=True)
    priceLevel           = Column(String,  nullable=True)
    createdAt     = Column(DateTime, server_default=func.now())
    updatedAt     = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        Index("ix_listings_city",        "city"),
        Index("ix_listings_listingType", "listingType"),
        Index("ix_listings_propertyType","propertyType"),
        Index("ix_listings_price",       "price"),
    )
