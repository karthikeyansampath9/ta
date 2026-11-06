import React from 'react';
import type { PricingRecord, SearchFilterState } from '../types';
import { Edit2, History, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PricingTableProps {
  records: PricingRecord[];
  loading: boolean;
  filters: SearchFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  total: number;
  totalPages: number;
  onEdit: (record: PricingRecord) => void;
  onViewHistory: (record: PricingRecord) => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({
  records,
  loading,
  filters,
  setFilters,
  total,
  totalPages,
  onEdit,
  onViewHistory,
}) => {
  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const getSortIcon = (column: string) => {
    if (filters.sort_by !== column) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return filters.sort_order === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'GBP':
        return '£';
      case 'EUR':
        return '€';
      case 'JPY':
        return '¥';
      case 'CAD':
        return 'CA$';
      case 'AUD':
        return 'A$';
      default:
        return '$';
    }
  };

  const getStoreCountryBadge = (storeId: string) => {
    const prefix = storeId.slice(0, 2).toUpperCase();
    switch (prefix) {
      case 'US':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UK':
      case 'GB':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DE':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'FR':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'JP':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CA':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'AU':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/75 text-slate-600 uppercase font-bold tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('store_id')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Store ID</span>
                  {getSortIcon('store_id')}
                </div>
              </th>
              <th
                onClick={() => handleSort('sku')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>SKU</span>
                  {getSortIcon('sku')}
                </div>
              </th>
              <th
                onClick={() => handleSort('product_name')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Product Name</span>
                  {getSortIcon('product_name')}
                </div>
              </th>
              <th
                onClick={() => handleSort('price')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Price</span>
                  {getSortIcon('price')}
                </div>
              </th>
              <th
                onClick={() => handleSort('date')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Feed Date</span>
                  {getSortIcon('date')}
                </div>
              </th>
              <th className="py-3.5 px-4">
                <span>Version</span>
              </th>
              <th
                onClick={() => handleSort('updated_at')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Last Modified</span>
                  {getSortIcon('updated_at')}
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4 bg-slate-50/30">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">No pricing records found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload a CSV pricing feed or adjust your search filters.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono border ${getStoreCountryBadge(
                        r.store_id
                      )}`}
                    >
                      {r.store_id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 font-medium">{r.sku}</td>
                  <td className="py-3 px-4 text-slate-900 font-medium max-w-xs truncate">
                    {r.product_name}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                    {getCurrencySymbol(r.currency)}
                    {r.currency === 'JPY' ? r.price.toFixed(0) : r.price.toFixed(2)}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">
                      {r.currency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{r.date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      v{r.version}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(r.updated_at).toLocaleDateString()} {new Date(r.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onEdit(r)}
                      title="Edit Price Record"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors border border-slate-200 hover:border-blue-300"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onViewHistory(r)}
                      title="View Price Change Audit History"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-medium transition-colors border border-slate-200 hover:border-purple-300"
                    >
                      <History className="h-3 w-3" />
                      <span>History</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {total === 0 ? 0 : (filters.page - 1) * filters.page_size + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(filters.page * filters.page_size, total)}
          </span>{' '}
          of <span className="font-semibold text-slate-900">{total}</span> records
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filters.page_size}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                page_size: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="rounded border border-slate-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          <button
            disabled={filters.page <= 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
            }
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="font-medium px-2">
            Page {filters.page} of {totalPages}
          </span>

          <button
            disabled={filters.page >= totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
            }
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
