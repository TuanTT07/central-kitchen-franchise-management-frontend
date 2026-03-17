import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Boxes, UtensilsCrossed, Package, Loader2, AlertTriangle } from 'lucide-react';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { managerServices } from '@/services/managerServices';
import { kitchenServices } from '@/services/kitchenServices';
import type { CategoryResponse, ManagerOrderItem, NearExpiryItem, ProductsResponse } from '@/services/managerServices';
import type { ProductBatchesResponse } from '@/services/kitchenServices';


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

  // Giữ placeholder cho phân trang đơn yêu cầu (đã ẩn UI)

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

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border-0 bg-white shadow-sm lg:col-span-2">
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
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Top danh mục sản phẩm
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Biểu đồ cột ngang theo số lượng (dữ liệu API)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                {categoryStats.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu danh mục.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryStats
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 6)
                      .map((cat) => (
                        <div key={cat.categoryId} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate font-medium text-slate-800">
                              {cat.categoryName}
                            </span>
                            <span className="shrink-0 text-xs text-slate-500">
                              {cat.count} SP · {cat.percent}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, cat.percent))}%`,
                                backgroundColor: cat.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}

                    <div className="pt-1 text-xs text-slate-500">
                      Tổng: <span className="font-medium text-slate-800">{products.length}</span> sản phẩm ·{' '}
                      <span className="font-medium text-slate-800">{categories.length}</span> danh mục
                    </div>
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

export default ManagerDashboard;
