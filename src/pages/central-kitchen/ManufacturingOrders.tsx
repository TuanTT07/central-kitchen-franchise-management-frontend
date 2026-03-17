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
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarClock, ChefHat, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenServices, type ManufacturingOrderResponse, type ManuOrderStatus } from '@/services/kitchenServices';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {toast} from 'sonner';

// ================= TYPES =================

const FILTER_OPTIONS: (ManuOrderStatus | 'ALL')[] = ['ALL', 'PLANNED', 'COOKING', 'COMPLETED'];

/**
 * Mapping nhãn hiển thị cho trạng thái lệnh sản xuất
 */
const MANU_ORDER_STATUS_LABEL: Record<ManuOrderStatus, string> = {
  PLANNED: 'Chờ sản xuất',
  COOKING: 'Đang nấu',
  COMPLETED: 'Hoàn thành',
};

/**
 * Mapping class CSS cho từng trạng thái
 */
const MANU_ORDER_STATUS_CLASS: Record<ManuOrderStatus, string> = {
  PLANNED: 'border-blue-200 bg-blue-50 text-blue-700',
  COOKING: 'border-amber-200 bg-amber-50 text-amber-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

// ================= UTIL =================
/**
 * Định dạng chuỗi ngày tháng sang dạng vi-VN (HH:mm dd/mm)
 *
 * @param value Chuỗi ngày tháng từ API hoặc null
 * @returns Chuỗi đã định dạng hoặc '—' nếu null
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
  const PAGE_SIZE = 10;
  // Lệnh đang chọn để cập nhật trạng thái
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrderResponse | null>(null);
  // Trạng thái đóng/mở popup xác nhận
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ================= API =================
  /**
   * Gọi API lấy danh sách tất cả các lệnh sản xuất
   * Cập nhật state manufacturingOrder khi thành công
   */
  const getAllManufacturing = async () => {
    try {
      const response = await kitchenServices.getAllOrders();
      if (response.success) {
        setManufacturingOrder(response.data);
      }
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const updateStatusManufacturingOrder = async (id: number) => {
    try {
      const response = await kitchenServices.updateStatusOrder(id);
      if (response.success) {
        getAllManufacturing();
        toast.success(`${response.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  /**
   * Mở popup xác nhận cập nhật trạng thái
   */
  const handleOpenConfirm = (order: ManufacturingOrderResponse) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  /**
   * Xử lý xác nhận cập nhật trạng thái từ popup
   */
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE)), [filteredOrders.length]);
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const stats = useMemo(() => {
    return {
      total: manufacturingOrder.length,
      cooking: manufacturingOrder.filter((o) => o.status === 'COOKING').length,
      planned: manufacturingOrder.filter((o) => o.status === 'PLANNED').length,
    };
  }, [manufacturingOrder]);

  // ================= EFFECT =================
  useEffect(() => {
    getAllManufacturing();
  }, []);

  // ================= RENDER =================
  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <ChefHat className="size-6 text-amber-500" />
              Lệnh sản xuất
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi trạng thái bảng `manufacturing_orders` theo từng sản phẩm.
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng lệnh</span>
              <span className="text-lg font-semibold text-amber-900">{stats.total}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Đang nấu</span>
              <span className="text-lg font-semibold text-amber-900">{stats.cooking}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Chờ sản xuất</span>
              <span className="text-lg font-semibold text-amber-900">{stats.planned}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -mt-2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã lệnh, tên món..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-white pl-9 text-xs shadow-sm focus-visible:ring-amber-300"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Trạng thái
              </span>
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-white text-xs">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusFilter(opt)}
                    className={cn(
                      'px-3 py-1.5 transition',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : MANU_ORDER_STATUS_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-1">
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Danh sách lệnh sản xuất
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  manufacturing_orders · filter theo trạng thái, tìm kiếm theo mã và sản phẩm.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-2 py-2 font-semibold">Mã lệnh</th>
                        <th className="px-2 py-2 font-semibold">Sản phẩm</th>
                        <th className="px-2 py-2 font-semibold text-center">Số lượng kế hoạch</th>
                        <th className="px-2 py-2 font-semibold text-center">Thời gian</th>
                        <th className="px-2 py-2 font-semibold text-right">Trạng thái</th>
                        <th className="px-2 py-2 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {paginatedOrders.map((o) => (
                        <tr key={o.manuOrderId} className="hover:bg-amber-50/40">
                          <td className="px-2 py-2">
                            <p className="text-sm font-semibold text-stone-900">{o.orderCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {o.manuOrderId}</p>
                          </td>
                          <td className="px-2 py-2">
                            <p className="text-sm font-medium text-stone-900">{o.productName}</p>
                            <p className="text-[11px] text-stone-500">product_id: {o.productId}</p>
                          </td>
                          <td className="px-2 py-2 text-center text-sm font-semibold text-stone-900">
                            {o.quantityPlanned}
                          </td>
                          <td className="px-2 py-2 text-[11px] text-stone-800">
                            {o.startDate ? (
                              <div className="flex flex-col gap-0.5">
                                <span>Bắt đầu: {formatDateTime(o.startDate)}</span>
                                <span>Kết thúc: {formatDateTime(o.endDate)}</span>
                              </div>
                            ) : (
                              <span className="text-stone-500">Chưa lên lịch</span>
                            )}
                          </td>

                          <td className="px-2 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                MANU_ORDER_STATUS_CLASS[o.status as ManuOrderStatus]
                              )}
                            >
                              {MANU_ORDER_STATUS_LABEL[o.status as ManuOrderStatus] || o.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-200 bg-white text-[11px] text-amber-900 hover:bg-amber-50"
                              onClick={() => handleOpenConfirm(o)}
                              disabled={o.status === 'COMPLETED'}
                            >
                              Cập nhật
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-xs text-stone-500">
                            Không có lệnh sản xuất nào khớp với bộ lọc.
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
                    {filteredOrders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                    –
                    {Math.min(page * PAGE_SIZE, filteredOrders.length)}
                  </span>{' '}
                  / <span className="font-semibold text-stone-800">{filteredOrders.length}</span> lệnh
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
      {/* Popup xác nhận cập nhật trạng thái */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="size-5 text-amber-500" />
              Xác nhận cập nhật
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-stone-600">
              Bạn có chắc chắn muốn cập nhật trạng thái cho lệnh sản xuất{' '}
              <span className="font-bold text-stone-900">{selectedOrder?.orderCode}</span> không?
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 rounded-lg bg-amber-50 p-4 border border-amber-100">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-stone-500">Hiện tại</span>
                <span
                  className={cn(
                    'mt-1 rounded-full border px-3 py-1 text-xs font-semibold',
                    selectedOrder ? MANU_ORDER_STATUS_CLASS[selectedOrder.status as ManuOrderStatus] : ''
                  )}
                >
                  {selectedOrder ? MANU_ORDER_STATUS_LABEL[selectedOrder.status as ManuOrderStatus] : ''}
                </span>
              </div>
              <div className="h-px w-8 bg-amber-300" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-stone-500">Tiếp theo</span>
                <span
                  className={cn(
                    'mt-1 rounded-full border px-3 py-1 text-xs font-semibold',
                    selectedOrder?.status === 'PLANNED'
                      ? MANU_ORDER_STATUS_CLASS.COOKING
                      : MANU_ORDER_STATUS_CLASS.COMPLETED
                  )}
                >
                  {selectedOrder?.status === 'PLANNED'
                    ? MANU_ORDER_STATUS_LABEL.COOKING
                    : MANU_ORDER_STATUS_LABEL.COMPLETED}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-stone-200 text-stone-600"
            >
              Hủy
            </Button>
            <Button onClick={handleConfirmUpdate} className="bg-amber-500 text-white hover:bg-amber-600">
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ManufacturingOrders;
