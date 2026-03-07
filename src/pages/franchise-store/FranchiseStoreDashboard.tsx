import { useMemo } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Package,
  Receipt,
  Truck,
  Sparkles,
  CalendarClock,
  Boxes,
} from 'lucide-react';
import { FRANCHISEE_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';
import { mockActivity } from '@/services/mockDashboardData';
import { cn } from '@/lib/utils';

/**
 * Dashboard bám DB: store_orders, export_notes.
 * Thiết kế đồng bộ với SupplyDashboard / ManagerDashboard.
 */

type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';
type ExportStatus = 'READY' | 'SHIPPED' | 'CANCEL';

interface StoreOrder {
  order_id: number;
  order_code: string;
  store_store_id: number;
  order_date: string;
  delivery_date: string | null;
  status: StoreOrderStatus;
}

interface ExportNote {
  export_id: number;
  export_code: string;
  store_order_id: number;
  export_date: string;
  status: ExportStatus;
}

const STORE_ORDER_STATUS_LABEL: Record<StoreOrderStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
};

const STORE_ORDER_STATUS_CLASS: Record<StoreOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
};

const EXPORT_STATUS_LABEL: Record<ExportStatus, string> = {
  READY: 'Sẵn sàng giao',
  SHIPPED: 'Đã giao',
  CANCEL: 'Hủy',
};

const EXPORT_STATUS_CLASS: Record<ExportStatus, string> = {
  READY: 'bg-sky-100 text-sky-800 border-sky-200',
  SHIPPED: 'bg-amber-500 text-white border-amber-600',
  CANCEL: 'bg-stone-200 text-stone-600 border-stone-300',
};

const MOCK_STORE_ORDERS: StoreOrder[] = [
  {
    order_id: 1,
    order_code: 'SO-20260304-001',
    store_store_id: 1,
    order_date: '2026-03-04T08:30:00Z',
    delivery_date: '2026-03-06',
    status: 'PENDING',
  },
  {
    order_id: 2,
    order_code: 'SO-20260303-002',
    store_store_id: 1,
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
    status: 'APPROVED',
  },
  {
    order_id: 4,
    order_code: 'SO-20260301-003',
    store_store_id: 1,
    order_date: '2026-03-01T09:45:00Z',
    delivery_date: '2026-03-03',
    status: 'CANCELLED',
  },
];

const MOCK_EXPORT_NOTES: ExportNote[] = [
  {
    export_id: 10,
    export_code: 'EX-20260304-001',
    store_order_id: 2,
    export_date: '2026-03-04T06:00:00Z',
    status: 'SHIPPED',
  },
  {
    export_id: 11,
    export_code: 'EX-20260303-001',
    store_order_id: 3,
    export_date: '2026-03-03T05:30:00Z',
    status: 'READY',
  },
];

const CURRENT_STORE_ID = 1;

