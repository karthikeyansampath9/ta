import React, { useState } from 'react';
import {
  Layers,
  Database,
  Cpu,
  Shield,
  Zap,
  Globe,
  CheckCircle,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'context' | 'solution' | 'decisions' | 'nfr' | 'assumptions'>('context');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Sub-navigation bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
        <div>
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <Layers className="h-5 w-5 text-blue-400" />
            <span>Architecture & System Design Documentation</span>
          </h2>
          <p className="text-xs text-slate-400">
            Enterprise Retail Pricing Platform for 3,000 Stores Worldwide
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => setActiveSection('context')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'context'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            1. Context Diagram
          </button>
          <button
            onClick={() => setActiveSection('solution')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'solution'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            2. Solution Architecture
          </button>
          <button
            onClick={() => setActiveSection('decisions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'decisions'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            3. Design Decisions
          </button>
          <button
            onClick={() => setActiveSection('nfr')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'nfr'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            4. NFRs Addressed
          </button>
          <button
            onClick={() => setActiveSection('assumptions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeSection === 'assumptions'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            5. Assumptions
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* SECTION 1: CONTEXT DIAGRAM */}
        {activeSection === 'context' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">1. System Context (C4 Level 1)</h3>
              <p className="text-sm text-slate-600 mt-1">
                Defines the boundary of the Global Retail Pricing Platform, external actors, enterprise ERPs, and store POS endpoints.
              </p>
            </div>

            {/* Architecture Diagram Visualization */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="text-slate-400 mb-4 font-sans text-xs flex items-center justify-between">
                <span>System Context Map (Mermaid Architecture Flow)</span>
                <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded text-[11px]">
                  C4 Level 1
                </span>
              </div>
              <pre className="text-blue-300 leading-relaxed">
{`+-----------------------+     +------------------------+     +------------------------+
|  Store Pricing Leads  |     |  HQ Merchandising Team |     |  Store POS Edge Sync   |
| (3,000 Stores Local)  |     |   (Global Pricing)     |     | (Automated SFTP / API) |
+-----------+-----------+     +-----------+------------+     +-----------+------------+
            |                             |                              |
            | Manual CSV Upload           | Bulk Price Strategies        | Automated Nightly Feed
            v                             v                              v
+-----------------------------------------------------------------------------------------+
|                  APEXRETAIL GLOBAL PRICING PLATFORM (CORE PLATFORM)                     |
|                                                                                         |
|  * Edge Ingestion API Gateway (TLS 1.3, Rate Limiting, Pre-Signed Multipart S3)         |
|  * Streaming CSV Parser & Anomaly Guardrails (Store ID, SKU, Positive Price, Date)     |
|  * Read/Write Segregated Distributed Engine (PostgreSQL Partitioned + OpenSearch)       |
|  * Optimistic Concurrency Engine & Tamper-Proof Audit Ledger                            |
+-----------------------------------------------------------------------------------------+
            |                             |                              |
            v                             v                              v
+-----------------------+     +------------------------+     +------------------------+
|  Enterprise ERP / SAP |     | Central Data Warehouse |     | Store Edge Caches /    |
| (Financial Ledger)    |     | (Snowflake / BigQuery) |     | Regional POS Registers |
+-----------------------+     +------------------------+     +------------------------+`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">
                  Primary Actors
                </span>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                  <li>Store Managers across 3,000 retail branches</li>
                  <li>Regional Merchandising & Category Directors</li>
                  <li>Automated Store Edge Ingestion Agents</li>
                  <li>Global Pricing Analysts & Compliance Auditors</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">Core Inputs</span>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                  <li>Store ID (e.g. US-0001, UK-0402, DE-0120)</li>
                  <li>Product SKU Code (Global Catalog format)</li>
                  <li>Product Name / Description</li>
                  <li>Price (Currency-aware positive decimal)</li>
                  <li>Effective Date (ISO format YYYY-MM-DD)</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-sm mb-1">Downstream Systems</span>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                  <li>In-store POS Cash Registers (price lookups)</li>
                  <li>E-commerce Website & Mobile App Cart APIs</li>
                  <li>Central Financial Accounting (SAP S/4HANA)</li>
                  <li>Corporate Data Lakehouse (Snowflake/BigQuery)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SOLUTION ARCHITECTURE */}
        {activeSection === 'solution' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                2. Solution Architecture (C4 Level 2 Container Architecture)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Multi-region, horizontally scalable, event-driven architecture designed to comfortably handle 300M+ pricing records and 3,000 concurrent store feed bursts.
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner">
              <pre className="text-emerald-300 leading-relaxed">
{`[ 3,000 Stores (Global) ]
       │
       ▼ HTTPS (Anycast DNS + Cloudflare CDN + WAF)
[ Cloud Storage S3 / GCS Bucket ] <── Direct Pre-Signed Multipart Upload
       │
       ▼ ObjectCreated Event (AWS EventBridge / SNS)
[ Apache Kafka / AWS SQS FIFO Cluster ] ── (Partition Key = Store_ID)
       │
       ▼ Auto-scaling Ingestion Workers (Kubernetes KEDA Pods)
       │  ├─ 1. Streaming CSV Chunk Parser (10k rows/chunk)
       │  ├─ 2. Schema, Date, Currency & SKU Validation
       │  ├─ 3. Anomaly Guardrail Filter (flag >80% drop / price < 0)
       │  └─ 4. Batch UPSERT (Idempotency Key: store_id + sku + date)
       │
  ┌────┴─────────────────────────────┐
  ▼                                  ▼
[ Distributed Aurora PostgreSQL ]  [ OpenSearch / Elasticsearch Cluster ]
  ├─ Partitioned by Country & Store  ├─ Sub-50ms Faceted Search
  ├─ Optimistic Lock (version++)     ├─ SKU, Product Name Substring
  └─ Append-Only PriceAuditLog       └─ CDC Sync via Debezium WAL
  │
  ▼
[ Redis Cluster ] ── (Hot SKU Cache, Rate Limiting, User Sessions)`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 text-sm flex items-center space-x-1.5 mb-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span>Ingestion Pipeline Components</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Direct Object Storage Pre-Signed Uploads:</strong> Large multi-megabyte CSV feeds from 3,000 stores never touch API application memory. Files upload directly to object storage via presigned S3 URLs, triggering asynchronous distributed worker pods via SQS/Kafka.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 text-sm flex items-center space-x-1.5 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>Storage & Search Segregation (CQRS)</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Partitioned Relational + OpenSearch:</strong> Relational tables are partitioned declaratively by <code>country_code</code> and <code>store_id</code>. Heavy multi-criteria filtering runs on an OpenSearch cluster synced in real-time via Change Data Capture (Debezium CDC).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: DESIGN DECISIONS */}
        {activeSection === 'decisions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">3. Architectural Design Decisions & Trade-offs</h3>
              <p className="text-sm text-slate-600 mt-1">
                Key architectural choices evaluated against alternatives, with rationale for enterprise retail scale.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Decision 1 */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    ADR 01: Asynchronous Event-Driven Ingestion vs Synchronous REST
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    ADOPTED
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Context:</strong> 3,000 stores uploading feeds between 11 PM and midnight produce massive burst traffic (~150,000 to 300,000 records per minute).
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Decision:</strong> Use asynchronous event-driven queueing with streaming CSV chunking. The store receives an immediate upload acknowledgement, and processing runs with backpressure management.
                </p>
                <p className="text-slate-500">
                  <em>Trade-off:</em> Requires client polling or WebSocket for real-time status, but prevents API gateway timeouts and cluster saturation.
                </p>
              </div>

              {/* Decision 2 */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    ADR 02: Optimistic Concurrency Control (OCC) vs Pessimistic Locking
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    ADOPTED
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Context:</strong> When a Store Manager manually adjusts a price while an automated feed or HQ promo update is running, blind writes would cause silent data loss.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Decision:</strong> Include a numeric <code>version</code> field on every record. Edits check <code>WHERE id = :id AND version = :expected_version</code>. If mismatched, return HTTP 409 Conflict.
                </p>
                <p className="text-slate-500">
                  <em>Trade-off:</em> Requires client to handle 409 Conflict gracefully, but provides zero database lock contention and maximum read/write throughput.
                </p>
              </div>

              {/* Decision 3 */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    ADR 03: Immutable Audit Ledger (Write-Once-Read-Many)
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    ADOPTED
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Context:</strong> Regulatory compliance (SOX, tax audit, anti-price-gouging laws) mandates complete historical accountability for every price point.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Decision:</strong> Every price update inserts a row in <code>PriceAuditLog</code> recording <code>old_price</code>, <code>new_price</code>, <code>percentage_change</code>, <code>changed_by</code>, <code>change_source</code>, and <code>reason</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: NFRs */}
        {activeSection === 'nfr' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                4. Non-Functional Requirements & Engineering Solutions
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Addressing the requirements expected of a multinational retail chain with 3,000 stores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Scalability */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-blue-700 font-bold">
                  <Cpu className="h-4 w-4" />
                  <span>1. Scalability (3,000 Stores &bull; 150M+ Records)</span>
                </div>
                <p className="text-slate-600">
                  <strong>Requirement:</strong> Handle 3,000 stores each maintaining 50,000 active SKUs, uploading up to 150M daily pricing updates.
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Solution:</strong> Stream-based CSV parser with 500-row micro-batch UPSERTs; horizontally autoscaled ingestion workers (KEDA); database partitioned by Country Code and Store Hash.
                </p>
              </div>

              {/* High Availability */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                  <CheckCircle className="h-4 w-4" />
                  <span>2. High Availability & Disaster Recovery (99.99%)</span>
                </div>
                <p className="text-slate-600">
                  <strong>Requirement:</strong> Unscheduled downtime must not exceed 52 minutes per year (99.99% SLA).
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Solution:</strong> Multi-Availability Zone deployment with automated read replica promotion; S3 cross-region replication; RPO &lt; 1 minute, RTO &lt; 5 minutes.
                </p>
              </div>

              {/* Latency */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-700 font-bold">
                  <Zap className="h-4 w-4" />
                  <span>3. Latency & Performance (&lt; 100ms Query)</span>
                </div>
                <p className="text-slate-600">
                  <strong>Requirement:</strong> Sub-second global search and live editing across millions of pricing records.
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Solution:</strong> OpenSearch cluster for full-text and compound criteria search (&lt; 50ms p95); Redis caching for hot store catalogs; WAL mode for non-blocking concurrent SQLite/PostgreSQL operations.
                </p>
              </div>

              {/* Data Integrity */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-purple-700 font-bold">
                  <Shield className="h-4 w-4" />
                  <span>4. Data Integrity & Anomaly Guardrails</span>
                </div>
                <p className="text-slate-600">
                  <strong>Requirement:</strong> Prevent fat-finger errors ($0.01 iPhone) and invalid feeds from corrupting store shelf prices.
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Solution:</strong> Validation on price &gt; 0; rejection of malformed dates; automated outlier detection (flagging price drops &gt;80% for secondary supervisor approval).
                </p>
              </div>

              {/* Multi-Currency */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-teal-700 font-bold">
                  <Globe className="h-4 w-4" />
                  <span>5. Multi-Currency & Internationalization</span>
                </div>
                <p className="text-slate-600">
                  <strong>Requirement:</strong> Support stores across USA, UK, Germany, France, Japan, Canada, Australia with native currency & formatting.
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Solution:</strong> ISO 4217 Currency Code stored explicitly with every price; locale-aware number formatters (handling Japanese Yen with 0 decimals, USD/EUR with 2 decimals).
                </p>
              </div>

              {/* Security */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 font-bold">
                  <Shield className="h-4 w-4" />
                  <span>6. Security & Role-Based Access Control (RBAC)</span>
                </div>
                <p className="text-slate-600">
                  <strong>Requirement:</strong> Store staff can only edit their store's prices; HQ planners can manage national price bands.
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Solution:</strong> OAuth 2.0 / OpenID Connect with JWT claims containing store scope; TLS 1.3 in-transit and AES-256 database disk encryption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ASSUMPTIONS */}
        {activeSection === 'assumptions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">5. Assumptions & Scope Boundaries</h3>
              <p className="text-sm text-slate-600 mt-1">
                Baseline assumptions regarding feed frequency, network connectivity, and retail operational models.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">1. Feed Cadence & Batching</span>
                  <p className="text-slate-600 mt-0.5">
                    Stores generate daily pricing snapshot feeds upon close of business, plus periodic intraday emergency price override files. The platform is designed to process both bulk scheduled feeds and ad-hoc single-store files.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">2. SKU Uniqueness & Global Master Data</span>
                  <p className="text-slate-600 mt-0.5">
                    SKU codes conform to the global merchandise master catalog. Products sold in multiple countries share common root SKU identifiers or country-specific suffixes.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">3. Tax Inclusive vs Exclusive Pricing</span>
                  <p className="text-slate-600 mt-0.5">
                    European/UK prices are treated as VAT-inclusive based on local retail customs, while US/Canadian prices represent pre-tax shelf prices. Country prefix in Store ID defines the tax mode.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">4. Data Retention & Archival</span>
                  <p className="text-slate-600 mt-0.5">
                    Operational pricing records remain active for the current fiscal year (365 days). Historical audit records older than 1 year are automatically offloaded to cold Parquet lakehouse storage (S3 Glacier) for 7-year regulatory compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
