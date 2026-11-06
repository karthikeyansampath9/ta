import React, { useEffect, useState } from 'react';
import type { PricingRecord, PriceAuditLog } from '../types';
import { api } from '../services/api';
import { History, X, ArrowRight, Clock, User, FileText, Loader2 } from 'lucide-react';

interface AuditHistoryModalProps {
  record: PricingRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  const [history, setHistory] = useState<PriceAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .getRecordHistory(record.id)
      .then((data) => {
        if (mounted) setHistory(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to fetch history');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [record.id]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-600 rounded-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Price Audit Trail</h3>
              <p className="text-xs text-slate-300">
                Immutable Ledger &bull; {record.store_id} &bull; {record.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
            <div>
              <span className="text-slate-500">Item:</span>{' '}
              <span className="font-semibold text-slate-800">{record.product_name}</span>
            </div>
            <div>
              <span className="text-slate-500">Current Price:</span>{' '}
              <span className="font-bold text-slate-900">
                ${record.price.toFixed(2)} ({record.currency})
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <p className="text-xs">Loading audit ledger...</p>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No historical price modifications recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((log) => {
                const isPriceDrop = log.price_delta !== null && log.price_delta < 0;
                const isPriceHike = log.price_delta !== null && log.price_delta > 0;

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-purple-600 shadow-sm" />

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center space-x-1 font-semibold text-slate-700">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{log.changed_by}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1 text-slate-400 text-[11px]">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </span>
                      </div>

                      {/* Price Delta View */}
                      <div className="flex items-center space-x-2 text-sm">
                        {log.old_price !== null ? (
                          <>
                            <span className="line-through text-slate-400 font-medium">
                              ${log.old_price.toFixed(2)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-bold text-slate-900">
                              ${log.new_price.toFixed(2)}
                            </span>
                            {log.percentage_change !== null && (
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  isPriceDrop
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isPriceHike
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {log.percentage_change > 0 ? '+' : ''}
                                {log.percentage_change.toFixed(1)}%
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="font-bold text-slate-900">
                            ${log.new_price.toFixed(2)} (Initial Price)
                          </span>
                        )}

                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 ml-auto">
                          {log.change_source}
                        </span>
                      </div>

                      {/* Reason */}
                      {log.reason && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg flex items-start space-x-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{log.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
