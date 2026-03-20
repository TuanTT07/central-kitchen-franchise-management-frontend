/**
 * File: OrderTrackingPage.tsx
 * Description: Trang theo dõi trạng thái đơn hàng và phiếu xuất kho của chi nhánh
 * Author: Tuan Tran, Dat Tran
 */

// ================= IMPORTS =================

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CalendarClock, ChevronLeft, ChevronRight, Eye, Receipt,
  Search, Truck, AlertTriangle, Loader2, XCircle, Check,
  PackageCheck, RefreshCw, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';
import StatusBadge from '@/components/ui/StatusBadge';
import { franchiseServices, type OrderResponse, type OrderDetailResponse, type ExportNotesResponse } from '@/services/franchiseServices';
import { toast } from 'sonner';

/**
 * Component Description
 * - Hiển thị danh sách đơn hàng đã đặt
 * - Theo dõi trạng thái duyệt đơn và trạng thái xuất kho
 * - Trạng thái hiển thị qua translateStatus() – không hardcode text.
 */

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'CONSOLIDATED', 'CANCELLED'] as const;
type FilterStatus = (typeof FILTER_OPTIONS)[number];

const normalizeOrderStatus = (status: unknown): string => {
  if (typeof status !== 'string' || !status.trim()) return '';
  return status.toUpperCase().replace(/[\s-]+/g, '_');
};

