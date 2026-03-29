/**
 * File: DeliverySchedulePage.tsx
 * Description: Quản lý và hiển thị lịch trình giao hàng từ bếp trung tâm
 * Author: Tuan Tran, Dat Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Truck,
  MapPin,
  Trash2,
  Edit,
  Calendar,
  User,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';
import {
  supplyServices,
  resolveDeliveryExportNotesForDisplay,
  getStoreNamesForDeliveryPlan,
  type DeliveryDetail,
  type DeliveryPlanResponse,
  type ExportNotesResponse,
} from '@/services/supplyServices';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { translateStatus } from '@/utils/labelMapping';

import { toast } from 'sonner';
import { useGlobalListPageSize } from '@/hooks/useGlobalListPageSize';

// ================= TYPES =================

interface DeliveryFormInput {
  driverName: string;
  vehiclePlate: string;
  scheduledDate: string;
}

/**
 * DeliverySchedulePage Component
 * - Hiển thị danh sách các chuyến giao hàng
 * - Cho phép theo dõi trạng thái và thông tin tài xế
 * - Hỗ trợ thao tác cập nhật và hủy đơn
 * - Chức năng Tạo lịch mới qua quy trình 2 bước
 */
const DeliverySchedulePage = () => {
  // ================= STATE =================

  const deliveryPageSize = useGlobalListPageSize();

  // Danh sách lịch giao hàng từ API
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlanResponse[]>([]);
  // lịch sử giao hàng chi tiết
  const [deliveryDetail, setDeliveryDetail] = useState<DeliveryDetail>();

  // Trạng thái loading khi gọi API danh sách
  const [loading, setLoading] = useState<boolean>(false);

  // Giá trị tìm kiếm trên trang chính
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // ---------------- Modal State ----------------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [readyNotes, setReadyNotes] = useState<ExportNotesResponse[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ---------------- Status Modal State ----------------
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedPlanForStatus, setSelectedPlanForStatus] = useState<DeliveryPlanResponse | null>(null);

  // ---------------- Detail Modal State ----------------
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // ---------------- Pagination State ----------------
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  /** Khi có bộ lọc trạng thái: toàn bộ chuyến đã tải để lọc + phân trang cục bộ */
  const [allTripsForFilter, setAllTripsForFilter] = useState<DeliveryPlanResponse[] | null>(null);
  const [statusFilterBulkNonce, setStatusFilterBulkNonce] = useState(0);

  // ================= FORM =================

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeliveryFormInput>();

  // ================= EFFECT =================

  // Phân trang server: chỉ khi không lọc theo trạng thái
  useEffect(() => {
    if (statusFilter) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await supplyServices.getDeliveryPlan(currentPage, deliveryPageSize);
        if (cancelled) return;
        if (response?.data && Array.isArray(response.data.items)) {
          setDeliveryPlans(response.data.items);
          setTotalPages(response.data.totalPages || 0);
          setTotalElements(response.data.totalElements || 0);
        } else {
          toast.error('Không thể lấy danh sách lịch giao hàng');
          setDeliveryPlans([]);
        }
      } catch {
        if (!cancelled) {
          toast.error('Không thể lấy danh sách lịch giao hàng');
          setDeliveryPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPage, statusFilter, deliveryPageSize]);

  useLayoutEffect(() => {
    setCurrentPage(0);
  }, [deliveryPageSize]);

  // Có bộ lọc trạng thái: tải hết chuyến rồi lọc + paginate cục bộ (tránh trang 1 API không có CANCELLED…)
  useEffect(() => {
    if (!statusFilter) {
      setAllTripsForFilter(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setAllTripsForFilter(null);
      setDeliveryPlans([]);
      try {
        const all = await supplyServices.getAllDeliveryPlans(50);
        if (!cancelled) setAllTripsForFilter(all);
      } catch {
        if (!cancelled) {
          toast.error('Không thể lấy danh sách lịch giao hàng');
          setAllTripsForFilter([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, statusFilterBulkNonce]);

  // Áp dụng lọc trạng thái + tìm kiếm + slice theo trang
  useEffect(() => {
    if (!statusFilter || allTripsForFilter === null) return;

    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = (plan: DeliveryPlanResponse) => {
      if (!q) return true;
      return (
        (plan?.deliveryCode?.toLowerCase() || '').includes(q) ||
        (plan?.driverName?.toLowerCase() || '').includes(q)
      );
    };

    const filtered = allTripsForFilter
      .filter((p) => p.status === statusFilter)
      .filter(matchesSearch);

    const totalP = Math.max(1, Math.ceil(filtered.length / deliveryPageSize) || 1);
    const maxIdx = totalP - 1;
    const safePage = Math.min(currentPage, maxIdx);

    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return;
    }

    setTotalElements(filtered.length);
    setTotalPages(totalP);
    const start = safePage * deliveryPageSize;
    setDeliveryPlans(filtered.slice(start, start + deliveryPageSize));
  }, [statusFilter, allTripsForFilter, currentPage, searchTerm, deliveryPageSize]);

  // Fetch phiếu xuất kho khi mở modal
  useEffect(() => {
    if (isModalOpen && step === 1) {
      fetchReadyNotes();
    }
  }, [isModalOpen, step]);

  // ================= API =================

  const fetchDeliveryPlansServer = async (page: number) => {
    try {
      setLoading(true);
      const response = await supplyServices.getDeliveryPlan(page, deliveryPageSize);
      if (response?.data && Array.isArray(response.data.items)) {
        setDeliveryPlans(response.data.items);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } else {
        toast.error('Không thể lấy danh sách lịch giao hàng');
        setDeliveryPlans([]);
      }
    } catch {
      toast.error('Không thể lấy danh sách lịch giao hàng');
      setDeliveryPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDeliveryList = () => {
    if (statusFilter) setStatusFilterBulkNonce((n) => n + 1);
    else void fetchDeliveryPlansServer(currentPage);
  };

  // Gọi API lấy lịch sử giao hàng chi tiết
  const getDeliveryDetail = async (id: number) => {
    try {
      const response = await supplyServices.getDeliveryPlanDetail(id);
      if (response.success) {
        setDeliveryDetail(response.data);
      } else {
        toast.error('Không thể lấy chi tiết lịch giao hàng');
      }
    } catch (error) {
      toast.error('Lỗi khi lấy chi tiết lịch giao hàng');
    }
  };

  // Gọi API lấy danh sách phiếu xuất kho sẵn sàng
  const fetchReadyNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const response = await supplyServices.getExportNoteReadyForDelivery();
      // Theo JSON mới: response.data là một mảng trực tiếp
      if (response && Array.isArray(response.data)) {
        setReadyNotes(response.data);
      } else {
        toast.error('Không thể lấy danh sách phiếu xuất kho');
        setReadyNotes([]);
      }
    } catch (error) {
      toast.error('Không thể lấy danh sách phiếu xuất kho');
      setReadyNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Gọi API tạo lịch giao hàng
  const onCreateDelivery = async (data: DeliveryFormInput) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        exportNoteIds: selectedNoteIds,
      };
      await supplyServices.createDeliveryPlan(payload);
      setIsModalOpen(false);
      resetModal();
      reloadFirstPage();
      toast.success('Tạo lịch giao hàng thành công');
    } catch (error) {
      toast.error('Không thể tạo lịch giao hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= HANDLER =================

  /**
   * Reload về trang 0. Nếu đang ở trang 0, gọi API trực tiếp vì
   * setCurrentPage(0) không trigger useEffect khi state không đổi.
   */
  const reloadFirstPage = () => {
    if (statusFilter) {
      setCurrentPage(0);
      setStatusFilterBulkNonce((n) => n + 1);
    } else if (currentPage !== 0) {
      setCurrentPage(0);
    } else {
      void fetchDeliveryPlansServer(0);
    }
  };

  // Reset trạng thái modal
  const resetModal = () => {
    setStep(1);
    setSelectedNoteIds([]);
    reset();
  };

  // Toggle chọn phiếu xuất kho
  const toggleSelectNote = (id: number) => {
    setSelectedNoteIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Xóa lịch giao hàng
  const handleDeleteUI = async (plan: DeliveryPlanResponse) => {
    try {
      await supplyServices.updateDeliveryStatusCancel(plan.deliveryId);
      toast.success('Xóa lịch giao hàng thành công');
      if (statusFilter) setStatusFilterBulkNonce((n) => n + 1);
      else void fetchDeliveryPlansServer(currentPage);
    } catch (error) {
      toast.error('Không thể xóa lịch giao hàng');
    }
  };

  const handleOpenDetail = async (plan: DeliveryPlanResponse) => {
    setIsDetailModalOpen(true);
    setDeliveryDetail(undefined);
    await getDeliveryDetail(plan.deliveryId);
  };

  // Xử lý khi nhấn nút Cập nhật
  const handleUpdate = (plan: DeliveryPlanResponse) => {
    if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
      toast.error('Chuyến hàng đã hoàn tất hoặc đã hủy, không thể cập nhật thêm.');
      return;
    }
    setSelectedPlanForStatus(plan);
    setIsStatusModalOpen(true);
  };

  // Xác nhận cập nhật trạng thái
  const handleUpdateStatusConfirm = async () => {
    if (!selectedPlanForStatus) return;

    try {
      setIsSubmitting(true);
      let response;
      if (selectedPlanForStatus.status === 'PLANNED') {
        response = await supplyServices.updateDeliveryStatusStart(selectedPlanForStatus.deliveryId);
      } else if (selectedPlanForStatus.status === 'IN_TRANSIT') {
        response = await supplyServices.updateDeliveryStatusComplete(selectedPlanForStatus.deliveryId);
      }

      setIsStatusModalOpen(false);
      setSelectedPlanForStatus(null);
      if (statusFilter) setStatusFilterBulkNonce((n) => n + 1);
      else void fetchDeliveryPlansServer(currentPage);
      toast.success(`${response?.message}`);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý thay đổi ô tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (currentPage !== 0) setCurrentPage(0);
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    if (currentPage !== 0) setCurrentPage(0);
  };

  // ================= UTILS =================

  // Render nhãn trạng thái với màu sắc tương ứng
  const renderStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PLANNED: 'bg-blue-50 text-blue-600 border-blue-100',
      IN_TRANSIT: 'bg-amber-50 text-amber-600 border-amber-100',
      COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    const statusLabels: Record<string, string> = {
      PLANNED: translateStatus('PLANNED') || 'Chờ giao',
      IN_TRANSIT: translateStatus('IN_TRANSIT') || 'Đang giao',
      COMPLETED: translateStatus('COMPLETED') || 'Hoàn tất',
      CANCELLED: translateStatus('CANCELLED') || 'Đã hủy',
    };

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyles[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  // Tìm kiếm trên trang hiện tại (server paginate). Khi có lọc trạng thái, tìm kiếm đã áp trong effect.
  const displayPlans = useMemo(() => {
    if (!Array.isArray(deliveryPlans)) return [];
    if (statusFilter) return deliveryPlans;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return deliveryPlans;
    return deliveryPlans.filter(
      (plan) =>
        (plan?.deliveryCode?.toLowerCase() || '').includes(q) ||
        (plan?.driverName?.toLowerCase() || '').includes(q)
    );
  }, [deliveryPlans, statusFilter, searchTerm]);

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completedCount = deliveryPlans.filter((p) => p.status === 'COMPLETED').length;
  const inTransitCount = deliveryPlans.filter((p) => p.status === 'IN_TRANSIT').length;

  const detailExportNotes = useMemo(
    () => (deliveryDetail ? resolveDeliveryExportNotesForDisplay(deliveryDetail) : []),
    [deliveryDetail]
  );

  // ================= RENDER =================

  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header Card ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Truck className="size-6 text-amber-500" />
              Lịch giao hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi và điều phối các chuyến hàng từ kho trung tâm tới chi nhánh.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng chuyến</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{totalElements || deliveryPlans.length}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-sky-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">Đang giao</span>
              <span className="mt-0.5 text-2xl font-bold text-sky-700">{inTransitCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Hoàn thành</span>
              <span className="mt-0.5 text-2xl font-bold text-emerald-700">{completedCount}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
        {/* Search */}
        <div className="relative w-72 flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <input
            type="text"
            placeholder="Tìm mã chuyến, tài xế..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex h-9 flex-none items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-amber-900 outline-none"
          >
            <option value="">Tất cả</option>
            <option value="PLANNED">{translateStatus('PLANNED')}</option>
            <option value="IN_TRANSIT">{translateStatus('IN_TRANSIT')}</option>
            <option value="COMPLETED">{translateStatus('COMPLETED')}</option>
            <option value="CANCELLED">{translateStatus('CANCELLED')}</option>
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshDeliveryList()}
          className="h-9 flex-none gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-6 w-px shrink-0 bg-amber-200" />

        {/* Action */}
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="h-9 flex-none gap-1.5 rounded-lg bg-amber-500 px-4 text-xs text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95"
        >
          <Plus className="size-3.5" />
          Tạo lịch mới
        </Button>
      </div>

      {/* ── Content ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-6">
          {/* Main Table */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm shadow-amber-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-50 bg-amber-50/30 text-[10px] font-black uppercase tracking-widest text-amber-900/60">
                    <th className="px-6 py-4">Mã chuyến</th>
                    <th className="px-6 py-4">Chi nhánh nhận</th>
                    <th className="px-6 py-4">Tài xế phụ trách</th>
                    <th className="px-6 py-4">Ngày dự kiến</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50/50">
                  {displayPlans.length > 0 ? (
                    displayPlans.map((plan) => {
                      const storeNames = getStoreNamesForDeliveryPlan(plan);
                      return (
                      <tr
                        key={plan.deliveryId}
                        className="group cursor-pointer hover:bg-amber-50/20 transition-all border-b border-amber-100"
                        onClick={() => handleOpenDetail(plan)}
                        title="Xem chi tiết lịch giao hàng"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[11px] border border-amber-100">
                            {plan.deliveryCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {storeNames.length > 0 ? (
                              storeNames.map((storeName, idx) => (
                                <div key={idx} className="flex items-center gap-2 font-semibold text-stone-800">
                                  <MapPin className="size-3 text-amber-500" />
                                  <span className="truncate max-w-[150px]">{storeName}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-stone-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 ring-2 ring-white">
                              <User className="size-4" />
                            </div>
                            <span className="text-xs font-bold text-stone-700">{plan.driverName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-stone-600 font-medium whitespace-nowrap">
                            <Calendar className="size-3.5 text-stone-400" />
                            {formatDate(plan.scheduledDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4">{renderStatusBadge(plan.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdate(plan);
                              }}
                              className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-colors hover:cursor-pointer"
                              title="Cập nhật"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUI(plan);
                              }}
                              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors hover:cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                          <Truck className="size-8 text-stone-300" />
                          <span className="text-xs font-medium text-stone-400 italic">
                            {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy chuyến giao hàng nào.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination UI */}
              <div className="flex items-center justify-between border-t border-amber-50 px-6 py-4 bg-amber-50/10">
                <div className="text-[11px] font-bold text-stone-500">
                  Trang <span className="text-amber-600">{currentPage + 1}</span> / {totalPages || 1}
                  {totalElements > 0 && (
                    <span className="ml-2 text-stone-400 font-normal">({totalElements} chuyến)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0 || loading}
                    className="h-8 w-8 p-0 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-30"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="h-8 w-8 p-0 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-30"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {/* MODAL TẠO LỊCH MỚI */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0 rounded-2xl border-none shadow-2xl">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Truck className="size-6" />
              Lên lịch giao hàng mới
            </h2>
            <p className="text-amber-50 text-xs mt-1 font-medium opacity-90">
              {step === 1 ? 'Bước 1: Chọn phiếu xuất kho cần giao' : 'Bước 2: Nhập thông tin chi tiết chuyến giao'}
            </p>

            {/* Step Indicator */}
            <div className="mt-6 flex items-center gap-3">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'} transition-all`} />
              <div className={`h-2 flex-1 rounded-full ${step === 2 ? 'bg-white' : 'bg-white/30'} transition-all`} />
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto bg-white/50 backdrop-blur-sm">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-stone-800 uppercase tracking-wide">
                    Danh sách phiếu xuất sẵn sàng ({readyNotes.length})
                  </Label>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    Đã chọn: {selectedNoteIds.length}
                  </span>
                </div>

                {isLoadingNotes ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
                    <Loader2 className="size-8 animate-spin text-amber-500" />
                    <span className="text-xs font-medium italic">Đang tải danh sách...</span>
                  </div>
                ) : readyNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {readyNotes.map((note) => (
                      <div
                        key={note.exportId}
                        onClick={() => toggleSelectNote(note.exportId)}
                        className={`group flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedNoteIds.includes(note.exportId)
                            ? 'bg-amber-50 border-amber-500 shadow-md shadow-amber-100'
                            : 'bg-white border-stone-100 hover:border-amber-200 hover:bg-stone-50/50'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex size-5 items-center justify-center rounded-full border transition-colors ${
                            selectedNoteIds.includes(note.exportId)
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-white border-stone-300 group-hover:border-amber-400'
                          }`}
                        >
                          {selectedNoteIds.includes(note.exportId) && <Check className="size-3 stroke-[4]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black text-amber-700">{note.exportCode}</p>
                            <span className="text-[9px] font-bold text-stone-400">{note.items?.length || 0} mục</span>
                          </div>
                          <p className="text-sm font-bold text-stone-800 mt-0.5">{note.storeName}</p>

                          {/* Preview sản phẩm bên trong */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.items?.slice(0, 3).map((item, id) => (
                              <span
                                key={id}
                                className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium"
                              >
                                {item.productName}
                              </span>
                            ))}
                            {(note.items?.length || 0) > 3 && (
                              <span className="text-[9px] text-stone-400 font-bold px-1 italic">
                                +{note.items.length - 3}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/30">
                    <Truck className="size-8 text-stone-200 mx-auto" />
                    <p className="text-xs font-bold text-stone-400 mt-2 italic">
                      Không có phiếu xuất kho nào sẵn sàng giao.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form id="delivery-form" onSubmit={handleSubmit(onCreateDelivery)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-700 ml-1">
                      Tên tài xế phụ trách <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/4 -translate-y-1/4 size-6 text-stone-400" />
                      <Input
                        {...register('driverName', { required: 'Vui lòng nhập tên tài xế' })}
                        placeholder="Nhập tên tài xế..."
                        className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl font-medium text-stone-800"
                        errorMessage={errors.driverName?.message}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-700 ml-1">
                      Biển số xe vận chuyển <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/4 -translate-y-1/4 size-6 text-stone-400" />
                      <Input
                        {...register('vehiclePlate', { required: 'Vui lòng nhập biển số xe' })}
                        placeholder="49A-XXXXX"
                        className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl font-medium text-stone-800"
                        errorMessage={errors.vehiclePlate?.message}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-700 ml-1">
                    Ngày dự kiến giao hàng <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/4 -translate-y-1/4 size-6 text-stone-400" />
                    <Input
                      type="datetime-local"
                      {...register('scheduledDate', {
                        required: 'Vui lòng chọn ngày giao hàng',
                        validate: (value) => {
                          const selectedDate = new Date(value);
                          const now = new Date();
                          return selectedDate > now || 'Ngày giao hàng phải lớn hơn ngày hiện tại';
                        },
                      })}
                      className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl font-medium text-stone-800"
                      errorMessage={errors.scheduledDate?.message}
                    />
                  </div>
                </div>

                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-[11px] font-bold text-orange-800 mb-2 uppercase tracking-wide">
                      Chi tiết chuyến giao:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(readyNotes.filter((n) => selectedNoteIds.includes(n.exportId)).map((n) => n.storeName))
                      ).map((storeName, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white border border-orange-200 rounded-full text-[10px] font-black text-orange-700 truncate max-w-[150px]"
                        >
                          {storeName}
                        </span>
                      ))}
                    </div>
                  </div>
              </form>
            )}
          </div>

          <DialogFooter className="p-6 bg-stone-50/80 border-t border-stone-100">
            <div className="flex w-full items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-500 font-bold text-xs"
              >
                Hủy bỏ
              </Button>

              <div className="flex gap-3">
                {step === 2 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-10 rounded-xl px-5 border-stone-300 font-bold text-xs text-stone-700 hover:bg-white"
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Quay lại
                  </Button>
                )}

                {step === 1 ? (
                  <Button
                    disabled={selectedNoteIds.length === 0}
                    onClick={() => setStep(2)}
                    className="h-10 rounded-xl px-6 bg-amber-500 font-black text-xs text-white hover:bg-amber-600 disabled:opacity-40 shadow-lg shadow-amber-200"
                  >
                    Tiếp theo
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form="delivery-form"
                    disabled={isSubmitting}
                    className="h-10 rounded-xl px-10 bg-gradient-to-r from-amber-500 to-orange-600 font-black text-sm text-white hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-amber-200 active:scale-95 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Xác nhận tạo lịch'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CHI TIẾT LỊCH GIAO HÀNG */}
      <Dialog
        open={isDetailModalOpen}
        onOpenChange={(open) => {
          setIsDetailModalOpen(open);
          if (!open) setDeliveryDetail(undefined);
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <h3 className="text-base font-bold text-amber-900">Chi tiết lịch giao hàng</h3>
            <p className="mt-1 text-xs text-amber-700/80">Chi tiết các chuyến giao và sản phẩm tương ứng.</p>
          </div>
          <div className="space-y-4 px-6 py-5 text-sm max-h-[70vh] overflow-y-auto">
            {!deliveryDetail ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="size-8 animate-spin text-amber-500" />
                <span className="text-xs font-medium text-stone-500 italic">Đang tải chi tiết lịch giao hàng...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Mã chuyến</p>
                    <p className="mt-1 font-bold text-stone-900">{deliveryDetail.deliveryCode}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Trạng thái</p>
                    <p className="mt-1 font-bold text-stone-900">{translateStatus(deliveryDetail.status)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Tài xế</p>
                    <p className="mt-1 font-bold text-stone-900">{deliveryDetail.driverName}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Biển số</p>
                    <p className="mt-1 font-bold text-stone-900">{deliveryDetail.vehiclePlate ?? '—'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-semibold text-stone-500">Ngày dự kiến</p>
                    <p className="mt-1 font-bold text-stone-900">{formatDate(deliveryDetail.scheduledDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700">Danh sách phiếu xuất</p>
                  <div className="space-y-3">
                    {detailExportNotes.length ? (
                      detailExportNotes.map((note) => (
                        <div
                          key={note.exportId}
                          className="rounded-xl border border-amber-100 bg-amber-50/20 overflow-hidden"
                        >
                          <div className="bg-amber-50/60 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-stone-900 flex items-center gap-2">
                                <MapPin className="size-4 text-amber-600" />
                                {note.storeName}
                              </p>
                              <p className="text-[11px] font-medium text-stone-500 mt-0.5 ml-6">
                                Phiếu xuất: <span className="font-semibold text-stone-700">{note.exportCode}</span>
                                {note.exportDate ? <> | {formatDate(note.exportDate)}</> : null}
                                {note.storeOrderCode ? (
                                  <>
                                    {' '}
                                    | Đơn CH: <span className="font-semibold text-stone-700">{note.storeOrderCode}</span>
                                  </>
                                ) : null}
                              </p>
                            </div>
                            {renderStatusBadge(note.status)}
                          </div>
                          
                          <div className="p-4 bg-white">
                            <p className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-3">Sản phẩm xuất kho</p>
                            {note.items && note.items.length > 0 ? (
                              <div className="overflow-x-auto rounded-lg border border-stone-100">
                                <table className="w-full text-left bg-white">
                                  <thead className="bg-stone-50 text-[10px] uppercase text-stone-500 border-b border-stone-100">
                                    <tr>
                                      <th className="px-3 py-2 font-bold">Mã Hàng</th>
                                      <th className="px-3 py-2 font-bold">Tên Sản Phẩm</th>
                                      <th className="px-3 py-2 font-bold">Số lượng</th>
                                      <th className="px-3 py-2 font-bold">Mã Lô</th>
                                      <th className="px-3 py-2 font-bold">HSD</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-50">
                                    {note.items.map((item, id) => (
                                      <tr key={id} className="text-xs hover:bg-stone-50/80 transition-colors">
                                        <td className="px-3 py-2 font-semibold text-stone-500">#{item.productId}</td>
                                        <td className="px-3 py-2 font-bold text-stone-800">{item.productName}</td>
                                        <td className="px-3 py-2">
                                          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                            {item.quantity} {item.unitName}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-stone-600 font-medium">{item.batchCode || '—'}</td>
                                        <td className="px-3 py-2 text-stone-600 font-medium">{item.expiryDate ? formatDate(item.expiryDate).split(' ')[0] : '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs italic text-stone-500">Không có dữ liệu sản phẩm.</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 border border-dashed border-stone-200 rounded-lg">
                        <span className="text-sm text-stone-400 italic">Không có phiếu xuất nào.</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="border-t border-stone-100 bg-stone-50 px-6 py-3">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-900 hover:bg-amber-50"
              onClick={() => setIsDetailModalOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL XÁC NHẬN CẬP NHẬT TRẠNG THÁI */}

      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0 rounded-2xl border-none shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              <Truck className="size-6" />
              Xác nhận cập nhật trạng thái
            </h2>
            <p className="text-blue-50 text-xs mt-1 font-medium opacity-90">
              Chuyến hàng: <span className="font-black text-white">{selectedPlanForStatus?.deliveryCode}</span>
            </p>
          </div>

          <div className="p-8 space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <span className="text-[10px] uppercase text-stone-400">Hiện tại</span>
                  {selectedPlanForStatus && renderStatusBadge(selectedPlanForStatus.status)}
                </div>
                <ChevronRight className="size-5 text-stone-300 mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase text-stone-400">Tiếp theo</span>
                  {selectedPlanForStatus?.status === 'PLANNED'
                    ? renderStatusBadge('IN_TRANSIT')
                    : renderStatusBadge('COMPLETED')}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 w-full text-left">
                <p className="text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wide">
                  Chi tiết chuyến hàng:
                </p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-stone-700">
                    Tài xế: <span className="font-bold">{selectedPlanForStatus?.driverName}</span>
                  </p>
                  <p className="text-xs font-medium text-stone-700">
                    Lộ trình:{' '}
                    <span className="font-bold">
                      {selectedPlanForStatus
                        ? getStoreNamesForDeliveryPlan(selectedPlanForStatus).join(', ') || '—'
                        : ''}
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-xs font-medium text-stone-600 leading-relaxed italic">
                Bạn có chắc chắn muốn chuyển trạng thái chuyến hàng này không? Hành động này sẽ được ghi lại vào lịch
                sử.
              </p>
            </div>
          </div>

          <DialogFooter className="p-4 bg-stone-50/80 border-t border-stone-100">
            <div className="flex w-full gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 text-stone-500 font-bold text-xs h-11"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleUpdateStatusConfirm}
                disabled={isSubmitting}
                className="flex-[2] h-11 rounded-xl bg-blue-600 font-black text-sm text-white hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận chuyển trạng thái'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-amber-200 p-1">
          <Truck className="size-3 text-amber-700" />
        </div>
        <p className="text-[10px] font-medium leading-relaxed text-amber-800/80">
          <span className="font-bold">Lưu ý:</span> Lịch giao hàng được đồng bộ tự động từ hệ thống điều phối vận tải.
          Các thay đổi về tài xế hoặc lộ trình cần được cập nhật trước khi chuyến hàng bắt đầu trạng thái "Đang giao".
        </p>
      </div>
    </div>
  );
};

export default DeliverySchedulePage;
