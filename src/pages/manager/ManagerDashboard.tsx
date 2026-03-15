import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, UtensilsCrossed, Package, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { cn } from '@/lib/utils';
import { managerServices } from '@/services/managerServices';
import { kitchenServices } from '@/services/kitchenServices';
import type { CategoryResponse, ManagerOrderItem, NearExpiryItem, ProductsResponse } from '@/services/managerServices';
import type { ProductBatchesResponse } from '@/services/kitchenServices';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CONSOLIDATED: 'Đã gộp',
  CANCELLED: 'Đã hủy',
  AWAITING_DELIVERY: 'Chờ giao hàng',
  DONE: 'Hoàn thành',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  CONSOLIDATED: 'bg-sky-100 text-sky-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
  AWAITING_DELIVERY: 'bg-sky-100 text-sky-800',
  DONE: 'bg-emerald-100 text-emerald-800',
};

const CATEGORY_COLORS = ['#d97706', '#ea580c', '#b45309', '#c2410c'];

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function parsePaginatedItems<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  const arr = (o.items ?? o.content) as T[] | undefined;
  return Array.isArray(arr) ? arr : [];
}

const PAGE_SIZE_ORDERS = 10;

const ManagerDashboard = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductsResponse[]>([]);
  const [orders, setOrders] = useState<ManagerOrderItem[]>([]);
  const [nearExpiry, setNearExpiry] = useState<NearExpiryItem[]>([]);
  const [batches, setBatches] = useState<ProductBatchesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, prodRes, ordersRes, nearRes, batchesRes] = await Promise.allSettled([
          managerServices.getAllCategories(),
          managerServices.getAllProducts(),
          managerServices.getOrders(0, 50),
          managerServices.getNearExpiryBatches(14),
          kitchenServices.getAllProductBatches(),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          const raw = catRes.value.data as CategoryResponse[] | unknown;
          setCategories(Array.isArray(raw) ? raw : []);
        }
        if (prodRes.status === 'fulfilled' && prodRes.value?.data) {
          const raw = prodRes.value.data as ProductsResponse[] | unknown;
          setProducts(Array.isArray(raw) ? raw : []);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const data = (ordersRes.value as { data?: unknown }).data;
          setOrders(parsePaginatedItems<ManagerOrderItem>(data));
        }
        if (nearRes.status === 'fulfilled' && nearRes.value?.data) {
          const data = (nearRes.value as { data?: unknown }).data;
          setNearExpiry(parsePaginatedItems<NearExpiryItem>(data));
        }
        if (batchesRes.status === 'fulfilled' && batchesRes.value?.data) {
          const raw = batchesRes.value.data as ProductBatchesResponse[] | unknown;
          setBatches(Array.isArray(raw) ? raw : []);
        }
      } catch {
        setError('Không tải được dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const totalStockUnits = useMemo(
    () => batches.reduce((sum, b) => sum + (b.currentQuantity ?? 0), 0),
    [batches]
  );
  const ordersToday = useMemo(
    () => orders.filter((o) => o.orderDate?.slice(0, 10) === todayStr).length,
    [orders, todayStr]
  );
  const ordersByDay = useMemo(() => {
    const count: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    orders.forEach((o) => {
      const d = new Date(o.orderDate);
      const i = d.getDay() === 0 ? 6 : d.getDay() - 1;
      count[i] = (count[i] ?? 0) + 1;
    });
    return DAY_LABELS.map((day, i) => ({ day, count: count[i] ?? 0 }));
  }, [orders]);
  const maxOrdersByDay = Math.max(...ordersByDay.map((d) => d.count), 1);
  const categoryStats = useMemo(() => {
    const total = products.length;
    return categories
      .map((cat, idx) => {
        const count = products.filter((p) => (p.categoryId ?? (p as { category_id?: number }).category_id) === cat.categoryId).length;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return { ...cat, count, percent, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] };
      })
      .filter((c) => c.count > 0);
  }, [categories, products]);
  const donutSegments = useMemo(() => {
    return categoryStats.reduce(
      (acc, cat, i) => {
        const start = i === 0 ? 0 : acc[i - 1].end;
        acc.push({ start, end: start + cat.percent, color: cat.color });
        return acc;
      },
      [] as { start: number; end: number; color: string }[]
    );
  }, [categoryStats]);

  const orderTotalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE_ORDERS));
  const paginatedOrders = orders.slice(
    orderPage * PAGE_SIZE_ORDERS,
    (orderPage + 1) * PAGE_SIZE_ORDERS
  );

  if (loading) {
    return (
      <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
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
              Tổng quan tồn kho, đơn yêu cầu và sản phẩm.
            </p>
          </header>

          {/* KPIs – toàn bộ từ API */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tổng tồn kho
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {totalStockUnits.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Đơn vị từ lô hàng</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Boxes className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Đơn hôm nay
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {ordersToday}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Đơn từ cửa hàng</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
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
                      Sản phẩm
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {products.length}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{categories.length} danh mục</p>
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
                      Lô sắp hết hạn
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {nearExpiry.length}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Cần ưu tiên FEFO</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Đơn yêu cầu theo ngày
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Theo dữ liệu đơn hàng (API)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex h-40 items-end gap-2">
                  {ordersByDay.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-amber-200/80 transition-colors hover:bg-amber-300/80"
                        style={{
                          height: `${Math.max((d.count / maxOrdersByDay) * 100, 16)}%`,
                          minHeight: 24,
                        }}
                      />
                      <span className="text-xs font-medium text-slate-600">{d.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Loại sản phẩm
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Tỷ lệ theo danh mục (dữ liệu API)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {categoryStats.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu danh mục.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <div
                      className="h-28 w-28 shrink-0 rounded-full border-4 border-white shadow-inner"
                      style={{
                        background: `conic-gradient(${donutSegments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`,
                      }}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      {categoryStats.map((cat) => (
                        <div key={cat.categoryId} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-slate-700">{cat.categoryName}</span>
                          </span>
                          <span className="font-medium text-slate-900">{cat.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border-0 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Đơn yêu cầu gần đây
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  {orders.length} đơn · trang {orderPage + 1}/{orderTotalPages} (dữ liệu API)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-500">Chưa có đơn nào.</p>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-100">
                      {paginatedOrders.map((o) => (
                        <li key={o.orderId} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/80">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{o.orderCode}</p>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {o.storeName ?? `Cửa hàng #${o.storeId}`} · Giao {formatDate(o.deliveryDate)}
                            </p>
                          </div>
                          <span className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-medium', STATUS_STYLE[o.status] ?? 'bg-slate-100 text-slate-600')}>
                            {STATUS_LABEL[o.status] ?? 'Khác'}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                      <span className="text-sm text-slate-500">
                        Trang {orderPage + 1} / {orderTotalPages}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setOrderPage((p) => Math.max(0, p - 1))}
                          disabled={orderPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setOrderPage((p) => Math.min(orderTotalPages - 1, p + 1))}
                          disabled={orderPage >= orderTotalPages - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Lô sắp hết hạn
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Cần ưu tiên xuất FEFO (dữ liệu API)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {nearExpiry.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">Không có lô sắp hết hạn.</p>
                ) : (
                  nearExpiry.slice(0, 8).map((b, idx) => (
                    <div
                      key={b.batchCode + idx}
                      className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{b.product || b.batchCode}</p>
                        <p className="text-xs text-slate-600">
                          {b.batchCode} · HSD {formatDate(b.expiryDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-900">{b.stock}</p>
                        <p className="text-xs text-amber-700">Gần hết hạn</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
