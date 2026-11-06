import type { PricingRecord, PriceAuditLog, IngestionResult, DashboardSummary, SearchFilterState } from '../types';

const API_BASE = '/api/pricing';

export const api = {
  async getPricingRecords(filters: SearchFilterState): Promise<{
    items: PricingRecord[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams();
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.sku) params.append('sku', filters.sku);
    if (filters.product_name) params.append('product_name', filters.product_name);
    if (filters.min_price !== undefined && filters.min_price !== null && !isNaN(filters.min_price)) {
      params.append('min_price', filters.min_price.toString());
    }
    if (filters.max_price !== undefined && filters.max_price !== null && !isNaN(filters.max_price)) {
      params.append('max_price', filters.max_price.toString());
    }
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    params.append('sort_by', filters.sort_by);
    params.append('sort_order', filters.sort_order);
    params.append('page', filters.page.toString());
    params.append('page_size', filters.page_size.toString());

    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch pricing records: ${res.statusText}`);
    }
    return res.json();
  },

  async uploadCsv(file: File): Promise<IngestionResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Upload failed: ${res.statusText}`);
    }
    return res.json();
  },

  async updateRecord(id: number, data: {
    price: number;
    product_name?: string;
    version: number;
    changed_by?: string;
    reason?: string;
  }): Promise<PricingRecord> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (res.status === 409) {
      const errData = await res.json().catch(() => ({}));
      const conflictMsg = errData.detail?.message || 'Concurrency conflict: record was modified by another operator.';
      const conflictError: any = new Error(conflictMsg);
      conflictError.isConflict = true;
      conflictError.conflictData = errData.detail;
      throw conflictError;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Update failed: ${res.statusText}`);
    }

    return res.json();
  },

  async getRecordHistory(id: number): Promise<PriceAuditLog[]> {
    const res = await fetch(`${API_BASE}/${id}/history`);
    if (!res.ok) {
      throw new Error(`Failed to fetch history for record ${id}`);
    }
    return res.json();
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/summary`);
    if (!res.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }
    return res.json();
  },

  async generateMockData(storeCount: number = 10, recordsPerStore: number = 10): Promise<any> {
    const res = await fetch(`${API_BASE}/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_count: storeCount, records_per_store: recordsPerStore }),
    });
    if (!res.ok) {
      throw new Error('Failed to generate mock data');
    }
    return res.json();
  },

  getExportUrl(filters: SearchFilterState): string {
    const params = new URLSearchParams();
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.sku) params.append('sku', filters.sku);
    if (filters.product_name) params.append('product_name', filters.product_name);
    if (filters.min_price !== undefined && filters.min_price !== null && !isNaN(filters.min_price)) {
      params.append('min_price', filters.min_price.toString());
    }
    if (filters.max_price !== undefined && filters.max_price !== null && !isNaN(filters.max_price)) {
      params.append('max_price', filters.max_price.toString());
    }
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    return `${API_BASE}/export?${params.toString()}`;
  },

  getTemplateUrl(): string {
    return `${API_BASE}/template`;
  }
};
