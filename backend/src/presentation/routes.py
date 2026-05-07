from fastapi import APIRouter, Depends, Response, status

from src.application.bank_imports.dtos import ImportBankStatementCommand, ImportRowCommand, ListBankImportsQuery, ParsePdfCommand
from src.application.bank_imports.use_cases import ImportBankStatement, ListBankImports, ParsePdfStatement
from src.application.budget_advice.dtos import GenerateBudgetAdviceCommand
from src.application.budget_advice.use_cases import GenerateBudgetAdvice
from src.application.budgets.dtos import BudgetLineCommand, GetBudgetQuery, SetBudgetCommand
from src.application.budgets.use_cases import GetBudget, SetBudget
from src.application.receipts.dtos import ListReceiptsQuery, ReceiptItemDto, SaveReceiptCommand, ScanReceiptCommand
from src.application.receipts.use_cases import ListReceipts, SaveReceipt, ScanReceipt
from src.application.savings_goals.dtos import (
    CreateSavingsGoalCommand,
    DeleteSavingsGoalCommand,
    ListSavingsGoalsQuery,
    UpdateSavingsGoalCommand,
)
from src.application.savings_goals.use_cases import (
    CreateSavingsGoal,
    DeleteSavingsGoal,
    ListSavingsGoals,
    UpdateSavingsGoal,
)
from src.application.accounts.dtos import (
    CreateAccountCommand,
    DeleteAccountCommand,
    ListAccountsQuery,
    UpdateAccountCommand,
)
from src.application.accounts.use_cases import (
    CreateAccount,
    DeleteAccount,
    ListAccounts,
    UpdateAccount,
)
from src.application.auth.dtos import (
    LoginCommand,
    LogoutCommand,
    RefreshSessionCommand,
    SignUpCommand,
)
from src.application.auth.use_cases import (
    GetCurrentUser,
    LoginUser,
    LogoutSession,
    RefreshSession,
    SignUpUser,
)
from datetime import date as DateType
from typing import Optional

from src.application.categories.dtos import (
    CreateCategoryCommand,
    DeleteCategoryCommand,
    ListCategoriesQuery,
    UpdateCategoryCommand,
)
from src.application.categories.use_cases import (
    CreateCategory,
    DeleteCategory,
    ListCategories,
    UpdateCategory,
)
from src.application.income_sources.dtos import (
    CreateIncomeSourceCommand,
    DeleteIncomeSourceCommand,
    ListIncomeSourcesQuery,
    UpdateIncomeSourceCommand,
)
from src.application.income_sources.use_cases import (
    CreateIncomeSource,
    DeleteIncomeSource,
    ListIncomeSources,
    UpdateIncomeSource,
)
from src.application.transactions.dtos import (
    CreateTransactionCommand,
    DeleteTransactionCommand,
    ListTransactionsQuery,
    TransferCommand,
    UpdateTransactionCommand,
)
from src.application.transactions.use_cases import (
    CreateTransaction,
    DeleteTransaction,
    ListTransactions,
    TransferBetweenAccounts,
    UpdateTransaction,
)
from src.presentation.dependencies import (
    import_bank_statement_use_case,
    list_bank_imports_use_case,
    parse_pdf_use_case,
    generate_budget_advice_use_case,
    get_budget_use_case,
    set_budget_use_case,
    scan_receipt_use_case,
    save_receipt_use_case,
    list_receipts_use_case,
    create_savings_goal_use_case,
    list_savings_goals_use_case,
    update_savings_goal_use_case,
    delete_savings_goal_use_case,
    create_account_use_case,
    create_category_use_case,
    create_income_source_use_case,
    create_transaction_use_case,
    current_user_id,
    delete_account_use_case,
    delete_category_use_case,
    delete_income_source_use_case,
    delete_transaction_use_case,
    transfer_use_case,
    get_current_user_use_case,
    list_accounts_use_case,
    list_categories_use_case,
    list_income_sources_use_case,
    list_transactions_use_case,
    login_use_case,
    logout_session_use_case,
    refresh_session_use_case,
    sign_up_use_case,
    update_account_use_case,
    update_category_use_case,
    update_income_source_use_case,
    update_transaction_use_case,
)
from src.presentation.schemas import (
    AccountRequest,
    AccountResponse,
    AuthTokensResponse,
    BankImportResponse,
    ParsePdfRequest,
    ParsedPdfRowResponse,
    BudgetAdviceRequest,
    BudgetAdviceResponse,
    BudgetLineResponse,
    BudgetRequest,
    BudgetResponse,
    ImportBankStatementRequest,
    CategoryRequest,
    CategoryResponse,
    IncomeSourceRequest,
    IncomeSourceResponse,
    LoginRequest,
    LogoutRequest,
    ReceiptItemResponse,
    ReceiptResponse,
    RefreshRequest,
    SaveReceiptRequest,
    SavingsGoalRequest,
    SavingsGoalResponse,
    ScanReceiptRequest,
    ScanReceiptResponse,
    SignUpRequest,
    TransactionRequest,
    TransactionResponse,
    TransactionUpdateRequest,
    TransferRequest,
    TransferResponse,
    UserResponse,
)

