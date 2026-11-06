import React, { useState } from 'react';
import type { PricingRecord } from '../types';
import { api } from '../services/api';
import { Edit3, AlertCircle, Check, Loader2, X, ShieldAlert } from 'lucide-react';

interface EditRecordModalProps {
  record: PricingRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedRecord: PricingRecord) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  if (!isOpen || !record) return null;

  const [price, setPrice] = useState<string>(record.price.toString());
  const [productName, setProductName] = useState<string>(record.product_name);
  const [operator, setOperator] = useState<string>('Pricing Lead');
  const [reason, setReason] = useState<string>('Promotional adjustment');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConflictError(false);

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Price must be a valid number strictly greater than 0.');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateRecord(record.id, {
        price: parsedPrice,
        product_name: productName.trim() || undefined,
        version: record.version, // Optimistic concurrency check
        changed_by: operator.trim() || 'Pricing Lead',
        reason: reason.trim() || 'Manual adjustment',
      });
      onSaveSuccess(updated);
      onClose();
    } catch (err: any) {
      if (err.isConflict) {
        setConflictError(true);
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err.message || 'Failed to update record');
      }
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Edit3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Pricing Record</h3>
              <p className="text-xs text-slate-300">
                Optimistic Locking Protected &bull; Audit Trail Recorded
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Record Identity Pills */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Store ID</span>
              <span className="font-mono font-bold text-slate-800">{record.store_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SKU Code</span>
              <span className="font-mono font-bold text-slate-800">{record.sku}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Version</span>
              <span className="font-mono font-bold text-blue-600">v{record.version}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Feed Date</span>
              <span className="font-mono text-slate-700">{record.date}</span>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Description
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Price Input with Currency Prefix */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Price ({record.currency})
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-xs">
                  {getCurrencySymbol(record.currency)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-8 pr-12 text-xs rounded-lg border border-slate-300 py-2 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-slate-400 text-[10px]">{record.currency}</span>
              </div>
            </div>
          </div>

          {/* Operator Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modified By (User / Role)
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="e.g. Regional Pricing Lead"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Change Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Adjustment
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Local competitor price match, weekend sale"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Conflict Error Notice */}
          {conflictError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Concurrency Conflict Detected (HTTP 409)</p>
                <p className="mt-0.5">
                  This record was modified by another user or automated feed while you were viewing
                  it. Please refresh or close to inspect the updated pricing state.
                </p>
              </div>
            </div>
          )}

          {/* General Error */}
          {errorMsg && !conflictError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Update Error</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{saving ? 'Saving...' : 'Save Price Change'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
