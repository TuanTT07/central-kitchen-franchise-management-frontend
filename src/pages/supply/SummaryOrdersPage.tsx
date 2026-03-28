/**
 * File: SummaryOrdersPage.tsx
 * Description: Trang tổng hợp đơn hàng từ các chi nhánh (Supply Coordination).
 *             Cho phép xem danh sách đơn hàng, thực hiện gom đơn tự động/thủ công
 *             và tạo lệnh sản xuất thực tế.
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORT =================
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Hand,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  ListChecks,
  Calendar,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { OrderDetailResponse, OrderResponse } from '@/services/franchiseServices';
import { normalizeOrderDetailLine, normalizeSupplyOrder } from '@/services/franchiseServices';
import type { ConsolidationProduct, ConsolidationResponse } from '@/services/supplyServices';
import { supplyServices } from '@/services/supplyServices';
import { managerServices, type ProductsResponse } from '@/services/managerServices';
import { normalizeStatusKey, translateStatus } from '@/utils/labelMapping';
import { toast } from 'sonner';

function formatOrderDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapOrdersFromApi(items: OrderResponse<OrderDetailResponse[]>[]): OrderResponse<OrderDetailResponse[]>[] {
  return items.map((o) => {
    const n = normalizeSupplyOrder(o);
    const det = n.details;
    const detailsNorm = Array.isArray(det) ? det.map(normalizeOrderDetailLine) : det;
    return { ...n, details: detailsNorm };
  });
}

// ================= COMPONENT =================
function SummaryOrdersPage() {
  // ================= STATE =================
  // Danh sách đơn hàng từ API (đã được phân trang)
  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  // Danh sách đơn hàng dùng cho modal gom thủ công (load all APPROVED)
  const [manualOrders, setManualOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  const [isLoadingManualOrders, setIsLoadingManualOrders] = useState(false);

  // Tìm kiếm và lọc
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Phân trang Server-side
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  // Chi tiết đơn hàng (UI)
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse<OrderDetailResponse[]> | null>(null);

  // Gom đơn
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consolidationResult, setConsolidationResult] = useState<ConsolidationResponse | null>(null);
  const [editedProducts, setEditedProducts] = useState<ConsolidationProduct[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  // Sản xuất thủ công
  const [isManualProductionOpen, setIsManualProductionOpen] = useState(false);
  const [productList, setProductList] = useState<ProductsResponse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [manualQty, setManualQty] = useState<number>(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmittingProduction, setIsSubmittingProduction] = useState(false);

  // Trạng thái xử lý
  const [isFinalizing, setIsFinalizing] = useState(false);

  // ================= EFFECT =================

  // Gọi lại API khi chuyển trang hoặc thay đổi bộ lọc
  useEffect(() => {
    getAllOrders();
  }, [page, statusFilter]);

  // Xử lý tìm kiếm với delay (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Khi tìm kiếm thì reset về trang 0
      if (page !== 0) {
        setPage(0);
      } else {
        getAllOrders();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ================= API =================

  /**
   * Gọi API lấy danh sách đơn hàng đã phân trang từ Server
   */
  const getAllOrders = async () => {
    try {
      const response = await supplyServices.getAllOrders(page, PAGE_SIZE, search, statusFilter);
      if (response.success && response.data) {
        const raw = Array.isArray(response.data.items) ? response.data.items : [];
        setOrders(mapOrdersFromApi(raw));
        setTotalPages(response.data.totalPages ?? 1);
        setTotalElements(response.data.totalElements ?? 0);
      } else {
        setOrders([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
    }
  };

  /**
   * Load toàn bộ đơn hàng APPROVED cho modal gom thủ công (tránh phụ thuộc vào trang hiện tại).
   */
  const loadManualOrders = async () => {
    try {
      setIsLoadingManualOrders(true);
      const first = await supplyServices.getAllOrders(0, PAGE_SIZE, search, 'APPROVED');
      if (!first.success || !first.data) {
        setManualOrders([]);
        return;
      }

      const total = first.data.totalPages ?? 1;
      const firstItems = mapOrdersFromApi(Array.isArray(first.data.items) ? first.data.items : []);

      if (total <= 1) {
        setManualOrders(firstItems);
        return;
      }

      const rest = await Promise.all(
        Array.from({ length: total - 1 }, (_, i) => supplyServices.getAllOrders(i + 1, PAGE_SIZE, search, 'APPROVED'))
      );
      const restItems = rest.flatMap((res) =>
        res?.success && res.data && Array.isArray(res.data.items) ? mapOrdersFromApi(res.data.items) : []
      );

      // Dedup theo orderId để an toàn
      const map = new Map<number, OrderResponse<OrderDetailResponse[]> >();
      [...firstItems, ...restItems].forEach((o) => {
        if (o?.orderId != null && !map.has(o.orderId)) map.set(o.orderId, o);
      });
      setManualOrders(Array.from(map.values()));
    } catch {
      setManualOrders([]);
    } finally {
      setIsLoadingManualOrders(false);
    }
  };

  // ================= HANDLER =================

  /**
   * Nghiệp vụ: Gom đơn tự động (Auto Consolidate)
   * Gọi API để tự động gộp các đơn hàng đã APPROVED
   */
  async function autoConsolidate() {
    try {
      const response = await supplyServices.consolidateAuto();
      if (response.success) {
        setConsolidationResult(response.data);
        setEditedProducts(response.data.products);
        setIsModalOpen(true);
        getAllOrders();
      }
    } catch (error) {
      console.error('Gom đơn tự động thất bại:', error);
    }
  }

  /**
   * Cập nhật số lượng sản phẩm tổng hợp trong state editedProducts
   *
   * @param productId ID sản phẩm cần chỉnh sửa
   * @param newQuantity Số lượng mới
   */
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setEditedProducts((prev) => prev.map((p) => (p.productId === productId ? { ...p, quantity: newQuantity } : p)));
  };

  /**
   * Mở modal gom đơn thủ công
   */
  function manuConsolidate() {
    setSelectedOrderIds([]);
    setIsManualModalOpen(true);
    loadManualOrders();
  }

  /**
   * Xử lý chọn/bỏ chọn đơn hàng trong danh sách thủ công
   *
   * @param orderId ID của đơn hàng
   */
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  /**
   * Thực hiện gom đơn thủ công với các ID đã chọn
   */
  const handleManualConsolidate = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      const response = await supplyServices.consolidateManual(selectedOrderIds);
      if (response.success) {
        setConsolidationResult(response.data);
        setEditedProducts(response.data.products);
        setIsManualModalOpen(false);
        setIsModalOpen(true);
        getAllOrders();
      }
    } catch (error) {
      console.error('Gom đơn thủ công thất bại:', error);
    }
  };

  /**
   * Mở modal sản xuất thủ công và tải danh sách sản phẩm active
   */
  const openManualProductionModal = async () => {
    setSelectedProductId(null);
    setManualQty(1);
    setIsManualProductionOpen(true);
    try {
      setIsLoadingProducts(true);
      const response = await managerServices.getAllProducts();
      if (response.success && response.data) {
        // Lọc chỉ các sản phẩm ACTIVE
        const activeProducts = response.data.filter((p) => p.status === 'ACTIVE');
        setProductList(activeProducts);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  /**
   * Gửi yêu cầu tạo lệnh sản xuất thủ công
   */
  const handleSubmitManualProduction = async () => {
    if (!selectedProductId) {
      toast.warning('Vui lòng chọn một sản phẩm');
      return;
    }
    if (!manualQty || manualQty <= 0) {
      toast.warning('Số lượng phải lớn hơn 0');
      return;
    }
    try {
      setIsSubmittingProduction(true);
      const response = await supplyServices.createManuProduction({
        productId: selectedProductId,
        quantityPlanned: manualQty,
      });
      if (response.success) {
        toast.success('Tạo lệnh sản xuất thủ công thành công!');
        setIsManualProductionOpen(false);
      }
    } catch (error) {
      toast.error('Tạo lệnh sản xuất thủ công thất bại');
    } finally {
      setIsSubmittingProduction(false);
    }
  };
  /**
   * Nghiệp vụ: Phê duyệt đơn hàng
   *
   * @param orderId ID của đơn hàng cần phê duyệt
   */
  const handleApprove = async (orderId: number) => {
    try {
      const response = await supplyServices.approveOrder(orderId);
      if (response.success) {
        toast.success('Phê duyệt đơn hàng thành công');
        getAllOrders();
      }
    } catch (error) {
      toast.error('Phê duyệt đơn hàng thất bại');
    }
  };

  /**
   * Nghiệp vụ: Hủy gom đơn
   *
   * @param orderIds ID của đơn hàng đã được gom
   */
  const handleCancelConsolidate = async (orderIds: number[]) => {
    try {
      const response = await supplyServices.cancelConsolidate(orderIds);
      if (response.success) {
        toast.success('Hủy gom đơn thành công');
        setDetailOpen(false);
        setIsModalOpen(false);
        getAllOrders();
      }
    } catch (error) {
      toast.error('Hủy gom đơn thất bại');
    }
  };

  /**
   * Nghiệp vụ: Tạo lệnh sản xuất (Finalize)
   * Chuyển đổi dữ liệu đã gom thành lệnh sản xuất thực tế tại bếp
   */
  const handleFinalize = async () => {
    const requestBody = {
      products: editedProducts.map((p) => ({
        productId: p.productId,
        quantityPlanned: p.quantity,
      })),
    };

    setIsFinalizing(true);
    try {
      const response = await supplyServices.createManufacturingOrder(requestBody);
      if (response.success) {
        toast.success('Tạo lệnh sản xuất thành công');
        setIsModalOpen(false);
        setConsolidationResult(null);
        setEditedProducts([]);
        getAllOrders();
      }
    } catch (error) {
      console.error('Thực hiện tạo lệnh sản xuất thất bại:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Tính toán thống kê từ danh sách orders hiện tại (Lưu ý: Chỉ là thống kê cho trang hiện tại nếu backend không trả về global stats)
  const stats = useMemo(() => {
    return {
      total: totalElements,
      pending: statusFilter === 'PENDING' ? totalElements : '—', // Nếu đang lọc Pending thì dùng totalElements
      totalProducts: orders.reduce(
        (acc: number, curr: OrderResponse<OrderDetailResponse[]>) =>
          acc + curr.details.reduce((sum: number, item: OrderDetailResponse) => sum + item.quantity, 0),
        0
      ),
    };
  }, [totalElements, orders, statusFilter]);

  // Các đơn hàng hiện tại hiển thị trên trang
  const paginatedOrders = orders;

  const openDetail = (order: OrderResponse<OrderDetailResponse[]>) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  // ================= UTILS =================

  /**
   * Component con hiển thị Badge trạng thái với màu sắc tương ứng
   *
   * @param status Chuỗi trạng thái từ API (PENDING, APPROVED, CONSOLIDATED, CANCELLED)
   */
  function OrderStatusBadge({ status }: { status: string | undefined }) {
    if (!status)
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          Chưa có trạng thái
        </span>
      );

    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            {translateStatus(status)}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            {translateStatus(status)}
          </span>
        );
      case 'AWAITING_DELIVERY':
        return (
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
            {translateStatus(status)}
          </span>
        );
      case 'CONSOLIDATED':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {translateStatus(status)}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            {translateStatus(status)}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {translateStatus(status)}
          </span>
        );
    }
  }

  // ================= RENDER =================
  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header Card ── */}
      <Card className="border-amber-200/60 bg-white shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Tổng hợp đơn Supply
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Danh sách các đơn hàng từ chi nhánh gửi về bếp trung tâm.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng đơn</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{stats.total}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-yellow-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-600">Chờ xử lý</span>
              <span className="mt-0.5 text-2xl font-bold text-yellow-700">{stats.pending}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-orange-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">Tổng SP</span>
              <span className="mt-0.5 text-2xl font-bold text-orange-700">{stats.totalProducts}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
        {/* Search */}
        <div className="relative w-72 flex-none">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, sản phẩm hoặc chi nhánh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        {/* Advanced Filter – Status Select */}
        <div className="relative flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-amber-900 outline-none"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">{translateStatus('PENDING')}</option>
            <option value="APPROVED">{translateStatus('APPROVED')}</option>
            <option value="AWAITING_DELIVERY">Đợi giao hàng</option>
            <option value="CONSOLIDATED">{translateStatus('CONSOLIDATED')}</option>
            <option value="CANCELLED">{translateStatus('CANCELLED')}</option>
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={getAllOrders}
          className="h-9 shrink-0 gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-6 w-px shrink-0 bg-amber-200" />

        {/* Action buttons */}
        <Button
          size="sm"
          className="h-9 shrink-0 gap-1.5 rounded-lg bg-amber-500 px-4 text-xs text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95 hover:cursor-pointer"
          onClick={openManualProductionModal}
        >
          <Hand className="size-3.5" />
          Sản xuất thủ công
        </Button>
        <Button
          size="sm"
          className="h-9 shrink-0 gap-1.5 rounded-lg bg-amber-500 px-4 text-xs text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95 hover:cursor-pointer"
          onClick={() => autoConsolidate()}
        >
          <Zap className="size-3.5" />
          Tổng hợp tự động
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 shrink-0 gap-1.5 rounded-lg border-amber-300 px-4 text-xs text-amber-800 transition-all hover:bg-amber-50 active:scale-95 hover:cursor-pointer"
          onClick={manuConsolidate}
        >
          <ListChecks className="size-3.5" />
          Tổng hợp thủ công
        </Button>
      </div>

      {/* ── Content ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Hiển thị <span className="font-semibold text-stone-700">{orders.length}</span> trên tổng số{' '}
              <span className="font-semibold text-amber-700">{totalElements}</span> đơn hàng
              {statusFilter !== 'ALL' && (
                <span className="ml-1">
                  — lọc theo{' '}
                  <span className="font-semibold text-amber-700">
                    {statusFilter === 'AWAITING_DELIVERY' ? 'Đợi giao hàng' : translateStatus(statusFilter)}
                  </span>
                </span>
              )}
            </p>
          </div>

          <div className="grid gap-5">
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Danh sách đơn hàng</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Dữ liệu thực tế từ hệ thống quản lý đơn hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã đơn</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold whitespace-nowrap">Ngày đặt</th>
                        <th className="px-4 py-2 font-semibold whitespace-nowrap">Giao dự kiến</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                        <th className="px-2 py-2 font-semibold text-center">SL</th>
                        <th className="px-4 py-2 font-semibold">Trạng thái</th>
                        <th className="px-2 py-2 font-semibold text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50/70">
                      {paginatedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-14 text-center">
                            <div className="flex flex-col items-center gap-2 text-stone-400">
                              <Package className="size-10 opacity-30" />
                              <p className="text-sm font-medium">Không có đơn hàng nào</p>
                              <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedOrders.map((o: OrderResponse<OrderDetailResponse[]>) => (
                          <tr
                            key={`${o.orderId}-${o.storeId}-${o.orderCode}`}
                            className="cursor-pointer transition-colors hover:bg-amber-50/60 group"
                            onClick={() => openDetail(o)}
                            title="Xem chi tiết đơn hàng"
                          >
                            <td className="px-4 py-3 font-mono text-[11px] font-semibold text-stone-700">
                              {o.orderCode}
                            </td>
                            <td className="px-4 py-3 text-stone-700">
                              <span className="font-medium">{o.storeName}</span>
                              {o.storeCode ? (
                                <span className="mt-0.5 block text-[10px] text-stone-400">{o.storeCode}</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-[11px] text-stone-600 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3 shrink-0 text-amber-500" />
                                {formatOrderDateTime(o.orderDate)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-stone-600 whitespace-nowrap">
                              {o.deliveryDate ? (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="size-3 shrink-0 text-sky-500" />
                                  {formatOrderDateTime(o.deliveryDate)}
                                </span>
                              ) : (
                                <span className="text-stone-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-stone-700">
                              {o.details?.[0]?.productName || 'N/A'}
                              {o.details?.length > 1 && (
                                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                  +{o.details.length - 1}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-3 text-center font-semibold text-stone-700">
                              {o.details?.reduce((acc: number, curr: OrderDetailResponse) => acc + curr.quantity, 0) ||
                                0}
                            </td>
                            <td className="px-4 py-3">
                              <OrderStatusBadge status={o.status} />
                            </td>
                            <td className="px-2 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {normalizeStatusKey(o.status) === 'PENDING' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(o.orderId);
                                    }}
                                    className="h-7 border-green-200 bg-green-50 px-3 text-[11px] text-green-700 hover:bg-green-100 hover:text-green-800"
                                  >
                                    Phê duyệt
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetail(o);
                                  }}
                                  className="h-7 border-amber-200 bg-amber-50 px-3 text-[11px] text-amber-700 hover:bg-amber-100"
                                >
                                  Chi tiết
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-amber-50 bg-amber-50/30 px-4 py-2.5 text-xs">
                  <span className="text-stone-500">
                    Trang <span className="font-bold text-stone-700">{page + 1}</span> /{' '}
                    <span className="font-bold text-stone-700">{totalPages}</span>
                    <span className="ml-2 text-stone-400">({totalElements} kết quả)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 border-amber-200 p-0 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 border-amber-200 p-0 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      {/* Dialog kết quả gom đơn & Chỉnh sửa số lượng */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <Package className="size-5 text-amber-500" />
              Xác nhận & Điều chỉnh số lượng
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Hệ thống đã gom thành công <strong>{consolidationResult?.totalOrders}</strong> đơn hàng. Bạn có thể điều
                chỉnh số lượng tổng hợp bên dưới trước khi xác nhận.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Danh sách sản phẩm tổng hợp:</p>
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                {editedProducts.map((p) => (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between rounded-lg border border-stone-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-900">{p.productName}</p>
                      <p className="text-[10px] text-stone-500">Tổng hợp từ {p.orderIds.length} đơn hàng</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-24">
                        <Input
                          type="number"
                          value={p.quantity}
                          onChange={(e) => handleQuantityChange(p.productId, Number(e.target.value))}
                          className="h-9 border-amber-200 bg-amber-50/20 text-right font-bold text-amber-700 focus:border-amber-400 focus:ring-amber-200"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-stone-400 uppercase">Đơn vị</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (consolidationResult?.orderIds) {
                  handleCancelConsolidate(consolidationResult.orderIds);
                } else {
                  setIsModalOpen(false);
                }
              }}
              className="rounded-full border-amber-200 px-6 text-stone-600 hover:bg-stone-50"
            >
              Hủy
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="rounded-full bg-amber-500 px-8 text-white hover:bg-amber-600 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isFinalizing ? 'Đang tạo...' : 'Tạo lệnh sản xuất'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Chọn đơn hàng tủ công */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setIsManualModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <Filter className="size-5 text-amber-500" />
              Chọn đơn hàng để tổng hợp
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Lưu ý: Chỉ các đơn hàng ở trạng thái <strong>Đã duyệt (APPROVED)</strong> mới có thể tham gia tổng hợp
                thủ công.
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                    <th className="px-4 py-2 font-semibold w-10">Chọn</th>
                    <th className="px-4 py-2 font-semibold">Mã đơn</th>
                    <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                    <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                    <th className="px-4 py-2 font-semibold text-center">SL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {(isLoadingManualOrders ? [] : manualOrders)
                    .filter((o) => normalizeStatusKey(o.status) === 'APPROVED')
                    .map((o) => (
                      <tr
                        key={`manual-${o.orderId}-${o.storeId}-${o.orderCode}`}
                        className={`hover:bg-amber-50/40 cursor-pointer ${selectedOrderIds.includes(o.orderId) ? 'bg-amber-50' : ''}`}
                        onClick={() => toggleOrderSelection(o.orderId)}
                      >
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(o.orderId)}
                            onChange={() => {}}
                            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-2 font-semibold text-stone-900">{o.orderCode}</td>
                        <td className="px-4 py-2 text-stone-800">{o.storeName}</td>
                        <td className="px-4 py-2 text-stone-800">{o.details?.[0]?.productName || 'N/A'}</td>
                        <td className="px-4 py-2 text-center text-stone-800">
                          {o.details?.reduce((acc, curr) => acc + curr.quantity, 0) || 0}
                        </td>
                      </tr>
                    ))}
                  {!isLoadingManualOrders &&
                    manualOrders.filter((o) => normalizeStatusKey(o.status) === 'APPROVED').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-stone-500">
                        Không có đơn hàng nào đã duyệt để tổng hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <p className="text-xs text-stone-500">
              Đã chọn: <strong>{selectedOrderIds.length}</strong> đơn hàng
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-full border-amber-200 px-6 text-stone-600 hover:bg-stone-50"
              >
                Đóng
              </Button>
              <Button
                onClick={handleManualConsolidate}
                disabled={selectedOrderIds.length === 0}
                className="rounded-full bg-amber-500 px-8 text-white hover:bg-amber-600 shadow-md disabled:opacity-50"
              >
                Tiến hành gom đơn
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Sản xuất thủ công ── */}
      <Dialog open={isManualProductionOpen} onOpenChange={setIsManualProductionOpen}>
        <DialogContent onClose={() => setIsManualProductionOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <Hand className="size-5 text-amber-500" />
              Sản xuất thủ công
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Thông báo hướng dẫn */}
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Chọn <strong>1 sản phẩm</strong> và nhập số lượng cần sản xuất. Lệnh sản xuất sẽ được tạo ngay lập tức.
              </p>
            </div>

            {/* Chọn sản phẩm */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Sản phẩm <span className="text-red-500">*</span>
              </label>
              {isLoadingProducts ? (
                <div className="flex h-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50/30">
                  <span className="text-xs text-stone-500">Đang tải danh sách sản phẩm...</span>
                </div>
              ) : (
                <select
                  value={selectedProductId ?? ''}
                  onChange={(e) => setSelectedProductId(Number(e.target.value) || null)}
                  className="h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 cursor-pointer"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {productList.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName} ({p.unitName})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Thông tin chi tiết sản phẩm đã chọn */}
            {selectedProductId &&
              (() => {
                const selected = productList.find((p) => p.productId === selectedProductId);
                if (!selected) return null;
                return (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                    {/* Ảnh sản phẩm */}
                    {selected.imageUrl ? (
                      <img
                        src={selected.imageUrl}
                        alt={selected.productName}
                        className="h-16 w-16 shrink-0 rounded-lg border border-amber-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-100 text-amber-300">
                        <Package className="size-7" />
                      </div>
                    )}

                    {/* Thông tin */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">{selected.productName}</p>
                      {selected.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2">{selected.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5 text-[11px] text-stone-500">
                        <span>
                          Danh mục: <strong className="text-stone-700">{selected.categoryName}</strong>
                        </span>
                        <span>
                          Đơn vị: <strong className="text-amber-700">{selected.unitName}</strong>
                        </span>
                        <span>
                          Giá: <strong className="text-green-700">{selected.price.toLocaleString('vi-VN')} ₫</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Nhập số lượng */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Số lượng sản xuất <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={manualQty}
                onChange={(e) => setManualQty(Number(e.target.value))}
                placeholder="Nhập số lượng..."
                className="h-10 border-amber-200 bg-amber-50/20 font-semibold text-amber-800 focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManualProductionOpen(false)}
              className="rounded-full border-amber-200 px-6 text-stone-600 hover:bg-stone-50"
              disabled={isSubmittingProduction}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitManualProduction}
              disabled={isSubmittingProduction || !selectedProductId}
              className="rounded-full bg-amber-500 px-8 text-white hover:bg-amber-600 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmittingProduction ? 'Đang tạo...' : 'Xác nhận tạo lệnh'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chi tiết đơn hàng (UI only) */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <h3 className="text-base font-bold text-amber-900">Chi tiết đơn hàng</h3>
          </div>
          <div className="space-y-4 px-6 py-5">
            {!selectedOrder ? (
              <p className="text-sm text-stone-500">Đang tải...</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Mã đơn</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedOrder.orderCode}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Trạng thái</p>
                    <p className="mt-1 font-bold text-stone-900">{translateStatus(selectedOrder.status)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-semibold text-stone-500">Chi nhánh</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedOrder.storeName}</p>
                    {selectedOrder.storeCode ? (
                      <p className="mt-0.5 text-[11px] text-stone-500">Mã CN: {selectedOrder.storeCode}</p>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Ngày đặt</p>
                    <p className="mt-1 font-bold text-stone-900">{formatOrderDateTime(selectedOrder.orderDate)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Ngày giao dự kiến</p>
                    <p className="mt-1 font-bold text-stone-900">
                      {selectedOrder.deliveryDate ? formatOrderDateTime(selectedOrder.deliveryDate) : '—'}
                    </p>
                  </div>
                  {selectedOrder.updatedAt ? (
                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
                      <p className="text-[11px] font-semibold text-stone-500">Cập nhật lần cuối</p>
                      <p className="mt-1 font-bold text-stone-900">{formatOrderDateTime(selectedOrder.updatedAt)}</p>
                    </div>
                  ) : null}
                  {selectedOrder.approvedAt || selectedOrder.approvedByUsername ? (
                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
                      <p className="text-[11px] font-semibold text-stone-500">Phê duyệt</p>
                      <p className="mt-1 font-bold text-stone-900">
                        {selectedOrder.approvedAt ? formatOrderDateTime(selectedOrder.approvedAt) : '—'}
                        {selectedOrder.approvedByUsername ? (
                          <span className="mt-0.5 block text-[11px] font-medium text-stone-600">
                            Bởi: {selectedOrder.approvedByUsername}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  ) : null}
                  {selectedOrder.note ? (
                    <div className="rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3 sm:col-span-2">
                      <p className="text-[11px] font-semibold text-amber-800">Ghi chú đơn</p>
                      <p className="mt-1 text-sm text-stone-800 whitespace-pre-wrap">{selectedOrder.note}</p>
                    </div>
                  ) : null}
                  {selectedOrder.cancelReason ? (
                    <div className="rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-3 sm:col-span-2">
                      <p className="text-[11px] font-semibold text-rose-700">Lý do hủy</p>
                      <p className="mt-1 text-sm text-stone-800 whitespace-pre-wrap">{selectedOrder.cancelReason}</p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700">Danh sách sản phẩm</p>
                  <div className="overflow-x-auto overflow-hidden rounded-xl border border-amber-100">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                          <th className="px-4 py-2 font-semibold">Đơn vị</th>
                          <th className="px-4 py-2 font-semibold text-right">Số lượng</th>
                          <th className="px-4 py-2 font-semibold text-right">Đơn giá</th>
                          <th className="px-4 py-2 font-semibold text-right">Thành tiền</th>
                          <th className="px-4 py-2 font-semibold">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {selectedOrder.details?.map((d, idx) => (
                          <tr key={`${selectedOrder.orderId}-${d.orderDetailId ?? `${d.productId}-${idx}`}`} className="bg-white">
                            <td className="px-4 py-2 font-semibold text-stone-900">{d.productName}</td>
                            <td className="px-4 py-2 text-stone-600">{d.unitName || d.unit || '—'}</td>
                            <td className="px-4 py-2 text-right font-bold text-stone-800">{d.quantity}</td>
                            <td className="px-4 py-2 text-right text-stone-700">
                              {d.unitPrice != null ? `${Number(d.unitPrice).toLocaleString('vi-VN')} ₫` : '—'}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-amber-800">
                              {d.lineTotal != null ? `${Number(d.lineTotal).toLocaleString('vi-VN')} ₫` : '—'}
                            </td>
                            <td className="px-4 py-2 text-stone-600 max-w-[140px] truncate" title={d.note}>
                              {d.note || '—'}
                            </td>
                          </tr>
                        ))}
                        {!selectedOrder.details?.length && (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-xs text-stone-500">
                              Không có dòng chi tiết.
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
          <DialogFooter className="border-t border-stone-100 bg-stone-50 px-6 py-3">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-900 hover:bg-amber-50"
              onClick={() => setDetailOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SummaryOrdersPage;
