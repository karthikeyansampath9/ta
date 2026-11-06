import time
import json
import uuid
from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, and_, or_

from backend.app.models import PricingRecord, PriceAuditLog, IngestionBatch, utcnow
from backend.app.schemas import PricingRecordUpdate, RowError

class ConcurrencyConflictError(Exception):
    def __init__(self, current_version: int, expected_version: int):
        self.current_version = current_version
        self.expected_version = expected_version
        super().__init__(f"Record was modified by another process. Current version is {current_version}, but client expected version {expected_version}.")

def ingest_pricing_batch(
    db: Session,
    records: List[Dict[str, Any]],
    filename: str,
    raw_errors: List[RowError]
) -> Dict[str, Any]:
    """
    Persists pricing feed records using batch chunking and idempotency.
    Updates existing store-sku-date records, increments version, and logs audit entries.
    """
    start_time = time.time()
    batch_id = str(uuid.uuid4())
    success_count = 0

    # Process in chunks of 500 for optimal memory and transaction efficiency
    chunk_size = 500
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        
        # Build lookup keys for the chunk
        keys = [(r["store_id"], r["sku"], r["date"]) for r in chunk]
        
        # Fetch existing records in this chunk
        # Querying with composite or_ conditions
        conditions = [
            and_(
                PricingRecord.store_id == r["store_id"],
                PricingRecord.sku == r["sku"],
                PricingRecord.date == r["date"]
            )
            for r in chunk
        ]
        existing_records_map = {}
        if conditions:
            existing_records = db.query(PricingRecord).filter(or_(*conditions)).all()
            for er in existing_records:
                existing_records_map[(er.store_id, er.sku, er.date)] = er

        for r in chunk:
            key = (r["store_id"], r["sku"], r["date"])
            existing = existing_records_map.get(key)
            
            if existing:
                # If price changed, update and log
                if abs(existing.price - r["price"]) > 0.001 or existing.product_name != r["product_name"]:
                    old_price = existing.price
                    new_price = r["price"]
                    delta = round(new_price - old_price, 2)
                    pct = round((delta / old_price) * 100, 2) if old_price > 0 else 0.0

                    existing.product_name = r["product_name"]
                    existing.price = new_price
                    existing.currency = r.get("currency", existing.currency)
                    existing.version += 1
                    existing.updated_at = utcnow()

                    audit = PriceAuditLog(
                        pricing_record_id=existing.id,
                        store_id=existing.store_id,
                        sku=existing.sku,
                        old_price=old_price,
                        new_price=new_price,
                        price_delta=delta,
                        percentage_change=pct,
                        change_source="CSV_FEED",
                        changed_by=f"Feed: {filename}",
                        reason="Automated daily price feed sync"
                    )
                    db.add(audit)
                success_count += 1
            else:
                # Insert new record
                new_record = PricingRecord(
                    store_id=r["store_id"],
                    sku=r["sku"],
                    product_name=r["product_name"],
                    price=r["price"],
                    currency=r.get("currency", "USD"),
                    date=r["date"],
                    version=1,
                    created_at=utcnow(),
                    updated_at=utcnow()
                )
                db.add(new_record)
                db.flush() # populate new_record.id

                audit = PriceAuditLog(
                    pricing_record_id=new_record.id,
                    store_id=new_record.store_id,
                    sku=new_record.sku,
                    old_price=None,
                    new_price=new_record.price,
                    price_delta=0.0,
                    percentage_change=0.0,
                    change_source="CSV_FEED",
                    changed_by=f"Feed: {filename}",
                    reason="Initial feed creation"
                )
                db.add(audit)
                existing_records_map[key] = new_record
                success_count += 1

        db.commit()

    duration_ms = round((time.time() - start_time) * 1000, 2)
    error_count = len(raw_errors)
    status = "SUCCESS" if error_count == 0 else ("PARTIAL" if success_count > 0 else "FAILED")

    # Serialize top 50 sample errors for summary
    errors_sample = [e.model_dump() for e in raw_errors[:50]]
    
    batch = IngestionBatch(
        id=batch_id,
        filename=filename,
        total_rows=len(records) + error_count,
        success_count=success_count,
        error_count=error_count,
        status=status,
        duration_ms=duration_ms,
        errors_summary=json.dumps(errors_sample),
        created_at=utcnow()
    )
    db.add(batch)
    db.commit()

    return {
        "batch_id": batch_id,
        "filename": filename,
        "total_rows": len(records) + error_count,
        "success_count": success_count,
        "error_count": error_count,
        "status": status,
        "duration_ms": duration_ms,
        "errors": raw_errors
    }

