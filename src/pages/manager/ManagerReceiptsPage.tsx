/**
 * File: ManagerReceiptsPage.tsx
 * Description: Quản lý biên lai nhập và xuất kho của bếp trung tâm
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  ClipboardList,
  PackageOpen,
  X,
  Loader2,
  Eye,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenServices, type InventoryReceiptApi } from '@/services/kitchenServices';
import { supplyServices, type ExportNotesResponse } from '@/services/supplyServices';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import StatusBadge from '@/components/ui/StatusBadge';

type ReceiptStatus = 'DRAFT' | 'COMPLETED';

const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  DRAFT: 'Nháp',
  COMPLETED: 'Hoàn thành',
};

const FILTER_OPTIONS: (ReceiptStatus | 'ALL')[] = ['ALL', 'DRAFT', 'COMPLETED'];

const PAGE_SIZE = 10;

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

type PaginationBarProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  unit: string;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
};

const PaginationBar = ({ page, totalPages, totalItems, unit, loading, onPrev, onNext, onPage }: PaginationBarProps) => (
  <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50/30 px-5 py-3">
    <p className="text-xs text-stone-500">
      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} / {totalItems} {unit}
    </p>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 1 || loading}
        className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          disabled={loading}
          className={cn(
            'flex size-7 items-center justify-center rounded-lg border text-xs font-semibold transition',
            p === page
              ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
              : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={onNext}
        disabled={page === totalPages || loading}
        className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  </div>
);

const ManagerReceiptsPage = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>('IMPORT');

  // Import tab
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'ALL'>('ALL');
  const [receipts, setReceipts] = useState<InventoryReceiptApi[]>([]);
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [importPage, setImportPage] = useState(1);

  // Export tab
  const [exportSearch, setExportSearch] = useState('');
  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [isLoadingExport, setIsLoadingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportPage, setExportPage] = useState(1);
  const [exportTotalElements, setExportTotalElements] = useState(0);

  // Modals
  const [selectedExport, setSelectedExport] = useState<ExportNotesResponse | null>(null);
  const [isExportDetailOpen, setIsExportDetailOpen] = useState(false);
  const [isLoadingExportDetail, setIsLoadingExportDetail] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<InventoryReceiptApi | null>(null);
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);
  const [isLoadingReceiptDetail, setIsLoadingReceiptDetail] = useState(false);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    if (activeTab === 'EXPORT') fetchExportNotes(exportPage);
  }, [activeTab, exportPage]);

  // ── API ────────────────────────────────────────────────────────────────────
  const fetchReceipts = async () => {
    setIsLoadingImport(true);
    try {
      const response = await kitchenServices.getInventoryReceipts();
      if (response.data) setReceipts(response.data);
    } catch {
      // noop
    } finally {
      setIsLoadingImport(false);
    }
  };

  const fetchExportNotes = async (page: number) => {
    setIsLoadingExport(true);
    setExportError(null);
    try {
      const res = await supplyServices.getAllExportNote(page - 1, PAGE_SIZE);
      if (res.data.success) {
        setExportNotes(res.data.data.items);
        setExportTotalElements(res.data.data.totalElements);
      } else {
        setExportNotes([]);
        setExportTotalElements(0);
      }
    } catch {
      setExportError('Không tải được danh sách phiếu xuất kho.');
      setExportNotes([]);
      setExportTotalElements(0);
    } finally {
      setIsLoadingExport(false);
    }
  };

  // Lấy chi tiết phiếu xuất
  const handleOpenExportDetail = async (note: ExportNotesResponse) => {
    setIsLoadingExportDetail(true);
    try {
      setSelectedExport(note);
      setIsExportDetailOpen(true);
    } finally {
      setIsLoadingExportDetail(false);
    }
  };

  // Lấy chi tiết phiếu nhập
  const handleOpenReceiptDetail = async (receipt: InventoryReceiptApi) => {
    setSelectedReceipt(receipt);
    setIsReceiptDetailOpen(true);
    setIsLoadingReceiptDetail(true);
    try {
      const response = await kitchenServices.getInventoryReceiptById(receipt.receiptId);
      if (response.data) setSelectedReceipt(response.data);
    } catch {
      // giữ dữ liệu từ danh sách
    } finally {
      setIsLoadingReceiptDetail(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'IMPORT') fetchReceipts();
    else fetchExportNotes(exportPage);
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const draftCount = useMemo(() => receipts.filter((r) => r.status === 'DRAFT').length, [receipts]);
  const completedCount = useMemo(() => receipts.filter((r) => r.status === 'COMPLETED').length, [receipts]);

  const filteredImportReceipts = useMemo(() => {
    let data = receipts;
    if (statusFilter !== 'ALL') data = data.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.receiptCode.toLowerCase().includes(q) ||
          (r.receiptDate && new Date(r.receiptDate).toLocaleDateString('vi-VN').toLowerCase().includes(q))
      );
    }
    return data;
  }, [receipts, search, statusFilter]);

  const importTotalPages = Math.max(1, Math.ceil(filteredImportReceipts.length / PAGE_SIZE));
  const paginatedReceipts = useMemo(
    () => filteredImportReceipts.slice((importPage - 1) * PAGE_SIZE, importPage * PAGE_SIZE),
    [filteredImportReceipts, importPage]
  );

  const filteredExportNotes = useMemo(() => {
    if (!exportSearch.trim()) return exportNotes;
    const q = exportSearch.toLowerCase();
    return exportNotes.filter(
      (n) => n.exportCode?.toLowerCase().includes(q) || n.storeName?.toLowerCase().includes(q)
    );
  }, [exportNotes, exportSearch]);

  const exportTotalPages = Math.max(1, Math.ceil(exportTotalElements / PAGE_SIZE));

  const isRefreshing = isLoadingImport || isLoadingExport;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          {/* Title + Description + Tabs (LEFT) */}
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <FileText className="size-6 text-amber-500" />
              Biên lai kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              {activeTab === 'IMPORT'
                ? 'Quản lý biên lai nhập vật tư vào bếp trung tâm.'
                : 'Kiểm soát lịch sử xuất kho và phân bổ nguyên vật liệu đến các cửa hàng.'}
            </CardDescription>
            {/* Tab switcher — sát dưới description */}
            <div className="mt-1 inline-flex overflow-hidden rounded-full border border-amber-200 bg-white text-xs shadow-sm self-start">
              {(['IMPORT', 'EXPORT'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'min-w-[88px] px-5 py-1.5 text-center font-medium transition',
                    tab !== 'IMPORT' && 'border-l border-amber-200',
                    activeTab === tab ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'
                  )}
                >
                  {tab === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats + Refresh (RIGHT) */}
          <div className="flex items-center gap-3">
            {activeTab === 'IMPORT' ? (
              <div className="hidden items-center gap-5 md:flex">
                {[
                  { label: 'Tổng biên lai', value: receipts.length, color: 'text-amber-900' },
                  { label: 'Nháp',          value: draftCount,       color: 'text-blue-700'  },
                  { label: 'Hoàn thành',    value: completedCount,   color: 'text-emerald-700' },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-center gap-5">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">{s.label}</span>
                      <span className={cn('text-xl font-black', s.color)}>{s.value}</span>
                    </div>
                    {i < arr.length - 1 && <div className="h-8 w-px bg-amber-200/70" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="hidden flex-col items-end md:flex">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">Tổng phiếu xuất</span>
                <span className="text-xl font-black text-amber-900">{exportTotalElements}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Làm mới"
              className="flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* ── IMPORT TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-amber-500" />
              <Input
                placeholder="Tìm theo mã biên lai, ngày..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setImportPage(1);
                }}
                className="border-amber-200 bg-white pl-9 text-xs shadow-sm focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="inline-flex overflow-hidden rounded-xl border border-amber-200 bg-white p-1 text-xs shadow-sm">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt);
                    setImportPage(1);
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-medium transition',
                    statusFilter === opt
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-800 hover:bg-amber-50'
                  )}
                >
                  {opt === 'ALL' ? 'Tất cả' : RECEIPT_STATUS_LABEL[opt]}
                </button>
              ))}
            </div>
          </div>

          {/* Table card */}
          <Card className="overflow-hidden rounded-2xl border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-5 py-3.5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <ClipboardList className="size-4 text-amber-500" />
                Danh sách biên lai nhập kho
                <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  {filteredImportReceipts.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-bold uppercase tracking-wide text-amber-800">
                      <th className="px-5 py-3">Mã biên lai</th>
                      <th className="px-5 py-3">Ngày lập</th>
                      <th className="px-5 py-3">Người lập</th>
                      <th className="px-5 py-3 text-center">Trạng thái</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {isLoadingImport ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-7 animate-spin text-amber-400" />
                            <p className="text-xs text-stone-400">Đang tải danh sách biên lai...</p>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedReceipts.length > 0 ? (
                      paginatedReceipts.map((r, idx) => (
                        <tr
                          key={r.receiptId}
                          className={cn('transition-colors hover:bg-amber-50/60', idx % 2 === 1 && 'bg-stone-50/30')}
                        >
                          <td className="px-5 py-3">
                            <p className="font-semibold text-stone-900">{r.receiptCode}</p>
                            <p className="mt-0.5 text-[10px] text-stone-400">ID #{r.receiptId}</p>
                          </td>
                          <td className="px-5 py-3 text-stone-600">{formatDateTime(r.receiptDate)}</td>
                          <td className="px-5 py-3 text-stone-600">{r.createdByName ?? '—'}</td>
                          <td className="px-5 py-3 text-center">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptDetail(r)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                            >
                              <Eye className="size-3.5" />
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="size-9 text-stone-300" />
                            <p className="text-sm font-medium text-stone-400">Không có biên lai nào</p>
                            <p className="text-xs text-stone-300">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {filteredImportReceipts.length > PAGE_SIZE && (
                  <PaginationBar
                    page={importPage}
                    totalPages={importTotalPages}
                    totalItems={filteredImportReceipts.length}
                    unit="biên lai"
                    loading={isLoadingImport}
                    onPrev={() => setImportPage((p) => Math.max(1, p - 1))}
                    onNext={() => setImportPage((p) => Math.min(importTotalPages, p + 1))}
                    onPage={(p) => setImportPage(p)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── EXPORT TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'EXPORT' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-amber-500" />
            <Input
              placeholder="Tìm theo mã phiếu xuất, cửa hàng..."
              value={exportSearch}
              onChange={(e) => setExportSearch(e.target.value)}
              className="border-amber-200 bg-white pl-9 text-xs shadow-sm focus:border-amber-400 focus:ring-amber-200"
            />
          </div>

          {/* Table card */}
          <Card className="overflow-hidden rounded-2xl border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-5 py-3.5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <PackageOpen className="size-4 text-amber-500" />
                Danh sách phiếu xuất kho
                <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  {exportTotalElements}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-bold uppercase tracking-wide text-amber-800">
                      <th className="px-5 py-3">Mã phiếu xuất</th>
                      <th className="px-5 py-3">Cửa hàng</th>
                      <th className="px-5 py-3">Ngày xuất</th>
                      <th className="px-5 py-3 text-center">Trạng thái</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {isLoadingExport ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-7 animate-spin text-amber-400" />
                            <p className="text-xs text-stone-400">Đang tải danh sách phiếu xuất kho...</p>
                          </div>
                        </td>
                      </tr>
                    ) : exportError ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="size-9 text-rose-300" />
                            <p className="text-sm font-medium text-rose-400">{exportError}</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredExportNotes.length > 0 ? (
                      filteredExportNotes.map((note, idx) => (
                        <tr
                          key={note.exportId}
                          className={cn('transition-colors hover:bg-amber-50/60', idx % 2 === 1 && 'bg-stone-50/30')}
                        >
                          <td className="px-5 py-3">
                            <p className="font-semibold text-stone-900">{note.exportCode}</p>
                            <p className="mt-0.5 text-[10px] text-stone-400">ID #{note.exportId}</p>
                          </td>
                          <td className="px-5 py-3 text-stone-600">{note.storeName ?? '—'}</td>
                          <td className="px-5 py-3 text-stone-600">
                            {note.exportDate
                              ? new Date(note.exportDate).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <StatusBadge status={note.status ?? undefined} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenExportDetail(note)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                            >
                              <Eye className="size-3.5" />
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="size-9 text-stone-300" />
                            <p className="text-sm font-medium text-stone-400">Chưa có phiếu xuất kho nào</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {exportTotalElements > PAGE_SIZE && (
                  <PaginationBar
                    page={exportPage}
                    totalPages={exportTotalPages}
                    totalItems={exportTotalElements}
                    unit="phiếu"
                    loading={isLoadingExport}
                    onPrev={() => setExportPage((p) => Math.max(1, p - 1))}
                    onNext={() => setExportPage((p) => Math.min(exportTotalPages, p + 1))}
                    onPage={(p) => setExportPage(p)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Modal chi tiết phiếu XUẤT kho ──────────────────────────────── */}
      <Dialog open={isExportDetailOpen} onOpenChange={setIsExportDetailOpen}>
        <DialogContent className="w-[min(95vw,640px)] max-w-none overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200">
                <PackageOpen className="size-4" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">Chi tiết phiếu xuất kho</p>
                {selectedExport && (
                  <p className="text-xs text-gray-500">
                    Mã phiếu:{' '}
                    <span className="font-semibold text-amber-700">{selectedExport.exportCode}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExportDetailOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-100 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            {isLoadingExportDetail || !selectedExport ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="size-8 animate-spin text-amber-400" />
                <p className="text-sm text-gray-400">Đang tải chi tiết phiếu xuất...</p>
              </div>
            ) : (
              <>
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Mã phiếu xuất', value: selectedExport.exportCode },
                    { label: 'Cửa hàng nhận', value: selectedExport.storeName || '—' },
                    {
                      label: 'Ngày xuất',
                      value: selectedExport.exportDate
                        ? new Date(selectedExport.exportDate).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '—',
                    },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <p className="mb-1 text-xs text-gray-500">{info.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{info.value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                    <p className="mb-1.5 text-xs text-gray-500">Trạng thái</p>
                    <StatusBadge status={selectedExport.status ?? undefined} />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Danh sách mặt hàng xuất
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {selectedExport.items.length} mặt hàng
                    </span>
                  </p>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="max-h-56 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-2.5">Sản phẩm</th>
                            <th className="px-4 py-2.5 text-center">Số lượng</th>
                            <th className="px-4 py-2.5 text-center">Đơn vị</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {selectedExport.items.length > 0 ? (
                            selectedExport.items.map((item) => (
                              <tr key={item.productId} className="transition-colors hover:bg-amber-50/40">
                                <td className="px-4 py-2.5 font-medium text-gray-900">{item.productName}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-0.5 font-bold text-amber-800">
                                    {item.quantity.toLocaleString('vi-VN')}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center text-gray-500">{item.unitName}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                                Phiếu xuất này chưa có danh sách mặt hàng chi tiết.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              type="button"
              onClick={() => setIsExportDetailOpen(false)}
              className="rounded-xl border border-amber-200 px-5 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
            >
              Đóng
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal chi tiết biên lai NHẬP kho ───────────────────────────── */}
      <Dialog open={isReceiptDetailOpen} onOpenChange={setIsReceiptDetailOpen}>
        <DialogContent className="w-[min(95vw,640px)] max-w-none overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200">
                <ClipboardList className="size-4" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">Chi tiết biên lai nhập kho</p>
                {selectedReceipt && (
                  <p className="text-xs text-gray-500">
                    Mã biên lai:{' '}
                    <span className="font-semibold text-amber-700">{selectedReceipt.receiptCode}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsReceiptDetailOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-100 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            {!selectedReceipt || isLoadingReceiptDetail ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="size-8 animate-spin text-amber-400" />
                <p className="text-sm text-gray-400">Đang tải chi tiết biên lai...</p>
              </div>
            ) : (
              <>
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Mã biên lai', value: selectedReceipt.receiptCode },
                    { label: 'Người lập', value: selectedReceipt.createdByName ?? '—' },
                    { label: 'Ngày lập', value: formatDateTime(selectedReceipt.receiptDate) },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <p className="mb-1 text-xs text-gray-500">{info.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{info.value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                    <p className="mb-1.5 text-xs text-gray-500">Trạng thái</p>
                    <StatusBadge status={selectedReceipt.status} />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Danh sách mặt hàng nhập
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {selectedReceipt.items?.length ?? 0} mặt hàng
                    </span>
                  </p>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="max-h-56 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-2.5">Mã lô hàng</th>
                            <th className="px-4 py-2.5 text-center">Số lượng</th>
                            <th className="px-4 py-2.5 text-center">Batch ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                            selectedReceipt.items.map((item) => (
                              <tr key={item.receiptItemId} className="transition-colors hover:bg-amber-50/40">
                                <td className="px-4 py-2.5 font-medium text-gray-900">{item.batchCode}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-0.5 font-bold text-amber-800">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center text-xs text-gray-400">#{item.batchId}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                                Biên lai này chưa có mặt hàng nào.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              type="button"
              onClick={() => setIsReceiptDetailOpen(false)}
              className="rounded-xl border border-amber-200 px-5 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
            >
              Đóng
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerReceiptsPage;
