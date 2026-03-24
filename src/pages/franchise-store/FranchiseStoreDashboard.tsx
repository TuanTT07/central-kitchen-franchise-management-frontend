import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Package,
  Receipt,
  Truck,
  Loader2,
  FileText,
} from 'lucide-react';
import { FRANCHISEE_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';
import { franchiseServices, type OrderResponse } from '@/services/franchiseServices';
import { supplyServices, type ExportNotesResponse } from '@/services/supplyServices';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Dashboard Franchise Store: Chỉ dữ liệu từ API (orders, export-notes).
 * Trạng thái hiển thị qua translateStatus() – không hardcode text.
 */

const ORDER_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CONSOLIDATED: 'bg-sky-100 text-sky-800 border-sky-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
  AWAITING_DELIVERY: 'bg-sky-100 text-sky-800 border-sky-200',
};

const EXPORT_STATUS_CLASS: Record<string, string> = {
  READY: 'bg-sky-100 text-sky-800 border-sky-200',
  SHIPPING: 'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPED: 'bg-amber-500 text-white border-amber-600',
  IN_TRANSIT: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCEL: 'bg-stone-200 text-stone-600 border-stone-300',
};

const PAGE_SIZE_ORDERS = 5;
const PAGE_SIZE_EXPORTS = 5;

function parsePaginatedItems<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  const arr = (o.items ?? o.content) as T[] | undefined;
  return Array.isArray(arr) ? arr : [];
}