router = APIRouter()


@router.post("/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignUpRequest,
    use_case: SignUpUser = Depends(sign_up_use_case),
) -> UserResponse:
    result = await use_case.execute(SignUpCommand(email=request.email, password=request.password, name=request.name))
    return UserResponse(id=result.id, email=result.email, name=result.name)


@router.post("/auth/login", response_model=AuthTokensResponse)
async def login(
    request: LoginRequest,
    use_case: LoginUser = Depends(login_use_case),
) -> AuthTokensResponse:
    result = await use_case.execute(LoginCommand(email=request.email, password=request.password))
    return AuthTokensResponse.model_validate(result, from_attributes=True)


@router.post("/auth/refresh", response_model=AuthTokensResponse)
async def refresh(
    request: RefreshRequest,
    use_case: RefreshSession = Depends(refresh_session_use_case),
) -> AuthTokensResponse:
    result = await use_case.execute(RefreshSessionCommand(refresh_token=request.refresh_token))
    return AuthTokensResponse.model_validate(result, from_attributes=True)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: LogoutRequest,
    use_case: LogoutSession = Depends(logout_session_use_case),
) -> Response:
    await use_case.execute(LogoutCommand(refresh_token=request.refresh_token))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users/me", response_model=UserResponse)
async def me(
    user_id: str = Depends(current_user_id),
    use_case: GetCurrentUser = Depends(get_current_user_use_case),
) -> UserResponse:
    result = await use_case.execute(user_id)
    return UserResponse(id=result.id, email=result.email, name=result.name)


@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    request: AccountRequest,
    user_id: str = Depends(current_user_id),
    use_case: CreateAccount = Depends(create_account_use_case),
) -> AccountResponse:
    result = await use_case.execute(
        CreateAccountCommand(
            user_id=user_id,
            name=request.name,
            account_type=request.account_type.value,
            balance=request.balance,
            currency=request.currency,
            color=request.color,
        )
    )
    return AccountResponse.model_validate(result, from_attributes=True)


@router.get("/accounts", response_model=list[AccountResponse])
async def list_accounts(
    user_id: str = Depends(current_user_id),
    use_case: ListAccounts = Depends(list_accounts_use_case),
) -> list[AccountResponse]:
    results = await use_case.execute(ListAccountsQuery(user_id=user_id))
    return [AccountResponse.model_validate(result, from_attributes=True) for result in results]


