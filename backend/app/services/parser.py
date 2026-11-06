import csv
import io
import re
from datetime import datetime, date
from typing import Tuple, List, Dict, Any, Optional
from backend.app.schemas import RowError

HEADER_ALIASES = {
    "store_id": ["store id", "store_id", "storeid", "store", "store code", "store_code"],
    "sku": ["sku", "sku code", "product sku", "item code", "item_code", "product_code"],
    "product_name": ["product name", "product_name", "productname", "item name", "item description", "description", "title"],
    "price": ["price", "retail price", "retail_price", "unit price", "unit_price", "selling_price"],
    "date": ["date", "pricing date", "price_date", "effective_date", "timestamp"]
}

def normalize_header(header: str) -> str:
    cleaned = header.strip().lower().replace("-", " ").replace("_", " ")
    for canonical, aliases in HEADER_ALIASES.items():
        if cleaned in [a.replace("_", " ") for a in aliases]:
            return canonical
    return cleaned

def parse_date_value(val_str: str) -> Optional[date]:
    val = val_str.strip()
    if not val:
        return None
    # Common date formats in global retail feeds
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None

def parse_price_value(val_str: str) -> Optional[float]:
    val = val_str.strip()
    if not val:
        return None
    # Strip currency symbols and commas e.g. "$1,249.99" -> "1249.99" or "€ 15,50" -> "15.50"
    cleaned = re.sub(r"[^\d.,\-+]", "", val)
    # If comma is used as decimal separator (e.g. 15,50)
    if "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
    elif "," in cleaned and "." in cleaned:
        # e.g. 1,234.56 -> remove comma
        cleaned = cleaned.replace(",", "")
    
    try:
        price = float(cleaned)
        return round(price, 2)
    except ValueError:
        return None

def parse_csv_stream(
    file_bytes: bytes,
    encoding: str = "utf-8"
) -> Tuple[List[Dict[str, Any]], List[RowError], Dict[str, str]]:
    """
    Parses a CSV byte stream, normalizes headers, validates each row,
    and returns (valid_records, errors, header_mapping).
    """
    # Auto-detect BOM or fallback to latin-1
    try:
        text_data = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text_data = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text_data = file_bytes.decode("latin-1")

    reader = csv.reader(io.StringIO(text_data))
    
    try:
        raw_headers = next(reader)
    except StopIteration:
        return [], [RowError(row_number=0, error_message="CSV file is empty")], {}

    # Map headers to canonical names
    header_map = {}
    for idx, raw_h in enumerate(raw_headers):
        norm = normalize_header(raw_h)
        if norm in HEADER_ALIASES:
            header_map[norm] = idx

    required = ["store_id", "sku", "product_name", "price", "date"]
    missing = [req for req in required if req not in header_map]
    if missing:
        return [], [RowError(
            row_number=1,
            error_message=f"Missing required CSV columns: {', '.join(missing)}. Recognized columns found: {', '.join(raw_headers)}"
        )], {k: raw_headers[v] for k, v in header_map.items()}

    valid_records = []
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        if not row or all(c.strip() == "" for c in row):
            continue # skip empty lines

        row_store_id = row[header_map["store_id"]].strip() if header_map["store_id"] < len(row) else ""
        row_sku = row[header_map["sku"]].strip() if header_map["sku"] < len(row) else ""
        row_product_name = row[header_map["product_name"]].strip() if header_map["product_name"] < len(row) else ""
        row_price_raw = row[header_map["price"]].strip() if header_map["price"] < len(row) else ""
        row_date_raw = row[header_map["date"]].strip() if header_map["date"] < len(row) else ""

        # Validate Store ID
        if not row_store_id:
            errors.append(RowError(
                row_number=row_idx,
                store_id=row_store_id,
                sku=row_sku,
                field="store_id",
                error_message="Store ID cannot be empty"
            ))
            continue

        # Validate SKU
        if not row_sku:
            errors.append(RowError(
                row_number=row_idx,
                store_id=row_store_id,
                sku=row_sku,
                field="sku",
                error_message="SKU cannot be empty"
            ))
            continue

        # Validate Product Name
        if not row_product_name:
            errors.append(RowError(
                row_number=row_idx,
                store_id=row_store_id,
                sku=row_sku,
                field="product_name",
                error_message="Product Name cannot be empty"
            ))
            continue

        # Validate Price
        parsed_price = parse_price_value(row_price_raw)
        if parsed_price is None:
            errors.append(RowError(
                row_number=row_idx,
                store_id=row_store_id,
                sku=row_sku,
                field="price",
                error_message=f"Invalid price value '{row_price_raw}' (must be a valid positive number)"
            ))
            continue
        elif parsed_price <= 0:
            errors.append(RowError(
                row_number=row_idx,
                store_id=row_store_id,
                sku=row_sku,
                field="price",
                error_message=f"Price must be strictly greater than zero (found: {parsed_price})"
            ))
            continue

        # Validate Date
        parsed_date = parse_date_value(row_date_raw)
        if parsed_date is None:
            errors.append(RowError(
                row_number=row_idx,
                store_id=row_store_id,
                sku=row_sku,
                field="date",
                error_message=f"Invalid date format '{row_date_raw}' (expected YYYY-MM-DD or DD/MM/YYYY)"
            ))
            continue

        # Map currency based on Store ID prefix (e.g. US-, UK-, DE-, JP-) or default USD
        currency = "USD"
        s_upper = row_store_id.upper()
        if "UK" in s_upper or "GB" in s_upper:
            currency = "GBP"
        elif "DE" in s_upper or "FR" in s_upper or "IT" in s_upper or "ES" in s_upper or "EU" in s_upper:
            currency = "EUR"
        elif "JP" in s_upper:
            currency = "JPY"
        elif "CA" in s_upper:
            currency = "CAD"
        elif "AU" in s_upper:
            currency = "AUD"

        valid_records.append({
            "store_id": row_store_id,
            "sku": row_sku,
            "product_name": row_product_name,
            "price": parsed_price,
            "currency": currency,
            "date": parsed_date,
        })

    return valid_records, errors, {k: raw_headers[v] for k, v in header_map.items()}
