"""Accounts API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from src.presentation.api.dependencies import get_current_user_id, get_account_repository
from src.application.use_cases.account_use_cases import (
    CreateAccountUseCase,
    ListAccountsUseCase,
    GetAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
)
from src.domain.entities import AccountType, OwnerScope

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

    @classmethod
    def from_entity(cls, account):
        return cls(
            id=account.id,
            name=account.name,
            type=account.type.value,
            owner_scope=account.owner_scope.value,
            currency=account.currency,
            balance=float(account.balance),
            bank_name=account.bank_name,
            is_active=account.is_active,
            created_at=account.created_at.isoformat(),
        )


@router.post("/", response_model=AccountResponse, status_code=201)
async def create_account(
    request: CreateAccountRequest,
    user_id: str = Depends(get_current_user_id),
    account_repo = Depends(get_account_repository),
):
    """Create a new account."""
    use_case = CreateAccountUseCase(account_repo)

    try:
        account = await use_case.execute(
            user_id=user_id,
            name=request.name,
            type=AccountType(request.type),
            owner_scope=OwnerScope(request.owner_scope),
            currency=request.currency,
            bank_name=request.bank_name,
            iban_last4=request.iban_last4,
        )
        return AccountResponse.from_entity(account)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[AccountResponse])
async def list_accounts(
    user_id: str = Depends(get_current_user_id),
    account_repo = Depends(get_account_repository),
):
    """List user accounts."""
    use_case = ListAccountsUseCase(account_repo)
    accounts = await use_case.execute(user_id)
    return [AccountResponse.from_entity(acc) for acc in accounts]


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
    account_repo = Depends(get_account_repository),
):
    """Get account by ID."""
    use_case = GetAccountUseCase(account_repo)
    account = await use_case.execute(account_id, user_id)

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return AccountResponse.from_entity(account)


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    request: CreateAccountRequest,
    user_id: str = Depends(get_current_user_id),
    account_repo = Depends(get_account_repository),
):
    """Update account."""
    use_case = UpdateAccountUseCase(account_repo)

    try:
        account = await use_case.execute(
            account_id=account_id,
            user_id=user_id,
            name=request.name,
            type=AccountType(request.type),
            owner_scope=OwnerScope(request.owner_scope),
            currency=request.currency,
            bank_name=request.bank_name,
            iban_last4=request.iban_last4,
        )
        return AccountResponse.from_entity(account)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
    account_repo = Depends(get_account_repository),
):
    """Delete account."""
    use_case = DeleteAccountUseCase(account_repo)

    try:
        await use_case.execute(account_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