@router.put("/accounts/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    request: AccountRequest,
    user_id: str = Depends(current_user_id),
    use_case: UpdateAccount = Depends(update_account_use_case),
) -> AccountResponse:
    result = await use_case.execute(
        UpdateAccountCommand(
            user_id=user_id,
            account_id=account_id,
            name=request.name,
            account_type=request.account_type.value,
            balance=request.balance,
            currency=request.currency,
            color=request.color,
        )
    )
    return AccountResponse.model_validate(result, from_attributes=True)


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: str,
    user_id: str = Depends(current_user_id),
    use_case: DeleteAccount = Depends(delete_account_use_case),
) -> Response:
    await use_case.execute(DeleteAccountCommand(user_id=user_id, account_id=account_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/income-sources",
    response_model=IncomeSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_income_source(
    request: IncomeSourceRequest,
    user_id: str = Depends(current_user_id),
    use_case: CreateIncomeSource = Depends(create_income_source_use_case),
) -> IncomeSourceResponse:
    result = await use_case.execute(
        CreateIncomeSourceCommand(
            user_id=user_id,
            name=request.name,
            amount=request.amount,
            frequency=request.frequency.value,
        )
    )
    return IncomeSourceResponse.model_validate(result, from_attributes=True)


@router.get("/income-sources", response_model=list[IncomeSourceResponse])
async def list_income_sources(
    user_id: str = Depends(current_user_id),
    use_case: ListIncomeSources = Depends(list_income_sources_use_case),
) -> list[IncomeSourceResponse]:
    results = await use_case.execute(ListIncomeSourcesQuery(user_id=user_id))
    return [IncomeSourceResponse.model_validate(r, from_attributes=True) for r in results]


@router.put("/income-sources/{source_id}", response_model=IncomeSourceResponse)
async def update_income_source(
    source_id: str,
    request: IncomeSourceRequest,
    user_id: str = Depends(current_user_id),
    use_case: UpdateIncomeSource = Depends(update_income_source_use_case),
) -> IncomeSourceResponse:
    result = await use_case.execute(
        UpdateIncomeSourceCommand(
            user_id=user_id,
            source_id=source_id,
            name=request.name,
            amount=request.amount,
            frequency=request.frequency.value,
        )
    )
    return IncomeSourceResponse.model_validate(result, from_attributes=True)


@router.delete("/income-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income_source(
    source_id: str,
    user_id: str = Depends(current_user_id),
    use_case: DeleteIncomeSource = Depends(delete_income_source_use_case),
) -> Response:
    await use_case.execute(DeleteIncomeSourceCommand(user_id=user_id, source_id=source_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    request: CategoryRequest,
    user_id: str = Depends(current_user_id),
    use_case: CreateCategory = Depends(create_category_use_case),
) -> CategoryResponse:
    result = await use_case.execute(
        CreateCategoryCommand(user_id=user_id, name=request.name, color=request.color)
    )
    return CategoryResponse.model_validate(result, from_attributes=True)


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    user_id: str = Depends(current_user_id),
    use_case: ListCategories = Depends(list_categories_use_case),
) -> list[CategoryResponse]:
    results = await use_case.execute(ListCategoriesQuery(user_id=user_id))
    return [CategoryResponse.model_validate(r, from_attributes=True) for r in results]


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    request: CategoryRequest,
    user_id: str = Depends(current_user_id),
    use_case: UpdateCategory = Depends(update_category_use_case),
) -> CategoryResponse:
    result = await use_case.execute(
        UpdateCategoryCommand(
            user_id=user_id,
            category_id=category_id,
            name=request.name,
            color=request.color,
        )
    )
    return CategoryResponse.model_validate(result, from_attributes=True)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    user_id: str = Depends(current_user_id),
    use_case: DeleteCategory = Depends(delete_category_use_case),
) -> Response:
    await use_case.execute(DeleteCategoryCommand(user_id=user_id, category_id=category_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_transaction(
    request: TransactionRequest,
    user_id: str = Depends(current_user_id),
    use_case: CreateTransaction = Depends(create_transaction_use_case),
) -> TransactionResponse:
    result = await use_case.execute(
        CreateTransactionCommand(
            user_id=user_id,
            account_id=request.account_id,
            category_id=request.category_id,
            title=request.title,
            amount=request.amount,
            transaction_type=request.transaction_type.value,
            date=request.date,
            note=request.note,
        )
    )
    return TransactionResponse.model_validate(result, from_attributes=True)


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    from_date: Optional[DateType] = None,
    to_date: Optional[DateType] = None,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(current_user_id),
    use_case: ListTransactions = Depends(list_transactions_use_case),
) -> list[TransactionResponse]:
    results = await use_case.execute(
        ListTransactionsQuery(
            user_id=user_id,
            account_id=account_id,
            category_id=category_id,
            from_date=from_date,
            to_date=to_date,
            limit=limit,
            offset=offset,
        )
    )
    return [TransactionResponse.model_validate(r, from_attributes=True) for r in results]


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    request: TransactionUpdateRequest,
    user_id: str = Depends(current_user_id),
    use_case: UpdateTransaction = Depends(update_transaction_use_case),
) -> TransactionResponse:
    result = await use_case.execute(
        UpdateTransactionCommand(
            user_id=user_id,
            transaction_id=transaction_id,
            category_id=request.category_id,
            title=request.title,
            amount=request.amount,
            transaction_type=request.transaction_type.value,
            date=request.date,
            note=request.note,
        )
    )
    return TransactionResponse.model_validate(result, from_attributes=True)


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(current_user_id),
    use_case: DeleteTransaction = Depends(delete_transaction_use_case),
) -> Response:
    await use_case.execute(DeleteTransactionCommand(user_id=user_id, transaction_id=transaction_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/transfers", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def transfer_between_accounts(
    request: TransferRequest,
    user_id: str = Depends(current_user_id),
    use_case: TransferBetweenAccounts = Depends(transfer_use_case),
) -> TransferResponse:
    result = await use_case.execute(
        TransferCommand(
            user_id=user_id,
            from_account_id=request.from_account_id,
            to_account_id=request.to_account_id,
            category_id=request.category_id,
            amount=request.amount,
            date=request.date,
            note=request.note,
        )
    )
    return TransferResponse(
        debit_transaction_id=result.debit_transaction_id,
        credit_transaction_id=result.credit_transaction_id,
    )


@router.post("/bank-imports", response_model=BankImportResponse, status_code=status.HTTP_201_CREATED)
async def import_bank_statement(
    request: ImportBankStatementRequest,
    user_id: str = Depends(current_user_id),
    use_case: ImportBankStatement = Depends(import_bank_statement_use_case),
) -> BankImportResponse:
    result = await use_case.execute(
        ImportBankStatementCommand(
            user_id=user_id,
            account_id=request.account_id,
            source_name=request.source_name,
            rows=[
                ImportRowCommand(
                    date=row.date,
                    title=row.title,
                    amount=row.amount,
                    transaction_type=row.transaction_type,
                    category_id=row.category_id,
                )
                for row in request.rows
            ],
        )
    )
    return BankImportResponse(
        id=result.id,
        user_id=result.user_id,
        account_id=result.account_id,
        source_name=result.source_name,
        row_count=result.row_count,
        imported_count=result.imported_count,
        created_at=result.created_at,
    )


@router.get("/bank-imports", response_model=list[BankImportResponse])
async def list_bank_imports(
    user_id: str = Depends(current_user_id),
    use_case: ListBankImports = Depends(list_bank_imports_use_case),
) -> list[BankImportResponse]:
    results = await use_case.execute(ListBankImportsQuery(user_id=user_id))
    return [
        BankImportResponse(
            id=r.id,
            user_id=r.user_id,
            account_id=r.account_id,
            source_name=r.source_name,
            row_count=r.row_count,
            imported_count=r.imported_count,
            created_at=r.created_at,
        )
        for r in results
    ]


@router.post("/bank-imports/parse-pdf", response_model=list[ParsedPdfRowResponse])
async def parse_pdf_statement(
    request: ParsePdfRequest,
    user_id: str = Depends(current_user_id),
    use_case: ParsePdfStatement = Depends(parse_pdf_use_case),
) -> list[ParsedPdfRowResponse]:
    rows = use_case.execute(ParsePdfCommand(
        user_id=user_id,
        file_base64=request.file_base64,
        source_name=request.source_name,
    ))
    return [
        ParsedPdfRowResponse(
            date=r.date,
            title=r.title,
            amount=r.amount,
            transaction_type=r.transaction_type,
        )
        for r in rows
    ]


@router.get("/budgets", response_model=BudgetResponse | None)
async def get_budget(
    year: int,
    month: int,
    user_id: str = Depends(current_user_id),
    use_case: GetBudget = Depends(get_budget_use_case),
) -> BudgetResponse | None:
    result = await use_case.execute(GetBudgetQuery(user_id=user_id, year=year, month=month))
    if result is None:
        return None
    return BudgetResponse(
        id=result.id,
        user_id=result.user_id,
        year=result.year,
        month=result.month,
        lines=[BudgetLineResponse(category_id=l.category_id, planned_amount=l.planned_amount) for l in result.lines],
        total_planned=result.total_planned,
    )


@router.put("/budgets", response_model=BudgetResponse)
async def set_budget(
    request: BudgetRequest,
    user_id: str = Depends(current_user_id),
    use_case: SetBudget = Depends(set_budget_use_case),
) -> BudgetResponse:
    result = await use_case.execute(
        SetBudgetCommand(
            user_id=user_id,
            year=request.year,
            month=request.month,
            lines=[
                BudgetLineCommand(category_id=l.category_id, planned_amount=l.planned_amount)
                for l in request.lines
            ],
        )
    )
    return BudgetResponse(
        id=result.id,
        user_id=result.user_id,
        year=result.year,
        month=result.month,
        lines=[BudgetLineResponse(category_id=l.category_id, planned_amount=l.planned_amount) for l in result.lines],
        total_planned=result.total_planned,
    )


def _receipt_response(result: object) -> ReceiptResponse:
    return ReceiptResponse(
        id=result.id,  # type: ignore[attr-defined]
        user_id=result.user_id,  # type: ignore[attr-defined]
        merchant=result.merchant,  # type: ignore[attr-defined]
        total=result.total,  # type: ignore[attr-defined]
        date=result.date,  # type: ignore[attr-defined]
        items=[ReceiptItemResponse(name=i.name, amount=i.amount, category_id=i.category_id) for i in result.items],  # type: ignore[attr-defined]
        transaction_id=result.transaction_id,  # type: ignore[attr-defined]
        created_at=result.created_at,  # type: ignore[attr-defined]
    )


@router.post("/receipts/scan", response_model=ScanReceiptResponse)
async def scan_receipt(
    request: ScanReceiptRequest,
    user_id: str = Depends(current_user_id),
    use_case: ScanReceipt = Depends(scan_receipt_use_case),
) -> ScanReceiptResponse:
    result = await use_case.execute(
        ScanReceiptCommand(
            user_id=user_id,
            image_base64=request.image_base64,
            media_type=request.media_type,
        )
    )
    return ScanReceiptResponse(
        merchant=result.merchant,
        total=result.total,
        date=result.date,
        items=[{"name": i.name, "amount": i.amount} for i in result.items],  # type: ignore[misc]
    )


@router.post("/receipts", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def save_receipt(
    request: SaveReceiptRequest,
    user_id: str = Depends(current_user_id),
    use_case: SaveReceipt = Depends(save_receipt_use_case),
) -> ReceiptResponse:
    result = await use_case.execute(
        SaveReceiptCommand(
            user_id=user_id,
            merchant=request.merchant,
            total=request.total,
            date=request.date,
            items=[ReceiptItemDto(name=i.name, amount=i.amount, category_id=i.category_id) for i in request.items],
            transaction_id=request.transaction_id,
        )
    )
    return _receipt_response(result)


@router.get("/receipts", response_model=list[ReceiptResponse])
async def list_receipts(
    user_id: str = Depends(current_user_id),
    use_case: ListReceipts = Depends(list_receipts_use_case),
) -> list[ReceiptResponse]:
    results = await use_case.execute(ListReceiptsQuery(user_id=user_id))
    return [_receipt_response(r) for r in results]


def _savings_goal_response(r: object) -> SavingsGoalResponse:
    return SavingsGoalResponse(
        id=r.id,  # type: ignore[attr-defined]
        user_id=r.user_id,  # type: ignore[attr-defined]
        name=r.name,  # type: ignore[attr-defined]
        target_amount=r.target_amount,  # type: ignore[attr-defined]
        current_amount=r.current_amount,  # type: ignore[attr-defined]
        deadline=r.deadline,  # type: ignore[attr-defined]
        progress_ratio=r.progress_ratio,  # type: ignore[attr-defined]
        remaining_amount=r.remaining_amount,  # type: ignore[attr-defined]
        created_at=r.created_at,  # type: ignore[attr-defined]
    )


@router.post("/savings-goals", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_goal(
    request: SavingsGoalRequest,
    user_id: str = Depends(current_user_id),
    use_case: CreateSavingsGoal = Depends(create_savings_goal_use_case),
) -> SavingsGoalResponse:
    result = await use_case.execute(
        CreateSavingsGoalCommand(
            user_id=user_id,
            name=request.name,
            target_amount=request.target_amount,
            current_amount=request.current_amount,
            deadline=request.deadline,
        )
    )
    return _savings_goal_response(result)


@router.get("/savings-goals", response_model=list[SavingsGoalResponse])
async def list_savings_goals(
    user_id: str = Depends(current_user_id),
    use_case: ListSavingsGoals = Depends(list_savings_goals_use_case),
) -> list[SavingsGoalResponse]:
    results = await use_case.execute(ListSavingsGoalsQuery(user_id=user_id))
    return [_savings_goal_response(r) for r in results]


@router.put("/savings-goals/{goal_id}", response_model=SavingsGoalResponse)
async def update_savings_goal(
    goal_id: str,
    request: SavingsGoalRequest,
    user_id: str = Depends(current_user_id),
    use_case: UpdateSavingsGoal = Depends(update_savings_goal_use_case),
) -> SavingsGoalResponse:
    result = await use_case.execute(
        UpdateSavingsGoalCommand(
            user_id=user_id,
            goal_id=goal_id,
            name=request.name,
            target_amount=request.target_amount,
            current_amount=request.current_amount,
            deadline=request.deadline,
        )
    )
    return _savings_goal_response(result)


@router.delete("/savings-goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_goal(
    goal_id: str,
    user_id: str = Depends(current_user_id),
    use_case: DeleteSavingsGoal = Depends(delete_savings_goal_use_case),
) -> Response:
    await use_case.execute(DeleteSavingsGoalCommand(user_id=user_id, goal_id=goal_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/budget-advice", response_model=BudgetAdviceResponse)
async def generate_budget_advice(
    request: BudgetAdviceRequest,
    user_id: str = Depends(current_user_id),
    use_case: GenerateBudgetAdvice = Depends(generate_budget_advice_use_case),
) -> BudgetAdviceResponse:
    result = await use_case.execute(
        GenerateBudgetAdviceCommand(user_id=user_id, year=request.year, month=request.month)
    )
    return BudgetAdviceResponse(
        summary=result.summary,
        tips=result.tips,
        savings_advice=result.savings_advice,
        period_label=result.period_label,
        sentiment=result.sentiment,
    )
