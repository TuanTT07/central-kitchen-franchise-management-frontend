import DashboardLayout from '@/components/layout/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, Boxes, UtensilsCrossed, Receipt, Truck } from 'lucide-react';
import { mockRecentOrders, mockActivity } from '@/services/mockDashboardData';
import { FRANCHISEE_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-amber-500 text-white',
  COMPLETED: 'bg-emerald-500 text-white',
  CANCELLED: 'bg-stone-300 text-stone-600',
};

const FranchiseStoreDashboard = () => {
  return (
    <DashboardLayout navItems={FRANCHISEE_SIDEBAR_ITEMS} roleLabel={Role.FRANCHISE_STORE_STAFF}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Receipt className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn chờ xử lý</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Truck className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn đang giao</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Package className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sản phẩm tồn kho</p>
                <p className="text-2xl font-bold">48</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <UtensilsCrossed className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cần đặt hàng</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
              <CardDescription>Các đơn đã tạo từ cửa hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Mã đơn</th>
                      <th className="pb-3 font-medium">Sản phẩm</th>
                      <th className="pb-3 font-medium">SL</th>
                      <th className="pb-3 font-medium">Thành tiền</th>
                      <th className="pb-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentOrders.slice(0, 4).map((o) => (
                      <tr key={o.orderId} className="border-b border-border/50">
                        <td className="py-3 font-medium">{o.orderId}</td>
                        <td className="py-3">{o.itemName}</td>
                        <td className="py-3">{o.quantity}</td>
                        <td className="py-3">{(o.amount / 1000).toFixed(0)}K</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status] ?? 'bg-stone-200'}`}
                          >
                            {statusLabel[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="mt-4" size="sm">
                Tạo đơn mới
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" size="sm">
                <ShoppingCart className="mr-2 size-4" />
                Tạo đơn đặt hàng
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Truck className="mr-2 size-4" />
                Xác nhận nhận hàng
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Boxes className="mr-2 size-4" />
                Kiểm tra tồn kho
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
              {mockActivity.slice(0, 3).map((a) => (
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

export default FranchiseStoreDashboard;
