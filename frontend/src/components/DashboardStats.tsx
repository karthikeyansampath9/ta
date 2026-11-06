import React from 'react';
import type { DashboardSummary } from '../types';
import { Store, Tag, Database, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ summary, loading }) => {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 h-28" />
        ))}
      </div>
    );
  }

  const activeStores = summary?.active_stores ?? 0;
  const totalRecords = summary?.total_records ?? 0;
  const uniqueSkus = summary?.unique_skus ?? 0;
  const avgPrice = summary?.average_price ?? 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pricing Records
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalRecords.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Persisted</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Live indexed in multi-region cluster</p>
        </div>

        {/* Active Stores */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stores Ingested
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {activeStores.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 3,000 Global</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, (activeStores / 3000) * 100))}%` }}
            />
          </div>
        </div>

        {/* Unique SKUs */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Catalog SKUs
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {uniqueSkus.toLocaleString()}
            </span>
            <span className="text-xs text-purple-600 font-medium">Unique Items</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Cross-border synchronized</p>
        </div>

        {/* Average Price */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Price
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${avgPrice.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">Weighted</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Optimistic lock versioned</p>
        </div>
      </div>

      {/* Recent Feed Activity & Store Distribution */}
      {summary && summary.recent_batches && summary.recent_batches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed Ingestion Log */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Recent Ingestion Feeds</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead>
                  <tr className="text-slate-400 font-medium text-left">
                    <th className="pb-2">Feed Source</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Processed</th>
                    <th className="pb-2">Errors</th>
                    <th className="pb-2">Latency</th>
                    <th className="pb-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.recent_batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 font-medium text-slate-800">{b.filename}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            b.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.status === 'SUCCESS' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span>{b.status}</span>
                        </span>
                      </td>
                      <td className="py-2 text-slate-700">{b.success_count} rows</td>
                      <td className="py-2 text-rose-600 font-semibold">{b.error_count}</td>
                      <td className="py-2 text-slate-500">{b.duration_ms} ms</td>
                      <td className="py-2 text-slate-400">
                        {b.created_at ? new Date(b.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Brackets */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Tag className="h-4 w-4 text-indigo-600" />
              <span>Price Bracket Distribution</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Under $10 (Everyday Essentials)</span>
                  <span>{summary.price_ranges.under_10} items</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(summary.price_ranges.under_10 / Math.max(1, totalRecords)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>$10 - $50 (Standard Retail)</span>
                  <span>{summary.price_ranges['10_to_50']} items</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{
                      width: `${(summary.price_ranges['10_to_50'] / Math.max(1, totalRecords)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>$50 - $100 (Premium Goods)</span>
                  <span>{summary.price_ranges['50_to_100']} items</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${(summary.price_ranges['50_to_100'] / Math.max(1, totalRecords)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Over $100 (Electronics & High Value)</span>
                  <span>{summary.price_ranges.over_100} items</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{
                      width: `${(summary.price_ranges.over_100 / Math.max(1, totalRecords)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
