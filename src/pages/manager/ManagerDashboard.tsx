import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Boxes,
  UtensilsCrossed,
  Package,
  Store,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { cn } from '@/lib/utils';
import { managerServices } from '@/services/managerServices';
import { kitchenServices } from '@/services/kitchenServices';
import type { ManagerOrderItem, NearExpiryItem } from '@/services/managerServices';
import type { ProductBatchesResponse } from '@/services/kitchenServices';
import type { CategoryResponse, ProductsResponse } from '@/services/managerServices';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CONSOLIDATED: 'Đã gộp',
  CANCELLED: 'Đã hủy',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  CONSOLIDATED: 'bg-sky-100 text-sky-800 border-sky-200',
  CANCELLED: 'bg-stone-200 text-stone-600 border-stone-300',
};

const CATEGORY_COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#92400e'];

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ManagerDashboard = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductsResponse[]>([]);
  const [orders, setOrders] = useState<ManagerOrderItem[]>([]);
  const [nearExpiry, setNearExpiry] = useState<NearExpiryItem[]>([]);
  const [batches, setBatches] = useState<ProductBatchesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
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

        if (catRes.status === 'fulfilled' && catRes.value?.data) setCategories(catRes.value.data as CategoryResponse[]);
        if (prodRes.status === 'fulfilled' && prodRes.value?.data) setProducts((prodRes.value.data as ProductsResponse[]) || []);
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const orderData = ordersRes.value.data as { items?: ManagerOrderItem[]; content?: ManagerOrderItem[] };
          setOrders(Array.isArray(orderData.items) ? orderData.items : Array.isArray(orderData.content) ? orderData.content : []);
        }
        if (nearRes.status === 'fulfilled' && nearRes.value?.data) {
          const data = nearRes.value.data as { items?: NearExpiryItem[]; content?: NearExpiryItem[] };
          setNearExpiry(Array.isArray(data.items) ? data.items : Array.isArray(data.content) ? data.content : []);
        }
        if (batchesRes.status === 'fulfilled' && batchesRes.value?.data)
          setBatches(Array.isArray(batchesRes.value.data) ? batchesRes.value.data : []);
      } catch (e) {
        setError('Không tải được dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalStockUnits = useMemo(
    () => batches.reduce((sum, b) => sum + (b.currentQuantity ?? 0), 0),
    [batches]
  );

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const ordersToday = useMemo(
    () => orders.filter((o) => o.orderDate?.slice(0, 10) === todayStr).length,
    [orders, todayStr]
  );

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

  const ordersByDay = useMemo(() => {
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    orders.forEach((o) => {
      const d = new Date(o.orderDate);
      const day = d.getDay();
      const idx = day === 0 ? 6 : day - 1;
      dayCounts[idx] = (dayCounts[idx] || 0) + 1;
    });
    return DAY_LABELS.map((day, i) => ({ day, count: dayCounts[i] ?? 0 }));
  }, [orders]);

  const maxOrdersByDay = Math.max(...ordersByDay.map((d) => d.count), 1);
  const donutSegments = categoryStats.reduce(
    (acc, cat, index) => {
      const start = index === 0 ? 0 : acc[index - 1].end;
      const end = start + cat.percent;
      acc.push({ start, end, color: cat.color });
      return acc;
    },
    [] as { start: number; end: number; color: string }[]
  );

  if (loading) {
    return (
      <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
      <div className="space-y-6">
        {/* Hero */}
        <div className="relative flex items-center overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/25">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold leading-tight text-white md:text-base">
                Bếp trung tâm · Quản lý kho & đơn yêu cầu
              </h1>
              <p className="mt-0.5 truncate text-xs leading-tight text-amber-50/90">
                Tổng quan tồn kho, đơn hàng và danh mục sản phẩm
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-md transition hover:shadow-lg">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Boxes className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">Tổng tồn kho</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{totalStockUnits.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-500">đơn vị · từ lô hàng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-md transition hover:shadow-lg">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md">
                  <Package className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">Đơn hôm nay</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{ordersToday.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-500">đơn yêu cầu · theo ngày</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-md transition hover:shadow-lg">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-yellow-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 text-white shadow-md">
                  <UtensilsCrossed className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">Sản phẩm</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{products.length.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-500">sản phẩm · {categories.length} danh mục</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Chart + Donut + Near-expiry — 3 cột cân đối */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Đơn theo ngày (từ API orders) */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <TrendingUp className="size-4 text-amber-600" />
                Đơn yêu cầu theo ngày
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                Theo dữ liệu đơn hàng gần đây
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-36 items-end gap-1.5">
                {ordersByDay.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        d.count === maxOrdersByDay && maxOrdersByDay > 0
                          ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-md'
                          : 'bg-gradient-to-t from-amber-100 to-amber-50'
                      )}
                      style={{
                        height: `${Math.max((d.count / maxOrdersByDay) * 100, 12)}%`,
                        minHeight: '24px',
                      }}
                    />
                    <span className="text-[10px] font-medium text-stone-600">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Loại sản phẩm (categories + products) */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Boxes className="size-4 text-amber-600" />
                Loại sản phẩm
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                Tỷ lệ theo danh mục
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {categoryStats.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div
                    className="size-24 shrink-0 rounded-full border-4 border-white shadow-inner"
                    style={{
                      background: `conic-gradient(${donutSegments
                        .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
                        .join(', ')})`,
                    }}
                  />
                  <div className="flex-1 space-y-1.5">
                    {categoryStats.map((cat) => (
                      <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.categoryName}
                        </span>
                        <span className="text-xs font-semibold text-stone-800">
                          {cat.count} sp · {cat.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-stone-500">Chưa có dữ liệu danh mục.</p>
              )}
            </CardContent>
          </Card>

          {/* Lô sắp hết hạn (API near-expiry) */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <AlertTriangle className="size-4 text-amber-600" />
                Lô sắp hết hạn
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                Trong 14 ngày tới
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-52 space-y-2 overflow-y-auto pt-4">
              {nearExpiry.length > 0 ? (
                nearExpiry.slice(0, 8).map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-stone-900">{b.product}</p>
                      <p className="mt-0.5 text-[10px] text-stone-600">
                        {b.batchCode} · HD: {formatDate(b.expiryDate)}
                      </p>
                    </div>
                    <p className="ml-2 shrink-0 text-xs font-semibold text-amber-900">{b.stock}</p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-stone-500">Không có lô sắp hết hạn.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Đơn yêu cầu gần đây — full width cân đối */}
        <Card className="overflow-hidden border-amber-100 bg-white shadow-md">
          <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Store className="size-4 text-amber-600" />
              Đơn yêu cầu gần đây
            </CardTitle>
            <CardDescription className="text-[10px] text-amber-700/80">
                Danh sách đơn từ API
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-amber-50">
              {orders.length > 0 ? (
                orders.slice(0, 10).map((o) => (
                  <li
                    key={o.orderId}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-amber-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900">{o.orderCode}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {o.storeName ?? `#${o.storeId}`} · Giao: {formatDate(o.deliveryDate)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                        ORDER_STATUS_COLOR[o.status] ?? 'bg-stone-100 text-stone-700'
                      )}
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-xs text-stone-500">Chưa có đơn nào.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
