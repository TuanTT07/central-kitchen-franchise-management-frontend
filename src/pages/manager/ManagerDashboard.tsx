import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Boxes,
  UtensilsCrossed,
  Package,
  Store,
  TrendingUp,
  Sparkles,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { cn } from '@/lib/utils';

// --- Mock bám đúng schema DB: products, categories, product_batches, store_orders, stores ---

type ProductStatus = 'ACTIVE' | 'INACTIVE' | null;
type ProductBatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';
type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

interface Store {
  store_id: number;
  store_name: string;
}

interface StoreOrder {
  order_id: number;
  order_code: string;
  store_store_id: number;
  order_date: string; // timestamp
  delivery_date: string | null; // date
  status: StoreOrderStatus;
}

interface Category {
  category_id: number;
  category_name: string;
  status: ProductStatus;
}

interface Product {
  product_id: number;
  product_name: string;
  unit: string;
  description: string | null;
  image_url: string | null;
  status: ProductStatus;
  category_id: number | null;
}

interface ProductBatch {
  batch_id: number;
  batch_code: string;
  product_id: number;
  manu_order_id: number | null;
  initial_quantity: number;
  current_quantity: number;
  manufacturing_date: string; // date
  expiry_date: string; // date
  status: ProductBatchStatus;
}

const MOCK_STORES: Store[] = [
  { store_id: 1, store_name: 'Cửa hàng Quận 1' },
  { store_id: 2, store_name: 'Cửa hàng Quận 3' },
  { store_id: 3, store_name: 'Cửa hàng Quận 7' },
];

const MOCK_STORE_ORDERS: StoreOrder[] = [
  {
    order_id: 1,
    order_code: 'SO-20260301-001',
    store_store_id: 1,
    order_date: '2026-03-04T08:30:00Z',
    delivery_date: '2026-03-05',
    status: 'PENDING',
  },
  {
    order_id: 2,
    order_code: 'SO-20260301-002',
    store_store_id: 2,
    order_date: '2026-03-04T09:45:00Z',
    delivery_date: '2026-03-05',
    status: 'APPROVED',
  },
  {
    order_id: 3,
    order_code: 'SO-20260302-001',
    store_store_id: 1,
    order_date: '2026-03-03T14:15:00Z',
    delivery_date: '2026-03-04',
    status: 'APPROVED',
  },
  {
    order_id: 4,
    order_code: 'SO-20260302-002',
    store_store_id: 3,
    order_date: '2026-03-02T11:00:00Z',
    delivery_date: '2026-03-03',
    status: 'CANCELLED',
  },
];

const MOCK_CATEGORIES: Category[] = [
  { category_id: 1, category_name: 'Món chính', status: 'ACTIVE' },
  { category_id: 2, category_name: 'Món nước', status: 'ACTIVE' },
  { category_id: 3, category_name: 'Khai vị', status: 'ACTIVE' },
  { category_id: 4, category_name: 'Đồ uống', status: 'ACTIVE' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    unit: 'phần',
    description: 'Cơm gà sốt bơ tỏi',
    image_url: null,
    status: 'ACTIVE',
    category_id: 1,
  },
  {
    product_id: 2,
    product_name: 'Phở bò tái',
    unit: 'tô',
    description: null,
    image_url: null,
    status: 'ACTIVE',
    category_id: 2,
  },
  {
    product_id: 3,
    product_name: 'Trà chanh sả',
    unit: 'ly',
    description: null,
    image_url: null,
    status: 'ACTIVE',
    category_id: 4,
  },
  {
    product_id: 4,
    product_name: 'Thịt bò phi lê',
    unit: 'kg',
    description: 'Nguyên liệu kho lạnh',
    image_url: null,
    status: 'ACTIVE',
    category_id: 1,
  },
  {
    product_id: 5,
    product_name: 'Chả giò',
    unit: 'phần',
    description: null,
    image_url: null,
    status: 'INACTIVE',
    category_id: 3,
  },
];

