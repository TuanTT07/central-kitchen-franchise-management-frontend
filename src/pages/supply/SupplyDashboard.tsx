import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, AlertTriangle, CalendarClock, Loader2 } from 'lucide-react';
import { mockRecentOrders, mockActivity } from '@/services/mockDashboardData';
import { SUPPLY_COORDINATOR_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';

const SupplyDashboard = () => {
  const transferOrders = mockRecentOrders.filter((o) => o.orderType === 'TRANSFER');
  const totalTransferOrders = transferOrders.length;
  const totalOrders = mockRecentOrders.length;

  return (
    <DashboardLayout navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR}>
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Điều phối giao nhận
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Tổng quan đơn cần giao, chuyến giao và hoạt động giao nhận (dữ liệu giả lập).
            </p>
          </header>

          {/* KPI Cards */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Chuyến giao (giả lập)
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {totalTransferOrders}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Dựa trên đơn Transfer trong mockRecentOrders
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Đơn cần điều phối
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {totalOrders}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Tổng PO + Transfer trong mockRecentOrders
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
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
                      Sự cố chờ xử lý
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      2
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Sẽ mapping sang trang xử lý sự cố
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {/* Đơn cần giao – TransferOrder giả lập */}
            <Card className="border-0 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Đơn cần giao
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    TransferOrder chờ phân phối · sẽ mapping sang export_notes / store_orders
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                >
                  Cập nhật lịch giao
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-600">
                        <th className="px-4 py-3 font-semibold">Mã đơn</th>
                        <th className="px-4 py-3 font-semibold">Sản phẩm chính</th>
                        <th className="px-3 py-3 text-center font-semibold">SL</th>
                        <th className="px-4 py-3 font-semibold">Điểm đến</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transferOrders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">{o.orderId}</td>
                          <td className="px-4 py-3 text-slate-800">{o.itemName}</td>
                          <td className="px-3 py-3 text-center text-slate-800">{o.quantity}</td>
                          <td className="px-4 py-3 text-slate-700">{o.customer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tóm tắt nhanh – card nhỏ bên phải để cân layout */}
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Tóm tắt đơn Supply
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Phân loại nhanh PO / Transfer (dữ liệu giả lập)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Đơn mua (PO)</span>
                  <span className="font-semibold text-slate-900">
                    {mockRecentOrders.filter((o) => o.orderType === 'PO').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Chuyển kho (Transfer)</span>
                  <span className="font-semibold text-slate-900">{totalTransferOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tổng đơn</span>
                  <span className="font-semibold text-slate-900">{totalOrders}</span>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupplyDashboard;
