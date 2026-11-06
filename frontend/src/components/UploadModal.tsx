import React, { useState, useRef } from 'react';
import type { IngestionResult } from '../types';
import { api } from '../services/api';
import {
  UploadCloud,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Mock generator state
  const [mockStoreCount, setMockStoreCount] = useState<number>(20);
  const [generatingMock, setGeneratingMock] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setGeneralError(null);
    setIngestionResult(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setGeneralError('Please upload a file with .csv extension.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setGeneralError(null);

    try {
      const res = await api.uploadCsv(selectedFile);
      setIngestionResult(res);
      onUploadSuccess();
    } catch (err: any) {
      setGeneralError(err.message || 'Feed upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateMock = async () => {
    setGeneratingMock(true);
    setGeneralError(null);
    setIngestionResult(null);

    try {
      const res = await api.generateMockData(mockStoreCount, 15);
      setIngestionResult(res.ingestion_result);
      onUploadSuccess();
    } catch (err: any) {
      setGeneralError(err.message || 'Mock generation failed');
    } finally {
      setGeneratingMock(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIngestionResult(null);
    setGeneralError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <UploadCloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Upload Retail Pricing Feed</h3>
              <p className="text-xs text-slate-300">
                CSV Schema: Store ID, SKU, Product Name, Price, Date
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

        <div className="p-6 space-y-6">
          {/* File Drag & Drop Zone */}
          {!ingestionResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div
                  className={`p-3 rounded-full ${
                    selectedFile
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to ingest
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      Drag & drop your store pricing CSV here, or{' '}
                      <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports UTF-8, UTF-8-BOM, Latin-1, multi-date formats
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Error Alert */}
          {generalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Feed Processing Error</p>
                <p>{generalError}</p>
              </div>
            </div>
          )}

          {/* Ingestion Report / Summary */}
          {ingestionResult && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {ingestionResult.status === 'SUCCESS' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                  <h4 className="font-bold text-slate-900 text-sm">
                    Feed Ingestion Summary ({ingestionResult.status})
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Latency: {ingestionResult.duration_ms} ms
                </span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Total Rows</span>
                  <span className="font-bold text-slate-800 text-lg">
                    {ingestionResult.total_rows}
                  </span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="text-xs text-emerald-600 block">Ingested / Updated</span>
                  <span className="font-bold text-emerald-700 text-lg">
                    {ingestionResult.success_count}
                  </span>
                </div>
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                  <span className="text-xs text-rose-600 block">Rejected Rows</span>
                  <span className="font-bold text-rose-700 text-lg">
                    {ingestionResult.error_count}
                  </span>
                </div>
              </div>

              {/* Error Details if any */}
              {ingestionResult.errors && ingestionResult.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-bold text-rose-700 mb-2">
                    Line Validation Errors ({ingestionResult.errors.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-rose-200 bg-white divide-y divide-rose-100 text-xs">
                    {ingestionResult.errors.map((err, idx) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-rose-800">
                            Row {err.row_number}:
                          </span>{' '}
                          <span className="text-slate-700">{err.error_message}</span>
                        </div>
                        {err.field && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">
                            {err.field}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Upload Another Feed
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions & Templates */}
          {!ingestionResult && (
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <a
                href={api.getTemplateUrl()}
                download="pricing_feed_template.csv"
                className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Download Sample CSV Template</span>
              </a>

              {/* Mock Data Generator */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Simulate Network:</span>
                <select
                  value={mockStoreCount}
                  onChange={(e) => setMockStoreCount(parseInt(e.target.value))}
                  className="rounded border border-slate-300 px-2 py-1 text-xs bg-white"
                >
                  <option value={10}>10 Stores (~150 SKUs)</option>
                  <option value={50}>50 Stores (~750 SKUs)</option>
                  <option value={200}>200 Stores (~3,000 SKUs)</option>
                  <option value={500}>500 Stores (~7,500 SKUs)</option>
                </select>
                <button
                  type="button"
                  disabled={generatingMock || uploading}
                  onClick={handleGenerateMock}
                  className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  {generatingMock ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>Generate Feeds</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {ingestionResult ? 'Done' : 'Cancel'}
          </button>
          {!ingestionResult && (
            <button
              disabled={!selectedFile || uploading}
              onClick={handleUploadSubmit}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{uploading ? 'Ingesting Feeds...' : 'Ingest Feed'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
