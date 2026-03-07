import { useMemo } from 'react';
import { Link } from 'react-router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChefHat,
  Package,
  Boxes,
  Sparkles,
  UtensilsCrossed,
  ReceiptText,
  Truck,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';
import { CENTRAL_KITCHEN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';
import { cn } from '@/lib/utils';

/**
 * Dashboard Central Kitchen - bám DB: manufacturing_orders, product_batches,
 * store_orders, export_notes, inventory_receipts.
 * Thiết kế đồng bộ với FranchiseStoreDashboard / SupplyDashboard / ManagerDashboard.
 */

type ManuOrderStatus = 'PLANNED' | 'COOKING' | 'COMPLETED' | 'CANCELLED';
type ProductBatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';
type ExportStatus = 'READY' | 'SHIPPED' | 'CANCEL';

interface ManufacturingOrder {
  manu_order_id: number;
  order_code: string;
  product_id: number;
  product_name: string;
  quantity_planned: number;
  status: ManuOrderStatus;
  start_date: string | null;
  end_date: string | null;
}

interface ProductBatch {
  batch_id: number;
  batch_code: string;
  product_id: number;
  product_name: string;
  current_quantity: number;
  initial_quantity: number;
  status: ProductBatchStatus;
  expiry_date: string;
}

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
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
}

interface ExportNote {
  export_id: number;
  export_code: string;
  store_order_id: number;
  status: ExportStatus;
}