const OrderTrackingPage = () => {

  // ================= STATE =================

  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  const [exportData, setExportData] = useState<ExportNotesResponse | null>(null);
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
  const PAGE_SIZE = 10;
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderResponse<OrderDetailResponse[]> | null>(null);

  // ================= EFFECT =================

  useEffect(() => {
    fetchData();
  }, []);

  // ================= API =================

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, exportRes] = await Promise.all([
        franchiseServices.getOrders(),
        franchiseServices.getExportNote()
      ]);
      if (orderRes.success && orderRes.data) setOrders(orderRes.data.items);
      if (exportRes.success && exportRes.data) setExportData(exportRes.data);
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
        setOrderDetail(res.data);
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
    return data;
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount   = orders.filter((o) => normalizeOrderStatus(o.status) === 'PENDING').length;
  const approvedCount  = orders.filter((o) => normalizeOrderStatus(o.status) === 'APPROVED').length;
  const inTransitCount = orders.filter((o) => normalizeOrderStatus(o.status) === 'IN_TRANSIT').length;
  const cancelledCount = orders.filter((o) => normalizeOrderStatus(o.status) === 'CANCELLED').length;

  // ================= RENDER =================

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="size-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 className="size-7 animate-spin text-amber-500" />
            </div>
          </div>
          <p className="text-sm font-semibold text-amber-700">Đang tải dữ liệu đơn hàng...</p>
          <p className="text-xs text-stone-400">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-0">
      <Card className="border-amber-200/60 bg-white shadow-md overflow-hidden">
        {/* ─── Header ─── */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 shadow-sm text-white">
                <Truck className="size-4" />
              </div>
              Theo dõi đơn đặt hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80 ml-10">
              Theo dõi trạng thái đơn hàng và thông tin lô hàng của cửa hàng.
            </CardDescription>
          </div>

          {/* Stats Bar */}
          <div className="hidden items-center gap-5 md:flex">
            {[
              { label: 'Tổng đơn', value: orders.length, color: 'text-amber-900' },
              { label: 'Chờ duyệt', value: pendingCount, color: 'text-amber-700' },
              { label: 'Đang giao', value: inTransitCount, color: 'text-blue-700' },
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
              onClick={fetchData}
              title="Làm mới"
              className="ml-2 flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 shadow-sm hover:bg-amber-50 transition"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {/* ─── Search + Filter ─── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-amber-500" />
              <Input
                placeholder="Tìm theo mã đơn, ngày giao..."
                value={search}
                onChange={handleSearch}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs shadow-sm">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleFilterChange(opt)}
                    className={cn(
                      'cursor-pointer px-3 py-1.5 font-medium transition-all duration-150',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt
                        ? 'bg-amber-500 text-white font-bold'
                        : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : translateStatus(opt)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Main Grid: Table + Sidebar ─── */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* Orders Table */}
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2 overflow-hidden">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3 px-4">
                <CardTitle className="flex items-center justify-between text-sm font-bold text-amber-900">
                  <span className="flex items-center gap-2">
                    <Receipt className="size-4 text-amber-500" />
                    Danh sách đơn đặt hàng
                  </span>
                  <span className="text-[11px] font-normal text-amber-700/70">
                    {filteredOrders.length} đơn
                  </span>
                </CardTitle>
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
                      {paginatedOrders.length === 0 ? (
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
                                  {/* Eye button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenOrderDetail(o.orderId)}
                                    title="Xem chi tiết"
                                    className="flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 shadow-sm transition hover:bg-amber-500 hover:text-white hover:border-amber-500"
                                  >
                                    <Eye className="size-3.5" />
                                  </button>

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
                {filteredOrders.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50/20 px-4 py-3">
                    <p className="text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-700">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredOrders.length)}
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

            {/* ─── Sidebar ─── */}
            <div className="space-y-4">
              {/* Stats */}
              <Card className="border-amber-100 overflow-hidden shadow-sm">
                <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <CalendarClock className="size-4 text-amber-500" />
                    Thống kê đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 p-4">
                  {[
                    { label: 'Chờ duyệt', sub: translateStatus('PENDING'), count: pendingCount, icon: AlertTriangle, bg: 'bg-amber-500', border: 'border-amber-100', countColor: 'text-amber-900' },
                    { label: 'Đã duyệt', sub: translateStatus('APPROVED'), count: approvedCount, icon: Check, bg: 'bg-emerald-500', border: 'border-emerald-100', countColor: 'text-emerald-900' },
                    { label: 'Đang giao', sub: translateStatus('IN_TRANSIT'), count: inTransitCount, icon: Truck, bg: 'bg-blue-500', border: 'border-blue-100', countColor: 'text-blue-900' },
                    { label: 'Đã hủy', sub: translateStatus('CANCELLED'), count: cancelledCount, icon: XCircle, bg: 'bg-stone-400', border: 'border-stone-200', countColor: 'text-stone-700' },
                  ].map((s) => (
                    <div key={s.label} className={cn('flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-stone-50', s.border)}>
                      <div className="flex items-center gap-3">
                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm', s.bg)}>
                          <s.icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800">{s.label}</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-tight">{s.sub}</p>
                        </div>
                      </div>
                      <span className={cn('text-2xl font-black', s.countColor)}>{s.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Export Note Info */}
              <Card className="border-sky-100 overflow-hidden shadow-sm">
                <CardHeader className="border-b border-sky-50 bg-gradient-to-r from-sky-50/80 to-indigo-50/80 py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-sky-900">
                    <PackageCheck className="size-4 text-sky-500" />
                    Lô hàng mới nhất
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {exportData && exportData.items.length > 0 ? (
                    <div className="space-y-3">
                      {exportData.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-sky-50 bg-sky-50/30 p-3">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-stone-800 leading-tight">{item.productName}</span>
                            <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">{item.batchCode}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                            <span>{item.quantity} {item.unitName}</span>
                            <span>HSD: {item.expiryDate}</span>
                          </div>
                        </div>
                      ))}
                      {exportData.items.length > 3 && (
                        <p className="text-center text-[11px] text-sky-600 font-semibold cursor-pointer hover:underline">
                          +{exportData.items.length - 3} lô hàng khác...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <PackageCheck className="size-8 text-sky-100" />
                      <p className="text-xs text-stone-400 italic">Chưa có thông tin lô hàng được xuất.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
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
                <PackageCheck className="size-7" />
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
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Ngày đặt', value: new Date(orderDetail.orderDate).toLocaleDateString('vi-VN') },
                    { label: 'Ngày giao dự kiến', value: orderDetail.deliveryDate ? new Date(orderDetail.deliveryDate).toLocaleDateString('vi-VN') : '—' },
                    { label: 'Cửa hàng', value: orderDetail.storeName || '—' },
                    { label: 'Số mặt hàng', value: `${orderDetail.details?.length ?? 0} món` },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{info.label}</p>
                      <p className="mt-1 text-sm font-bold text-stone-900">{info.value}</p>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div>
                  <p className="mb-3 text-sm font-bold text-stone-800">Danh sách mặt hàng</p>
                  <div className="overflow-hidden rounded-xl border border-amber-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-amber-50 text-left text-[11px] font-bold uppercase tracking-wide text-amber-800">
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Sản phẩm</th>
                          <th className="px-4 py-3 text-center">SL</th>
                          <th className="px-4 py-3">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {orderDetail.details?.map((d, idx) => (
                          <tr key={d.orderDetailId} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-4 py-3 text-xs text-stone-400 font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-stone-900">{d.productName}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-0.5 text-sm font-bold text-amber-800 min-w-[2rem]">
                                {d.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-500">{d.unitName ?? d.unit ?? '—'}</td>
                          </tr>
                        ))}
                        {!orderDetail.details?.length && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-stone-400">
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
    </div>
  );
};

export default OrderTrackingPage;
