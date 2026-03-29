/**
 * =========================================================
 * Component: ManufacturingOrders
 * Description: Trang quản lý danh sách lệnh sản xuất của bếp trung tâm.
 *             Cho phép xem, tìm kiếm và lọc các lệnh sản xuất theo trạng thái.
 * Author: Tuan Tran
 * Created: 2026-03-08
 *
 * Features:
 * - Hiển thị danh sách manufacturing_orders từ API.
 * - Tìm kiếm theo mã lệnh hoặc tên sản phẩm.
 * - Lọc theo trạng thái (PLANNED, COOKING, COMPLETED, CANCELLED).
 * - Hiển thị tóm tắt tình hình sản xuất.
 * =========================================================
 */

// ================= IMPORT =================
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, CalendarClock, ChefHat, Search,
  ChevronLeft, ChevronRight, RefreshCw, Package,
  FlameKindling, CheckCircle2, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';
import { kitchenServices, type ManufacturingOrderResponse, type ManuOrderStatus } from '@/services/kitchenServices';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import { useGlobalListPageSize } from '@/hooks/useGlobalListPageSize';

// ================= TYPES =================

const FILTER_OPTIONS: (ManuOrderStatus | 'ALL')[] = ['ALL', 'PLANNED', 'COOKING', 'COMPLETED'];

// ================= UTIL =================
/**
 * Định dạng chuỗi ngày tháng sang dạng vi-VN (HH:mm dd/mm)
 */
