class DomainError(Exception):
    """Base class for business-rule failures."""


class InvalidEmailError(DomainError):
    def __init__(self, value: str) -> None:
        super().__init__(f"Invalid email address: {value}")


class InvalidUserError(DomainError):
    pass


class InvalidAccountError(DomainError):
    pass


class AccountNotFoundError(DomainError):
    pass


class DuplicateEmailError(DomainError):
    def __init__(self, email: str) -> None:
        super().__init__(f"Email already exists: {email}")


class InvalidCredentialsError(DomainError):
    def __init__(self) -> None:
        super().__init__("Invalid email or password")


class UserNotFoundError(DomainError):
    pass


class InvalidRefreshTokenError(DomainError):
    pass


class ExpiredRefreshTokenError(DomainError):
    pass


class RevokedRefreshTokenError(DomainError):
    pass


class InvalidIncomeSourceError(DomainError):
    pass


class IncomeSourceNotFoundError(DomainError):
    pass


class InvalidCategoryError(DomainError):
    pass


class CategoryNotFoundError(DomainError):
    pass


class InvalidTransactionError(DomainError):
    pass


class TransactionNotFoundError(DomainError):
    pass


class InvalidReceiptError(DomainError):
    pass


class ReceiptNotFoundError(DomainError):
    pass


class InvalidBankImportError(DomainError):
    pass


class BankImportNotFoundError(DomainError):
    pass


class InvalidBudgetError(DomainError):
    pass


class BudgetNotFoundError(DomainError):
    pass


class InvalidSavingsGoalError(DomainError):
    pass


class SavingsGoalNotFoundError(DomainError):
    pass
