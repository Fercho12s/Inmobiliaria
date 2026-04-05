"""auth.py — JWT authentication helpers."""
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models
from database import get_db

SECRET_KEY   = os.getenv("SECRET_KEY") or secrets.token_hex(32)
ALGORITHM    = "HS256"
TOKEN_HOURS  = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain[:72])


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain[:72], hashed)


def create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        return int(uid) if uid else None
    except (JWTError, ValueError):
        return None


def get_optional_user(
    vendrixa_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not vendrixa_token:
        return None
    uid = _decode_token(vendrixa_token)
    if not uid:
        return None
    return db.query(models.User).filter(
        models.User.id == uid, models.User.is_active == True  # noqa: E712
    ).first()


def get_current_user(
    user: Optional[models.User] = Depends(get_optional_user),
) -> models.User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    return user


def user_to_dict(user: models.User) -> dict:
    return {
        "id":              str(user.id),
        "email":           user.email,
        "firstName":       user.first_name,
        "lastName":        user.last_name,
        "role":            user.role,
        "profileImageUrl": None,
    }


def seed_admin(db: Session) -> None:
    """Insert the admin user if it doesn't exist yet."""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@vendrixa.com")
    admin_pass  = os.getenv("ADMIN_PASSWORD", "Admin1234!")

    if not db.query(models.User).filter(models.User.email == admin_email).first():
        db.add(models.User(
            email=admin_email,
            hashed_password=hash_password(admin_pass),
            first_name="Admin",
            last_name="Vendrixa",
            role="admin",
            is_active=True,
        ))
        db.commit()
