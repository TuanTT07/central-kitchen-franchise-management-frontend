import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  Boxes,
  UtensilsCrossed,
  Package,
  Loader2,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { managerServices } from '@/services/managerServices';
import { kitchenServices } from '@/services/kitchenServices';
import type {
  CategoryResponse,
  ManagerOrderItem,
  NearExpiryItem,
  ProductsResponse,
} from '@/services/managerServices';
import type { ProductBatchesResponse } from '@/services/kitchenServices';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = ['#f59e0b', '#f97316', '#b45309', '#c2410c', '#d97706', '#ea580c'];

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

function parseTotalPages(data: unknown): number {
  if (!data || typeof data !== 'object') return 1;
  const value = Number((data as Record<string, unknown>).totalPages ?? 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

const STATUS_ORDER_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  COOKING: 'bg-blue-100 text-blue-700 border-blue-200',
  DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SHIPPED: 'bg-sky-100 text-sky-700 border-sky-200',
};

const STATUS_ORDER_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
  COOKING: 'Đang nấu',
  DONE: 'Hoàn thành',
  SHIPPED: 'Đang giao',
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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiPageSize = 100;
        const [catRes, prodRes, ordersRes, nearRes, batchesRes] = await Promise.allSettled([
          managerServices.getAllCategories(),
          managerServices.getAllProducts(),
          managerServices.getOrders(0, apiPageSize),
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
          const firstPayload = (ordersRes.value as { data?: unknown }).data;
          const totalPages = parseTotalPages(firstPayload);
          const firstItems = parsePaginatedItems<ManagerOrderItem>(firstPayload);
          if (totalPages <= 1) {
            setOrders(firstItems);
          } else {
            const remaining = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, i) => managerServices.getOrders(i + 1, apiPageSize))
            );
            const remainingItems = remaining.flatMap((res) => parsePaginatedItems<ManagerOrderItem>(res?.data));
            setOrders([...firstItems, ...remainingItems]);
          }
        }
        if (nearRes.status === 'fulfilled' && nearRes.value?.data) {
          setNearExpiry(parsePaginatedItems<NearExpiryItem>((nearRes.value as { data?: unknown }).data));
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
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.orderDate ?? 0).getTime() - new Date(a.orderDate ?? 0).getTime())
        .slice(0, 6),
    [orders]
  );
  const categoryStats = useMemo(() => {
    const total = products.length;
    return categories
      .map((cat, idx) => {
        const count = products.filter(
          (p) => (p.categoryId ?? (p as { category_id?: number }).category_id) === cat.categoryId
        ).length;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return { ...cat, count, percent, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [categories, products]);

  const maxCategoryCount = useMemo(
    () => Math.max(...categoryStats.map((c) => c.count), 1),
    [categoryStats]
  );

  if (loading) {
    return (
      <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Đang tải dữ liệu...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
      <div className="min-h-screen bg-slate-50/60">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {/* ── TITLE ── */}
          <div>
            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">Tổng quan quản lý</h1>
            <p className="mt-0.5 text-sm text-amber-600">Tổng quan tồn kho, đơn hàng và sản phẩm</p>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Boxes}
              label="Tổng tồn kho"
              value={totalStockUnits.toLocaleString('vi-VN')}
              sub="Đơn vị từ lô hàng"
              color="amber"
            />
            <KpiCard
              icon={Package}
              label="Đơn hôm nay"
              value={String(ordersToday)}
              sub="Đơn từ cửa hàng"
              color="orange"
            />
            <KpiCard
              icon={UtensilsCrossed}
              label="Sản phẩm"
              value={String(products.length)}
              sub={`${categories.length} danh mục`}
              color="amber"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Lô sắp hết hạn"
              value={String(nearExpiry.length)}
              sub="Cần ưu tiên FEFO"
              color="rose"
            />
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid gap-5 lg:grid-cols-5">

            {/* Lô sắp hết hạn – 3 cols */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:col-span-3">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Lô sắp hết hạn</p>
                  <p className="text-[11px] text-stone-500">Cần ưu tiên xuất theo FEFO</p>
                </div>
                {nearExpiry.length > 0 && (
                  <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                    {nearExpiry.length}
                  </span>
                )}
              </div>
              <div className="divide-y divide-stone-100">
                {nearExpiry.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarCheck className="mb-2 size-8 text-green-400" />
                    <p className="text-sm font-medium text-stone-500">Không có lô sắp hết hạn</p>
                    <p className="text-xs text-stone-400">Tồn kho đang ổn định</p>
                  </div>
                ) : (
                  nearExpiry.slice(0, 7).map((b, idx) => (
                    <div
                      key={b.batchCode + idx}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-amber-50/50"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          {b.product || b.batchCode}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {b.batchCode} · HSD: {formatDate(b.expiryDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-stone-900">{Number(b.stock).toLocaleString('vi-VN')}</p>
                        <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                          Gần hết hạn
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Danh mục sản phẩm – 2 cols */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <TrendingUp className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Top danh mục</p>
                  <p className="text-[11px] text-stone-500">
                    {products.length} sản phẩm · {categories.length} danh mục
                  </p>
                </div>
              </div>
              <div className="px-5 py-4">
                {categoryStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <UtensilsCrossed className="mb-2 size-8 text-stone-300" />
                    <p className="text-sm text-stone-400">Chưa có dữ liệu</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {categoryStats.map((cat) => (
                      <div key={cat.categoryId}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-semibold text-stone-800">{cat.categoryName}</span>
                          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 tabular-nums font-bold text-stone-600">
                            {cat.count} SP
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((cat.count / maxCategoryCount) * 100)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RECENT ORDERS ── */}
          <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <ShoppingBag className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">Đơn hàng gần đây</p>
                <p className="text-[11px] text-stone-500">6 đơn mới nhất từ cửa hàng</p>
              </div>
              <span className="ml-auto text-[11px] font-medium text-stone-400">
                Tổng: {orders.length} đơn
              </span>
            </div>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="mb-2 size-8 text-stone-300" />
                <p className="text-sm text-stone-400">Chưa có đơn hàng nào.</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Cửa hàng</th>
                    <th className="px-5 py-3">Ngày đặt</th>
                    <th className="px-5 py-3">Ngày giao</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentOrders.map((o) => (
                    <tr key={o.orderId} className="transition hover:bg-amber-50/40">
                      <td className="px-5 py-3 font-mono text-[11px] text-stone-500">
                        #{String(o.orderId).padStart(4, '0')}
                      </td>
                      <td className="px-5 py-3 font-medium text-stone-800">
                        {(o as { storeName?: string }).storeName ?? `Cửa hàng #${o.storeId}`}
                      </td>
                      <td className="px-5 py-3 text-stone-500">{formatDate(o.orderDate)}</td>
                      <td className="px-5 py-3 text-stone-500">
                        {formatDate((o as { expectedDeliveryDate?: string }).expectedDeliveryDate)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                          STATUS_ORDER_COLOR[o.status] ?? 'bg-stone-100 text-stone-600 border-stone-200'
                        )}>
                          {STATUS_ORDER_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── KPI Card ── */
function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: 'amber' | 'orange' | 'rose';
}) {
  const palette = {
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', num: 'text-amber-700', border: 'border-amber-100' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', num: 'text-orange-700', border: 'border-orange-100' },
    rose:   { bg: 'bg-rose-50',   icon: 'bg-rose-100   text-rose-600',   num: 'text-rose-700',   border: 'border-rose-100'   },
  }[color];

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md', palette.border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className={cn('mt-2 text-3xl font-extrabold', palette.num)}>{value}</p>
          <p className="mt-0.5 text-[11px] text-stone-400">{sub}</p>
        </div>
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl shadow-inner', palette.icon)}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className={cn('pointer-events-none absolute -bottom-3 -right-3 size-16 rounded-full opacity-[0.08]',
        color === 'amber' ? 'bg-amber-500' : color === 'orange' ? 'bg-orange-500' : 'bg-rose-500'
      )} />
    </div>
  );
}

export default ManagerDashboard;
