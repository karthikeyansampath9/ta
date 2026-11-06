import io
import csv
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas import (
    PricingRecordRead,
    PricingRecordDetail,
    PricingRecordUpdate,
    PaginatedPricingResponse,
    IngestionResult,
    PriceAuditLogRead,
    DashboardSummary,
    MockDataRequest
)
from backend.app.services.parser import parse_csv_stream
from backend.app.services.pricing_service import (
    ingest_pricing_batch,
    search_pricing_records,
    get_pricing_record,
    update_pricing_record,
    get_audit_logs_for_record,
    get_dashboard_summary,
    ConcurrencyConflictError
)
from backend.app.services.generator import (
    generate_mock_pricing_records,
    generate_mock_csv
)

router = APIRouter(prefix="/pricing", tags=["Pricing Feeds & Search"])

@router.post("/upload", response_model=IngestionResult, summary="Upload & Ingest Pricing Feed CSV")
async def upload_pricing_feed(
    file: UploadFile = File(..., description="CSV file with Store ID, SKU, Product Name, Price, Date"),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard CSV file."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    valid_records, errors, headers = parse_csv_stream(file_bytes)

    if not valid_records and errors:
        # If headers were invalid or no valid records found
        if any("Missing required CSV columns" in e.error_message or "empty" in e.error_message for e in errors):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=errors[0].error_message
            )

    result = ingest_pricing_batch(
        db=db,
        records=valid_records,
        filename=file.filename,
        raw_errors=errors
    )
    return result

@router.get("", response_model=PaginatedPricingResponse, summary="Search Pricing Records")
def get_pricing_records(
    store_id: Optional[str] = Query(None, description="Store ID filter (e.g. 'US-0001')"),
    sku: Optional[str] = Query(None, description="SKU code filter"),
    product_name: Optional[str] = Query(None, description="Product Name substring filter"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    sort_by: str = Query("updated_at", pattern="^(id|store_id|sku|product_name|price|date|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, total, total_pages = search_pricing_records(
        db=db,
        store_id=store_id,
        sku=sku,
        product_name=product_name,
        min_price=min_price,
        max_price=max_price,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/summary", response_model=DashboardSummary, summary="Dashboard & Aggregation Metrics")
def get_summary_metrics(db: Session = Depends(get_db)):
    return get_dashboard_summary(db)

@router.get("/template", summary="Download Sample CSV Template")
def download_csv_template():
    content = "Store ID,SKU,Product Name,Price,Date\nUS-0001,SKU-GROC-1001,Organic Whole Milk 1 Gallon,4.29,2026-11-06\nUK-0002,SKU-ELEC-2001,Wireless Noise Cancelling Earbuds,89.99,2026-11-06\nDE-0003,SKU-HOME-3001,Stainless Steel Cookware Set 10-Piece,199.99,2026-11-06\n"
    response = StreamingResponse(
        io.StringIO(content),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=pricing_feed_template.csv"
    return response

@router.get("/export", summary="Export Search Results to CSV")
def export_pricing_to_csv(
    store_id: Optional[str] = None,
    sku: Optional[str] = None,
    product_name: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    items, total, _ = search_pricing_records(
        db=db,
        store_id=store_id,
        sku=sku,
        product_name=product_name,
        min_price=min_price,
        max_price=max_price,
        start_date=start_date,
        end_date=end_date,
        page=1,
        page_size=5000 # max export batch
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Store ID", "SKU", "Product Name", "Price", "Currency", "Date", "Version", "Last Updated"])
    for r in items:
        writer.writerow([r.store_id, r.sku, r.product_name, r.price, r.currency, r.date.isoformat(), r.version, r.updated_at.isoformat()])

    output.seek(0)
    response = StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=pricing_records_export.csv"
    return response

@router.get("/{record_id}", response_model=PricingRecordDetail, summary="Get Single Pricing Record with History")
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = get_pricing_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pricing record {record_id} not found")
    return record

@router.put("/{record_id}", response_model=PricingRecordRead, summary="Update Pricing Record with Optimistic Locking")
def update_record(
    record_id: int,
    payload: PricingRecordUpdate,
    db: Session = Depends(get_db)
):
    try:
        updated = update_pricing_record(db, record_id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Pricing record {record_id} not found")
        return updated
    except ConcurrencyConflictError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": str(err),
                "error_code": "CONCURRENCY_CONFLICT",
                "current_version": err.current_version,
                "expected_version": err.expected_version
            }
        )

@router.get("/{record_id}/history", response_model=List[PriceAuditLogRead], summary="Get Price Audit Trail")
def get_history(record_id: int, db: Session = Depends(get_db)):
    record = get_pricing_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pricing record {record_id} not found")
    return get_audit_logs_for_record(db, record_id)

@router.post("/generate-mock", summary="Simulate Retail Feeds (3,000 Stores)")
def generate_mock_data(payload: MockDataRequest, db: Session = Depends(get_db)):
    records = generate_mock_pricing_records(
        store_count=payload.store_count,
        records_per_store=payload.records_per_store,
        target_date=payload.start_date or date.today()
    )
    filename = f"simulated_feed_{payload.store_count}stores.csv"
    result = ingest_pricing_batch(
        db=db,
        records=records,
        filename=filename,
        raw_errors=[]
    )
    return {
        "message": f"Successfully generated and ingested mock feed for {payload.store_count} stores",
        "ingestion_result": result
    }
