import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, AlertTriangle, Sparkles, CalendarClock } from 'lucide-react';
import { mockRecentOrders, mockActivity } from '@/services/mockDashboardData';
import { SUPPLY_COORDINATOR_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';

const SupplyDashboard = () => {
  const transferOrders = mockRecentOrders.filter((o) => o.orderType === 'TRANSFER');
  const totalTransferOrders = transferOrders.length;
  const totalOrders = mockRecentOrders.length;

  return (
    <DashboardLayout
      navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS}
      roleLabel={Role.SUPPLY_COORDINATOR}
    >
      <div className="space-y-5">
        {/* Hero banner – đồng bộ màu với Admin/Manager */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-2 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/15 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/25 shadow-sm">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-semibold leading-tight text-white md:text-sm">
                Supply Coordinator · Điều phối giao nhận
              </h1>
              <p className="mt-0.5 text-[11px] leading-tight text-amber-50/90">
                Tổng quan đơn cần giao, chuyến giao trong ngày và hoạt động giao nhận
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Truck className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Chuyến giao (giả lập)
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{totalTransferOrders}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    Dựa trên đơn Transfer trong mockRecentOrders
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
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Đơn cần điều phối
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{totalOrders}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    Tổng PO + Transfer trong mockRecentOrders
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
                    Sự cố chờ xử lý
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">2</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    Mapping sau sang trang xử lý sự cố
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Đơn cần giao – TransferOrder giả lập */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">Đơn cần giao</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  TransferOrder chờ phân phối · sẽ mapping sang export_notes / store_orders
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="h-8 rounded-full bg-white px-3 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-50"
              >
                Cập nhật lịch giao
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-2 font-semibold">Mã đơn</th>
                      <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                      <th className="px-2 py-2 font-semibold text-center">SL</th>
                      <th className="px-4 py-2 font-semibold">Điểm đến</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {transferOrders.map((o) => (
                      <tr key={o.orderId} className="hover:bg-amber-50/40">
                        <td className="px-4 py-2 font-semibold text-stone-900">{o.orderId}</td>
                        <td className="px-4 py-2 text-stone-800">{o.itemName}</td>
                        <td className="px-2 py-2 text-center text-stone-800">{o.quantity}</td>
                        <td className="px-4 py-2 text-stone-700">{o.customer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Hành động nhanh */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Hành động nhanh</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Truy cập nhanh tới các màn hình Supply
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Button className="w-full justify-start rounded-lg bg-amber-500 text-xs text-white hover:bg-amber-600">
                <Package className="mr-2 size-4" />
                Tổng hợp đơn (Order Aggregation)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start rounded-lg border-amber-200 text-xs text-amber-800 hover:bg-amber-50"
              >
                <CalendarClock className="mr-2 size-4" />
                Xem lịch giao (Delivery Schedule)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start rounded-lg border-amber-200 text-xs text-amber-800 hover:bg-amber-50"
              >
                <AlertTriangle className="mr-2 size-4" />
                Báo sự cố (Issue Handling)
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Hoạt động gần đây – col-span-2 giống layout Admin/Manager */}
          <Card className="border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Hoạt động giao nhận gần đây
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Nhật ký actions của Supply / kho / giao nhận
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

          {/* Tóm tắt nhanh – card nhỏ bên phải để cân layout */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Tóm tắt đơn Supply
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Phân loại nhanh PO / Transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Đơn mua (PO)</span>
                <span className="font-semibold text-stone-900">
                  {mockRecentOrders.filter((o) => o.orderType === 'PO').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Chuyển kho (Transfer)</span>
                <span className="font-semibold text-stone-900">{totalTransferOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Tổng đơn</span>
                <span className="font-semibold text-stone-900">{totalOrders}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupplyDashboard;
