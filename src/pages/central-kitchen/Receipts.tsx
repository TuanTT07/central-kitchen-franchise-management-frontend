import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarClock, FileText, Hash, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenServices, type InventoryReceiptApi } from '@/services/kitchenServices';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type ReceiptStatus = 'DRAFT' | 'COMPLETED';

const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  DRAFT: 'Nháp',
  COMPLETED: 'Hoàn thành',
};

const RECEIPT_STATUS_CLASS: Record<ReceiptStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
};

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

  const draftReceipts = useMemo(
    () => receipts.filter((r) => r.status === 'DRAFT'),
    [receipts]
  );

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
              Biên lai nhập kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi trạng thái bảng `inventory_receipts` – biên lai nhập kho bếp trung tâm.
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng biên lai
              </span>
              <span className="text-lg font-semibold text-amber-900">
                {receipts.length}
              </span>
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
                    {opt === 'ALL' ? 'Tất cả' : RECEIPT_STATUS_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
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
                      {filteredReceipts.map((r) => (
                        <tr key={r.receiptId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{r.receiptCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {r.receiptId}</p>
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {formatDateTime(r.receiptDate)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                RECEIPT_STATUS_CLASS[r.status]
                              )}
                            >
                              {RECEIPT_STATUS_LABEL[r.status]}
                            </span>
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
            </Card>

            <Card className="border-amber-100 bg-amber-50/60 shadow-sm">
              <CardHeader className="border-b border-amber-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Tình hình biên lai
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Tóm tắt trạng thái inventory_receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Nháp</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">{draftCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Hoàn thành</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">{completedCount}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px]">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <p className="font-semibold text-amber-900">Biên lai nháp cần xử lý</p>
                  </div>
                  {draftReceipts.length > 0 ? (
                    <ul className="space-y-1.5">
                      {draftReceipts.map((r) => (
                        <li key={r.receiptId} className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-stone-900">
                            {r.receiptCode}
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              RECEIPT_STATUS_CLASS[r.status]
                            )}
                          >
                            {RECEIPT_STATUS_LABEL[r.status]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500">Không có biên lai nháp.</p>
                  )}
                </div>
              </CardContent>
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
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold',
                      RECEIPT_STATUS_CLASS[selectedReceipt.status]
                    )}
                  >
                    {RECEIPT_STATUS_LABEL[selectedReceipt.status]}
                  </span>
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
    </div>
  );
}

export default Receipts;
