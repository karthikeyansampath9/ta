import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { SearchFilters } from './components/SearchFilters';
import { PricingTable } from './components/PricingTable';
import { UploadModal } from './components/UploadModal';
import { EditRecordModal } from './components/EditRecordModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { ArchitectureView } from './components/ArchitectureView';
import type { PricingRecord, SearchFilterState, DashboardSummary } from './types';
import { api } from './services/api';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'upload' | 'dashboard' | 'architecture'>('pricing');

  // Filters State
  const [filters, setFilters] = useState<SearchFilterState>({
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

  // Data state
  const [records, setRecords] = useState<PricingRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PricingRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<PricingRecord | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Pricing Records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPricingRecords(filters);
      setRecords(data.items);
      setTotalRecords(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error('Failed to load records:', err);
      showToast(err.message || 'Error loading records', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch Summary Metrics
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleEditRecord = (rec: PricingRecord) => {
    setEditingRecord(rec);
  };

  const handleViewHistory = (rec: PricingRecord) => {
    setHistoryRecord(rec);
  };

  const handleSaveSuccess = (updatedRecord: PricingRecord) => {
    showToast(`Price updated for ${updatedRecord.sku} to $${updatedRecord.price.toFixed(2)}`);
    fetchRecords();
    fetchSummary();
  };

  const handleUploadSuccess = () => {
    showToast('Pricing feed successfully processed and persisted.');
    fetchRecords();
    fetchSummary();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openUploadModal={() => setUploadModalOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 animate-slide-up text-xs font-medium">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Seeding Banner if empty */}
        {totalRecords === 0 && !loading && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <h3 className="text-base font-bold">Quick Start: Populate 3,000 Retail Store Feeds</h3>
              </div>
              <p className="text-xs text-indigo-200">
                Your database is ready. Ingest a sample feed or generate realistic price records across US, UK, DE, FR, JP, CA, and AU.
              </p>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="bg-white hover:bg-slate-100 text-indigo-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
              >
                Upload CSV Feed
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.generateMockData(20, 15);
                    showToast('Seeded 300 pricing records across 20 retail stores!');
                    fetchRecords();
                    fetchSummary();
                  } catch (e: any) {
                    showToast(e.message || 'Seeding failed', 'error');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors border border-indigo-400/30"
              >
                Generate 20 Stores (Instant)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: PRICING SEARCH & EDIT GRID */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <SearchFilters
              filters={filters}
              setFilters={setFilters}
              onSearch={fetchRecords}
              totalRecords={totalRecords}
            />

            <PricingTable
              records={records}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              total={totalRecords}
              totalPages={totalPages}
              onEdit={handleEditRecord}
              onViewHistory={handleViewHistory}
            />
          </div>
        )}

        {/* VIEW 2: DASHBOARD & METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Global Retail Chain Pricing Intelligence
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregated telemetry across 3,000 stores in 7 regional markets
                </p>
              </div>
              <button
                onClick={fetchSummary}
                className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-medium transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh KPIs</span>
              </button>
            </div>

            <DashboardStats
              summary={summary}
              loading={summaryLoading}
              onRefresh={fetchSummary}
            />
          </div>
        )}

        {/* VIEW 3: ARCHITECTURE & NFR DOCUMENTATION */}
        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; 2026 ApexRetail Systems &bull; Enterprise Pricing Feed & Ingestion Architecture
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-blue-600 font-medium underline"
            >
              View Architecture & NFRs
            </button>
            <span>&bull;</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 font-medium"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <EditRecordModal
        record={editingRecord}
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        onSaveSuccess={handleSaveSuccess}
      />

      <AuditHistoryModal
        record={historyRecord}
        isOpen={Boolean(historyRecord)}
        onClose={() => setHistoryRecord(null)}
      />
    </div>
  );
}

export default App;
