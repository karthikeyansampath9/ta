import random
from datetime import date, timedelta
from typing import List, Dict, Any

STORES_POOLS = [
    {"prefix": "US-", "country": "USA", "currency": "USD", "count": 1500},
    {"prefix": "UK-", "country": "United Kingdom", "currency": "GBP", "count": 400},
    {"prefix": "DE-", "country": "Germany", "currency": "EUR", "count": 350},
    {"prefix": "FR-", "country": "France", "currency": "EUR", "count": 300},
    {"prefix": "JP-", "country": "Japan", "currency": "JPY", "count": 200},
    {"prefix": "CA-", "country": "Canada", "currency": "CAD", "count": 150},
    {"prefix": "AU-", "country": "Australia", "currency": "AUD", "count": 100},
]

PRODUCTS_CATALOG = [
    {"sku": "SKU-GROC-1001", "name": "Organic Whole Milk 1 Gallon", "base_price": 4.29},
    {"sku": "SKU-GROC-1002", "name": "Organic Honeycrisp Apples 1kg", "base_price": 5.99},
    {"sku": "SKU-GROC-1003", "name": "Artisan Sourdough Loaf 500g", "base_price": 3.75},
    {"sku": "SKU-GROC-1004", "name": "Fair Trade Colombian Coffee 12oz", "base_price": 9.49},
    {"sku": "SKU-GROC-1005", "name": "Cage-Free Grade A Brown Eggs 12ct", "base_price": 4.19},
    {"sku": "SKU-ELEC-2001", "name": "Wireless Noise Cancelling Earbuds", "base_price": 89.99},
    {"sku": "SKU-ELEC-2002", "name": "Smart Home Mesh WiFi Router 6E", "base_price": 149.00},
    {"sku": "SKU-ELEC-2003", "name": "4K Ultra HD Streaming Stick", "base_price": 49.99},
    {"sku": "SKU-ELEC-2004", "name": "USB-C Fast Charging Cable 2m", "base_price": 14.99},
    {"sku": "SKU-ELEC-2005", "name": "Bluetooth Portable Speaker 20W", "base_price": 59.95},
    {"sku": "SKU-HOME-3001", "name": "Stainless Steel Cookware Set 10-Piece", "base_price": 199.99},
    {"sku": "SKU-HOME-3002", "name": "Memory Foam Ergonomic Pillow", "base_price": 34.50},
    {"sku": "SKU-HOME-3003", "name": "Cordless Handheld Vacuum 18V", "base_price": 79.99},
    {"sku": "SKU-HOME-3004", "name": "Aromatherapy Essential Oil Diffuser", "base_price": 24.99},
    {"sku": "SKU-CARE-4001", "name": "Mineral Daily Sunscreen SPF 50 150ml", "base_price": 16.50},
    {"sku": "SKU-CARE-4002", "name": "Electric Sonic Toothbrush Rechargeable", "base_price": 39.99},
    {"sku": "SKU-CARE-4003", "name": "Hydrating Facial Cleanser 250ml", "base_price": 12.99},
    {"sku": "SKU-APPA-5001", "name": "Classic Fit Cotton Crewneck T-Shirt", "base_price": 18.00},
    {"sku": "SKU-APPA-5002", "name": "Merino Wool Blend Winter Beanie", "base_price": 22.50},
    {"sku": "SKU-APPA-5003", "name": "Lightweight Waterproof Rain Jacket", "base_price": 85.00},
]

def generate_mock_pricing_records(store_count: int = 10, records_per_store: int = 10, target_date: date = None) -> List[Dict[str, Any]]:
    """
    Generates realistic pricing feeds simulating stores across the 3,000 store retail network.
    """
    if target_date is None:
        target_date = date.today()

    records = []
    
    # Select stores across multiple countries
    selected_stores = []
    store_counter = 1
    for pool in STORES_POOLS:
        country_stores = max(1, int(store_count * (pool["count"] / 3000.0)))
        for i in range(country_stores):
            if len(selected_stores) >= store_count:
                break
            selected_stores.append({
                "store_id": f"{pool['prefix']}{store_counter:04d}",
                "currency": pool["currency"]
            })
            store_counter += 1
        if len(selected_stores) >= store_count:
            break

    # If any remaining
    while len(selected_stores) < store_count:
        pool = random.choice(STORES_POOLS)
        selected_stores.append({
            "store_id": f"{pool['prefix']}{store_counter:04d}",
            "currency": pool["currency"]
        })
        store_counter += 1

    for store_info in selected_stores:
        # Sample products
        sample_prods = random.sample(PRODUCTS_CATALOG, min(records_per_store, len(PRODUCTS_CATALOG)))
        for prod in sample_prods:
            # Regional price variation (+/- 15%)
            variance = random.uniform(-0.12, 0.15)
            price = round(prod["base_price"] * (1 + variance), 2)
            if store_info["currency"] == "JPY":
                price = round(price * 150.0, 0) # Convert to approx JPY

            # Random slight date variation within the last 7 days
            days_ago = random.choice([0, 0, 1, 2, 3])
            rec_date = target_date - timedelta(days=days_ago)

            records.append({
                "store_id": store_info["store_id"],
                "sku": prod["sku"],
                "product_name": prod["name"],
                "price": price,
                "currency": store_info["currency"],
                "date": rec_date
            })

    return records

def generate_mock_csv(records: List[Dict[str, Any]]) -> str:
    """
    Renders records to CSV format with standard headers.
    """
    lines = ["Store ID,SKU,Product Name,Price,Date"]
    for r in records:
        # Escape quotes in product names if needed
        pname = r["product_name"]
        if "," in pname or '"' in pname:
            pname = f'"{pname.replace('"', '""')}"'
        lines.append(f"{r['store_id']},{r['sku']},{pname},{r['price']},{r['date'].isoformat()}")
    return "\n".join(lines)
