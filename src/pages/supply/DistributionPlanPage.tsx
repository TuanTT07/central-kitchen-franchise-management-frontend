/**
 * File: DistributionPlanPage.tsx
 * Description: Trang quản lý kế hoạch phân phối hàng hóa. 
 *              Hiển thị danh sách phiếu xuất kho và hỗ trợ tạo đợt phân phối mới.
 * Author: Tuan Tran
 * Created: 2026-03-12
 */

// ================= IMPORTS =================

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, MapPin, Search, Loader2, Package, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, Filter, Plus } from 'lucide-react';
import {
  supplyServices,
  type ExportNotesResponse,
  type ExportNoteItem,
  type PreviewOrderResponse,
} from '@/services/supplyServices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { OrderResponse, OrderDetailResponse } from '@/services/franchiseServices';
import { translateStatus } from '@/utils/labelMapping';
import { toast } from 'sonner';

// ================= STATUS BADGE =================

function DistributionStatusBadge({ status }: { status: string }) {
  const label = translateStatus(status) || status;

  const colorMap: Record<string, string> = {
    READY:     'bg-amber-100 text-amber-800',
    SHIPPING:  'bg-sky-100 text-sky-800',
    SHIPPED:   'bg-emerald-100 text-emerald-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCEL:    'bg-red-100 text-red-700',
    CANCELLED: 'bg-red-100 text-red-700',
    IN_TRANSIT:'bg-blue-100 text-blue-800',
  };

  const cls = colorMap[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/**
 * DistributionPlanPage Component
 * - Quản lý danh sách phiếu xuất kho
 * - Tích hợp phân trang server-side
 * - Preview lô thực từ các đơn hàng sẵn sàng
 */
const DistributionPlanPage = () => {

  // ================= STATE =================

  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Trạng thái modal và dữ liệu tạo đợt mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [readyOrders, setReadyOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  // UI Preview: dữ liệu thực tế từ API preview
  const [previewData, setPreviewData] = useState<PreviewOrderResponse[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // UI Detail: mở chi tiết phiếu xuất
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExportNote, setSelectedExportNote] = useState<ExportNotesResponse | null>(null);

  // Phân trang (client-side sau khi lọc/sắp xếp)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Loading states
  const [loading, setLoading] = useState(false);
  const [isFetchingReady, setIsFetchingReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ================= EFFECT =================

  // Gọi API khi load trang
  useEffect(() => {
    getExportNotes();
  }, []);

  // ================= API =================

  /**
   * Lấy danh sách phiếu xuất kho
   */
  const getExportNotes = async () => {
    try {
      setLoading(true);
      // Tải toàn bộ phiếu xuất để lọc/sắp xếp đúng trên toàn bộ dữ liệu
      const firstResponse = await supplyServices.getAllExportNote(0, PAGE_SIZE);
      if (firstResponse.data.success) {
        const firstPage = firstResponse.data.data.items ?? [];
        const lastPage = firstResponse.data.data.totalPages || 1;

        if (lastPage <= 1) {
          setExportNotes(firstPage);
        } else {
          const restPages = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, i) => supplyServices.getAllExportNote(i + 1, PAGE_SIZE))
          );
          const restItems = restPages.flatMap((res) => (res.data.success ? res.data.data.items ?? [] : []));
          setExportNotes([...firstPage, ...restItems]);
        }
      }
    } catch (error) {
      toast.error('Không thể tải danh sách phiếu xuất kho');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy danh sách đơn hàng sẵn sàng để phân phối
   */
  const fetchReadyOrders = async () => {
    try {
      setIsFetchingReady(true);
      const response = await supplyServices.getStoreOrderReadyForManufacturing();
      if (response.success) {
        setReadyOrders(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng sẵn sàng');
    } finally {
      setIsFetchingReady(false);
    }
  };

  /**
   * Xem trước kế hoạch xuất kho (phân bổ lô hàng) cho các đơn đã chọn
   */
  const fetchPreviewData = async (ids: number[]) => {
    if (ids.length === 0) {
      setPreviewData([]);
      return;
    }
    try {
      setIsPreviewing(true);
      const response = await supplyServices.previewExportNote(ids);
      if (response.success) {
        setPreviewData(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin xem trước lô hàng');
    } finally {
      setIsPreviewing(false);
    }
  };

  /**
   * Thực hiện tạo phiếu xuất kho từ các đơn hàng đã chọn
   */
  const handleCreateExportNote = async () => {
    if (selectedOrderIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một đơn hàng');
      return;
    }

    try {
      setIsCreating(true);
      const response = await supplyServices.createExportNote(selectedOrderIds);
      if (response.success) {
        toast.success('Tạo đợt phân phối thành công');
        setIsCreateModalOpen(false);
        setSelectedOrderIds([]);
        // Đưa về trang đầu để thấy đợt mới và tải lại toàn bộ danh sách
        setPage(0);
        getExportNotes();
      }
    } catch (error) {
      toast.error('Tạo đợt phân phối thất bại');
    } finally {
      setIsCreating(false);
    }
  };

  // ================= HANDLER =================

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    fetchReadyOrders();
    setPreviewData([]);
  };

  const handleToggleOrder = (orderId: number) => {
    setSelectedOrderIds((prev) => {
      const next = prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId];
      // Gọi preview ngay khi thay đổi lựa chọn
      fetchPreviewData(next);
      return next;
    });
  };

  /**
   * Mở chi tiết phiếu xuất kho
   */
  const openExportDetail = (note: ExportNotesResponse) => {
    setSelectedExportNote(note);
    setDetailOpen(true);
  };

  // ================= UTILS =================

  const filteredPlans = useMemo(() => {
    let filtered = [...exportNotes];

    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (p: ExportNotesResponse) =>
          p.exportCode.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q) ||
          p.items.some((item: ExportNoteItem) => item.productName.toLowerCase().includes(q))
      );
    }

    // Ưu tiên: READY lên trên cùng, sau đó sắp xếp theo exportId giảm dần (mới nhất trước)
    const STATUS_PRIORITY: Record<string, number> = { READY: 0, SHIPPING: 1, SHIPPED: 2, CANCEL: 3 };
    return filtered.sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 99;
      const pb = STATUS_PRIORITY[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.exportId - a.exportId;
    });
  }, [search, statusFilter, exportNotes]);

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / PAGE_SIZE));
  const paginatedPlans = filteredPlans.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  /**
   * Thống kê số lượng
   */
  const stats = useMemo(() => {
    return {
      total: exportNotes.length,
      ready: exportNotes.filter((p: ExportNotesResponse) => p.status === 'READY').length,
      shipped: exportNotes.filter((p: ExportNotesResponse) => p.status === 'SHIPPED').length,
    };
  }, [exportNotes]);

  /**
   * Nhóm theo chi nhánh
   */
  const storeGroups = useMemo(() => {
    const groups: Record<string, { storeName: string; count: number; totalQty: number; status: string }> = {};
    exportNotes.forEach((p: ExportNotesResponse) => {
      if (!groups[p.storeName]) {
        groups[p.storeName] = { storeName: p.storeName, count: 0, totalQty: 0, status: p.status };
      }
      groups[p.storeName].count += 1;
      groups[p.storeName].totalQty += p.items.reduce((sum: number, item: ExportNoteItem) => sum + item.quantity, 0);
    });
    return Object.values(groups);
  }, [exportNotes]);

  // ================= RENDER =================

  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header Card ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <LayoutGrid className="size-6 text-amber-500" />
              Kế hoạch phân phối
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Lập và theo dõi các đợt phân phối từ bếp trung tâm tới chi nhánh.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng đợt</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{stats.total}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-yellow-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-600">Sẵn sàng giao</span>
              <span className="mt-0.5 text-2xl font-bold text-yellow-700">{stats.ready}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Đã giao</span>
              <span className="mt-0.5 text-2xl font-bold text-emerald-700">{stats.shipped}</span>
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
            placeholder="Tìm theo mã đợt, chi nhánh hoặc sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex h-9 flex-none items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-amber-900 outline-none"
          >
            <option value="">Tất cả</option>
            <option value="READY">Sẵn sàng</option>
            <option value="SHIPPING">Đang giao</option>
            <option value="SHIPPED">Đã giao</option>
            <option value="CANCEL">Đã hủy</option>
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={getExportNotes}
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
          onClick={handleOpenCreateModal}
          className="h-9 flex-none gap-1.5 rounded-lg bg-amber-500 px-4 text-xs text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95"
        >
          <Plus className="size-3.5" />
          Tạo đợt phân phối
        </Button>
      </div>

      {/* ── Content ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Danh sách phiếu xuất kho</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Thông tin chi tiết các đợt hàng chuẩn bị xuất kho
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã phiếu</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                        <th className="px-2 py-2 font-semibold text-center">SL mặt hàng</th>
                        <th className="px-2 py-2 font-semibold text-right">Tổng SL</th>
                        <th className="px-4 py-2 font-semibold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center">
                            <Loader2 className="mx-auto size-6 animate-spin text-amber-500" />
                          </td>
                        </tr>
                      ) : (
                        paginatedPlans.map((p: ExportNotesResponse) => (
                          <tr
                            key={p.exportId}
                            className="cursor-pointer hover:bg-amber-50/40"
                            onClick={() => openExportDetail(p)}
                            title="Xem chi tiết đợt phân phối"
                          >
                            <td className="px-4 py-3 font-semibold text-stone-900">{p.exportCode}</td>
                            <td className="px-4 py-3 text-stone-800">{p.storeName}</td>
                            <td className="px-4 py-3 text-stone-600 italic">
                              {p.items.map((i: ExportNoteItem) => i.productName).join(', ')}
                            </td>
                            <td className="px-2 py-3 text-center text-stone-800 font-medium">{p.items.length}</td>
                            <td className="px-2 py-3 text-right text-stone-800 font-bold">
                              {p.items.reduce((sum: number, i: ExportNoteItem) => sum + i.quantity, 0)}
                            </td>
                            <td className="px-4 py-3">
                              <DistributionStatusBadge status={p.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {!loading && filteredPlans.length === 0 && (
                  <div className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <LayoutGrid className="size-10 opacity-30" />
                      <p className="text-sm font-medium">Không có đợt phân phối nào</p>
                      <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </div>
                )}

                {/* ================= PAGINATION ================= */}
                <div className="flex items-center justify-between border-t border-amber-50 px-4 py-3 text-xs">
                  <span className="text-stone-500">
                    Trang <span className="font-bold text-amber-900">{page + 1}</span> /{' '}
                    <span className="font-bold text-amber-900">{totalPages}</span>
                  </span>
                  <div className="flex gap-1">
                    {/* Nút Trang trước */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-amber-200 text-amber-900 hover:bg-amber-50 disabled:opacity-40"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || loading}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {/* Hiển thị các số trang */}
                    {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p)}
                        disabled={loading}
                        className={`h-8 w-8 border-amber-200 text-xs font-semibold ${
                          p === page
                            ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                            : 'text-amber-900 hover:bg-amber-50'
                        }`}
                      >
                        {p + 1}
                      </Button>
                    ))}

                    {/* Nút Trang sau */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-amber-200 text-amber-900 hover:bg-amber-50 disabled:opacity-40"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1 || loading}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Theo chi nhánh</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Phân bổ hàng hóa theo điểm đến
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {storeGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900">{group.storeName}</p>
                        <p className="text-[10px] text-stone-500 italic">
                          {group.count} đợt · {group.totalQty} sản phẩm
                        </p>
                      </div>
                    </div>
                    <DistributionStatusBadge status={group.status} />
                  </div>
                ))}
                {storeGroups.length === 0 && (
                  <div className="py-4 text-center text-[10px] text-stone-400">Không có dữ liệu chi nhánh.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {/* ================= MODAL: TẠO ĐỢT PHÂN PHỐI ================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b border-amber-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Package className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-amber-900">Tạo đợt phân phối mới</DialogTitle>
                <p className="text-xs text-amber-700/70">
                  Chọn các đơn hàng chi nhánh đã sẵn sàng để lập đợt phân phối hàng.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isFetchingReady ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3">
                <Loader2 className="size-8 animate-spin text-amber-500" />
                <p className="text-xs text-stone-500">Đang tải danh sách đơn hàng...</p>
              </div>
            ) : readyOrders.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <div className="rounded-full bg-stone-50 p-3">
                  <Package className="size-8 text-stone-300" />
                </div>
                <p className="text-sm font-medium text-stone-500">Không có đơn hàng nào sẵn sàng</p>
                <p className="text-xs text-stone-400">Tất cả đơn hàng đã được xử lý hoặc chưa được phê duyệt.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="rounded-xl border border-amber-100 overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-amber-50/60 text-amber-900 border-b border-amber-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-10 text-center">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            checked={readyOrders.length > 0 && selectedOrderIds.length === readyOrders.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds(readyOrders.map((o) => o.orderId));
                              } else {
                                setSelectedOrderIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 font-semibold">Mã đơn hàng</th>
                        <th className="px-4 py-3 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-3 font-semibold text-right">Tổng sản phẩm</th>
                        <th className="px-4 py-3 font-semibold text-right">Ngày đặt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50 bg-white">
                      {readyOrders.map((order: OrderResponse<OrderDetailResponse[]>) => (
                        <tr
                          key={order.orderId}
                          className={`hover:bg-amber-50/30 transition-colors cursor-pointer ${
                            selectedOrderIds.includes(order.orderId) ? 'bg-amber-50/50' : ''
                          }`}
                          onClick={() => handleToggleOrder(order.orderId)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                checked={selectedOrderIds.includes(order.orderId)}
                                onChange={() => handleToggleOrder(order.orderId)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-950">{order.orderCode}</td>
                          <td className="px-4 py-3 text-stone-700">{order.storeName}</td>
                          <td className="px-4 py-3 text-right font-medium text-stone-900">
                            {order.details.reduce((sum: number, d: OrderDetailResponse) => sum + d.quantity, 0)} sản
                            phẩm
                          </td>
                          <td className="px-4 py-3 text-right text-stone-500">
                            {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-amber-100 bg-white shadow-sm">
                  <div className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 px-4 py-3">
                    <p className="text-sm font-bold text-amber-900">Xem trước lô hàng</p>
                    <p className="text-[11px] text-amber-700/80">Các lô hàng cho đơn đã chọn.</p>
                  </div>
                  <div className="max-h-full overflow-y-auto p-4">
                    {isPreviewing ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="size-6 animate-spin text-amber-500" />
                        <p className="text-[10px] text-stone-500 font-medium italic">Đang tính toán phân bổ...</p>
                      </div>
                    ) : selectedOrderIds.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/40 px-4 py-8 text-center">
                        <Search className="size-8 text-amber-200 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-amber-900/40">Chưa chọn đơn hàng</p>
                        <p className="text-[10px] text-amber-700/30">
                          Chọn đơn hàng ở bảng bên trái để xem chi tiết lô hàng dự kiến.
                        </p>
                      </div>
                    ) : previewData.length === 0 ? (
                      <div className="text-xs text-stone-500 text-center py-6">Không có thông tin phân bổ lô hàng.</div>
                    ) : (
                      <div className="space-y-4">
                        {previewData.map((order) => (
                          <div
                            key={order.storeOrderId}
                            className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/20 p-3 shadow-sm hover:border-amber-200 transition-all"
                          >
                            <div className="flex items-center justify-between border-b border-amber-50 pb-2">
                              <span className="text-[11px] font-bold text-amber-900">{order.orderCode}</span>
                              <span className="text-[10px] text-stone-500 italic">{order.storeName}</span>
                            </div>

                            <div className="space-y-3 pt-1">
                              {order.products.map((prod) => (
                                <div key={prod.productId} className="space-y-2">
                                  <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-amber-50">
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-stone-900">{prod.productName}</span>
                                      <span
                                        className={`text-[10px] font-medium ${prod.shortfall > 0 ? 'text-red-500' : 'text-emerald-600'}`}
                                      >
                                        {prod.shortfall > 0 ? `Thiếu: ${prod.shortfall} ${prod.unit}` : 'Đủ hàng'}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] text-stone-400 block uppercase tracking-tighter">
                                        Yêu cầu / Có thể đáp ứng
                                      </span>
                                      <span className="text-[11px] font-black text-amber-700">
                                        {prod.requiredQuantity} / {prod.fulfillableQuantity}{' '}
                                        <span className="text-[9px] font-medium text-stone-400">{prod.unit}</span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-1.5 pl-2">
                                    {prod.batchAllocations.map((batch) => (
                                      <div
                                        key={batch.batchId}
                                        className="flex items-center justify-between rounded-md border border-stone-100 bg-white/40 px-3 py-1.5 transition hover:bg-white hover:shadow-sm"
                                      >
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-stone-800">
                                              {batch.batchCode}
                                            </span>
                                            <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1 rounded uppercase tracking-tighter">
                                              Lô
                                            </span>
                                          </div>
                                          <span className="text-[9px] text-stone-400 font-medium">
                                            HSD: {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[11px] font-bold text-stone-900">
                                            {batch.allocatedQuantity}
                                          </span>
                                          <span className="text-[9px] text-stone-400 ml-1 font-medium italic">
                                            được phân bổ
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    {prod.batchAllocations.length === 0 && (
                                      <p className="text-[10px] text-red-400 italic pl-2">
                                        Không có lô hàng khả dụng để đáp ứng.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-amber-100 pt-5 mt-auto">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-stone-500">
                Đã chọn: <span className="font-bold text-amber-600">{selectedOrderIds.length}</span> đơn hàng
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-amber-200 text-amber-800 hover:bg-amber-50"
                >
                  Hủy bỏ
                </Button>
                <Button
                  disabled={selectedOrderIds.length === 0 || isCreating}
                  onClick={handleCreateExportNote}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200/50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Tạo đợt mới'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: CHI TIẾT ĐỢT PHÂN PHỐI ================= */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedExportNote(null);
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <h3 className="text-base font-bold text-amber-900">Chi tiết đợt phân phối</h3>
            <p className="mt-1 text-xs text-amber-700/80">Xem chi tiết phiếu xuất kho và mặt hàng.</p>
          </div>
          <div className="space-y-4 px-6 py-5">
            {!selectedExportNote ? (
              <p className="text-sm text-stone-500">Đang tải...</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Mã phiếu</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedExportNote.exportCode}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Trạng thái</p>
                    <p className="mt-1 font-bold text-stone-900">{translateStatus(selectedExportNote.status)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-semibold text-stone-500">Chi nhánh</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedExportNote.storeName}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700">Danh sách mặt hàng</p>
                  <div className="overflow-hidden rounded-xl border border-amber-100">
                    <table className="w-full text-xs">
                      <thead className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                          <th className="px-4 py-2 font-semibold text-right">Số lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {selectedExportNote.items?.map((it, idx) => (
                          <tr key={`${it.productId ?? idx}-${idx}`} className="bg-white">
                            <td className="px-4 py-2 font-semibold text-stone-900">{it.productName}</td>
                            <td className="px-4 py-2 text-right font-bold text-stone-800">{it.quantity}</td>
                          </tr>
                        ))}
                        {!selectedExportNote.items?.length && (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-xs text-stone-500">
                              Không có mặt hàng.
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
};

export default DistributionPlanPage;
