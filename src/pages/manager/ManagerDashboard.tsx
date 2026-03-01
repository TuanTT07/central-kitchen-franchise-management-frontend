import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Boxes, UtensilsCrossed, BookOpen, BarChart3, Package } from 'lucide-react';
import { mockOrdersByDay, mockCategories, mockRecentOrders, mockActivity } from '@/services/mockDashboardData';
import { MANAGER_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';

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

const ManagerDashboard = () => {
  const maxOrders = Math.max(...mockOrdersByDay.map((d) => d.count));

  return (
    <DashboardLayout navItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Boxes className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tồn kho tổng</p>
                <p className="text-2xl font-bold">1,248</p>
                <p className="text-xs text-muted-foreground">đơn vị</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Package className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn trong ngày</p>
                <p className="text-2xl font-bold">42</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <UtensilsCrossed className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sản phẩm</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Đơn hàng theo ngày</CardTitle>
              <CardDescription>Tuần này</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-end gap-2">
                {mockOrdersByDay.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${d.count === 185 ? 'bg-amber-500' : 'bg-amber-100'}`}
                      style={{
                        height: `${(d.count / maxOrders) * 100}%`,
                        minHeight: '8px',
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Loại sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="size-24 shrink-0 rounded-full border-4 border-white shadow-inner"
                  style={{
                    background: `conic-gradient(#f59e0b 0% 30%, #fde68a 30% 55%, #d6d3d1 55% 80%, #78716c 80% 100%)`,
                  }}
                />
                <div className="flex-1 space-y-1.5">
                  {mockCategories.map((cat) => (
                    <div key={cat.name} className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="font-medium">{cat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" size="sm">
                <BarChart3 className="mr-2 size-4" />
                Xuất báo cáo
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <BookOpen className="mr-2 size-4" />
                Cập nhật công thức
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Boxes className="mr-2 size-4" />
                Kiểm kê tồn kho
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Đơn gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockRecentOrders.slice(0, 3).map((o) => (
                  <div
                    key={o.orderId}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{o.orderId}</p>
                      <p className="text-xs text-muted-foreground">{o.itemName}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[o.status] ?? 'bg-stone-200'}`}>
                      {statusLabel[o.status] ?? o.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActivity.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                      {a.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
