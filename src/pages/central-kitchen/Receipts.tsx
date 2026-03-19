import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarClock, FileText, Hash, Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <FileText className="size-6 text-amber-500" />
              Phiếu nhập kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi và tạo phiếu nhập kho từ bảng `inventory_receipts`.
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng biên lai
              </span>
              <span className="text-lg font-semibold text-amber-900">{receipts.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Nháp
              </span>
              <span className="text-lg font-semibold text-amber-900">{draftCount}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Hoàn thành
              </span>
              <span className="text-lg font-semibold text-amber-900">{completedCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã biên lai, ngày..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusFilter(opt)}
                    className={cn(
                      'px-3 py-1.5 transition',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt
                        ? 'bg-amber-500 text-white'
                        : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : translateStatus(opt)}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                className="ml-auto h-9 rounded-full bg-amber-600 px-4 text-[11px] font-semibold text-white hover:bg-amber-700"
                onClick={handleOpenStockIn}
              >
                + Tạo phiếu nhập kho
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-1">
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <FileText className="size-4 text-amber-500" />
                  Danh sách biên lai
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  inventory_receipts · lọc theo trạng thái, tìm theo mã và ngày.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã biên lai</th>
                        <th className="px-4 py-2 font-semibold">Ngày lập</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                        <th className="px-4 py-2 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {paginatedReceipts.map((r) => (
                        <tr key={r.receiptId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{r.receiptCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {r.receiptId}</p>
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {formatDateTime(r.receiptDate)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-200 bg-white text-[11px] text-amber-900 hover:bg-amber-50"
                              onClick={() => handleOpenDetail(r)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!isLoadingList && filteredReceipts.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-xs text-stone-500"
                          >
                            Không có biên lai nào khớp với bộ lọc.
                          </td>
                        </tr>
                      )}
                      {isLoadingList && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-xs text-stone-500"
                          >
                            Đang tải dữ liệu biên lai...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <div className="flex flex-col gap-3 border-t border-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-stone-500">
                  Hiển thị{' '}
                  <span className="font-semibold text-stone-800">
                    {filteredReceipts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredReceipts.length)}
                  </span>{' '}
                  / <span className="font-semibold text-stone-800">{filteredReceipts.length}</span> phiếu
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-amber-200 bg-white px-2 text-[11px] text-amber-900 hover:bg-amber-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[110px] text-center text-[11px] font-medium text-stone-700">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-amber-200 bg-white px-2 text-[11px] text-amber-900 hover:bg-amber-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>

          </div>
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

          {selectedReceipt && (
            <>
              {/* Header: mã biên lai nổi bật + badge (thêm padding phải để tránh dính nút đóng) */}
              <div className="border-b border-stone-100 bg-stone-50/80 px-8 pt-6 pb-6 pr-14">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-baseline gap-4">
                    <Hash className="size-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                        Mã biên lai
                      </p>
                      <p className="mt-1 text-xl font-bold tracking-tight text-stone-900">
                        {selectedReceipt.receiptCode}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">ID: {selectedReceipt.receiptId}</p>
                    </div>
                  </div>
                  <StatusBadge status={selectedReceipt.status} className="px-4 py-2 text-xs" />
                </div>
              </div>

              {/* Thông tin phụ: ngày + người tạo (tăng khoảng cách giữa 2 khối) */}
              <div className="flex flex-wrap gap-x-16 gap-y-4 border-b border-stone-100 bg-white px-8 py-5">
                <div className="flex items-center gap-3 min-w-0">
                  <CalendarClock className="size-4 shrink-0 text-stone-400" />
                  <div>
                    <p className="text-[10px] font-medium uppercase text-stone-400">Ngày lập</p>
                    <p className="mt-0.5 text-sm font-semibold text-stone-800">
                      {formatDateTime(selectedReceipt.receiptDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <User className="size-4 shrink-0 text-stone-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase text-stone-400">Người tạo</p>
                    <p className="mt-0.5 text-sm font-semibold text-stone-800">
                      {selectedReceipt.createdByName || '—'}
                      {typeof selectedReceipt.createdById !== 'undefined' && (
                        <span className="ml-1.5 font-normal text-stone-500">(ID: {selectedReceipt.createdById})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Danh sách mặt hàng: padding rộng hơn, cột tách rõ */}
              <div className="max-h-[55vh] overflow-y-auto">
                <div className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50 px-6 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Danh sách mặt hàng
                  </p>
                </div>
                <div className="px-6 py-4 pb-6">
                  {isLoadingDetail && !selectedReceipt.items?.length ? (
                    <p className="py-10 text-center text-xs text-stone-500">
                      Đang tải danh sách mặt hàng...
                    </p>
                  ) : selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold text-stone-500">
                          <th className="pb-3 pr-4">Mã lô</th>
                          <th className="w-24 pb-3 text-center">Số lượng</th>
                          <th className="w-20 pb-3 pl-4 text-right">Batch ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {selectedReceipt.items.map((item, i) => (
                          <tr
                            key={item.receiptItemId}
                            className={cn(
                              'transition-colors',
                              i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50',
                              'hover:bg-amber-50/50'
                            )}
                          >
                            <td className="py-3 pr-4 font-medium text-stone-900">
                              {item.batchCode}
                            </td>
                            <td className="py-3 text-center font-semibold text-stone-800">
                              {item.quantity}
                            </td>
                            <td className="py-3 pl-4 text-right text-xs text-stone-500">
                              {item.batchId}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-10 text-center text-xs text-stone-500">
                      Biên lai này chưa có mặt hàng nào.
                    </p>
                  )}
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
