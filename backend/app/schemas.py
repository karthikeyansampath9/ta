from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

class RowError(BaseModel):
    row_number: int
    store_id: Optional[str] = None
    sku: Optional[str] = None
    field: Optional[str] = None
    error_message: str

class PricingRecordBase(BaseModel):
    store_id: str = Field(..., min_length=1, max_length=50)
    sku: str = Field(..., min_length=1, max_length=50)
    product_name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0, description="Price must be strictly positive")
    currency: Optional[str] = "USD"
    date: date

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return round(v, 2)

class PricingRecordCreate(PricingRecordBase):
    pass

class PricingRecordUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: float = Field(..., gt=0, description="Price must be strictly positive")
    version: int = Field(..., description="Current version of the record for optimistic concurrency control")
    changed_by: Optional[str] = Field("Operator", max_length=100)
    reason: Optional[str] = Field("Price adjustment", max_length=500)

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return round(v, 2)

class PriceAuditLogRead(BaseModel):
    id: int
    pricing_record_id: int
    store_id: str
    sku: str
    old_price: Optional[float]
    new_price: float
    price_delta: Optional[float]
    percentage_change: Optional[float]
    change_source: str
    changed_by: str
    reason: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PricingRecordRead(PricingRecordBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PricingRecordDetail(PricingRecordRead):
    audit_logs: List[PriceAuditLogRead] = []

class PaginatedPricingResponse(BaseModel):
    items: List[PricingRecordRead]
    total: int
    page: int
    page_size: int
    total_pages: int

class IngestionResult(BaseModel):
    batch_id: str
    filename: str
    total_rows: int
    success_count: int
    error_count: int
    status: str
    duration_ms: float
    errors: List[RowError] = []

class DashboardSummary(BaseModel):
    total_records: int
    active_stores: int
    unique_skus: int
    average_price: float
    latest_feed_at: Optional[datetime]
    recent_batches: List[Any] = []
    top_stores_by_count: List[dict] = []
    price_ranges: dict = {}

class MockDataRequest(BaseModel):
    store_count: int = Field(10, ge=1, le=3000)
    records_per_store: int = Field(10, ge=1, le=500)
    start_date: Optional[date] = None
