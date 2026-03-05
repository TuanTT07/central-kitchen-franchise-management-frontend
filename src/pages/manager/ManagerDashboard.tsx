import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Boxes,
  UtensilsCrossed,
  BookOpen,
  BarChart3,
  Package,
  Store,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { cn } from '@/lib/utils';

// --- Mock bám đúng schema DB (store_orders, product_batches, products, categories) ---

type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

interface Store {
  store_id: number;
  store_name: string;
}

interface StoreOrder {
  order_id: number;
  order_code: string;
  store_store_id: number;
  order_date: string;
  delivery_date: string | null;
  status: StoreOrderStatus;
}

interface ProductBatch {
  batch_id: number;
  product_id: number;
  current_quantity: number;
}

interface Product {
  product_id: number;
  product_name: string;
  category_id: number | null;
}

interface Category {
  category_id: number;
  category_name: string;
}

const MOCK_STORES: Store[] = [
  { store_id: 1, store_name: 'Cửa hàng Quận 1' },
  { store_id: 2, store_name: 'Cửa hàng Quận 3' },
  { store_id: 3, store_name: 'Cửa hàng Quận 7' },
];

const MOCK_STORE_ORDERS: StoreOrder[] = [
  { order_id: 1, order_code: 'SO-20260301-001', store_store_id: 1, order_date: '2026-03-01T09:00:00Z', delivery_date: '2026-03-02', status: 'APPROVED' },
  { order_id: 2, order_code: 'SO-20260301-002', store_store_id: 2, order_date: '2026-03-01T10:30:00Z', delivery_date: '2026-03-02', status: 'PENDING' },
  { order_id: 3, order_code: 'SO-20260302-001', store_store_id: 1, order_date: '2026-03-02T08:15:00Z', delivery_date: '2026-03-03', status: 'APPROVED' },
  { order_id: 4, order_code: 'SO-20260302-002', store_store_id: 3, order_date: '2026-03-02T11:45:00Z', delivery_date: '2026-03-03', status: 'CANCELLED' },
  { order_id: 5, order_code: 'SO-20260303-001', store_store_id: 2, order_date: '2026-03-03T09:00:00Z', delivery_date: '2026-03-04', status: 'PENDING' },
];

const MOCK_PRODUCT_BATCHES: ProductBatch[] = [
  { batch_id: 1, product_id: 1, current_quantity: 120 },
  { batch_id: 2, product_id: 1, current_quantity: 150 },
  { batch_id: 3, product_id: 2, current_quantity: 40 },
  { batch_id: 4, product_id: 3, current_quantity: 260 },
  { batch_id: 5, product_id: 4, current_quantity: 0 },
];

const MOCK_PRODUCTS: Product[] = [
  { product_id: 1, product_name: 'Cơm gà xối mỡ', category_id: 1 },
  { product_id: 2, product_name: 'Phở bò tái', category_id: 2 },
  { product_id: 3, product_name: 'Trà chanh sả', category_id: 4 },
  { product_id: 4, product_name: 'Thịt bò phi lê', category_id: 1 },
  { product_id: 5, product_name: 'Bún bò Huế', category_id: 2 },
  { product_id: 6, product_name: 'Chả giò', category_id: 3 },
];

const MOCK_CATEGORIES: Category[] = [
  { category_id: 1, category_name: 'Món chính' },
  { category_id: 2, category_name: 'Món nước' },
  { category_id: 3, category_name: 'Khai vị' },
  { category_id: 4, category_name: 'Đồ uống' },
];

const MOCK_ORDERS_BY_DAY = [
  { day: 'T2', count: 12 },
  { day: 'T3', count: 18 },
  { day: 'T4', count: 15 },
  { day: 'T5', count: 22 },
  { day: 'T6', count: 19 },
  { day: 'T7', count: 14 },
  { day: 'CN', count: 8 },
];

const MOCK_ACTIVITY = [
  { id: '1', userName: 'Nguyễn Văn A', action: 'Xuất kho phiếu PX-001 cho đơn SO-20260301-001', time: '11:20' },
  { id: '2', userName: 'Trần Thị B', action: 'Duyệt đơn yêu cầu SO-20260302-001', time: '11:00' },
  { id: '3', userName: 'Lê Văn C', action: 'Nhập kho phiếu PN-002 — Trà chanh sả', time: '10:30' },
];

const STORE_ORDER_STATUS_LABEL: Record<StoreOrderStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
};

const STORE_ORDER_STATUS_COLOR: Record<StoreOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  CANCELLED: 'bg-stone-200 text-stone-600 border-stone-300',
};

const CATEGORY_COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#b45309'];