const FranchiseStoreDashboard = () => {
  const ordersOfStore = useMemo(
    () => MOCK_STORE_ORDERS.filter((o) => o.store_store_id === CURRENT_STORE_ID),
    []
  );

  const pendingCount = useMemo(
    () => ordersOfStore.filter((o) => o.status === 'PENDING').length,
    [ordersOfStore]
  );

  const approvedCount = useMemo(
    () => ordersOfStore.filter((o) => o.status === 'APPROVED').length,
    [ordersOfStore]
  );

  const shippedCount = useMemo(() => {
    const approvedIds = new Set(
      ordersOfStore.filter((o) => o.status === 'APPROVED').map((o) => o.order_id)
    );
    return MOCK_EXPORT_NOTES.filter(
      (e) => approvedIds.has(e.store_order_id) && e.status === 'SHIPPED'
    ).length;
  }, [ordersOfStore]);

  const totalOrders = ordersOfStore.length;

  const recentOrdersWithExport = useMemo(() => {
    return ordersOfStore.slice(0, 5).map((o) => {
      const exp = MOCK_EXPORT_NOTES.find((e) => e.store_order_id === o.order_id);
      return {
        ...o,
        export_code: exp?.export_code ?? '—',
        export_status: exp?.status ?? null,
      };
    });
  }, [ordersOfStore]);

  return (
    <DashboardLayout navItems={FRANCHISEE_SIDEBAR_ITEMS} roleLabel={Role.FRANCHISE_STORE_STAFF}>
      <div className="space-y-5">
        {/* Hero banner – giống Supply / Manager */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-2 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/15 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/25 shadow-sm">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="whitespace-nowrap text-[11px] font-semibold leading-tight text-white md:text-xs">
                Cửa hàng phân phối · Đơn đặt hàng & nhận hàng
              </h1>
              <p className="mt-0.5 text-[10px] leading-tight text-amber-50/90">
                Tổng quan store_orders và export_notes của cửa hàng
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards – 3 thẻ giống Supply */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Đơn chờ duyệt
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{pendingCount}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    store_orders.status = PENDING
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
                  <Truck className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Đơn đã giao / đang giao
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{shippedCount}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    export_notes.status = SHIPPED
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
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Tổng đơn cửa hàng
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{totalOrders}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    store_orders (store_store_id)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Đơn hàng gần đây – 2 cột giống Supply */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">
                  Đơn hàng gần đây
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  store_orders của cửa hàng · join export_notes nếu có
                </CardDescription>
              </div>
              <Button
                asChild
                size="sm"
                className="h-8 rounded-full bg-white px-3 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-50"
              >
                <Link to="/franchise-store/create-order">
                  <ShoppingCart className="mr-2 size-4" />
                  Tạo đơn mới
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-2 font-semibold">Mã đơn</th>
                      <th className="px-4 py-2 font-semibold">Ngày đặt</th>
                      <th className="px-2 py-2 font-semibold text-center">Ngày giao</th>
                      <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                      <th className="px-4 py-2 font-semibold text-right">Phiếu xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {recentOrdersWithExport.map((o) => (
                      <tr key={o.order_id} className="hover:bg-amber-50/40">
                        <td className="px-4 py-2 font-semibold text-stone-900">{o.order_code}</td>
                        <td className="px-4 py-2 text-stone-700">
                          {o.order_date.replace('T', ' ').slice(0, 16)}
                        </td>
                        <td className="px-2 py-2 text-center text-stone-700">
                          {o.delivery_date ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                              STORE_ORDER_STATUS_CLASS[o.status]
                            )}
                          >
                            {STORE_ORDER_STATUS_LABEL[o.status]}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {o.export_status ? (
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                EXPORT_STATUS_CLASS[o.export_status]
                              )}
                            >
                              {EXPORT_STATUS_LABEL[o.export_status]}
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Hành động nhanh – giống Supply */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Hành động nhanh</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Truy cập nhanh tới các màn hình cửa hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Button asChild className="w-full justify-start rounded-lg bg-amber-500 text-xs text-white hover:bg-amber-600">
                <Link to="/franchise-store/create-order" className="no-underline">
                  <ShoppingCart className="mr-2 size-4" />
                  Tạo đơn đặt hàng
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-lg border-amber-200 text-xs text-amber-800 hover:bg-amber-50">
                <Link to="/franchise-store/order-tracking" className="no-underline">
                  <CalendarClock className="mr-2 size-4" />
                  Theo dõi đơn hàng
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-lg border-amber-200 text-xs text-amber-800 hover:bg-amber-50">
                <Link to="/franchise-store/products" className="no-underline">
                  <Boxes className="mr-2 size-4" />
                  Xem sản phẩm
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-lg border-amber-200 text-xs text-amber-800 hover:bg-amber-50">
                <Link to="/franchise-store/store-profile" className="no-underline">
                  <Package className="mr-2 size-4" />
                  Thông tin cửa hàng
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Hàng thứ 2: Hoạt động gần đây + Tóm tắt – giống Supply */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Hoạt động gần đây
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Nhật ký đơn hàng & giao nhận cửa hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {mockActivity.map((a) => (
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
                Tóm tắt đơn cửa hàng
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Phân loại theo store_orders.status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Chờ duyệt (PENDING)</span>
                <span className="font-semibold text-stone-900">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Đã duyệt (APPROVED)</span>
                <span className="font-semibold text-stone-900">{approvedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Đã hủy (CANCELLED)</span>
                <span className="font-semibold text-stone-900">
                  {ordersOfStore.filter((o) => o.status === 'CANCELLED').length}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-100 pt-2">
                <span className="text-stone-700 font-medium">Tổng đơn</span>
                <span className="font-semibold text-amber-900">{totalOrders}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FranchiseStoreDashboard;
