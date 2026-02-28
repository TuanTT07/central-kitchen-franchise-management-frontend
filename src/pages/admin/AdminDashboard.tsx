import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, Users as UsersIcon, DollarSign, Receipt } from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import {
  mockKpis,
  mockRevenueData,
  mockOrdersByDay,
  mockCategories,
  mockOrderTypes,
  mockRecentOrders,
  mockTrendingItems,
  mockActivity,
} from '@/services/mockDashboardData';
import { cn } from '@/lib/utils';

const statusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusColor: Record<string, string> = {
  DRAFT: 'bg-stone-200 text-stone-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-500 text-white',
  COMPLETED: 'bg-emerald-500 text-white',
  CANCELLED: 'bg-stone-300 text-stone-600',
};

const AdminDashboard = () => {
  const [revenuePeriod, setRevenuePeriod] = useState('8 tháng');
  const [ordersPeriod, setOrdersPeriod] = useState('Tuần này');
  const maxOrders = Math.max(...mockOrdersByDay.map((d) => d.count));
  const maxRevenue = Math.max(...mockRevenueData.flatMap((d) => [d.income, d.expense]));

  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <Receipt className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                <p className="text-2xl font-bold">{mockKpis.totalOrders.value.toLocaleString()}</p>
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <TrendingUp className="size-4" />+{mockKpis.totalOrders.trend}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <UsersIcon className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chi nhánh</p>
                <p className="text-2xl font-bold">{mockKpis.totalLocations.value}</p>
                <span className="flex items-center gap-1 text-sm text-stone-500">— so với tháng trước</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-white">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
                <DollarSign className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold">${mockKpis.totalRevenue.value.toLocaleString()}</p>
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <TrendingUp className="size-4" />+{mockKpis.totalRevenue.trend}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="border-border bg-white lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Tổng doanh thu</CardTitle>
                <CardDescription>$184,839</CardDescription>
              </div>
              <select
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value)}
                className="rounded-md border border-border px-3 py-1.5 text-sm"
              >
                <option>8 tháng gần nhất</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-end gap-2">
                {mockRevenueData.map((point, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 flex-col justify-end gap-0.5">
                      <div
                        className="w-full rounded-t bg-amber-500 opacity-90"
                        style={{
                          height: `${(point.income / maxRevenue) * 100}%`,
                          minHeight: '4px',
                        }}
                      />
                      <div
                        className="w-full rounded-t bg-stone-400 opacity-70"
                        style={{
                          height: `${(point.expense / maxRevenue) * 100}%`,
                          minHeight: '4px',
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{point.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4">
                <span className="flex items-center gap-2 text-sm">
                  <span className="size-3 rounded-full bg-amber-500" />
                  Thu nhập
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="size-3 rounded-full bg-stone-400" />
                  Chi phí
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Orders Overview */}
          <Card className="border-border bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Đơn hàng theo ngày</CardTitle>
              <select
                value={ordersPeriod}
                onChange={(e) => setOrdersPeriod(e.target.value)}
                className="rounded-md border border-border px-2 py-1 text-xs"
              >
                <option>Tuần này</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-end gap-2">
                {mockOrdersByDay.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-t transition-colors',
                        d.count === 185 ? 'bg-amber-500' : 'bg-amber-100'
                      )}
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
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Categories */}
          <Card className="border-border bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Loại sản phẩm</CardTitle>
              <select className="rounded-md border border-border px-2 py-1 text-xs">
                <option>Tháng này</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="size-28 shrink-0 rounded-full border-4 border-white shadow-inner"
                  style={{
                    background: `conic-gradient(
                      #f59e0b 0% 30%,
                      #fde68a 30% 55%,
                      #d6d3d1 55% 80%,
                      #78716c 80% 100%
                    )`,
                  }}
                />
                <div className="flex-1 space-y-2">
                  {mockCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={cn('size-2.5 rounded-full', cat.color)} />
                        {cat.name}
                      </span>
                      <span className="font-medium">{cat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Types */}
          <Card className="border-border bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Loại đơn hàng</CardTitle>
              <select className="rounded-md border border-border px-2 py-1 text-xs">
                <option>Tháng này</option>
              </select>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockOrderTypes.map((ot) => (
                <div key={ot.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <Package className="size-4 text-muted-foreground" />
                    {ot.name}
                  </span>
                  <div className="text-right">
                    <span className="font-medium">{ot.percent}%</span>
                    <span className="ml-1 text-xs text-muted-foreground">{ot.count} đơn</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivity.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                      {a.userName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{a.userName}</span>{' '}
                        <span className="text-muted-foreground">({a.roleName})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{a.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="border-border bg-white lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="Tìm kiếm..." className="h-8 w-40 text-sm" />
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </div>
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
                        <td className="py-3">{(o.amount / 1000).toFixed(0)}K</td>
                        <td className="py-3">{o.customer}</td>
                        <td className="py-3">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              statusColor[o.status] ?? 'bg-stone-200'
                            )}
                          >
                            {statusLabel[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Trending Items */}
          <Card className="border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Sản phẩm phổ biến</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockTrendingItems.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border border-border p-2">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-2xl">
                    🍽️
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      <span className="text-amber-500">★</span> {item.rating} ({item.reviewCount})
                    </p>
                    <p className="font-medium text-amber-600">{(item.price / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
