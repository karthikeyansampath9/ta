from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class PricingRecord(Base):
    __tablename__ = "pricing_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(String(50), nullable=False, index=True)
    sku = Column(String(50), nullable=False, index=True)
    product_name = Column(String(255), nullable=False, index=True)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    date = Column(Date, nullable=False, index=True)
    
    # Optimistic locking version
    version = Column(Integer, default=1, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    audit_logs = relationship("PriceAuditLog", back_populates="pricing_record", cascade="all, delete-orphan", order_by="desc(PriceAuditLog.created_at)")

    __table_args__ = (
        # Idempotency constraint: A single store has one price record for a SKU on a given date
        UniqueConstraint("store_id", "sku", "date", name="uq_store_sku_date"),
        Index("idx_store_sku", "store_id", "sku"),
        Index("idx_store_date", "store_id", "date"),
        Index("idx_price_range", "price"),
    )


class PriceAuditLog(Base):
    __tablename__ = "price_audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pricing_record_id = Column(Integer, ForeignKey("pricing_records.id", ondelete="CASCADE"), nullable=False, index=True)
    store_id = Column(String(50), nullable=False)
    sku = Column(String(50), nullable=False)
    old_price = Column(Float, nullable=True)
    new_price = Column(Float, nullable=False)
    price_delta = Column(Float, nullable=True)
    percentage_change = Column(Float, nullable=True)
    change_source = Column(String(50), default="MANUAL_EDIT", nullable=False) # MANUAL_EDIT, CSV_FEED, REST_API
    changed_by = Column(String(100), default="Operator", nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    pricing_record = relationship("PricingRecord", back_populates="audit_logs")


class IngestionBatch(Base):
    __tablename__ = "ingestion_batches"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="PENDING", nullable=False) # SUCCESS, PARTIAL, FAILED
    duration_ms = Column(Float, default=0.0, nullable=False)
    errors_summary = Column(Text, nullable=True) # JSON array of sample row errors
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
