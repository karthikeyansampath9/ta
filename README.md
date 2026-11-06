# ApexRetail Global Pricing Platform

> Enterprise Pricing Feed Ingestion, Multi-Criteria Search, In-Place Editing, and Multi-Country Retail Architecture (3,000 Stores Worldwide).

---

## 🌟 Solution Overview

This repository contains the architecture, design documentation, and full-stack implementation of the **ApexRetail Global Pricing Platform**. The platform is purpose-built to address the functional and non-functional requirements of a retail store chain with **3,000 stores across 7 countries**, managing over **150,000,000 pricing records** with sub-100ms search latency and zero-downtime feed ingestion.

### ✨ Key Features Implemented

1. **Feed Upload & Streaming Ingestion**:
   - Drag-and-drop CSV feed ingestion supporting standard columns: `Store ID`, `SKU`, `Product Name`, `Price`, `Date`.
   - Streaming parser capable of handling UTF-8, UTF-8-BOM, and Latin-1 encodings.
   - Micro-batch idempotent UPSERTs on `(store_id, sku, date)`.
   - Real-time line-by-line error reporting (identifying invalid prices, negative values, and malformed dates).
   - Instant mock feed generator simulating feeds for up to 3,000 retail stores across US, UK, DE, FR, JP, CA, and AU.

2. **Multi-Criteria Search & Filter Grid**:
   - Filter by **Store ID** (prefix/exact), **SKU**, **Product Name** (substring/full-text), **Price Range** (min/max), and **Feed Date**.
   - Dynamic sorting across all columns (Store, SKU, Product Name, Price, Date, Last Modified).
   - Multi-currency display with native symbols (`$`, `£`, `€`, `¥`, `CA$`, `A$`).
   - One-click CSV export of filtered query results.

3. **In-Place & Modal Record Editing with Concurrency Control**:
   - In-place and modal price adjustments with validation (strictly positive decimals).
   - **Optimistic Concurrency Control (OCC)** using version check (`version` field) to prevent lost updates when concurrent store feeds or operators edit the same item (returns HTTP 409 Conflict with clear messaging).

4. **Immutable Audit Ledger**:
   - Every price modification automatically appends to an audit trail recording old price, new price, percentage change, operator identity, modification source (`CSV_FEED` vs `MANUAL_EDIT`), and reason.
   - Interactive audit history drawer in the web application.

5. **Interactive Architecture & NFR Viewer**:
   - Complete C4 Context Diagram, Solution Architecture, Design Decisions, NFR Matrix, and Assumptions viewable directly inside the SPA and in `docs/ARCHITECTURE.md`.

---

## 🚀 Quick Start Guide (How to Run the Application)

### Option 1: One-Click Startup (Windows)
Double-click `run.bat` or run the PowerShell script:
```powershell
.\run.ps1
```

### Option 2: Run via Command Line (Cross-Platform)

#### 1. Backend Setup
```bash
# Install Python dependencies
python -m pip install -r backend/requirements.txt
```

#### 2. Frontend Build
```bash
cd frontend
npm install
npm run build
cd ..
```

#### 3. Launch Unified Server
```bash
# Starts both the FastAPI REST API and the React Single Page App on port 8000
python backend/run.py
```

### Option 3: Docker Deployment
```bash
docker compose up --build -d
```

---

## 🌐 Application URLs

Once started, access the application in your browser:
- **Single Page Web Application**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI / Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

