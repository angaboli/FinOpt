"""Authentication API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()


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


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """Sign up a new user."""
    # Implement with Supabase auth.sign_up()
    raise HTTPException(status_code=501, detail="Sign up endpoint - implement with Supabase Auth")


@router.post("/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    """Sign in existing user."""
    # Implement with Supabase auth.sign_in_with_password()
    raise HTTPException(status_code=501, detail="Sign in endpoint - implement with Supabase Auth")


@router.post("/signout")
async def signout():
    """Sign out user."""
    # Implement with Supabase auth.sign_out()
    return {"message": "Signed out successfully"}


@router.get("/me")
async def get_current_user():
    """Get current user info."""
    # Implement with Supabase auth.get_user()
    raise HTTPException(status_code=501, detail="Get user endpoint - implement with Supabase Auth")