const ManagerDashboard = () => {
  const totalStockUnits = useMemo(
    () => MOCK_PRODUCT_BATCHES.reduce((sum, b) => sum + b.current_quantity, 0),
    []
  );

  const totalProducts = MOCK_PRODUCTS.length;

  const ordersToday = useMemo(() => {
    const today = '2026-03-04';
    return MOCK_STORE_ORDERS.filter((o) => o.order_date.startsWith(today)).length;
  }, []);

  const categoryStats = useMemo(() => {
    const total = MOCK_PRODUCTS.length;
    return MOCK_CATEGORIES.map((cat, idx) => {
      const count = MOCK_PRODUCTS.filter((p) => p.category_id === cat.category_id).length;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...cat, count, percent, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] };
    }).filter((c) => c.count > 0);
  }, []);

  const maxOrdersByDay = Math.max(...MOCK_ORDERS_BY_DAY.map((d) => d.count), 1);

  const getStoreName = (storeId: number) =>
    MOCK_STORES.find((s) => s.store_id === storeId)?.store_name ?? `#${storeId}`;

  return (
    <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
      <div className="space-y-5">
        {/* Hero banner — gọn gàng, chuẩn */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-2 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-white/25">
              <Sparkles className="size-3 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xs font-semibold leading-tight text-white md:text-sm">
                Bếp trung tâm · Quản lý kho & đơn hàng
              </h1>
              <p className="mt-0.5 truncate text-[9px] leading-tight text-amber-50/90">
                Tổng quan tồn kho, đơn yêu cầu cửa hàng và danh mục sản phẩm
              </p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-amber-600" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
                  <Boxes className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600/90">Tồn kho trung tâm</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{totalStockUnits.toLocaleString('vi-VN')}</p>
                  <p className="text-[10px] text-stone-500">đơn vị (product_batches)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-orange-200/70 bg-white shadow-lg shadow-orange-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-orange-600" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md">
                  <Package className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-orange-600/90">Đơn hôm nay</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{ordersToday}</p>
                  <p className="text-[10px] text-stone-500">store_orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                  <UtensilsCrossed className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600/90">Sản phẩm</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{totalProducts}</p>
                  <p className="text-[10px] text-stone-500">bảng products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <TrendingUp className="size-4 text-amber-600" />
                Đơn yêu cầu theo ngày
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">Tuần này · store_orders</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-36 items-end gap-1.5">
                {MOCK_ORDERS_BY_DAY.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        d.count === maxOrdersByDay
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md'
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

          {/* Categories */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Store className="size-4 text-amber-600" />
                Loại sản phẩm
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">categories × products</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div
                  className="size-20 shrink-0 rounded-full border-2 border-white shadow-inner"
                  style={{
                    background: `conic-gradient(${categoryStats
                      .map((c, i) => {
                        const start = categoryStats.slice(0, i).reduce((s, x) => s + x.percent, 0);
                        const end = start + c.percent;
                        return `${c.color} ${start}% ${end}%`;
                      })
                      .join(', ')})`,
                  }}
                />
                <div className="flex-1 space-y-2.5">
                  {categoryStats.map((cat) => (
                    <div key={cat.category_id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-medium text-stone-800">{cat.category_name}</span>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {cat.percent}%
                      </span>
                    </div>
                  ))}
                  {categoryStats.length === 0 && (
                    <p className="text-xs text-stone-500">Chưa có dữ liệu</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-4">
              <Button
                className="w-full justify-start gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-sm text-white shadow-md hover:from-amber-600 hover:to-orange-600"
              >
                <BarChart3 className="size-4" />
                Xuất báo cáo
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg border-amber-200 py-4 text-xs text-amber-800 hover:bg-amber-50"
              >
                <BookOpen className="size-4" />
                Cập nhật công thức
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg border-amber-200 py-4 text-xs text-amber-800 hover:bg-amber-50"
              >
                <Boxes className="size-4" />
                Kiểm kê tồn kho
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80">
              <CardTitle className="text-base font-bold text-amber-900">Đơn yêu cầu gần đây</CardTitle>
              <CardDescription className="text-amber-700/80">Mã đơn · Cửa hàng · Trạng thái</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-amber-50">
                {MOCK_STORE_ORDERS.slice(0, 4).map((o) => (
                  <li
                    key={o.order_id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-amber-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900">{o.order_code}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {getStoreName(o.store_store_id)} · Giao:{' '}
                        {o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                        STORE_ORDER_STATUS_COLOR[o.status]
                      )}
                    >
                      {STORE_ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80">
              <CardTitle className="text-base font-bold text-amber-900">Hoạt động gần đây</CardTitle>
              <CardDescription className="text-amber-700/80">Nhập/xuất kho · Duyệt đơn</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-amber-50">
                {MOCK_ACTIVITY.map((a) => (
                  <li key={a.id} className="flex gap-3 px-4 py-3 transition hover:bg-amber-50/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white shadow-sm">
                      {a.userName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-stone-800">{a.action}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
