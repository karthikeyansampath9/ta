import React from 'react';
import type { SearchFilterState } from '../types';
import { X, Download, Filter, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

interface SearchFiltersProps {
  filters: SearchFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  onSearch: () => void;
  totalRecords: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  setFilters,
  totalRecords,
}) => {
  const handleInputChange = (field: keyof SearchFilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // reset to page 1 on filter modification
    }));
  };

  const handleReset = () => {
    setFilters({
      store_id: '',
      sku: '',
      product_name: '',
      min_price: undefined,
      max_price: undefined,
      start_date: '',
      end_date: '',
      sort_by: 'updated_at',
      sort_order: 'desc',
      page: 1,
      page_size: 20,
    });
  };

  const hasActiveFilters =
    Boolean(filters.store_id) ||
    Boolean(filters.sku) ||
    Boolean(filters.product_name) ||
    filters.min_price !== undefined ||
    filters.max_price !== undefined ||
    Boolean(filters.start_date) ||
    Boolean(filters.end_date);

  const exportUrl = api.getExportUrl(filters);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
          <Filter className="h-4 w-4 text-blue-600" />
          <span>Multi-Criteria Pricing Search</span>
          <span className="text-xs font-normal text-slate-500">
            ({totalRecords.toLocaleString()} matching records)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
          <a
            href={exportUrl}
            download="pricing_records_export.csv"
            className="flex items-center space-x-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Store ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Store ID (e.g. US-0101)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by Store..."
              value={filters.store_id || ''}
              onChange={(e) => handleInputChange('store_id', e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {filters.store_id && (
              <button
                onClick={() => handleInputChange('store_id', '')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            SKU Code
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. SKU-GROC-1001"
              value={filters.sku || ''}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {filters.sku && (
              <button
                onClick={() => handleInputChange('sku', '')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Product Description
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search product title..."
              value={filters.product_name || ''}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {filters.product_name && (
              <button
                onClick={() => handleInputChange('product_name', '')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Price Range ($)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min"
              value={filters.min_price !== undefined ? filters.min_price : ''}
              onChange={(e) =>
                handleInputChange(
                  'min_price',
                  e.target.value === '' ? undefined : parseFloat(e.target.value)
                )
              }
              className="w-full text-xs rounded-lg border border-slate-300 px-2 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max"
              value={filters.max_price !== undefined ? filters.max_price : ''}
              onChange={(e) =>
                handleInputChange(
                  'max_price',
                  e.target.value === '' ? undefined : parseFloat(e.target.value)
                )
              }
              className="w-full text-xs rounded-lg border border-slate-300 px-2 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Feed Date
          </label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