*(Optional: If developing on the frontend with Vite hot module reloading, run `npm run dev` inside `frontend/` and access [http://localhost:5173](http://localhost:5173).)*

---

## 🧪 Running Automated Tests

Run the complete test suite (unit tests for streaming CSV parser, validation rules, optimistic concurrency conflicts, search filters, and audit trail generation):
```bash
python -m pytest backend/tests/test_pricing.py -v
```

---

## 📂 Repository Structure

```
├── docs/
│   └── ARCHITECTURE.md          # Full Architecture Document, C4 Diagrams, Decisions, NFRs, Assumptions
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py        # REST API endpoints (upload, search, update, audit, mock, export)
│   │   ├── services/
│   │   │   ├── parser.py        # Streaming CSV parser with validation & line-level error collection
│   │   │   ├── pricing_service.py # Batch upsert, optimistic locking, search, audit ledger
│   │   │   └── generator.py     # 3,000-store realistic mock feed generator
│   │   ├── config.py            # Platform configuration & settings
│   │   ├── database.py          # SQLAlchemy engine (WAL mode enabled) & session management
│   │   ├── models.py            # DB Models: PricingRecord, PriceAuditLog, IngestionBatch
│   │   ├── schemas.py           # Pydantic validation schemas & DTOs
│   │   └── main.py              # FastAPI app with SPA static file serving
│   ├── tests/
│   │   └── test_pricing.py      # Automated Pytest suite (all 7 tests passing)
│   ├── requirements.txt         # Python dependencies
│   └── run.py                   # Server startup runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Global header with status badge & navigation
│   │   │   ├── SearchFilters.tsx    # Multi-criteria filter bar (Store, SKU, Name, Price, Date)
│   │   │   ├── PricingTable.tsx     # Rich data table with column sorting & actions
│   │   │   ├── UploadModal.tsx      # Drag & drop CSV uploader, error drawer & mock generator
│   │   │   ├── EditRecordModal.tsx  # In-place price edit modal with OCC versioning
│   │   │   ├── AuditHistoryModal.tsx# Chronological price change timeline drawer
│   │   │   ├── DashboardStats.tsx   # Aggregated telemetry cards & feed status table
│   │   │   └── ArchitectureView.tsx # Embedded interactive C4 diagrams & NFR documentation
│   │   ├── services/
│   │   │   └── api.ts               # Typed REST API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx                  # Main SPA component
│   │   └── index.css                # Tailwind CSS styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── samples/
│   ├── sample_valid_feed.csv    # Multi-store test feed (US, UK, DE, FR, JP, CA, AU)
│   └── sample_invalid_feed.csv  # Negative price, missing SKU, bad date format for error testing
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Multi-container orchestration
├── run.bat                      # Windows one-click start script
├── run.ps1                      # PowerShell one-click start script
├── run.sh                       # Linux/macOS one-click start script
└── README.md                    # Project documentation
```

---

## 🚢 Publishing to Your GitHub Repository

To push this codebase to your own GitHub repository, execute:

```bash
# 1. Add your GitHub remote repository
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "feat: complete ApexRetail Global Pricing Platform with architecture, SPA frontend, and FastAPI backend"

# 4. Push to main branch
git branch -M main
git push -u origin main
```

---

## 📋 Deliverables Summary

| Deliverable | Location |
|-------------|----------|
| **Context Diagram** | [docs/ARCHITECTURE.md §2](docs/ARCHITECTURE.md#2-context-diagram-c4-level-1) & UI Architecture Tab |
| **Solution Architecture** | [docs/ARCHITECTURE.md §3](docs/ARCHITECTURE.md#3-solution-architecture-c4-level-2-container-architecture) & UI Architecture Tab |
| **Design Decisions (ADRs)** | [docs/ARCHITECTURE.md §6](docs/ARCHITECTURE.md#6-design-decisions--trade-off-analysis-adrs) & UI Architecture Tab |
| **Non-Functional Requirements & Solutions** | [docs/ARCHITECTURE.md §7](docs/ARCHITECTURE.md#7-non-functional-requirements-nfr-matrix--solutions) & UI Architecture Tab |
| **Assumptions** | [docs/ARCHITECTURE.md §8](docs/ARCHITECTURE.md#8-assumptions) & UI Architecture Tab |
| **Source Implementation** | Complete working SPA (`frontend/`) and Backend (`backend/`) |
| **Steps to Run** | Documented in `README.md` and automated via `run.bat` / `run.ps1` / `run.sh` |
