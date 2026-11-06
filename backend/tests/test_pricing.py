import os
import sys
import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup test path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.services.parser import parse_csv_stream

# In-memory SQLite with StaticPool so all connections share the same memory instance
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

# ----------------- Parser Tests -----------------

def test_parse_csv_valid():
    csv_data = b"""Store ID,SKU,Product Name,Price,Date
US-0001,SKU-100,Organic Milk,4.99,2026-11-06
UK-0002,SKU-200,Sourdough Bread,3.50,2026-11-06
"""
    records, errors, headers = parse_csv_stream(csv_data)
    assert len(records) == 2
    assert len(errors) == 0
    assert records[0]["store_id"] == "US-0001"
    assert records[0]["sku"] == "SKU-100"
    assert records[0]["price"] == 4.99
    assert records[0]["currency"] == "USD"
    assert records[1]["currency"] == "GBP"

def test_parse_csv_invalid_rows():
    csv_data = b"""Store ID,SKU,Product Name,Price,Date
US-0001,,Organic Milk,4.99,2026-11-06
US-0002,SKU-200,Bad Price,-2.50,2026-11-06
US-0003,SKU-300,Bad Date,10.00,not-a-date
"""
    records, errors, headers = parse_csv_stream(csv_data)
    assert len(records) == 0
    assert len(errors) == 3
    assert any("SKU cannot be empty" in e.error_message for e in errors)
    assert any("Price must be strictly greater than zero" in e.error_message for e in errors)
    assert any("Invalid date format" in e.error_message for e in errors)

def test_parse_csv_missing_headers():
    csv_data = b"""Store ID,SKU,Price
US-0001,SKU-100,4.99
"""
    records, errors, headers = parse_csv_stream(csv_data)
    assert len(records) == 0
    assert len(errors) == 1
    assert "Missing required CSV columns" in errors[0].error_message

# ----------------- API Endpoints Tests -----------------

def test_upload_feed(client):
    csv_content = (
        "Store ID,SKU,Product Name,Price,Date\n"
        "US-0010,SKU-A1,Arabica Coffee Beans,12.50,2026-11-06\n"
        "US-0010,SKU-B2,Green Tea 50 bags,6.99,2026-11-06\n"
    )
    response = client.post(
        "/api/pricing/upload",
        files={"file": ("test_feed.csv", csv_content.encode("utf-8"), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success_count"] == 2
    assert data["error_count"] == 0
    assert data["status"] == "SUCCESS"

def test_search_and_filter(client):
    csv_content = (
        "Store ID,SKU,Product Name,Price,Date\n"
        "US-0001,SKU-1,Apple Gala,2.00,2026-11-01\n"
        "US-0002,SKU-2,Banana Cavendish,1.50,2026-11-02\n"
        "UK-0003,SKU-3,Cheddar Cheese,8.50,2026-11-03\n"
    )
    client.post("/api/pricing/upload", files={"file": ("feed.csv", csv_content.encode("utf-8"), "text/csv")})

    # Search by store_id
    res = client.get("/api/pricing?store_id=UK-0003")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["sku"] == "SKU-3"

    # Search by product name substring
    res = client.get("/api/pricing?product_name=banana")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["product_name"] == "Banana Cavendish"

    # Search by price range
    res = client.get("/api/pricing?min_price=2.00&max_price=5.00")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["sku"] == "SKU-1"

def test_update_record_and_optimistic_locking(client):
    csv_content = "Store ID,SKU,Product Name,Price,Date\nUS-0050,SKU-OP,Wireless Mouse,25.00,2026-11-06\n"
    client.post("/api/pricing/upload", files={"file": ("feed.csv", csv_content.encode("utf-8"), "text/csv")})

    res = client.get("/api/pricing?sku=SKU-OP")
    records = res.json()["items"]
    assert len(records) == 1
    rec = records[0]
    rec_id = rec["id"]
    version = rec["version"]

    # Successful update
    update_res = client.put(
        f"/api/pricing/{rec_id}",
        json={
            "price": 29.99,
            "version": version,
            "changed_by": "Pricing Lead",
            "reason": "Inflation adjustment"
        }
    )
    assert update_res.status_code == 200
    updated_rec = update_res.json()
    assert updated_rec["price"] == 29.99
    assert updated_rec["version"] == version + 1

    # Conflict on outdated version
    conflict_res = client.put(
        f"/api/pricing/{rec_id}",
        json={
            "price": 35.00,
            "version": version, # Stale version!
            "changed_by": "Another Lead"
        }
    )
    assert conflict_res.status_code == 409
    assert conflict_res.json()["detail"]["error_code"] == "CONCURRENCY_CONFLICT"

    # Check audit history
    history_res = client.get(f"/api/pricing/{rec_id}/history")
    assert history_res.status_code == 200
    logs = history_res.json()
    assert len(logs) == 2 # Initial feed + 1 manual edit
    assert logs[0]["new_price"] == 29.99
    assert logs[0]["old_price"] == 25.00
    assert logs[0]["reason"] == "Inflation adjustment"

def test_dashboard_summary(client):
    csv_content = (
        "Store ID,SKU,Product Name,Price,Date\n"
        "US-0001,SKU-10,Product 1,10.00,2026-11-06\n"
        "US-0002,SKU-20,Product 2,20.00,2026-11-06\n"
    )
    client.post("/api/pricing/upload", files={"file": ("feed.csv", csv_content.encode("utf-8"), "text/csv")})

    summary_res = client.get("/api/pricing/summary")
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert data["total_records"] == 2
    assert data["active_stores"] == 2
    assert data["unique_skus"] == 2
    assert data["average_price"] == 15.00
