import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ChefHat, Loader2, Package, UtensilsCrossed } from 'lucide-react';
import { CENTRAL_KITCHEN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';
import { kitchenServices, type ProductBatchesResponse } from '@/services/kitchenServices';
import { managerServices, type ManagerOrderItem } from '@/services/managerServices';
import { supplyServices, type ExportNotesResponse } from '@/services/supplyServices';

type ProductBatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';

const BATCH_STATUS_LABEL: Record<ProductBatchStatus, string> = {
  WAITING_FOR_STOCK: 'Chờ nhập kho',
  AVAILABLE: 'Khả dụng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRED: 'Hết hạn',
};


const CentralKitchenDashboard = () => {
  const [batches, setBatches] = useState<ProductBatchesResponse[]>([]);
  const [orders, setOrders] = useState<ManagerOrderItem[]>([]);
  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function parsePaginatedItems<T>(data: unknown): T[] {
    if (!data || typeof data !== 'object') return [];
    const o = data as Record<string, unknown>;
    const arr = (o.items ?? o.content) as T[] | undefined;
    return Array.isArray(arr) ? arr : [];
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [batchesRes, ordersRes, exportsRes] = await Promise.allSettled([
          kitchenServices.getAllProductBatches(),
          managerServices.getOrders(0, 50),
          supplyServices.getAllExportNote(),
        ]);

        if (batchesRes.status === 'fulfilled' && batchesRes.value?.data) {
          const raw = batchesRes.value.data as ProductBatchesResponse[] | unknown;
          setBatches(Array.isArray(raw) ? raw : []);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const data = (ordersRes.value as { data?: unknown }).data;
          setOrders(parsePaginatedItems<ManagerOrderItem>(data));
        }
        if (exportsRes.status === 'fulfilled' && exportsRes.value?.data) {
          const data = (exportsRes.value as { data?: unknown }).data;
          setExportNotes(parsePaginatedItems<ExportNotesResponse>(data));
        }
      } catch {
        setError('Không tải được dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const plannedCount = useMemo(
    () => orders.filter((o) => o.status === 'PENDING').length,
    [orders]
  );

  const cookingCount = useMemo(
    () => orders.filter((o) => o.status === 'APPROVED' || o.status === 'CONSOLIDATED').length,
    [orders]
  );

  const outOfStockCount = useMemo(
    () =>
      batches.filter(
        (b) => (b.status as ProductBatchStatus | undefined) === 'OUT_OF_STOCK' || (b.status as ProductBatchStatus | undefined) === 'EXPIRED'
      ).length,
    [batches]
  );

  const exportReadyCount = useMemo(
    () => exportNotes.filter((e) => e.status === 'READY').length,
    [exportNotes]
  );

  const batchesAlert = useMemo(
    () =>
      batches.filter(
        (b) => (b.status as ProductBatchStatus | undefined) === 'OUT_OF_STOCK' || (b.status as ProductBatchStatus | undefined) === 'EXPIRED'
      ),
    [batches]
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <DashboardLayout navItems={CENTRAL_KITCHEN_SIDEBAR_ITEMS} roleLabel={Role.CENTRAL_KITCHEN_STAFF}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={CENTRAL_KITCHEN_SIDEBAR_ITEMS} roleLabel={Role.CENTRAL_KITCHEN_STAFF}>
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Bếp trung tâm
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Tổng quan sản xuất, lô sản phẩm và phiếu xuất.
            </p>
          </header>

          {/* KPI Cards – bám API */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Đơn chờ sản xuất
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {plannedCount}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Đơn cửa hàng trạng thái PENDING</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <ChefHat className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Đơn đang xử lý
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {cookingCount}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Đơn APPROVED / CONSOLIDATED</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <UtensilsCrossed className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Lô hết / sắp hết
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {outOfStockCount}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Lô OUT_OF_STOCK / EXPIRED</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {/* Đơn từ cửa hàng gần đây – giả lập lệnh sản xuất */}
            <Card className="border-0 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Đơn từ cửa hàng gần đây
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Đơn từ các cửa hàng
                  </CardDescription>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link to="/central-kitchen/orders">
                    <Package className="mr-2 h-4 w-4" />
                    Xem tất cả
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {recentOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Chưa có đơn nào.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-600">
                          <th className="px-4 py-3 font-semibold">Mã đơn</th>
                          <th className="px-4 py-3 font-semibold">Cửa hàng</th>
                          <th className="px-3 py-3 text-center font-semibold">Ngày giao</th>
                          <th className="px-4 py-3 text-right font-semibold">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentOrders.map((o) => (
                          <tr key={o.orderId} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium text-slate-900">{o.orderCode}</td>
                            <td className="px-4 py-3 text-slate-800">{o.storeName ?? `Cửa hàng #${o.storeId}`}</td>
                            <td className="px-3 py-3 text-center text-slate-700">
                              {formatDate(o.deliveryDate)}
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-medium text-slate-700">
                              {o.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tóm tắt đơn sản xuất / lô */}
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Tóm tắt sản xuất & lô
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Từ đơn cửa hàng và product_batches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Đơn chờ sản xuất (PENDING)</span>
                  <span className="font-semibold text-slate-900">{plannedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Đơn đang xử lý (APPROVED/CONSOLIDATED)</span>
                  <span className="font-semibold text-slate-900">{cookingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Phiếu READY</span>
                  <span className="font-semibold text-slate-900">{exportReadyCount}</span>
                </div>
                {batchesAlert.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <p className="mb-1.5 text-xs font-medium text-amber-800">Lô cần chú ý</p>
                    {batchesAlert.slice(0, 4).map((b) => (
                      <div key={b.batchId ?? (b as { batch_id?: number }).batch_id} className="flex items-center justify-between py-1">
                        <span className="truncate text-xs text-slate-600">
                          {b.batchCode ?? (b as { batch_code?: string }).batch_code}
                        </span>
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800">
                          {BATCH_STATUS_LABEL[(b.status as ProductBatchStatus) ?? 'OUT_OF_STOCK']}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Phiếu xuất chờ giao – export_notes */}
          <section>
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Phiếu xuất kho
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Danh sách phiếu xuất
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {exportNotes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Chưa có phiếu xuất nào.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-600">
                          <th className="px-4 py-3 font-semibold">Mã phiếu</th>
                          <th className="px-4 py-3 font-semibold">Đơn hàng</th>
                          <th className="px-4 py-3 font-semibold">Chi nhánh</th>
                          <th className="px-4 py-3 text-right font-semibold">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exportNotes.slice(0, 8).map((e) => (
                          <tr key={e.exportId} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium text-slate-900">{e.exportCode}</td>
                            <td className="px-4 py-3 text-slate-800">
                              {e.storeOrderId ? `Đơn #${e.storeOrderId}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{e.storeName ?? '—'}</td>
                            <td className="px-4 py-3 text-right text-xs font-medium text-slate-700">
                              {e.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CentralKitchenDashboard;
