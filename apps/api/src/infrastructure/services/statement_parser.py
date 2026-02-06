"""Multi-format statement parser service.

Parses bank statement files (CSV, Excel, JSON, PDF) into Transaction entities
with flexible column detection for various bank export formats.
"""

import csv
import io
import json
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Optional, Tuple

from src.domain.entities import Transaction, TransactionStatus


# Flexible column name mappings
DATE_COLUMNS = {"date", "Date", "DATE", "fecha", "transaction_date", "Transaction Date", "Datum"}
DESCRIPTION_COLUMNS = {
    "description", "Description", "DESCRIPTION",
    "libelle", "Libellé", "libellé", "LIBELLE",
    "label", "Label", "LABEL",
    "memo", "Memo",
    "reference", "Reference",
}
AMOUNT_COLUMNS = {"amount", "Amount", "AMOUNT", "montant", "Montant", "MONTANT", "Betrag"}
DEBIT_COLUMNS = {"debit", "Debit", "DEBIT", "débit", "Débit"}
CREDIT_COLUMNS = {"credit", "Credit", "CREDIT", "crédit", "Crédit"}

DATE_FORMATS = [
    "%Y-%m-%d",       # 2024-01-15
    "%d/%m/%Y",       # 15/01/2024
    "%m/%d/%Y",       # 01/15/2024
    "%Y/%m/%d",       # 2024/01/15
    "%d-%m-%Y",       # 15-01-2024
    "%d.%m.%Y",       # 15.01.2024
]


def _find_column(headers: List[str], candidates: set) -> Optional[str]:
    """Find the first matching header from a set of candidates."""
    for header in headers:
        stripped = header.strip()
        if stripped in candidates:
            return header
    return None


def _parse_date(value: str) -> datetime:
    """Parse a date string trying multiple formats."""
    value = value.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f"Impossible de parser la date: '{value}'")


def _parse_amount(value: str) -> Decimal:
    """Parse an amount string handling various formats."""
    value = value.strip()
    # Handle French format: 1 234,56 or 1.234,56
    if "," in value and "." in value:
        # Determine which is the decimal separator (last one)
        if value.rindex(",") > value.rindex("."):
            # French: 1.234,56
            value = value.replace(".", "").replace(",", ".")
        else:
            # English: 1,234.56
            value = value.replace(",", "")
    elif "," in value:
        # Could be French decimal: 123,45
        value = value.replace(",", ".")

    # Remove spaces and currency symbols
    value = value.replace(" ", "").replace("\u00a0", "")
    value = value.replace("€", "").replace("$", "").replace("£", "")

    try:
        return Decimal(value)
    except InvalidOperation:
        raise ValueError(f"Impossible de parser le montant: '{value}'")


def _row_to_transaction(
    row: Dict[str, str],
    headers: List[str],
    user_id: str,
    account_id: str,
    currency: str,
) -> Transaction:
    """Convert a row dict to a Transaction entity.

    Amount and description are required. Other fields (category, merchant,
    notes) can be missing - the user can edit them later.
    """
    date_col = _find_column(headers, DATE_COLUMNS)
    desc_col = _find_column(headers, DESCRIPTION_COLUMNS)
    amount_col = _find_column(headers, AMOUNT_COLUMNS)
    debit_col = _find_column(headers, DEBIT_COLUMNS)
    credit_col = _find_column(headers, CREDIT_COLUMNS)

    if not amount_col and not (debit_col or credit_col):
        raise ValueError(f"Colonne montant introuvable. Colonnes disponibles: {headers}")

    # Date: default to today if column missing or unparseable
    date_val = datetime.utcnow()
    if date_col and row.get(date_col, "").strip():
        try:
            date_val = _parse_date(row[date_col])
        except ValueError:
            pass  # keep default

    # Description: use column value or fallback
    description = ""
    if desc_col and row.get(desc_col, "").strip():
        description = row[desc_col].strip()
    if not description:
        raise ValueError("Description manquante")

    # Amount: required
    if amount_col and row.get(amount_col, "").strip():
        amount = _parse_amount(row[amount_col])
    else:
        amount = Decimal("0")
        if debit_col and row.get(debit_col, "").strip():
            amount = -abs(_parse_amount(row[debit_col]))
        if credit_col and row.get(credit_col, "").strip():
            amount = abs(_parse_amount(row[credit_col]))
        if amount == Decimal("0"):
            raise ValueError("Montant manquant")

    return Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=account_id,
        amount=amount,
        currency=currency,
        date=date_val,
        description=description,
        is_manual=False,
        status=TransactionStatus.COMPLETED,
    )


