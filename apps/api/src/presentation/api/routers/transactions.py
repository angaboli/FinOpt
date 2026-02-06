"""Transaction API router."""

import base64
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

from src.presentation.api.dependencies import get_current_user_id, get_transaction_repository, get_account_repository
from src.application.use_cases.transaction_use_cases import (
    CreateManualTransactionUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    ListTransactionsUseCase,
    GetTransactionUseCase,
    ImportStatementUseCase,
)
from src.infrastructure.services.statement_parser import parse_statement


router = APIRouter()


# Request/Response models
class CreateTransactionRequest(BaseModel):
    account_id: str
    amount: float
    date: str  # ISO format
    description: str
    category_id: Optional[str] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class UpdateTransactionRequest(BaseModel):
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class ImportTransactionsRequest(BaseModel):
    account_id: str
    file_type: str  # CSV, EXCEL, JSON, PDF
    file_data: str  # base64 encoded
    file_name: str


class ImportTransactionsResponse(BaseModel):
    transactions_imported: int
    errors: List[str]


class TransactionResponse(BaseModel):
    id: str
    account_id: str
    amount: float
    currency: str
    date: str
    description: str
    category_id: Optional[str] = None
    merchant_name: Optional[str] = None
    is_manual: bool
    is_recurring: bool
    status: str
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: str
    updated_at: str

    @classmethod
    def from_entity(cls, transaction):
        return cls(
            id=transaction.id,
            account_id=transaction.account_id,
            amount=float(transaction.amount),
            currency=transaction.currency,
            date=transaction.date.isoformat(),
            description=transaction.description,
            category_id=transaction.category_id,
            merchant_name=transaction.merchant_name,
            is_manual=transaction.is_manual,
            is_recurring=transaction.is_recurring,
            status=transaction.status.value,
            notes=transaction.notes,
            tags=transaction.tags,
            created_at=transaction.created_at.isoformat(),
            updated_at=transaction.updated_at.isoformat(),
        )


@router.post("/", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    request: CreateTransactionRequest,
    user_id: str = Depends(get_current_user_id),
    transaction_repo = Depends(get_transaction_repository),
    account_repo = Depends(get_account_repository),
):
    """Create a manual transaction."""
    use_case = CreateManualTransactionUseCase(
        transaction_repo=transaction_repo,
        account_repo=account_repo,
    )

    try:
        transaction = await use_case.execute(
            user_id=user_id,
            account_id=request.account_id,
            amount=Decimal(str(request.amount)),
            date=datetime.fromisoformat(request.date),
            description=request.description,
            category_id=request.category_id,
            merchant_name=request.merchant_name,
            notes=request.notes,
            tags=request.tags,
        )
        return TransactionResponse.from_entity(transaction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import", response_model=ImportTransactionsResponse)
async def import_transactions(
    request: ImportTransactionsRequest,
    user_id: str = Depends(get_current_user_id),
    transaction_repo = Depends(get_transaction_repository),
    account_repo = Depends(get_account_repository),
):
    """Import transactions from a file (CSV, Excel, JSON, PDF)."""
    # Validate file type
    valid_types = {"CSV", "EXCEL", "JSON", "PDF"}
    file_type = request.file_type.upper()
    if file_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporte: {request.file_type}. Formats acceptes: {', '.join(valid_types)}",
        )

    # Decode base64 file
    try:
        file_content = base64.b64decode(request.file_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Donnees base64 invalides")

    # Size limit: 5MB
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Le fichier depasse la limite de 5 Mo")

    # Verify account belongs to user
    account = await account_repo.get_by_id(request.account_id, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Compte introuvable")

    # Parse the file
    parsed_transactions, parse_errors = parse_statement(
        file_type=file_type,
        file_content=file_content,
        user_id=user_id,
        account_id=request.account_id,
        currency=account.currency,
    )

    if not parsed_transactions and parse_errors:
        raise HTTPException(status_code=400, detail="; ".join(parse_errors))

    if not parsed_transactions:
        return ImportTransactionsResponse(transactions_imported=0, errors=["Aucune transaction trouvee dans le fichier"])

    # Import using the existing use case
    use_case = ImportStatementUseCase(
        transaction_repo=transaction_repo,
        account_repo=account_repo,
    )

    try:
        imported = await use_case.execute(
            user_id=user_id,
            account_id=request.account_id,
            transactions=parsed_transactions,
        )
        return ImportTransactionsResponse(
            transactions_imported=len(imported),
            errors=parse_errors,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    transaction_repo = Depends(get_transaction_repository),
):
    """Get a transaction by ID."""
    use_case = GetTransactionUseCase(transaction_repo)
    transaction = await use_case.execute(transaction_id, user_id)

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return TransactionResponse.from_entity(transaction)


@router.get("/", response_model=dict)
async def list_transactions(
    user_id: str = Depends(get_current_user_id),
    transaction_repo = Depends(get_transaction_repository),
    account_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List transactions with filters."""
    filters = {}
    if account_id:
        filters["account_id"] = account_id
    if category_id:
        filters["category_id"] = category_id
    if start_date:
        filters["start_date"] = start_date
    if end_date:
        filters["end_date"] = end_date
    if search:
        filters["search"] = search

    use_case = ListTransactionsUseCase(transaction_repo)
    transactions, total = await use_case.execute(user_id, filters, page, limit)

    return {
        "data": [TransactionResponse.from_entity(t) for t in transactions],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    request: UpdateTransactionRequest,
    user_id: str = Depends(get_current_user_id),
    transaction_repo = Depends(get_transaction_repository),
    account_repo = Depends(get_account_repository),
):
    """Update a transaction."""
    use_case = UpdateTransactionUseCase(transaction_repo, account_repo)

    updates = request.dict(exclude_unset=True)
    if "amount" in updates:
        updates["amount"] = Decimal(str(updates["amount"]))
    if "date" in updates:
        updates["date"] = datetime.fromisoformat(updates["date"])

    try:
        transaction = await use_case.execute(transaction_id, user_id, **updates)
        return TransactionResponse.from_entity(transaction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    transaction_repo = Depends(get_transaction_repository),
    account_repo = Depends(get_account_repository),
):
    """Delete a transaction (soft delete)."""
    use_case = DeleteTransactionUseCase(transaction_repo, account_repo)

    try:
        await use_case.execute(transaction_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