const MOCK_PRODUCT_BATCHES: ProductBatch[] = [
  {
    batch_id: 1,
    batch_code: 'LOT-COMGA-001',
    product_id: 1,
    manu_order_id: 1,
    initial_quantity: 200,
    current_quantity: 120,
    manufacturing_date: '2026-03-01',
    expiry_date: '2026-03-05',
    status: 'AVAILABLE',
  },
  {
    batch_id: 2,
    batch_code: 'LOT-COMGA-002',
    product_id: 1,
    manu_order_id: 2,
    initial_quantity: 180,
    current_quantity: 150,
    manufacturing_date: '2026-03-02',
    expiry_date: '2026-03-06',
    status: 'AVAILABLE',
  },
  {
    batch_id: 3,
    batch_code: 'LOT-PHO-001',
    product_id: 2,
    manu_order_id: 3,
    initial_quantity: 80,
    current_quantity: 40,
    manufacturing_date: '2026-02-28',
    expiry_date: '2026-03-04',
    status: 'AVAILABLE',
  },
  {
    batch_id: 4,
    batch_code: 'LOT-TRACHANH-001',
    product_id: 3,
    manu_order_id: 4,
    initial_quantity: 300,
    current_quantity: 260,
    manufacturing_date: '2026-03-01',
    expiry_date: '2026-03-10',
    status: 'AVAILABLE',
  },
  {
    batch_id: 5,
    batch_code: 'LOT-THITBO-001',
    product_id: 4,
    manu_order_id: 5,
    initial_quantity: 50,
    current_quantity: 0,
    manufacturing_date: '2026-02-20',
    expiry_date: '2026-03-03',
    status: 'OUT_OF_STOCK',
  },
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
  {
    id: '1',
    userName: 'Nguyễn Văn A',
    action: 'Duyệt đơn SO-20260301-002 cho cửa hàng Quận 3',
    time: '11:20',
  },
  {
    id: '2',
    userName: 'Trần Thị B',
    action: 'Cập nhật tồn kho lô LOT-COMGA-001 sau xuất hàng',
    time: '10:45',
  },
  {
    id: '3',
    userName: 'Lê Văn C',
    action: 'Kiểm tra cảnh báo lô sắp hết hạn',
    time: '10:10',
  },
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

const isNearExpiry = (date: string) => {
  const today = new Date('2026-03-04');
  const expiry = new Date(date);
  const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 3;
};

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

  const nearExpiryCount = useMemo(
    () => MOCK_PRODUCT_BATCHES.filter((b) => isNearExpiry(b.expiry_date) && b.current_quantity > 0).length,
    []
  );

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

  const donutSegments = categoryStats.reduce(
    (acc, cat, index) => {
      const start = index === 0 ? 0 : acc[index - 1].end;
      const end = start + cat.percent;
      acc.push({ start, end, color: cat.color });
      return acc;
    },
    [] as { start: number; end: number; color: string }[]
  );

  return (
    <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
      <div className="space-y-5">
        {/* Hero banner — gọn gàng, chuẩn, bám đúng nghiệp vụ kho */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-2 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-white/25">
              <Sparkles className="size-3 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xs font-semibold leading-tight text-white md:text-sm">
                Bếp trung tâm · Quản lý kho & đơn yêu cầu
              </h1>
              <p className="mt-0.5 truncate text-[9px] leading-tight text-amber-50/90">
                Tổng quan product_batches, store_orders và danh mục products
              </p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Boxes className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">
                    Tổng tồn kho
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">
                    {totalStockUnits.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-stone-500">units · từ bảng product_batches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md">
                  <Package className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">
                    Đơn yêu cầu hôm nay
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">
                    {ordersToday.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-stone-500">store_orders · theo order_date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-yellow-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 text-white shadow-md">
                  <UtensilsCrossed className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">
                    Sản phẩm & danh mục
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">
                    {totalProducts.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-stone-500">products · bảng products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Đơn yêu cầu theo ngày (store_orders) */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <TrendingUp className="size-4 text-amber-600" />
                Đơn yêu cầu theo ngày
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                Tuần này · từ store_orders
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-36 items-end gap-1.5">
                {MOCK_ORDERS_BY_DAY.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        d.count === maxOrdersByDay
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

          {/* Loại sản phẩm từ categories + products */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Boxes className="size-4 text-amber-600" />
                Loại sản phẩm
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                Tỷ lệ theo bảng categories & products
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
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
                    <div key={cat.category_id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.category_name}
                      </span>
                      <span className="text-xs font-semibold text-stone-800">
                        {cat.count} sp · {cat.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cảnh báo lô sắp hết hạn */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <AlertTriangle className="size-4 text-amber-600" />
                Lô hàng sắp hết hạn
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                FEFO · từ bảng product_batches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {MOCK_PRODUCT_BATCHES.filter(
                (b) => isNearExpiry(b.expiry_date) && b.current_quantity > 0
              ).map((b) => {
                const product = MOCK_PRODUCTS.find((p) => p.product_id === b.product_id);
                return (
                  <div
                    key={b.batch_id}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-stone-900">
                        {product?.product_name ?? `#${b.product_id}`}
                      </p>
                      <p className="mt-0.5 text-[10px] text-stone-600">
                        {b.batch_code} · HD: {b.expiry_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-amber-900">
                        {b.current_quantity.toLocaleString()} {product?.unit}
                      </p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-amber-700">
                        <CalendarClock className="size-3" />
                        Gần hết hạn
                      </p>
                    </div>
                  </div>
                );
              })}
              {nearExpiryCount === 0 && (
                <p className="text-xs text-stone-500">Không có lô hàng nào sắp hết hạn.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Đơn yêu cầu gần đây */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Store className="size-4 text-amber-600" />
                Đơn yêu cầu gần đây
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                store_orders · không có tiền
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-amber-50">
                {MOCK_STORE_ORDERS.map((o) => (
                  <li
                    key={o.order_id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-amber-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {o.order_code}
                      </p>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {getStoreName(o.store_store_id)} · Giao: {o.delivery_date ?? '—'}
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

          {/* Hoạt động gần đây */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <CalendarClock className="size-4 text-amber-600" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/80">
                Liên quan kho & đơn yêu cầu
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-amber-50">
                {MOCK_ACTIVITY.map((a) => (
                  <li
                    key={a.id}
                    className="flex gap-3 px-4 py-3 transition hover:bg-amber-50/50"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-sm">
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
