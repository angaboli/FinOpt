"""Authentication API router."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.infrastructure.database.connection import get_db
from src.config import settings
from src.presentation.api.dependencies import get_current_user_id

router = APIRouter()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest, db: AsyncSession = Depends(get_db)):
    """Sign up a new user."""
    # Check if user exists
    result = await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": request.email}
    )
    if result.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = pwd_context.hash(request.password)
    result = await db.execute(
        text("""
            INSERT INTO users (email, full_name, password_hash)
            VALUES (:email, :full_name, :password_hash)
            RETURNING id, email, full_name, created_at
        """),
        {"email": request.email, "full_name": request.full_name, "password_hash": hashed_password}
    )
    user_row = result.fetchone()
    await db.commit()
    
    # Create notification preferences for new user
    await db.execute(
        text("INSERT INTO notification_preferences (user_id) VALUES (:user_id) ON CONFLICT DO NOTHING"),
        {"user_id": str(user_row.id)}
    )
    await db.commit()
    
    # Generate token
    access_token = create_access_token({"sub": str(user_row.id)})
    
    return AuthResponse(
        access_token=access_token,
        user={"id": str(user_row.id), "email": user_row.email, "full_name": user_row.full_name}
    )


@router.post("/signin", response_model=AuthResponse)
async def signin(request: SignInRequest, db: AsyncSession = Depends(get_db)):
    """Sign in existing user."""
    result = await db.execute(
        text("SELECT id, email, full_name, password_hash FROM users WHERE email = :email"),
        {"email": request.email}
    )
    user_row = result.fetchone()
    
    if not user_row or not pwd_context.verify(request.password, user_row.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": str(user_row.id)})
    
    return AuthResponse(
        access_token=access_token,
        user={"id": str(user_row.id), "email": user_row.email, "full_name": user_row.full_name}
    )


@router.post("/signout")
async def signout():
    """Sign out user (client should discard token)."""
    return {"message": "Signed out successfully"}


@router.get("/me")
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get current user info."""
    result = await db.execute(
        text("SELECT id, email, full_name, created_at FROM users WHERE id = :id"),
        {"id": user_id}
    )
    user_row = result.fetchone()
    
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user_row.id),
        "email": user_row.email,
        "full_name": user_row.full_name,
        "created_at": user_row.created_at.isoformat() if user_row.created_at else None
    }
