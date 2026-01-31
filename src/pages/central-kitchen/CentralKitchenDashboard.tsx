import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LayoutDashboard,
  ChefHat,
  Package,
  ClipboardList,
  Boxes,
} from 'lucide-react';
import {
  mockOrdersByDay,
  mockRecentOrders,
  mockActivity,
} from '@/services/mockDashboardData';

const centralNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Xử lý đơn', href: '#', icon: Package },
  { label: 'Kế hoạch sản xuất', href: '#', icon: ClipboardList },
  { label: 'Nguyên liệu', href: '#', icon: Boxes },
  { label: 'Trạng thái sản xuất', href: '#', icon: ChefHat },
];

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

const CentralKitchenDashboard = () => {
  const maxOrders = Math.max(...mockOrdersByDay.map((d) => d.count));

  return (
    <DashboardLayout navItems={centralNavItems} roleLabel="CENTRAL_KITCHEN">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Package className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn chờ xử lý</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <ChefHat className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang sản xuất</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Boxes className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nguyên liệu thấp</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Đơn theo ngày</CardTitle>
              <CardDescription>ProductionOrder tuần này</CardDescription>
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

          <Card className="border-border bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
              <CardDescription>TransferOrder từ cửa hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Mã đơn</th>
                      <th className="pb-3 font-medium">Sản phẩm</th>
                      <th className="pb-3 font-medium">SL</th>
                      <th className="pb-3 font-medium">Chi nhánh</th>
                      <th className="pb-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentOrders.map((o) => (
                      <tr key={o.orderId} className="border-b border-border/50">
                        <td className="py-3 font-medium">{o.orderId}</td>
                        <td className="py-3">{o.itemName}</td>
                        <td className="py-3">{o.quantity}</td>
                        <td className="py-3">{o.customer}</td>
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
                Xử lý đơn
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

export default CentralKitchenDashboard;
