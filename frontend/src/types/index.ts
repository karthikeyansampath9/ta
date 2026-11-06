export interface PricingRecord {
  id: number;
  store_id: string;
  sku: string;
  product_name: string;
  price: number;
  currency: string;
  date: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PriceAuditLog {
  id: number;
  pricing_record_id: number;
  store_id: string;
  sku: string;
  old_price: number | null;
  new_price: number;
  price_delta: number | null;
  percentage_change: number | null;
  change_source: string;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface RowError {
  row_number: number;
  store_id?: string;
  sku?: string;
  field?: string;
  error_message: string;
}

export interface IngestionResult {
  batch_id: string;
  filename: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  duration_ms: number;
  errors: RowError[];
}

export interface DashboardSummary {
  total_records: number;
  active_stores: number;
  unique_skus: number;
  average_price: number;
  latest_feed_at: string | null;
  recent_batches: {
    id: string;
    filename: string;
    total_rows: number;
    success_count: number;
    error_count: number;
    status: string;
    duration_ms: number;
    created_at: string;
  }[];
  top_stores_by_count: { store_id: string; count: number }[];
  price_ranges: {
    under_10: number;
    '10_to_50': number;
    '50_to_100': number;
    over_100: number;
  };
}

export interface SearchFilterState {
  store_id?: string;
  sku?: string;
  product_name?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  end_date?: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  page: number;
  page_size: number;
}