function parseTotalPages(data: unknown): number {
  if (!data || typeof data !== 'object') return 1;
  const value = Number((data as Record<string, unknown>).totalPages ?? 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

const FranchiseStoreDashboard = () => {
  const { user } = useAuth();
  const storeId = user?.storeId ?? user?.store_id ?? null;

  const [orders, setOrders] = useState<OrderResponse<unknown>[]>([]);
  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(0);
  const [exportPage, setExportPage] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageSize = 100;

      const firstOrdersRes = await franchiseServices.getOrders(0, pageSize);
      const firstOrdersPayload = firstOrdersRes?.data;
      const orderTotalPages = parseTotalPages(firstOrdersPayload);
      const firstOrders = parsePaginatedItems<OrderResponse<unknown>>(firstOrdersPayload);
      const remainingOrdersRes =
        orderTotalPages > 1
          ? await Promise.all(Array.from({ length: orderTotalPages - 1 }, (_, i) => franchiseServices.getOrders(i + 1, pageSize)))
          : [];
      const remainingOrders = remainingOrdersRes.flatMap((res) => parsePaginatedItems<OrderResponse<unknown>>(res?.data));
      setOrders([...firstOrders, ...remainingOrders]);

      const firstExportRes = await supplyServices.getAllExportNote(0, pageSize);
      const firstExportPayload = firstExportRes?.data?.data;
      const exportTotalPages = parseTotalPages(firstExportPayload);
      const firstExports = parsePaginatedItems<ExportNotesResponse>(firstExportPayload);
      const remainingExportRes =
        exportTotalPages > 1
          ? await Promise.all(Array.from({ length: exportTotalPages - 1 }, (_, i) => supplyServices.getAllExportNote(i + 1, pageSize)))
          : [];
      const remainingExports = remainingExportRes.flatMap((res) => parsePaginatedItems<ExportNotesResponse>(res?.data?.data));
      setExportNotes([...firstExports, ...remainingExports]);
    } catch {
      setError('Không tải được dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ordersOfStore = useMemo(() => {
    if (storeId != null) {
      return orders.filter((o) => (o as OrderResponse<unknown> & { storeId?: number }).storeId === storeId);
    }
    return orders;
  }, [orders, storeId]);

  const pendingCount = useMemo(
    () => ordersOfStore.filter((o) => o.status === 'PENDING').length,
    [ordersOfStore]
  );
  const approvedCount = useMemo(
    () => ordersOfStore.filter((o) => o.status === 'APPROVED' || o.status === 'CONSOLIDATED').length,
    [ordersOfStore]
  );
  const shippedCount = useMemo(() => {
    const orderIds = new Set(ordersOfStore.filter((o) => o.status === 'APPROVED' || o.status === 'CONSOLIDATED').map((o) => o.orderId));
    return exportNotes.filter((e) => orderIds.has(e.storeOrderId) && (e.status === 'SHIPPED' || e.status === 'COMPLETED' || e.status === 'IN_TRANSIT')).length;
  }, [ordersOfStore, exportNotes]);
  const totalOrders = ordersOfStore.length;

  const orderTotalPages = Math.max(1, Math.ceil(ordersOfStore.length / PAGE_SIZE_ORDERS));
  const paginatedOrders = ordersOfStore.slice(
    orderPage * PAGE_SIZE_ORDERS,
    (orderPage + 1) * PAGE_SIZE_ORDERS
  );
  const recentOrdersWithExport = useMemo(() => {
    return paginatedOrders.map((o) => {
      const exp = exportNotes.find((e) => e.storeOrderId === o.orderId);
      const details = (o as OrderResponse<unknown>).details;
      const itemCount = Array.isArray(details) ? details.length : 0;
      return {
        ...o,
        export_code: exp?.exportCode ?? '—',
        export_status: exp?.status ?? null,
        itemCount,
      };
    });
  }, [paginatedOrders, exportNotes]);

  const readyExports = useMemo(
    () => exportNotes.filter((e) => e.status === 'READY' || e.status === 'IN_TRANSIT'),
    [exportNotes]
  );
  const exportTotalPages = Math.max(1, Math.ceil(exportNotes.length / PAGE_SIZE_EXPORTS));
  const paginatedExports = exportNotes.slice(
    exportPage * PAGE_SIZE_EXPORTS,
    (exportPage + 1) * PAGE_SIZE_EXPORTS
  );

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <DashboardLayout navItems={FRANCHISEE_SIDEBAR_ITEMS} roleLabel={Role.FRANCHISE_STORE_STAFF}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={FRANCHISEE_SIDEBAR_ITEMS} roleLabel={Role.FRANCHISE_STORE_STAFF}>
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Cửa hàng phân phối
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Tổng quan đơn hàng và phiếu xuất của cửa hàng.
            </p>
          </header>

          {/* KPIs – toàn bộ từ API */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Đơn chờ duyệt
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {pendingCount}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Đơn trạng thái {translateStatus('PENDING')}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Đã giao / đang giao
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {shippedCount}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Phiếu xuất</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tổng đơn hàng
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {totalOrders}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Cửa hàng</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Phiếu chờ giao
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {readyExports.length}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Phiếu {translateStatus('READY')} / {translateStatus('IN_TRANSIT')}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-0 bg-white shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Đơn hàng gần đây
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  {ordersOfStore.length} đơn · trang {orderPage + 1}/{orderTotalPages}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link to="/franchise-store/create-order">
                  <ShoppingCart className="mr-2 size-4" />
                  Tạo đơn mới
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-600">
                      <th className="px-4 py-3 font-semibold">Mã đơn</th>
                      <th className="px-3 py-3 font-semibold">Ngày đặt</th>
                      <th className="px-3 py-3 font-semibold text-center">Ngày giao</th>
                      <th className="px-3 py-3 font-semibold text-center">Số mặt hàng</th>
                      <th className="px-3 py-3 font-semibold text-right">Trạng thái đơn</th>
                      <th className="px-4 py-3 font-semibold text-right">Phiếu xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrdersWithExport.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                          Chưa có đơn nào. Tạo đơn mới từ menu bên trái.
                        </td>
                      </tr>
                    ) : (
                      recentOrdersWithExport.map((o) => (
                        <tr key={o.orderId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">{o.orderCode}</td>
                          <td className="px-3 py-3 text-slate-700">
                            {o.orderDate ? formatDate(o.orderDate) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-700">
                            {formatDate(o.deliveryDate)}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-700">
                            {o.itemCount ?? '—'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                ORDER_STATUS_CLASS[o.status] ?? 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {translateStatus(o.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {o.export_status ? (
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                  EXPORT_STATUS_CLASS[o.export_status] ?? 'bg-slate-100 text-slate-600'
                                )}
                              >
                                {translateStatus(o.export_status)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {ordersOfStore.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
                  <span className="text-sm text-slate-500">
                    Trang {orderPage + 1} / {orderTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => setOrderPage((p) => Math.max(0, p - 1))}
                      disabled={orderPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => setOrderPage((p) => Math.min(orderTotalPages - 1, p + 1))}
                      disabled={orderPage >= orderTotalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tóm tắt đơn – từ API */}
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                Tóm tắt đơn cửa hàng
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Phân loại theo trạng thái (dữ liệu API)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                <span className="text-slate-600">Chờ duyệt</span>
                <span className="font-semibold text-slate-900">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                <span className="text-slate-600">Đã duyệt / Đã gộp</span>
                <span className="font-semibold text-slate-900">{approvedCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                <span className="text-slate-600">Đã hủy</span>
                <span className="font-semibold text-slate-900">
                  {ordersOfStore.filter((o) => o.status === 'CANCELLED').length}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-medium text-slate-700">Tổng đơn</span>
                <span className="text-lg font-semibold text-slate-900">{totalOrders}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Phiếu xuất – toàn bộ từ API, bảng đầy đủ */}
        <section>
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                Phiếu xuất kho
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                {exportNotes.length} phiếu · trang {exportPage + 1}/{exportTotalPages} (dữ liệu API)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {exportNotes.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Chưa có phiếu xuất nào.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-600">
                          <th className="px-4 py-3 font-semibold">Mã phiếu</th>
                          <th className="px-3 py-3 font-semibold">Đơn hàng</th>
                          <th className="px-3 py-3 font-semibold text-center">Ngày xuất</th>
                          <th className="px-3 py-3 font-semibold text-center">Số mặt hàng</th>
                          <th className="px-4 py-3 font-semibold text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedExports.map((e) => (
                          <tr key={e.exportId} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium text-slate-900">{e.exportCode}</td>
                            <td className="px-3 py-3 text-slate-700">
                              {e.storeName ?? `Đơn #${e.storeOrderId}`}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-700">
                              {e.exportDate ? formatDate(e.exportDate) : '—'}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-700">
                              {Array.isArray(e.items) ? e.items.length : 0}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={cn(
                                  'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                  EXPORT_STATUS_CLASS[e.status] ?? 'bg-slate-100 text-slate-600'
                                )}
                              >
                                {translateStatus(e.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                    <span className="text-sm text-slate-500">
                      Trang {exportPage + 1} / {exportTotalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setExportPage((p) => Math.max(0, p - 1))}
                        disabled={exportPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setExportPage((p) => Math.min(exportTotalPages - 1, p + 1))}
                        disabled={exportPage >= exportTotalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FranchiseStoreDashboard;