const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// ================= COMPONENT =================
function ManufacturingOrders() {
  // ================= STATE =================
  const [manufacturingOrder, setManufacturingOrder] = useState<ManufacturingOrderResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ManuOrderStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = useGlobalListPageSize();
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrderResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // ================= API =================
  const getAllManufacturing = async () => {
    try {
      setIsLoading(true);
      const response = await kitchenServices.getAllOrders();
      if (response.success) {
        setManufacturingOrder(response.data);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatusManufacturingOrder = async (id: number) => {
    try {
      setIsUpdating(true);
      const response = await kitchenServices.updateStatusOrder(id);
      if (response.success) {
        getAllManufacturing();
        toast.success(`${response.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenConfirm = (order: ManufacturingOrderResponse) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedOrder) return;
    await updateStatusManufacturingOrder(selectedOrder.manuOrderId);
    setIsDialogOpen(false);
    setSelectedOrder(null);
  };

  // ================= UTILS (COMPUTED) =================

  const filteredOrders = useMemo(() => {
    let data = [...manufacturingOrder];
    if (statusFilter !== 'ALL') {
      data = data.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((o) => o.orderCode.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q));
    }
    return data;
  }, [manufacturingOrder, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useLayoutEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredOrders.length / pageSize)),
    [filteredOrders.length, pageSize],
  );
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const stats = useMemo(() => ({
    total:     manufacturingOrder.length,
    planned:   manufacturingOrder.filter((o) => o.status === 'PLANNED').length,
    cooking:   manufacturingOrder.filter((o) => o.status === 'COOKING').length,
    completed: manufacturingOrder.filter((o) => o.status === 'COMPLETED').length,
  }), [manufacturingOrder]);

  // ================= EFFECT =================
  useEffect(() => {
    getAllManufacturing();
  }, []);

  // ─── next status label helper ───
  const nextStatus = (current?: string | null) =>
    current === 'PLANNED' ? 'COOKING' : 'COMPLETED';

  // ================= RENDER =================
  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md overflow-hidden">

        {/* ─── Header ─── */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 shadow-sm text-white">
                <ChefHat className="size-4" />
              </div>
              Lệnh sản xuất
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80 ml-10">
              Theo dõi và cập nhật trạng thái từng lệnh sản xuất của bếp trung tâm.
            </CardDescription>
          </div>

          {/* Stats + Refresh */}
          <div className="hidden items-center gap-5 md:flex">
            {[
              { label: 'Tổng lệnh',   value: stats.total,     color: 'text-amber-900' },
              { label: 'Chờ sản xuất', value: stats.planned,  color: 'text-amber-700' },
              { label: 'Đang nấu',    value: stats.cooking,   color: 'text-orange-700' },
              { label: 'Hoàn thành',  value: stats.completed, color: 'text-emerald-700' },
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
              onClick={getAllManufacturing}
              disabled={isLoading}
              title="Làm mới"
              className="ml-2 flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 shadow-sm hover:bg-amber-50 transition disabled:opacity-50"
            >
              <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {/* ─── Search + Filter ─── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-amber-500" />
              <Input
                placeholder="Tìm theo mã lệnh, tên món..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs shadow-sm">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatusFilter(opt)}
                  className={cn(
                    'cursor-pointer px-3 py-1.5 font-medium transition-all duration-150',
                    opt !== 'ALL' && 'border-l border-amber-200',
                    statusFilter === opt ? 'bg-amber-500 text-white font-bold' : 'text-amber-800 hover:bg-amber-100'
                  )}
                >
                  {opt === 'ALL' ? 'Tất cả' : translateStatus(opt)}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Table Card ─── */}
          <Card className="border-amber-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3 px-5">
              <CardTitle className="flex items-center justify-between text-sm font-bold text-amber-900">
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-amber-500" />
                  Danh sách lệnh sản xuất
                </span>
                <span className="text-[11px] font-normal text-amber-700/70">
                  {filteredOrders.length} lệnh
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-800 uppercase tracking-wide">
                      <th className="px-5 py-3.5 font-bold">Mã lệnh</th>
                      <th className="px-5 py-3.5 font-bold">Sản phẩm</th>
                      <th className="px-5 py-3.5 font-bold text-center">SL kế hoạch</th>
                      <th className="px-5 py-3.5 font-bold">Thời gian</th>
                      <th className="px-5 py-3.5 font-bold text-center">Trạng thái</th>
                      <th className="px-5 py-3.5 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="size-7 animate-spin text-amber-300" />
                            <p className="text-sm font-medium text-stone-400">Đang tải dữ liệu...</p>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-full bg-amber-50">
                              <Package className="size-6 text-amber-200" />
                            </div>
                            <p className="text-sm font-medium text-stone-400">Không có lệnh sản xuất nào khớp với bộ lọc.</p>
                            <p className="text-xs text-stone-300">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((o) => (
                        <tr
                          key={o.manuOrderId}
                          className={cn(
                            'group hover:bg-amber-50/40 transition-colors',
                            o.status === 'COOKING' && 'bg-orange-50/20 hover:bg-orange-50/40',
                          )}
                        >
                          {/* Mã lệnh */}
                          <td className="px-5 py-4">
                            <p className="font-bold text-stone-900">{o.orderCode}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">ID #{o.manuOrderId}</p>
                          </td>

                          {/* Sản phẩm */}
                          <td className="px-5 py-4">
                            <p className="font-semibold text-stone-900">{o.productName}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              Tạo bởi: {o.createdBy ?? '—'}
                            </p>
                          </td>

                          {/* SL */}
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-0.5 text-sm font-black text-amber-800 min-w-[2.5rem]">
                              {o.quantityPlanned}
                            </span>
                          </td>

                          {/* Thời gian */}
                          <td className="px-5 py-4">
                            {o.startDate ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                                  <span className="w-[52px] font-semibold text-stone-400">Bắt đầu</span>
                                  <span className="font-medium">{formatDateTime(o.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                                  <span className="w-[52px] font-semibold text-stone-400">Kết thúc</span>
                                  <span className="font-medium">{formatDateTime(o.endDate)}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400 italic">Chưa lên lịch</span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="px-5 py-4 text-center">
                            <StatusBadge status={o.status} />
                          </td>

                          {/* Thao tác */}
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                'h-8 text-[11px] font-bold shadow-sm transition',
                                o.status === 'COMPLETED'
                                  ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                                  : 'border-amber-300 bg-white text-amber-900 hover:bg-amber-50 hover:border-amber-400'
                              )}
                              onClick={() => handleOpenConfirm(o)}
                              disabled={o.status === 'COMPLETED'}
                            >
                              {o.status === 'COMPLETED' ? 'Hoàn tất' : 'Cập nhật'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-amber-50 bg-amber-50/20 px-5 py-3">
                <p className="text-[11px] text-stone-500">
                  {filteredOrders.length === 0 ? (
                    'Không có lệnh nào'
                  ) : (
                    <>
                      <span className="font-semibold text-stone-700">
                        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredOrders.length)}
                      </span>{' '}
                      / {filteredOrders.length} lệnh
                    </>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-7 border-amber-200 bg-white p-0 text-amber-700 hover:bg-amber-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[80px] text-center text-[11px] font-semibold text-stone-600">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-7 border-amber-200 bg-white p-0 text-amber-700 hover:bg-amber-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Stat pills (mobile) ─── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:hidden">
            {[
              { label: 'Tổng lệnh',  value: stats.total,     icon: ListChecks,     bg: 'bg-amber-500' },
              { label: 'Chờ sx',     value: stats.planned,   icon: AlertTriangle,  bg: 'bg-amber-400' },
              { label: 'Đang nấu',   value: stats.cooking,   icon: FlameKindling,  bg: 'bg-orange-500' },
              { label: 'Xong',       value: stats.completed, icon: CheckCircle2,   bg: 'bg-emerald-500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white p-3 shadow-sm">
                <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-white', s.bg)}>
                  <s.icon className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase">{s.label}</p>
                  <p className="text-xl font-black text-stone-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Dialog xác nhận cập nhật ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[min(95vw,440px)] max-w-none overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
                <ChefHat className="size-6" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-white">
                  Xác nhận cập nhật trạng thái
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-amber-100 font-medium">
                Lệnh: <span className="font-black text-white">{selectedOrder?.orderCode}</span>
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Status transition */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Hiện tại</span>
                <StatusBadge status={selectedOrder?.status} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-px w-8 bg-amber-300 mt-4" />
                <span className="text-[10px] text-stone-300">→</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tiếp theo</span>
                <StatusBadge status={nextStatus(selectedOrder?.status)} />
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-xs font-medium text-stone-600 leading-relaxed text-center">
                Bạn có chắc chắn muốn chuyển trạng thái của lệnh sản xuất này không? Hành động sẽ được ghi lại vào lịch sử.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 border-stone-200 text-stone-600 font-bold text-xs h-11"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={isUpdating}
              className="flex-[2] h-11 rounded-xl bg-amber-500 font-black text-sm text-white hover:bg-amber-600 shadow-lg shadow-amber-200 active:scale-95 transition-all"
            >
              {isUpdating ? (
                <><RefreshCw className="mr-2 size-4 animate-spin" /> Đang xử lý...</>
              ) : 'Xác nhận cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ManufacturingOrders;