const MANU_ORDER_STATUS_LABEL: Record<ManuOrderStatus, string> = {
  PLANNED: 'Chờ sản xuất',
  COOKING: 'Đang nấu',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const MANU_ORDER_STATUS_CLASS: Record<ManuOrderStatus, string> = {
  PLANNED: 'bg-amber-100 text-amber-800 border-amber-200',
  COOKING: 'bg-orange-500 text-white border-orange-600 shadow-sm',
  COMPLETED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  CANCELLED: 'bg-stone-200 text-stone-600 border-stone-300',
};

const BATCH_STATUS_LABEL: Record<ProductBatchStatus, string> = {
  WAITING_FOR_STOCK: 'Chờ nhập kho',
  AVAILABLE: 'Khả dụng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRED: 'Hết hạn',
};

const EXPORT_STATUS_LABEL: Record<ExportStatus, string> = {
  READY: 'Sẵn sàng giao',
  SHIPPED: 'Đã giao',
  CANCEL: 'Hủy',
};

const EXPORT_STATUS_CLASS: Record<ExportStatus, string> = {
  READY: 'bg-sky-100 text-sky-800 border-sky-200',
  SHIPPED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCEL: 'bg-stone-200 text-stone-600 border-stone-300',
};

const MOCK_MANUFACTURING_ORDERS: ManufacturingOrder[] = [
  {
    manu_order_id: 1,
    order_code: 'MO-20260304-001',
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    quantity_planned: 200,
    status: 'PLANNED',
    start_date: null,
    end_date: null,
  },
  {
    manu_order_id: 2,
    order_code: 'MO-20260304-002',
    product_id: 2,
    product_name: 'Phở bò tái',
    quantity_planned: 150,
    status: 'COOKING',
    start_date: '2026-03-04T06:00:00Z',
    end_date: null,
  },
  {
    manu_order_id: 3,
    order_code: 'MO-20260303-001',
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    quantity_planned: 180,
    status: 'COMPLETED',
    start_date: '2026-03-03T07:00:00Z',
    end_date: '2026-03-03T10:30:00Z',
  },
  {
    manu_order_id: 4,
    order_code: 'MO-20260302-003',
    product_id: 3,
    product_name: 'Trà chanh sả',
    quantity_planned: 300,
    status: 'CANCELLED',
    start_date: null,
    end_date: null,
  },
];

const MOCK_PRODUCT_BATCHES: ProductBatch[] = [
  {
    batch_id: 1,
    batch_code: 'LOT-COMGA-001',
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    current_quantity: 120,
    initial_quantity: 200,
    status: 'AVAILABLE',
    expiry_date: '2026-03-05',
  },
  {
    batch_id: 2,
    batch_code: 'LOT-PHO-001',
    product_id: 2,
    product_name: 'Phở bò tái',
    current_quantity: 0,
    initial_quantity: 80,
    status: 'OUT_OF_STOCK',
    expiry_date: '2026-03-04',
  },
  {
    batch_id: 3,
    batch_code: 'LOT-TRACHANH-001',
    product_id: 3,
    product_name: 'Trà chanh sả',
    current_quantity: 45,
    initial_quantity: 300,
    status: 'AVAILABLE',
    expiry_date: '2026-03-02',
  },
];

const MOCK_STORES: Store[] = [
  { store_id: 1, store_name: 'Cửa hàng Quận 1' },
  { store_id: 2, store_name: 'Cửa hàng Quận 3' },
  { store_id: 3, store_name: 'Cửa hàng Quận 7' },
];

const MOCK_STORE_ORDERS: StoreOrder[] = [
  {
    order_id: 1,
    order_code: 'SO-20260304-001',
    store_store_id: 1,
    order_date: '2026-03-04T08:30:00Z',
    delivery_date: '2026-03-06',
    status: 'APPROVED',
  },
  {
    order_id: 2,
    order_code: 'SO-20260303-002',
    store_store_id: 2,
    order_date: '2026-03-03T10:15:00Z',
    delivery_date: '2026-03-05',
    status: 'APPROVED',
  },
  {
    order_id: 3,
    order_code: 'SO-20260302-001',
    store_store_id: 1,
    order_date: '2026-03-02T14:00:00Z',
    delivery_date: '2026-03-04',
    status: 'PENDING',
  },
];

const MOCK_EXPORT_NOTES: ExportNote[] = [
  { export_id: 10, export_code: 'EX-20260304-001', store_order_id: 1, status: 'READY' },
  { export_id: 11, export_code: 'EX-20260303-001', store_order_id: 2, status: 'SHIPPED' },
];

const MOCK_ORDERS_BY_DAY = [
  { day: 'T2', count: 8 },
  { day: 'T3', count: 12 },
  { day: 'T4', count: 15 },
  { day: 'T5', count: 18 },
  { day: 'T6', count: 14 },
  { day: 'T7', count: 10 },
  { day: 'CN', count: 6 },
];

/** inventory_receipts: receipt_code, status (COMPLETED | DRAFT) */
const MOCK_INVENTORY_RECEIPTS = [
  { receipt_id: 1, receipt_code: 'IR-20260304-001', status: 'DRAFT' as const },
  { receipt_id: 2, receipt_code: 'IR-20260303-001', status: 'COMPLETED' as const },
  { receipt_id: 3, receipt_code: 'IR-20260302-001', status: 'COMPLETED' as const },
];

/** Hoạt động bám manufacturing_orders, product_batches, export_notes */
const MOCK_ACTIVITY_CK = [
  { id: '1', userName: 'Nguyễn Văn A', roleName: 'Bếp trung tâm', action: 'Cập nhật đơn MO-20260304-002 sang trạng thái COOKING', time: '11:20' },
  { id: '2', userName: 'Trần Thị B', roleName: 'Bếp trung tâm', action: 'Hoàn thành lô LOT-COMGA-001 · product_batches', time: '10:45' },
  { id: '3', userName: 'Lê Văn C', roleName: 'Supply', action: 'Phiếu xuất EX-20260304-001 sẵn sàng giao · export_notes', time: '10:30' },
  { id: '4', userName: 'Phạm Thị D', roleName: 'Bếp trung tâm', action: 'Tạo biên lai nhập kho IR-20260304-001 · inventory_receipts', time: '10:15' },
];

const CentralKitchenDashboard = () => {
  const plannedCount = useMemo(
    () => MOCK_MANUFACTURING_ORDERS.filter((o) => o.status === 'PLANNED').length,
    []
  );

  const cookingCount = useMemo(
    () => MOCK_MANUFACTURING_ORDERS.filter((o) => o.status === 'COOKING').length,
    []
  );

  const outOfStockCount = useMemo(
    () => MOCK_PRODUCT_BATCHES.filter((b) => b.status === 'OUT_OF_STOCK' || b.status === 'EXPIRED').length,
    []
  );

  const exportReadyCount = useMemo(
    () => MOCK_EXPORT_NOTES.filter((e) => e.status === 'READY').length,
    []
  );

  const maxOrdersByDay = Math.max(...MOCK_ORDERS_BY_DAY.map((d) => d.count), 1);

  const getStoreName = (storeId: number) =>
    MOCK_STORES.find((s) => s.store_id === storeId)?.store_name ?? `#${storeId}`;

  const recentManuOrders = useMemo(() => MOCK_MANUFACTURING_ORDERS.slice(0, 5), []);

  const batchesAlert = useMemo(
    () => MOCK_PRODUCT_BATCHES.filter((b) => b.status === 'OUT_OF_STOCK' || b.status === 'EXPIRED'),
    []
  );

  const draftReceiptsCount = useMemo(
    () => MOCK_INVENTORY_RECEIPTS.filter((r) => r.status === 'DRAFT').length,
    []
  );

  return (
    <DashboardLayout navItems={CENTRAL_KITCHEN_SIDEBAR_ITEMS} roleLabel={Role.CENTRAL_KITCHEN_STAFF}>
      <div className="space-y-5">
        {/* Hero banner – đồng bộ với các role khác */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-2 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/15 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/25 shadow-sm">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="whitespace-nowrap text-[11px] font-semibold leading-tight text-white md:text-xs">
                Bếp trung tâm · Sản xuất & tồn kho
              </h1>
              <p className="mt-0.5 text-[10px] leading-tight text-amber-50/90">
                Tổng quan manufacturing_orders, product_batches và export_notes
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards – 3 thẻ bám DB */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <ChefHat className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Đơn chờ sản xuất
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{plannedCount}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    manufacturing_orders.status = PLANNED
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md">
                  <UtensilsCrossed className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Đơn đang nấu
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{cookingCount}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    manufacturing_orders.status = COOKING
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-yellow-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 text-white shadow-md">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Lô hết / sắp hết
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{outOfStockCount}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    product_batches OUT_OF_STOCK / EXPIRED
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Đơn sản xuất theo ngày */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Đơn sản xuất theo ngày
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Tuần này · manufacturing_orders
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-40 items-end gap-1.5">
                {MOCK_ORDERS_BY_DAY.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        d.count === maxOrdersByDay
                          ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-md'
                          : 'bg-gradient-to-t from-amber-100 to-amber-50'
                      )}
                      style={{
                        height: `${(d.count / maxOrdersByDay) * 100}%`,
                        minHeight: '12px',
                      }}
                    />
                    <span className="text-[11px] font-medium text-stone-600">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Đơn sản xuất gần đây – 2 cột */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">
                  Đơn sản xuất gần đây
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  manufacturing_orders · product_id → products
                </CardDescription>
              </div>
              <Button
                asChild
                size="sm"
                className="h-8 rounded-full bg-white px-3 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-50"
              >
                <Link to="/central-kitchen/orders">
                  <Package className="mr-2 size-4" />
                  Xem tất cả
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-2 font-semibold">Mã đơn</th>
                      <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                      <th className="px-2 py-2 font-semibold text-center">SL kế hoạch</th>
                      <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {recentManuOrders.map((o) => (
                      <tr key={o.manu_order_id} className="hover:bg-amber-50/40">
                        <td className="px-4 py-2 font-semibold text-stone-900">{o.order_code}</td>
                        <td className="px-4 py-2 text-stone-800">{o.product_name}</td>
                        <td className="px-2 py-2 text-center text-stone-800">
                          {o.quantity_planned}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                              MANU_ORDER_STATUS_CLASS[o.status]
                            )}
                          >
                            {MANU_ORDER_STATUS_LABEL[o.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {/* Phiếu xuất chờ giao – export_notes */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">
                  Phiếu xuất chờ giao
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  export_notes · liên kết store_orders
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-2 font-semibold">Mã phiếu</th>
                      <th className="px-4 py-2 font-semibold">Đơn hàng</th>
                      <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                      <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {MOCK_EXPORT_NOTES.map((e) => {
                      const order = MOCK_STORE_ORDERS.find((o) => o.order_id === e.store_order_id);
                      return (
                        <tr key={e.export_id} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 font-semibold text-stone-900">{e.export_code}</td>
                          <td className="px-4 py-2 text-stone-800">
                            {order?.order_code ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-stone-700">
                            {order ? getStoreName(order.store_store_id) : '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                EXPORT_STATUS_CLASS[e.status]
                              )}
                            >
                              {EXPORT_STATUS_LABEL[e.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hàng thứ 3: Hoạt động gần đây + Tóm tắt */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Hoạt động gần đây
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Nhật ký manufacturing_orders · product_batches · export_notes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {MOCK_ACTIVITY_CK.map((a) => (
                  <div
                    key={a.id}
                    className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-3"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-sm">
                      {a.userName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900">
                        {a.userName}{' '}
                        <span className="font-normal text-amber-800/90">({a.roleName})</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-600">{a.action}</p>
                      <p className="mt-0.5 text-[10px] text-stone-400">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Tóm tắt đơn sản xuất
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Phân loại theo manufacturing_orders.status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Chờ sản xuất (PLANNED)</span>
                <span className="font-semibold text-stone-900">{plannedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Đang nấu (COOKING)</span>
                <span className="font-semibold text-stone-900">{cookingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Hoàn thành (COMPLETED)</span>
                <span className="font-semibold text-stone-900">
                  {MOCK_MANUFACTURING_ORDERS.filter((o) => o.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Phiếu sẵn sàng giao (READY)</span>
                <span className="font-semibold text-stone-900">{exportReadyCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Biên lai nháp (DRAFT)</span>
                <span className="font-semibold text-stone-900">{draftReceiptsCount}</span>
              </div>
              {batchesAlert.length > 0 && (
                <div className="border-t border-amber-100 pt-2">
                  <p className="mb-1.5 text-[11px] font-medium text-amber-800">Lô cần chú ý</p>
                  {batchesAlert.map((b) => (
                    <div key={b.batch_id} className="flex items-center justify-between py-1">
                      <span className="truncate text-stone-600">{b.batch_code}</span>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800">
                        {BATCH_STATUS_LABEL[b.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-amber-100 pt-2">
                <span className="font-medium text-stone-700">Tổng đơn sản xuất</span>
                <span className="font-semibold text-amber-900">
                  {MOCK_MANUFACTURING_ORDERS.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CentralKitchenDashboard;
