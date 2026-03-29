/**
 * File: OrderTrackingPage.tsx
 * Description: Trang theo dõi trạng thái đơn hàng của chi nhánh
 * Author: Tuan Tran, Dat Tran
 */

// ================= IMPORTS =================

import { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
   ChevronLeft,
   ChevronRight,
   Receipt,
   Search,
   Loader2,
   XCircle,
   Check,
   RefreshCw,
   Package,
   LayoutGrid,
   SlidersHorizontal,
   Filter,
   Plus,
   AlertTriangle,
   Upload,
 } from 'lucide-react';
import { cn, formatCalendarDayVi } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  franchiseServices,
  normalizeOrderDetailLine,
  normalizeSupplyOrder,
  type OrderResponse,
  type OrderDetailResponse,
} from '@/services/franchiseServices';
import { toast } from 'sonner';
import { useGlobalListPageSize } from '@/hooks/useGlobalListPageSize';

function mapOrderFromApi(o: OrderResponse<OrderDetailResponse[]>): OrderResponse<OrderDetailResponse[]> {
  const n = normalizeSupplyOrder(o);
  const det = n.details;
  return {
    ...n,
    details: Array.isArray(det) ? det.map(normalizeOrderDetailLine) : det,
  };
}

/**
 * Component Description
 * - Hiển thị danh sách đơn hàng đã đặt
 * - Theo dõi trạng thái duyệt đơn và trạng thái xuất kho
 * - Trạng thái hiển thị qua translateStatus() – không hardcode text.
 */

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'DONE', 'CONSOLIDATED', 'CANCELLED'] as const;
type FilterStatus = (typeof FILTER_OPTIONS)[number];

const normalizeOrderStatus = (status: unknown): string => {
  if (typeof status !== 'string' || !status.trim()) return '';
  return status.toUpperCase().replace(/[\s-]+/g, '_');
};

