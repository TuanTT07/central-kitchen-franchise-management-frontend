import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CalendarClock, FileText, Search, User,
  ChevronLeft, ChevronRight, RefreshCw, Eye, Inbox, Loader2,
  CheckCircle2, Clock,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';
import { kitchenServices, type InventoryReceiptApi, type ProductBatchesResponse } from '@/services/kitchenServices';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ReceiptStatus = 'DRAFT' | 'COMPLETED';

const FILTER_OPTIONS: (ReceiptStatus | 'ALL')[] = ['ALL', 'DRAFT', 'COMPLETED'];

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

function Receipts() {
  const [receipts, setReceipts] = useState<InventoryReceiptApi[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'ALL'>('ALL');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<InventoryReceiptApi | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modal tạo phiếu nhập kho (nhập kho hàng loạt) – di chuyển từ trang Lô sản phẩm
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [productBatches, setProductBatches] = useState<ProductBatchesResponse[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<{ quantities: Record<string, number> }>();

  const draftCount = useMemo(
    () => receipts.filter((r) => r.status === 'DRAFT').length,
    [receipts]
  );
  const completedCount = useMemo(
    () => receipts.filter((r) => r.status === 'COMPLETED').length,
    [receipts]
  );

  const filteredReceipts = useMemo(() => {
    let data = receipts;

    if (statusFilter !== 'ALL') {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.receiptCode.toLowerCase().includes(q) ||
          (r.receiptDate && new Date(r.receiptDate).toLocaleDateString('vi-VN').toLowerCase().includes(q))
      );
    }

    return data;
  }, [search, statusFilter, receipts]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredReceipts.length / PAGE_SIZE)),
    [filteredReceipts.length]
  );
  const paginatedReceipts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredReceipts.slice(start, start + PAGE_SIZE);
  }, [filteredReceipts, page]);

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedReceipt(null);
  };

  const handleOpenDetail = async (receipt: InventoryReceiptApi) => {
    setSelectedReceipt(receipt);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const response = await kitchenServices.getInventoryReceiptById(receipt.receiptId);
      if (response.data) {
        setSelectedReceipt(response.data);
      }
    } catch {
      // Giữ lại dữ liệu từ danh sách nếu API lỗi
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const fetchProductBatches = async () => {
    setIsLoadingBatches(true);
    try {
      const res = await kitchenServices.getAllProductBatches();
      if (res.data) setProductBatches(res.data);
    } catch (e) {
      toast.error('Không tải được danh sách lô hàng.');
      setProductBatches([]);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleOpenStockIn = async () => {
    if (productBatches.length === 0) {
      await fetchProductBatches();
    }
    const waitingBatches = productBatches.filter((b) => b.status === 'WAITING_FOR_STOCK');
    if (waitingBatches.length === 0) {
      toast.error('Không có lô hàng nào đang ở trạng thái Chờ nhập kho.');
      return;
    }

    waitingBatches.forEach((b) => {
      setValue(`quantities.${b.batchId}`, 0);
    });
    setSelectedBatchIds(waitingBatches.map((b) => b.batchId));
    setIsStockInModalOpen(true);
  };

  const handleToggleSelectBatch = (batchId: number) => {
    const isSelecting = !selectedBatchIds.includes(batchId);
    setSelectedBatchIds((prev) => (isSelecting ? [...prev, batchId] : prev.filter((id) => id !== batchId)));
    if (!isSelecting) clearErrors(`quantities.${batchId}`);
  };

  const handleToggleSelectAll = () => {
    const waitingBatchIds = productBatches.filter((b) => b.status === 'WAITING_FOR_STOCK').map((b) => b.batchId);
    if (selectedBatchIds.length === waitingBatchIds.length) {
      setSelectedBatchIds([]);
      clearErrors('quantities');
    } else {
      setSelectedBatchIds(waitingBatchIds);
    }
  };

  const handleConfirmStockIn = async (data: { quantities: Record<string, number> }) => {
    const finalData = selectedBatchIds.map((id) => ({
      productBatchId: id,
      quantity: data.quantities[id] || 0,
    }));
    try {
      const response = await kitchenServices.manualStockIn(finalData);
      if (response.data) {
        toast.success(`${response.message}`);
        await fetchReceipts();
        await fetchProductBatches();
        setIsStockInModalOpen(false);
      }
    } catch (e) {
      toast.error('Nhập kho thất bại. Vui lòng thử lại.');
    }
  };

  const fetchReceipts = async () => {
    setIsLoadingList(true);
    try {
      const response = await kitchenServices.getInventoryReceipts();
      if (response.data) {
        setReceipts(response.data);
      }
    } catch {
      // TODO: bổ sung toast khi có hệ thống thông báo
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  return (
    <div className="h-full w-full">
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">

        {/* ── Header ── */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <FileText className="size-6 text-amber-500" />
              Phiếu nhập kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi và tạo phiếu nhập kho từ các lô hàng đang chờ xử lý.
            </CardDescription>
          </div>

          {/* Stats + Refresh */}
          <div className="hidden items-center gap-5 md:flex">
            {[
              { label: 'Tổng biên lai', value: receipts.length, color: 'text-amber-900', icon: FileText },
              { label: 'Nháp',          value: draftCount,       color: 'text-blue-700',  icon: Clock },
              { label: 'Hoàn thành',    value: completedCount,   color: 'text-emerald-700', icon: CheckCircle2 },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-5">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">{s.label}</span>
                  <span className={cn('text-xl font-black', s.color)}>{s.value}</span>
                </div>
                {i < arr.length - 1 && <div className="h-10 w-px bg-amber-200/70" />}
              </div>
            ))}
            <button
              type="button"
              onClick={fetchReceipts}
              disabled={isLoadingList}
              title="Làm mới"
              className="ml-2 flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('size-4', isLoadingList && 'animate-spin')} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-amber-500" />
              <Input
                placeholder="Tìm theo mã biên lai, ngày..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs placeholder:text-xs placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs shadow-sm">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusFilter(opt)}
                    className={cn(
                      'cursor-pointer px-3 py-1.5 font-medium transition-all',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt ? 'bg-amber-500 text-white font-bold' : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : translateStatus(opt)}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-amber-600 px-4 text-[11px] font-semibold text-white hover:bg-amber-700"
                onClick={handleOpenStockIn}
              >
                + Tạo phiếu nhập kho
              </Button>
            </div>

            {/* Nút phải */}
            <Button
              type="button"
              size="sm"
              className="h-full shrink-0 rounded-full bg-amber-600 px-5 text-[11px] font-semibold text-white hover:bg-amber-700"
              onClick={handleOpenStockIn}
            >
              + Tạo phiếu nhập kho
            </Button>
          </div>

          {/* ── Table Card ── */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 px-5 py-3">
              <CardTitle className="flex items-center justify-between text-sm font-bold text-amber-900">
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-amber-500" />
                  Danh sách biên lai nhập kho
                </span>
                <span className="text-[11px] font-normal text-amber-700/70">
                  {filteredReceipts.length} phiếu
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
                      <th className="px-5 py-3 text-center">Trạng thái</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {isLoadingList ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-7 animate-spin text-amber-400" />
                            <p className="text-xs text-stone-400">Đang tải dữ liệu biên lai...</p>
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
                          <td className="px-5 py-3 text-center">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(r)}
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
                        <td colSpan={4} className="px-5 py-14 text-center">
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
              </div>

              {/* Pagination */}
              {filteredReceipts.length > 0 && (
                <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50/30 px-5 py-3">
                  <p className="text-xs text-stone-500">
                    {filteredReceipts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredReceipts.length)} /{' '}
                    <span className="font-semibold text-stone-700">{filteredReceipts.length}</span> phiếu
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDetail();
          else setIsDetailOpen(true);
        }}
      >
        <DialogContent
          className="max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl"
          onClose={handleCloseDetail}
        >
          {!selectedReceipt && (
            <div className="px-8 py-14 text-center text-sm text-stone-500">Đang tải...</div>
          )}

          {/* Header modal */}
          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 pr-14">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200">
                <FileText className="size-4" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">Chi tiết biên lai nhập kho</p>
                {selectedReceipt && (
                  <p className="text-xs text-gray-500">
                    Mã:{' '}
                    <span className="font-semibold text-amber-700">{selectedReceipt.receiptCode}</span>
                    <span className="ml-2 text-stone-400">· ID #{selectedReceipt.receiptId}</span>
                  </p>
                )}
              </div>
            </div>
            {selectedReceipt && <StatusBadge status={selectedReceipt.status} />}
          </div>

          {selectedReceipt && (
            <>
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 px-6 py-5">
                {[
                  { label: 'Ngày lập', value: formatDateTime(selectedReceipt.receiptDate), icon: CalendarClock },
                  { label: 'Người tạo', value: selectedReceipt.createdByName || '—', icon: User },
                ].map((info) => (
                  <div key={info.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                    <info.icon className="size-4 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs text-gray-500">{info.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Items table */}
              <div className="px-6 pb-6">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Danh sách mặt hàng
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {selectedReceipt.items?.length ?? 0} mặt hàng
                  </span>
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="max-h-56 overflow-auto">
                    {isLoadingDetail && !selectedReceipt.items?.length ? (
                      <div className="flex flex-col items-center gap-2 py-10">
                        <Loader2 className="size-6 animate-spin text-amber-400" />
                        <p className="text-xs text-stone-400">Đang tải danh sách mặt hàng...</p>
                      </div>
                    ) : selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-2.5">Mã lô</th>
                            <th className="px-4 py-2.5 text-center">Số lượng</th>
                            <th className="px-4 py-2.5 text-center">Batch ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {selectedReceipt.items.map((item, i) => (
                            <tr
                              key={item.receiptItemId}
                              className={cn('transition-colors hover:bg-amber-50/40', i % 2 === 1 && 'bg-stone-50/30')}
                            >
                              <td className="px-4 py-2.5 font-medium text-gray-900">{item.batchCode}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-0.5 font-bold text-amber-800">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs text-gray-400">#{item.batchId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-10">
                        <Inbox className="size-8 text-stone-300" />
                        <p className="text-xs text-stone-400">Biên lai này chưa có mặt hàng nào.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal tạo phiếu nhập kho (nhập kho hàng loạt) */}
      <Dialog open={isStockInModalOpen} onOpenChange={setIsStockInModalOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-4">
            <p className="text-lg font-bold text-amber-900 uppercase tracking-tight">
              Tạo phiếu nhập kho
            </p>
            <p className="text-[11px] font-medium text-amber-700/80">
              Chỉ hiển thị các lô đang chờ nhập kho. Vui lòng nhập số lượng thực tế trước khi lưu.
            </p>
          </div>

          <form onSubmit={handleSubmit(handleConfirmStockIn)}>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(245,158,11,0.1)]">
                  <tr className="text-left text-[11px] font-bold text-amber-900">
                    <th className="w-10 pb-3 pr-4">
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        checked={
                          selectedBatchIds.length ===
                            productBatches.filter((b) => b.status === 'WAITING_FOR_STOCK').length &&
                          selectedBatchIds.length > 0
                        }
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 pr-4">Mã lô / Sản phẩm</th>
                    <th className="pb-3 pr-4 text-center">SL dự kiến</th>
                    <th className="w-40 pb-3 text-center">SL thực tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {isLoadingBatches && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-xs text-stone-500">
                        Đang tải danh sách lô...
                      </td>
                    </tr>
                  )}

                  {!isLoadingBatches &&
                    productBatches
                      .filter((b) => b.status === 'WAITING_FOR_STOCK')
                      .map((b) => {
                        const checked = selectedBatchIds.includes(b.batchId);
                        return (
                          <tr key={b.batchId} className="hover:bg-amber-50/50">
                            <td className="py-3 pr-4">
                              <input
                                type="checkbox"
                                className="size-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                checked={checked}
                                onChange={() => handleToggleSelectBatch(b.batchId)}
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <p className="text-[11px] font-semibold text-stone-900">{b.batchCode}</p>
                              <p className="text-[10px] text-stone-500">{b.productName}</p>
                            </td>
                            <td className="py-3 pr-4 text-center text-[11px] font-semibold text-stone-800">
                              {b.initialQuantity.toLocaleString('vi-VN')} {b.unitName}
                            </td>
                            <td className="py-3 text-center">
                              <Input
                                type="number"
                                min={0}
                                disabled={!checked}
                                className={cn(
                                  'h-8 w-36 text-center text-xs',
                                  checked ? 'border-amber-200' : 'border-stone-200 bg-stone-50 text-stone-400',
                                  errors?.quantities?.[String(b.batchId)] && 'border-rose-300 focus-visible:ring-rose-200'
                                )}
                                {...register(`quantities.${b.batchId}`, {
                                  valueAsNumber: true,
                                  validate: (v) => {
                                    if (!selectedBatchIds.includes(b.batchId)) return true;
                                    if (typeof v !== 'number' || Number.isNaN(v)) return 'Vui lòng nhập số';
                                    if (v <= 0) return 'Số lượng phải > 0';
                                    return true;
                                  },
                                })}
                              />
                            </td>
                          </tr>
                        );
                      })}

                  {!isLoadingBatches &&
                    productBatches.filter((b) => b.status === 'WAITING_FOR_STOCK').length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-xs text-stone-500">
                          Không có lô nào ở trạng thái Chờ nhập kho.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-amber-100 bg-white px-6 py-4">
              <p className="text-[11px] text-stone-500">
                Đã chọn{' '}
                <span className="font-semibold text-stone-900">{selectedBatchIds.length}</span> lô
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 border-amber-200 text-[11px] text-amber-900 hover:bg-amber-50"
                  onClick={() => setIsStockInModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="h-8 bg-amber-600 text-[11px] text-white hover:bg-amber-700"
                  disabled={selectedBatchIds.length === 0}
                >
                  Lưu phiếu nhập
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Receipts;