def search_pricing_records(
    db: Session,
    store_id: Optional[str] = None,
    sku: Optional[str] = None,
    product_name: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[PricingRecord], int, int]:
    query = db.query(PricingRecord)

    if store_id and store_id.strip():
        # Match exact or prefix (e.g. "US-001" or "001")
        query = query.filter(PricingRecord.store_id.ilike(f"%{store_id.strip()}%"))
    
    if sku and sku.strip():
        query = query.filter(PricingRecord.sku.ilike(f"%{sku.strip()}%"))

    if product_name and product_name.strip():
        query = query.filter(PricingRecord.product_name.ilike(f"%{product_name.strip()}%"))

    if min_price is not None:
        query = query.filter(PricingRecord.price >= min_price)

    if max_price is not None:
        query = query.filter(PricingRecord.price <= max_price)

    if start_date:
        query = query.filter(PricingRecord.date >= start_date)

    if end_date:
        query = query.filter(PricingRecord.date <= end_date)

    total = query.count()

    # Dynamic sorting
    sort_column = getattr(PricingRecord, sort_by, PricingRecord.updated_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = max(1, (total + page_size - 1) // page_size)

    return items, total, total_pages

def get_pricing_record(db: Session, record_id: int) -> Optional[PricingRecord]:
    return db.query(PricingRecord).filter(PricingRecord.id == record_id).first()

def update_pricing_record(
    db: Session,
    record_id: int,
    payload: PricingRecordUpdate
) -> PricingRecord:
    record = db.query(PricingRecord).filter(PricingRecord.id == record_id).first()
    if not record:
        return None

    # Optimistic concurrency check
    if record.version != payload.version:
        raise ConcurrencyConflictError(
            current_version=record.version,
            expected_version=payload.version
        )

    old_price = record.price
    new_price = payload.price
    delta = round(new_price - old_price, 2)
    pct = round((delta / old_price) * 100, 2) if old_price > 0 else 0.0

    if payload.product_name:
        record.product_name = payload.product_name
    record.price = new_price
    record.version += 1
    record.updated_at = utcnow()

    # Create immutable audit log
    audit = PriceAuditLog(
        pricing_record_id=record.id,
        store_id=record.store_id,
        sku=record.sku,
        old_price=old_price,
        new_price=new_price,
        price_delta=delta,
        percentage_change=pct,
        change_source="MANUAL_EDIT",
        changed_by=payload.changed_by or "Pricing Manager",
        reason=payload.reason or "Manual price adjustment",
        created_at=utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(record)
    return record

def get_audit_logs_for_record(db: Session, record_id: int) -> List[PriceAuditLog]:
    return db.query(PriceAuditLog).filter(PriceAuditLog.pricing_record_id == record_id).order_by(desc(PriceAuditLog.created_at)).all()

def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    total_records = db.query(func.count(PricingRecord.id)).scalar() or 0
    active_stores = db.query(func.count(func.distinct(PricingRecord.store_id))).scalar() or 0
    unique_skus = db.query(func.count(func.distinct(PricingRecord.sku))).scalar() or 0
    avg_price = db.query(func.avg(PricingRecord.price)).scalar() or 0.0
    latest_feed = db.query(func.max(IngestionBatch.created_at)).scalar()

    recent_batches_db = db.query(IngestionBatch).order_by(desc(IngestionBatch.created_at)).limit(5).all()
    recent_batches = [
        {
            "id": b.id,
            "filename": b.filename,
            "total_rows": b.total_rows,
            "success_count": b.success_count,
            "error_count": b.error_count,
            "status": b.status,
            "duration_ms": b.duration_ms,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in recent_batches_db
    ]

    # Top stores by pricing record volume
    top_stores = (
        db.query(PricingRecord.store_id, func.count(PricingRecord.id).label("cnt"))
        .group_by(PricingRecord.store_id)
        .order_by(desc("cnt"))
        .limit(6)
        .all()
    )
    top_stores_by_count = [{"store_id": s[0], "count": s[1]} for s in top_stores]

    # Price bracket distribution
    brackets = {
        "under_10": db.query(func.count(PricingRecord.id)).filter(PricingRecord.price < 10).scalar() or 0,
        "10_to_50": db.query(func.count(PricingRecord.id)).filter(and_(PricingRecord.price >= 10, PricingRecord.price < 50)).scalar() or 0,
        "50_to_100": db.query(func.count(PricingRecord.id)).filter(and_(PricingRecord.price >= 50, PricingRecord.price < 100)).scalar() or 0,
        "over_100": db.query(func.count(PricingRecord.id)).filter(PricingRecord.price >= 100).scalar() or 0,
    }

    return {
        "total_records": total_records,
        "active_stores": active_stores,
        "unique_skus": unique_skus,
        "average_price": round(float(avg_price), 2),
        "latest_feed_at": latest_feed,
        "recent_batches": recent_batches,
        "top_stores_by_count": top_stores_by_count,
        "price_ranges": brackets
    }