const OrderTrackingPage = () => {

  // ================= STATE =================

  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedReceiveOrderId, setSelectedReceiveOrderId] = useState<number | null>(null);
  const [openReceiveDialog, setOpenReceiveDialog] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = useGlobalListPageSize();
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderResponse<OrderDetailResponse[]> | null>(null);

  // Report issue state
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [selectedReportOrderId, setSelectedReportOrderId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<string>('DAMAGED');
  const [reportNote, setReportNote] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [reportItems, setReportItems] = useState<{ productId: number; productName: string; orderedQuantity: number; actualQuantity: number; unitName: string }[]>([]);
  const [selectedWrongProductIds, setSelectedWrongProductIds] = useState<number[]>([]);
  const [isFetchingReportData, setIsFetchingReportData] = useState(false);

  useLayoutEffect(() => {
    setPage(1);
  }, [pageSize]);

  // ================= EFFECT =================

  useEffect(() => {
    fetchData();
  }, []);

  // ================= API =================

  const fetchData = async () => {
    try {
      setLoading(true);
      const orderRes = await franchiseServices.getOrders();
      if (orderRes.success && orderRes.data && Array.isArray(orderRes.data.items)) {
        setOrders(orderRes.data.items.map(mapOrderFromApi));
      }
    } catch {
      toast.error('Không thể tải dữ liệu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLER =================

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleCancelOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setOpenCancelDialog(true);
  };

  const handleOpenOrderDetail = async (orderId: number) => {
    setOpenDetailDialog(true);
    setIsLoadingDetail(true);
    setOrderDetail(null);
    try {
      const res = await franchiseServices.getOrderById(orderId);
      if (res.success && res.data) {
        setOrderDetail(mapOrderFromApi(res.data));
      } else {
        toast.error(res.message || 'Không tải được chi tiết đơn hàng');
      }
    } catch {
      toast.error('Không tải được chi tiết đơn hàng');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderId) return;
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }
    try {
      setLoading(true);
      const response = await franchiseServices.cancelOrder(selectedOrderId, {
        cancelReason: cancelReason.trim()
      });
      if (response.success) {
        setOpenCancelDialog(false);
        setCancelReason('');
        setSelectedOrderId(null);
        fetchData();
        toast.success('Đã hủy đơn hàng thành công');
      }
    } catch {
      toast.error('Không thể huỷ đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceive = async () => {
    if (!selectedReceiveOrderId) return;
    try {
      setIsReceiving(true);
      const response = await franchiseServices.receiveOrder(selectedReceiveOrderId);
      if (response.success) {
        setOpenReceiveDialog(false);
        setSelectedReceiveOrderId(null);
        toast.success('Xác nhận đơn hàng thành công!');
        await fetchData();
      } else {
        toast.error(response.message || 'Không thể xác nhận đơn hàng');
      }
    } catch {
      toast.error('Không thể xác nhận đơn hàng');
    } finally {
      setIsReceiving(false);
    }
  };

  const handleReportOrder = async (orderId: number) => {
    setSelectedReportOrderId(orderId);
    setOpenReportDialog(true);
    setIsFetchingReportData(true);
    try {
      // Tải chi tiết đơn hàng để lấy danh sách sản phẩm
      const res = await franchiseServices.getOrderById(orderId);
      if (res.success && res.data) {
        const mapped = mapOrderFromApi(res.data);
        const items = (mapped.details || []).map((d) => ({
          productId: d.productId,
          productName: d.productName,
          orderedQuantity: d.quantity,
          actualQuantity: d.quantity,
          unitName: d.unitName || d.unit || '—',
        }));
        setReportItems(items);
        setOrderDetail(mapped);
      }
    } catch {
      toast.error('Không thể tải chi tiết sản phẩm cho báo cáo');
    } finally {
      setIsFetchingReportData(false);
    }
  };

  const handleReportItemChange = (productId: number, actualQty: number) => {
    setReportItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, actualQuantity: actualQty } : item
      )
    );
  };

  const toggleWrongProduct = (productId: number) => {
    setSelectedWrongProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...files]);

      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmReport = async () => {
    if (!selectedReportOrderId) return;
    if (!reportReason) {
      toast.error('Vui lòng chọn lý do báo cáo');
      return;
    }

    try {
      setIsReporting(true);

      // ================= DATA PREPARATION =================

      // Mảng items theo cấu trúc yêu cầu của Backend
      // { productId: number, quantity: number, receivedQuantity: number }
      const itemsPayload = reportItems.map((item) => ({
        productId: item.productId,
        quantity: item.orderedQuantity,
        receivedQuantity: item.actualQuantity,
      }));

      // Tạo FormData để truyền dữ liệu (bao gồm cả File)
      const formData = new FormData();

      // Backend yêu cầu part 'payload' chứa thông tin JSON
      const payload = {
        reason: reportReason,
        note: reportNote || '',
        items: itemsPayload,
      };

      // Đưa payload vào FormData dưới dạng Blob với type application/json
      formData.append(
        'payload',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );

      // Thêm các file ảnh minh chứng
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      // ================= API CALL =================

      const response = await franchiseServices.createDeliveryIssue(selectedReportOrderId, formData);

      if (response.success) {
        toast.success(response.message || 'Gửi báo cáo sự cố thành công!');
        
        // ================= RESET STATE =================
        
        setOpenReportDialog(false);
        setReportReason('DAMAGED');
        setReportNote('');
        setSelectedImages([]);
        setImagePreviews([]);
        setReportItems([]);
        setSelectedWrongProductIds([]);
        
        // Cập nhật lại danh sách đơn hàng
        await fetchData();
      } else {
        toast.error(response.message || 'Gửi báo cáo thất bại');
      }

    } catch (error) {
      console.error("Lỗi khi gửi báo cáo:", error);
      toast.error('Có lỗi xảy ra khi gửi báo cáo, vui lòng kiểm tra kết nối mạng');
    } finally {
      setIsReporting(false);
    }
  };

  // ================= UTILS =================

  const filteredOrders = useMemo(() => {
    let data = [...orders];
    if (statusFilter !== 'ALL') {
      data = data.filter((o) => normalizeOrderStatus(o.status) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          (o.deliveryDate || '').toLowerCase().includes(q)
      );
    }
    // Mới nhất lên trước để dễ theo dõi đơn vừa tạo
    return [...data].sort((a, b) => {
      const at = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const bt = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      if (bt !== at) return bt - at;
      return (b.orderId ?? 0) - (a.orderId ?? 0);
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => normalizeOrderStatus(o.status) === 'PENDING').length,
      inTransit: orders.filter((o) => normalizeOrderStatus(o.status) === 'IN_TRANSIT').length,
    };
  }, [orders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [page, totalPages]);

  // ================= RENDER =================

  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header Card (giống Supply — Kế hoạch phân phối) ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <LayoutGrid className="size-6 shrink-0 text-amber-500" />
              Quản lý đơn hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Đặt và theo dõi đơn hàng từ cửa hàng tới bếp trung tâm.
            </CardDescription>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:flex-nowrap md:gap-4">
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-4 py-2.5 shadow-sm md:px-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng đơn</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{stats.total}</span>
            </div>
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-xl border border-yellow-100 bg-white/70 px-4 py-2.5 shadow-sm md:px-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-600">Chờ duyệt</span>
              <span className="mt-0.5 text-2xl font-bold text-yellow-700">{stats.pending}</span>
            </div>
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-xl border border-emerald-100 bg-white/70 px-4 py-2.5 shadow-sm md:px-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Đang giao</span>
              <span className="mt-0.5 text-2xl font-bold text-emerald-700">{stats.inTransit}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar (giống Supply) ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
        <div className="relative min-w-0 flex-1 basis-[min(100%,18rem)]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, ngày giao hoặc ghi chú..."
            value={search}
            onChange={handleSearch}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        <div className="relative flex h-9 flex-none items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={statusFilter === 'ALL' ? '' : statusFilter}
            onChange={(e) => {
              const v = e.target.value;
              handleFilterChange(v === '' ? 'ALL' : (v as FilterStatus));
            }}
            className="max-w-[10rem] cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-amber-900 outline-none"
          >
            <option value="">Tất cả</option>
            {FILTER_OPTIONS.filter((o) => o !== 'ALL').map((opt) => (
              <option key={opt} value={opt}>
                {translateStatus(opt)}
              </option>
            ))}
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchData()}
          disabled={loading}
          className="h-9 flex-none gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Làm mới
        </Button>

        <div className="hidden min-h-[1px] flex-1 sm:block" />

        <div className="hidden h-6 w-px shrink-0 bg-amber-200 sm:block" />

        <Button
          asChild
          size="sm"
          className="h-9 flex-none gap-1.5 rounded-lg bg-amber-500 px-4 text-xs text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
        >
          <Link to="/franchise-store/create-order">
            <Plus className="size-3.5" />
            Tạo đơn hàng
          </Link>
        </Button>
      </div>

      {/* ── Bảng đơn ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-6">
          <Card className="overflow-hidden border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3 px-4">
                <CardTitle className="flex items-center justify-between text-sm font-bold text-amber-900">
                  <span className="flex items-center gap-2">
                    <Receipt className="size-4 text-amber-500" />
                    Danh sách đơn đặt hàng
                  </span>
                  <span className="text-[11px] font-normal text-amber-700/70">
                    {loading ? '…' : `${filteredOrders.length} đơn`}
                  </span>
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Theo dõi trạng thái duyệt và giao hàng.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-800 uppercase tracking-wide">
                        <th className="px-4 py-3 font-bold">Mã đơn</th>
                        <th className="px-4 py-3 font-bold">Ngày đặt</th>
                        <th className="px-4 py-3 font-bold text-center">Ngày giao</th>
                        <th className="px-4 py-3 font-bold text-center">Trạng thái</th>
                        <th className="px-4 py-3 font-bold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50/60">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <Loader2 className="mx-auto size-8 animate-spin text-amber-500" />
                            <p className="mt-3 text-sm font-medium text-amber-700">Đang tải đơn hàng...</p>
                          </td>
                        </tr>
                      ) : paginatedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex size-12 items-center justify-center rounded-full bg-amber-50">
                                <Package className="size-6 text-amber-200" />
                              </div>
                              <p className="text-sm font-medium text-stone-400">Không tìm thấy đơn đặt hàng nào.</p>
                              <p className="text-xs text-stone-300">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedOrders.map((o) => {
                          const normStatus = normalizeOrderStatus(o.status);
                          const isInTransit = normStatus === 'IN_TRANSIT';
                          return (
                            <tr
                              key={o.orderId}
                              className={cn(
                                'group cursor-pointer hover:bg-amber-50/50 transition-colors',
                                isInTransit && 'bg-blue-50/20 hover:bg-blue-50/40'
                              )}
                              onClick={() => handleOpenOrderDetail(o.orderId)}
                            >
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-stone-900">{o.orderCode}</p>
                                <p className="text-[10px] text-stone-400">#{o.orderId}</p>
                              </td>
                              <td className="px-4 py-3.5 text-stone-500">
                                {new Date(o.orderDate).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-4 py-3.5 text-center text-stone-700 font-medium">
                                {o.deliveryDate
                                  ? new Date(o.deliveryDate).toLocaleDateString('vi-VN')
                                  : <span className="text-stone-300">—</span>}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <StatusBadge status={normStatus} />
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>

                                  {/* Confirm receive — only IN_TRANSIT */}
                                  {isInTransit && (
                                    <button
                                      type="button"
                                      title="Xác nhận đã nhận hàng"
                                      onClick={() => {
                                        setSelectedReceiveOrderId(o.orderId);
                                        setOpenReceiveDialog(true);
                                      }}
                                      disabled={isReceiving}
                                      className="flex h-8 items-center gap-1.5 rounded-lg border border-green-500 bg-green-500 px-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-green-600 hover:border-green-600 disabled:opacity-50"
                                    >
                                      <Check className="size-3.5 stroke-[3]" />
                                      Đã nhận
                                    </button>
                                  )}

                                  

                                  {/* Report button — */}
                                  {(normStatus === 'DONE') && (
                                    <button
                                      type="button"
                                      title="Báo cáo sự cố"
                                      onClick={() => handleReportOrder(o.orderId)}
                                      className="flex h-8 items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-2.5 text-[11px] font-bold text-orange-600 shadow-sm transition hover:bg-orange-50 hover:border-orange-300"
                                    >
                                      <AlertTriangle className="size-3.5" />
                                      Báo sự cố
                                    </button>
                                  )}
                                  {/* Cancel — only PENDING */}
                                  <button
                                    type="button"
                                    title={o.status === 'PENDING' ? 'Huỷ đơn' : 'Không thể huỷ'}
                                    onClick={() => handleCancelOrder(o.orderId)}
                                    disabled={normStatus !== 'PENDING'}
                                    className={cn(
                                      'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition',
                                      normStatus === 'PENDING'
                                        ? 'border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-300'
                                        : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                                    )}
                                  >
                                    <XCircle className="size-3.5" />
                                    Huỷ
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!loading && filteredOrders.length > pageSize && (
                  <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50/20 px-4 py-3">
                    <p className="text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-700">
                        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredOrders.length)}
                      </span>{' '}
                      / {filteredOrders.length} đơn
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-40 transition"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                        if (p > totalPages) return null;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            className={cn(
                              'flex size-7 items-center justify-center rounded-lg border text-xs font-bold transition',
                              p === page
                                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                                : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                            )}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-40 transition"
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

      {/* ================= MODALS ================= */}

      {/* Modal xác nhận huỷ đơn hàng */}
      <Dialog open={openCancelDialog} onOpenChange={(open) => {
        setOpenCancelDialog(open);
        if (!open) { setCancelReason(''); setSelectedOrderId(null); }
      }}>
        <DialogContent className="w-[min(95vw,480px)] max-w-none overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                <XCircle className="size-5" />
                Xác nhận huỷ đơn hàng
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-xs text-red-100 font-medium">
              Hành động này không thể hoàn tác sau khi xác nhận.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-bold text-stone-700">
                Lí do huỷ đơn <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="reason"
                placeholder="Nhập lí do huỷ đơn hàng (ví dụ: Đặt nhầm số lượng, thay đổi kế hoạch...)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="flex w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenCancelDialog(false)}
              className="flex-1 text-xs font-bold border-stone-200 text-stone-600 hover:bg-stone-100"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim() || loading}
              className="flex-1 bg-red-500 text-xs font-bold text-white hover:bg-red-600 shadow-sm transition-all"
            >
              {loading ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Đang xử lý...</>
              ) : 'Xác nhận huỷ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận đã nhận hàng */}
      <Dialog
        open={openReceiveDialog}
        onOpenChange={(open) => {
          setOpenReceiveDialog(open);
          if (!open) setSelectedReceiveOrderId(null);
        }}
      >
        <DialogContent className="w-[min(95vw,440px)] max-w-none overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
                <Package className="size-7" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-white">
                  Xác nhận đã nhận hàng
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-green-100 font-medium leading-relaxed">
                Bạn có chắc chắn đã nhận đủ hàng cho đơn này không?
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-xl border border-green-100 bg-green-50/50 p-4 text-center">
              <p className="text-xs font-medium text-green-800 leading-relaxed">
                Sau khi xác nhận, trạng thái đơn hàng sẽ được chuyển sang{' '}
                <span className="font-bold">Đã nhận</span>. Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenReceiveDialog(false)}
              className="flex-1 text-xs font-bold border-stone-200 text-stone-600 hover:bg-stone-100"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReceive}
              disabled={!selectedReceiveOrderId || isReceiving}
              className="flex-1 bg-green-600 text-xs font-bold text-white hover:bg-green-700 shadow-sm transition-all"
            >
              {isReceiving ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Đang xử lý...</>
              ) : (
                <><Check className="mr-1.5 size-3.5 stroke-[3]" /> Xác nhận đã nhận</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết đơn hàng */}
      <Dialog
        open={openDetailDialog}
        onOpenChange={(open) => {
          setOpenDetailDialog(open);
          if (!open) setOrderDetail(null);
        }}
      >
        <DialogContent className="w-[min(95vw,680px)] max-w-none overflow-hidden rounded-2xl border border-amber-100 p-0 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-900">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Receipt className="size-4" />
                </div>
                Chi tiết đơn hàng
              </DialogTitle>
              {orderDetail && (
                <p className="text-xs text-stone-500 mt-0.5 ml-9">
                  Mã đơn: <span className="font-bold text-stone-700">{orderDetail.orderCode}</span>
                  {' · '}
                  <StatusBadge status={normalizeOrderStatus(orderDetail.status)} className="text-[10px] py-0" />
                </p>
              )}
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[60dvh] overflow-y-auto">
            {isLoadingDetail && (
              <div className="flex flex-col items-center justify-center gap-3 py-14">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Đang tải chi tiết đơn hàng...</span>
              </div>
            )}

            {!isLoadingDetail && orderDetail && (
              <>
                {/* Info grid — cùng layout 4 ô như cũ */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Ngày đặt', value: formatCalendarDayVi(orderDetail.orderDate) },
                    {
                      label: 'Ngày giao dự kiến',
                      value: orderDetail.deliveryDate ? formatCalendarDayVi(orderDetail.deliveryDate) : '—',
                    },
                    {
                      label: 'Cửa hàng',
                      value: (
                        <span>
                          <span className="block">{orderDetail.storeName || '—'}</span>
                          {orderDetail.storeCode ? (
                            <span className="mt-0.5 block text-[11px] font-normal text-stone-500">
                              Mã: {orderDetail.storeCode}
                            </span>
                          ) : null}
                        </span>
                      ),
                    },
                    { label: 'Số mặt hàng', value: `${orderDetail.details?.length ?? 0} món` },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{info.label}</p>
                      <div className="mt-1 text-sm font-bold text-stone-900">{info.value}</div>
                    </div>
                  ))}
                </div>

                {/* Trường bổ sung từ API (chỉ hiện khi có) */}
                {(orderDetail.updatedAt ||
                  orderDetail.approvedAt ||
                  orderDetail.approvedByUsername ||
                  orderDetail.note ||
                  orderDetail.cancelReason) && (
                  <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Thông tin thêm</p>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      {orderDetail.updatedAt ? (
                        <p>
                          <span className="text-stone-500">Cập nhật: </span>
                          <span className="font-semibold text-stone-800">{formatCalendarDayVi(orderDetail.updatedAt)}</span>
                        </p>
                      ) : null}
                      {orderDetail.approvedAt || orderDetail.approvedByUsername ? (
                        <p>
                          <span className="text-stone-500">Phê duyệt: </span>
                          <span className="font-semibold text-stone-800">
                            {orderDetail.approvedAt ? formatCalendarDayVi(orderDetail.approvedAt) : '—'}
                            {orderDetail.approvedByUsername ? ` · ${orderDetail.approvedByUsername}` : ''}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    {orderDetail.note ? (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-amber-700">Ghi chú đơn</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{orderDetail.note}</p>
                      </div>
                    ) : null}
                    {orderDetail.cancelReason ? (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-rose-700">Lý do hủy</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{orderDetail.cancelReason}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="mb-3 text-sm font-bold text-stone-800">Danh sách mặt hàng</p>
                  <div className="overflow-x-auto overflow-hidden rounded-xl border border-amber-100">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="bg-amber-50 text-left text-[11px] font-bold uppercase tracking-wide text-amber-800">
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Sản phẩm</th>
                          <th className="px-4 py-3 text-center">SL</th>
                          <th className="px-4 py-3">Đơn vị</th>
                          <th className="px-4 py-3 text-right">Đơn giá</th>
                          <th className="px-4 py-3 text-right">Thành tiền</th>
                          <th className="px-4 py-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {orderDetail.details?.map((d, idx) => (
                          <tr key={d.orderDetailId ?? `${d.productId}-${idx}`} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-4 py-3 text-xs text-stone-400 font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-stone-900">{d.productName}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-0.5 text-sm font-bold text-amber-800 min-w-[2rem]">
                                {d.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-500">{d.unitName ?? d.unit ?? '—'}</td>
                            <td className="px-4 py-3 text-right text-stone-700">
                              {d.unitPrice != null ? `${Number(d.unitPrice).toLocaleString('vi-VN')} ₫` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-amber-800">
                              {d.lineTotal != null ? `${Number(d.lineTotal).toLocaleString('vi-VN')} ₫` : '—'}
                            </td>
                            <td className="max-w-[120px] truncate px-4 py-3 text-xs text-stone-600" title={d.note}>
                              {d.note || '—'}
                            </td>
                          </tr>
                        ))}
                        {!orderDetail.details?.length && (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-400">
                              Đơn hàng chưa có mặt hàng chi tiết.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-amber-100 bg-amber-50/30 px-6 py-4 flex justify-end gap-2">
            {orderDetail && (normalizeOrderStatus(orderDetail.status) === 'IN_TRANSIT' || normalizeOrderStatus(orderDetail.status) === 'DONE') && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenDetailDialog(false);
                  handleReportOrder(orderDetail.orderId);
                }}
                className="h-9 border-orange-200 text-sm font-semibold text-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="mr-1.5 size-4" />
                Báo sự cố / Từ chối nhận
              </Button>
            )}
            {orderDetail && normalizeOrderStatus(orderDetail.status) === 'IN_TRANSIT' && (
              <Button
                type="button"
                onClick={() => {
                  setOpenDetailDialog(false);
                  setSelectedReceiveOrderId(orderDetail!.orderId);
                  setOpenReceiveDialog(true);
                }}
                className="h-9 bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
              >
                <Check className="mr-1.5 size-4 stroke-[3]" />
                Xác nhận đã nhận
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDetailDialog(false)}
              className="h-9 border-amber-200 px-5 text-sm font-semibold text-amber-900 hover:bg-amber-50"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal báo cáo đơn hàng */}
      <Dialog
        open={openReportDialog}
        onOpenChange={(open) => {
          setOpenReportDialog(open);
          if (!open) {
            setReportReason('DAMAGED');
            setReportNote('');
            setSelectedImages([]);
            setImagePreviews([]);
            setReportItems([]);
            setSelectedWrongProductIds([]);
            setIsFetchingReportData(false);
          }
        }}
      >
        <DialogContent className="min-w-[50vw] max-w-none overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                <AlertTriangle className="size-5" />
                Từ chối nhận hàng / Báo cáo sự cố
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-xs text-orange-100 font-medium">
              Vui lòng cung cấp chi tiết sự cố để chúng tôi hỗ trợ bạn tốt nhất.
            </p>
          </div>

          <div className="space-y-4 p-6 overflow-y-auto max-h-[70dvh]">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-stone-700">Lý do <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'DAMAGED', label: 'Hàng vỡ / hỏng' },
                  { key: 'MISSING_ITEMS', label: 'Thiếu hàng' },
                  { key: 'WRONG_ITEMS', label: 'Sai hàng' },
                  { key: "QUALITY_FAILED", label: "Chất lượng kém" },
                  { key: "LATE_DELIVERY", label: "Giao hàng muộn" },
                  { key: 'REFUSED_DELIVERY', label: 'Từ chối nhận' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all',
                      reportReason === item.key
                        ? 'border-orange-500 bg-orange-50 shadow-sm ring-1 ring-orange-500'
                        : 'border-stone-100 bg-stone-50/50 hover:bg-stone-50'
                    )}
                  >
                    <input
                      type="radio"
                      className="size-3.5 accent-orange-500"
                      name="reportReason"
                      value={item.key}
                      checked={reportReason === item.key}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span className={cn('text-[11px] font-bold', reportReason === item.key ? 'text-orange-900' : 'text-stone-600')}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Form Content */}
            {isFetchingReportData ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="size-6 animate-spin text-orange-500" />
                <span className="text-[11px] text-stone-500 line-clamp-1">Đang tải thông tin sản phẩm...</span>
              </div>
            ) : (
              <>
                {/* Product Select for WRONG_ITEMS */}
                {reportReason === 'WRONG_ITEMS' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-700">Chọn các sản phẩm bị sai</Label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {reportItems.map((item) => {
                        const isSelected = selectedWrongProductIds.includes(item.productId);
                        return (
                          <div
                            key={item.productId}
                            onClick={() => toggleWrongProduct(item.productId)}
                            className={cn(
                              'flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all',
                              isSelected
                                ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                : 'border-stone-100 bg-stone-50/30 hover:bg-stone-50 hover:border-stone-200'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex size-5 items-center justify-center rounded-sm border transition-colors",
                                isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 bg-white"
                              )}>
                                {isSelected && <Check className="size-3.5 stroke-[3]" />}
                              </div>
                              <div className="flex flex-col">
                                <span className={cn('text-[11px] font-bold', isSelected ? 'text-orange-900' : 'text-stone-700')}>{item.productName}</span>
                                <span className="text-[10px] text-stone-500">Đặt: {item.orderedQuantity} {item.unitName}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {reportItems.length === 0 && (
                        <p className="text-[11px] text-stone-400 text-center py-4">Không có sản phẩm nào để chọn.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Product List for other item-related issues */}
                {['DAMAGED', 'MISSING_ITEMS', 'QUALITY_FAILED'].includes(reportReason) && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-700">Thông tin hàng hóa thực tế</Label>
                    <div className="overflow-hidden rounded-xl border border-stone-100">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-stone-50 text-left text-stone-500 font-bold uppercase tracking-wider">
                            <th className="px-3 py-2">Sản phẩm</th>
                            <th className="px-3 py-2 text-center">Đặt</th>
                            <th className="px-3 py-2 text-center w-20">Nhận</th>
                            <th className="px-3 py-2 text-center">ĐVT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {reportItems.map((item) => (
                            <tr key={item.productId} className="bg-white">
                              <td className="px-3 py-2 font-medium text-stone-900 line-clamp-1">{item.productName}</td>
                              <td className="px-3 py-2 text-center text-stone-500">{item.orderedQuantity}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.orderedQuantity}
                                  value={item.actualQuantity}
                                  onChange={(e) => handleReportItemChange(item.productId, parseInt(e.target.value) || 0)}
                                  className="w-full h-7 rounded-md border border-stone-200 bg-stone-50/50 text-center font-bold text-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                />
                              </td>
                              <td className="px-3 py-2 text-center text-stone-400">{item.unitName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-stone-400 italic font-medium">
                      * Nhập số lượng thực nhận để hệ thống xác định mức độ hư hại/thiếu hụt.
                    </p>
                  </div>
                )}

                {/* Delivery Info for Late Delivery */}
                {reportReason === 'LATE_DELIVERY' && orderDetail && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 space-y-1">
                    <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <Package className="size-3.5" /> Thông tin giao hàng
                    </p>
                    <div className="grid grid-cols-2 text-[10px] text-blue-700 font-medium">
                      <span>Ngày giao dự kiến:</span>
                      <span className="text-right font-bold">{orderDetail.deliveryDate ? new Date(orderDetail.deliveryDate).toLocaleDateString('vi-VN') : '—'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-700">Mô tả chi tiết</Label>
                  <textarea
                    placeholder="Vui lòng mô tả cụ thể tình trạng (ví dụ: Thùng bị móp hỏng 2 chai nước tương...)"
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 resize-none font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-stone-700">Ảnh minh chứng <span className="text-stone-400 font-normal">(Bắt buộc để đối chứng)</span></Label>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative group size-16 rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                        <img src={url} alt="Evidence" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 size-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="size-2.5" />
                        </button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center size-16 rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 cursor-pointer hover:bg-stone-100 hover:border-orange-300 transition-colors">
                      <Upload className="size-4 text-stone-400" />
                      <span className="mt-1 text-[8px] text-stone-500 font-bold text-center px-1">Thêm ảnh</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenReportDialog(false)}
              className="flex-1 text-xs font-bold border-stone-200 text-stone-600 hover:bg-stone-100"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReport}
              disabled={isReporting}
              className="flex-1 bg-orange-600 text-xs font-bold text-white hover:bg-orange-700 shadow-sm transition-all"
            >
              {isReporting ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Đang xử lý...</>
              ) : (
                <><Check className="mr-1.5 size-3.5 stroke-[3]" /> Gửi báo cáo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTrackingPage;
