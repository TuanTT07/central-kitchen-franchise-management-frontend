import DashboardLayout from '@/components/layout/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Calendar, Package, AlertTriangle } from 'lucide-react';
import { mockRecentOrders, mockActivity } from '@/services/mockDashboardData';

import { SUPPLY_COORDINATOR_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';

const SupplyDashboard = () => {
  return (
    <DashboardLayout navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Truck className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chuyến giao hôm nay</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Package className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn cần giao</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sự cố chờ xử lý</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Đơn cần giao</CardTitle>
              <CardDescription>TransferOrder chờ phân phối</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Mã đơn</th>
                      <th className="pb-3 font-medium">Sản phẩm</th>
                      <th className="pb-3 font-medium">SL</th>
                      <th className="pb-3 font-medium">Điểm đến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentOrders
                      .filter((o) => o.orderType === 'TRANSFER')
                      .map((o) => (
                        <tr key={o.orderId} className="border-b border-border/50">
                          <td className="py-3 font-medium">{o.orderId}</td>
                          <td className="py-3">{o.itemName}</td>
                          <td className="py-3">{o.quantity}</td>
                          <td className="py-3">{o.customer}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <Button className="mt-4" size="sm">
                Cập nhật lịch giao
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" size="sm">
                <Package className="mr-2 size-4" />
                Tổng hợp đơn
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Calendar className="mr-2 size-4" />
                Xem lịch giao
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <AlertTriangle className="mr-2 size-4" />
                Báo sự cố
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockActivity.map((a) => (
                <div key={a.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                    {a.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.userName}</p>
                    <p className="text-xs text-muted-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SupplyDashboard;
