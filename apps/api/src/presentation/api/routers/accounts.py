"""Accounts API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from src.presentation.api.dependencies import get_current_user_id

router = APIRouter()


class CreateAccountRequest(BaseModel):
    name: str
    type: str  # AccountType enum
    owner_scope: str  # OwnerScope enum
    currency: str = "EUR"
    bank_name: Optional[str] = None
    iban_last4: Optional[str] = None


class AccountResponse(BaseModel):
    id: str
    name: str
    type: str
    owner_scope: str
    currency: str
    balance: float
    bank_name: Optional[str] = None
    is_active: bool
    created_at: str


@router.post("/", response_model=AccountResponse, status_code=201)
async def create_account(
    request: CreateAccountRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new account."""
    raise HTTPException(status_code=501, detail="Implement account creation")


@router.get("/", response_model=List[AccountResponse])
async def list_accounts(user_id: str = Depends(get_current_user_id)):
    """List user accounts."""
    raise HTTPException(status_code=501, detail="Implement list accounts")


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str, user_id: str = Depends(get_current_user_id)):
    """Get account by ID."""
    raise HTTPException(status_code=501, detail="Implement get account")


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: str, user_id: str = Depends(get_current_user_id)):
    """Update account."""
    raise HTTPException(status_code=501, detail="Implement update account")


@router.delete("/{account_id}", status_code=204)
async def delete_account(account_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete account."""
    raise HTTPException(status_code=501, detail="Implement delete account")