def parse_csv(
    file_content: bytes,
    user_id: str,
    account_id: str,
    currency: str = "EUR",
) -> Tuple[List[Transaction], List[str]]:
    """Parse a CSV file into transactions.

    Returns (transactions, errors).
    """
    transactions: List[Transaction] = []
    errors: List[str] = []

    text = file_content.decode("utf-8-sig")  # Handle BOM

    # Detect separator
    first_line = text.split("\n")[0] if text else ""
    delimiter = ";" if ";" in first_line else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    headers = reader.fieldnames or []

    for i, row in enumerate(reader, start=2):
        try:
            # Skip empty rows
            if all(not v.strip() for v in row.values() if v):
                continue
            txn = _row_to_transaction(row, headers, user_id, account_id, currency)
            transactions.append(txn)
        except Exception as e:
            errors.append(f"Ligne {i}: {str(e)}")

    return transactions, errors


def parse_excel(
    file_content: bytes,
    user_id: str,
    account_id: str,
    currency: str = "EUR",
) -> Tuple[List[Transaction], List[str]]:
    """Parse an Excel file into transactions.

    Returns (transactions, errors).
    """
    import openpyxl

    transactions: List[Transaction] = []
    errors: List[str] = []

    wb = openpyxl.load_workbook(io.BytesIO(file_content), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return [], ["Le fichier Excel est vide ou ne contient qu'un en-tête"]

    headers = [str(cell) if cell is not None else "" for cell in rows[0]]

    for i, row_values in enumerate(rows[1:], start=2):
        try:
            row_dict = {}
            for j, header in enumerate(headers):
                val = row_values[j] if j < len(row_values) else None
                # Convert dates and numbers to strings for uniform processing
                if isinstance(val, datetime):
                    row_dict[header] = val.strftime("%Y-%m-%d")
                elif val is not None:
                    row_dict[header] = str(val)
                else:
                    row_dict[header] = ""

            if all(not v.strip() for v in row_dict.values()):
                continue

            txn = _row_to_transaction(row_dict, headers, user_id, account_id, currency)
            transactions.append(txn)
        except Exception as e:
            errors.append(f"Ligne {i}: {str(e)}")

    wb.close()
    return transactions, errors


def parse_json(
    file_content: bytes,
    user_id: str,
    account_id: str,
    currency: str = "EUR",
) -> Tuple[List[Transaction], List[str]]:
    """Parse a JSON file into transactions.

    Expects an array of objects: [{ date, description, amount, ... }]
    Returns (transactions, errors).
    """
    transactions: List[Transaction] = []
    errors: List[str] = []

    try:
        data = json.loads(file_content.decode("utf-8-sig"))
    except json.JSONDecodeError as e:
        return [], [f"JSON invalide: {str(e)}"]

    if not isinstance(data, list):
        return [], ["Le fichier JSON doit contenir un tableau d'objets"]

    for i, item in enumerate(data, start=1):
        try:
            if not isinstance(item, dict):
                errors.append(f"Element {i}: doit etre un objet")
                continue

            # Convert all values to strings for uniform processing
            row_dict = {k: str(v) if v is not None else "" for k, v in item.items()}
            headers = list(item.keys())

            txn = _row_to_transaction(row_dict, headers, user_id, account_id, currency)
            transactions.append(txn)
        except Exception as e:
            errors.append(f"Element {i}: {str(e)}")

    return transactions, errors


import re

# French month names for Wise-style date parsing
_FRENCH_MONTHS = {
    "janvier": "01", "février": "02", "fevrier": "02", "mars": "03",
    "avril": "04", "mai": "05", "juin": "06", "juillet": "07",
    "août": "08", "aout": "08", "septembre": "09", "octobre": "10",
    "novembre": "11", "décembre": "12", "decembre": "12",
}

# Pattern: "12 février 2025 ..." at the start of a line
_FR_DATE_RE = re.compile(
    r"^(\d{1,2})\s+(" + "|".join(_FRENCH_MONTHS.keys()) + r")\s+(\d{4})",
    re.IGNORECASE,
)

# Pattern: line ending with two numbers like "-16,20 62,76" (amount + balance)
_AMOUNT_BALANCE_RE = re.compile(r"(-?\d[\d\s]*[.,]\d{2})\s+(-?\d[\d\s]*[.,]\d{2})\s*$")


def _parse_french_date(line: str) -> Optional[datetime]:
    """Try to parse a French date like '12 février 2025' from start of line."""
    m = _FR_DATE_RE.match(line.strip())
    if not m:
        return None
    day, month_name, year = m.group(1), m.group(2).lower(), m.group(3)
    month = _FRENCH_MONTHS.get(month_name)
    if not month:
        return None
    try:
        return datetime(int(year), int(month), int(day))
    except ValueError:
        return None


def _parse_wise_text(
    text: str,
    user_id: str,
    account_id: str,
    currency: str,
) -> Tuple[List[Transaction], List[str]]:
    """Parse Wise-style text-based PDF statements.

    Wise format: pairs of lines:
      Line 1 (description): "Description text ... -amount balance"
      Line 2 (date): "12 février 2025 ... details"
    """
    transactions: List[Transaction] = []
    errors: List[str] = []
    lines = text.split("\n")

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Try to match an amount line (description + amount + balance)
        amount_match = _AMOUNT_BALANCE_RE.search(line)
        if amount_match:
            description = line[:amount_match.start()].strip()
            amount_str = amount_match.group(1)

            # Look at the next line(s) for a date
            date_val = None
            for j in range(i + 1, min(i + 4, len(lines))):
                date_val = _parse_french_date(lines[j].strip())
                if date_val:
                    break

            if not date_val:
                errors.append(f"Date introuvable pour: {description[:50]}...")
                i += 1
                continue

            try:
                amount = _parse_amount(amount_str)
                txn = Transaction(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    account_id=account_id,
                    amount=amount,
                    currency=currency,
                    date=date_val,
                    description=description or "Transaction",
                    is_manual=False,
                    status=TransactionStatus.COMPLETED,
                )
                transactions.append(txn)
            except Exception as e:
                errors.append(f"Erreur parsing: {str(e)}")

        i += 1

    return transactions, errors


def parse_pdf(
    file_content: bytes,
    user_id: str,
    account_id: str,
    currency: str = "EUR",
) -> Tuple[List[Transaction], List[str]]:
    """Parse a PDF file into transactions.

    Supports two modes:
    1. Table-based PDFs (standard bank statements with headers)
    2. Text-based PDFs (Wise-style: description+amount on one line, date on next)

    Returns (transactions, errors).
    """
    import pdfplumber

    transactions: List[Transaction] = []
    errors: List[str] = []

    try:
        pdf = pdfplumber.open(io.BytesIO(file_content))
    except Exception as e:
        return [], [f"Impossible d'ouvrir le PDF: {str(e)}"]

    # First, try table extraction
    for page_num, page in enumerate(pdf.pages, start=1):
        tables = page.extract_tables()
        for table_idx, table in enumerate(tables):
            if not table or len(table) < 2:
                continue

            headers = [str(cell).strip() if cell else "" for cell in table[0]]

            for row_num, row_values in enumerate(table[1:], start=2):
                try:
                    row_dict = {}
                    for j, header in enumerate(headers):
                        val = row_values[j] if j < len(row_values) else None
                        row_dict[header] = str(val).strip() if val else ""

                    if all(not v for v in row_dict.values()):
                        continue

                    txn = _row_to_transaction(row_dict, headers, user_id, account_id, currency)
                    transactions.append(txn)
                except Exception as e:
                    errors.append(f"Page {page_num}, tableau {table_idx + 1}, ligne {row_num}: {str(e)}")

    # If no tables found, try text-based parsing (Wise-style)
    if not transactions:
        errors.clear()
        all_text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                all_text += page_text + "\n"

        if all_text.strip():
            transactions, errors = _parse_wise_text(all_text, user_id, account_id, currency)

    pdf.close()

    if not transactions and not errors:
        errors.append("Aucune transaction trouvee dans le PDF")

    return transactions, errors


# Parser registry
PARSERS = {
    "CSV": parse_csv,
    "EXCEL": parse_excel,
    "JSON": parse_json,
    "PDF": parse_pdf,
}


def parse_statement(
    file_type: str,
    file_content: bytes,
    user_id: str,
    account_id: str,
    currency: str = "EUR",
) -> Tuple[List[Transaction], List[str]]:
    """Parse a statement file using the appropriate parser.

    Returns (transactions, errors).
    """
    parser = PARSERS.get(file_type.upper())
    if not parser:
        return [], [f"Format non supporte: {file_type}. Formats acceptes: {', '.join(PARSERS.keys())}"]

    return parser(file_content, user_id, account_id, currency)
