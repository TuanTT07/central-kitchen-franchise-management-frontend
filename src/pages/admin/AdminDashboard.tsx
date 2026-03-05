import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  TrendingUp,
  Users as UsersIcon,
  DollarSign,
  Receipt,
  Sparkles,
} from 'lucide-react';
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
  DRAFT: 'bg-stone-200 text-stone-700 border-stone-300',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-500 text-white border-amber-600 shadow-sm',
  COMPLETED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  CANCELLED: 'bg-stone-200 text-stone-600 border-stone-300',
};

const AdminDashboard = () => {
  const [revenuePeriod, setRevenuePeriod] = useState('8 tháng gần nhất');
  const [ordersPeriod, setOrdersPeriod] = useState('Tuần này');
  const maxOrders = Math.max(...mockOrdersByDay.map((d) => d.count), 1);
  const maxRevenue = Math.max(...mockRevenueData.flatMap((d) => [d.income, d.expense]), 1);

  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <div className="space-y-5">
        {/* Hero banner - đồng bộ màu, bám nghiệp vụ tổng thể hệ thống */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/15 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/25 shadow-sm">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold leading-tight text-white md:text-base">
                Admin · Tổng quan hệ thống bếp trung tâm
              </h1>
              <p className="mt-0.5 truncate text-xs leading-tight text-amber-50/90">
                KPIs toàn hệ thống · đồng bộ với đơn đặt hàng, chi nhánh và sản phẩm trong DB
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
                  <Receipt className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Tổng đơn hệ thống
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">
                    {mockKpis.totalOrders.value.toLocaleString()}
                  </p>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <TrendingUp className="size-3.5" />
                    +{mockKpis.totalOrders.trend}% so với kỳ trước
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md">
                  <UsersIcon className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Chi nhánh hoạt động
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">
                    {mockKpis.totalLocations.value}
                  </p>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500">
                    Quản lý bảng stores & users
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-yellow-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 text-white shadow-md">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                    Tổng giá trị đơn
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">
                    ₫{mockKpis.totalRevenue.value.toLocaleString()}
                  </p>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <TrendingUp className="size-3.5" />
                    +{mockKpis.totalRevenue.trend}% · từ store_orders
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart - đồng bộ ngôn ngữ với DB nhưng vẫn dùng mockRevenueData */}
          <Card className="border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">
                  Tổng giá trị đơn (giả lập)
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Tổng quan income / expense · mapping sang doanh thu & chi phí vận hành
                </CardDescription>
              </div>
              <select
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value)}
                className="rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option>8 tháng gần nhất</option>
              </select>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-48 items-end gap-2">
                {mockRevenueData.map((point, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 flex-col justify-end gap-1">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 shadow-sm"
                        style={{
                          height: `${(point.income / maxRevenue) * 100}%`,
                          minHeight: '6px',
                        }}
                      />
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-stone-400 to-stone-200/90"
                        style={{
                          height: `${(point.expense / maxRevenue) * 100}%`,
                          minHeight: '4px',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-600">{point.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-amber-500" />
                  Thu nhập (Income)
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-stone-400" />
                  Chi phí (Expense)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Orders Overview */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Đơn theo ngày (giả lập)
              </CardTitle>
              <select
                value={ordersPeriod}
                onChange={(e) => setOrdersPeriod(e.target.value)}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option>Tuần này</option>
              </select>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-40 items-end gap-1.5">
                {mockOrdersByDay.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        d.count === maxOrders
                          ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-md'
                          : 'bg-gradient-to-t from-amber-100 to-amber-50'
                      )}
                      style={{
                        height: `${(d.count / maxOrders) * 100}%`,
                        minHeight: '12px',
                      }}
                    />
                    <span className="text-[11px] font-medium text-stone-600">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Categories - liên hệ bảng categories/products */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Loại sản phẩm</CardTitle>
              <select className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option>Tháng này</option>
              </select>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div
                  className="size-24 shrink-0 rounded-full border-4 border-white shadow-inner"
                  style={{
                    background: `conic-gradient(
                      #f59e0b 0% 30%,
                      #fde68a 30% 55%,
                      #d6d3d1 55% 80%,
                      #78716c 80% 100%
                    )`,
                  }}
                />
                <div className="flex-1 space-y-1.5">
                  {mockCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className={cn('size-2.5 rounded-full', cat.color)} />
                        {cat.name}
                      </span>
                      <span className="font-semibold text-stone-800">{cat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Types - mapping loại đơn trong hệ thống */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Loại đơn</CardTitle>
              <select className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option>Tháng này</option>
              </select>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {mockOrderTypes.map((ot) => (
                <div key={ot.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Package className="size-4 text-stone-500" />
                    {ot.name}
                  </span>
                  <div className="text-right text-xs">
                    <span className="font-semibold text-stone-800">{ot.percent}%</span>
                    <span className="ml-1 text-stone-500">{ot.count} đơn</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity - mapping audit từ users/role/store_orders/... */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Hoạt động gần đây</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Audit users · role · store_orders · manufacturing_orders
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {mockActivity.map((a) => (
                  <div
                    key={a.id}
                    className="flex gap-3 rounded-lg border border-amber-50 bg-amber-50/40 px-3 py-2"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-sm">
                      {a.userName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-800">
                        {a.userName}{' '}
                        <span className="font-normal text-amber-800/90">({a.roleName})</span>
                      </p>
                      <p className="text-[11px] text-stone-600">{a.action}</p>
                      <p className="mt-0.5 text-[10px] text-stone-400">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders - mapping store_orders + stores (giả lập) */}
          <Card className="overflow-hidden border-amber-100 bg-white shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Đơn gần đây (giả lập)
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm theo mã / chi nhánh..."
                  className="h-8 w-44 border-amber-200 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-amber-300 text-xs text-amber-800 hover:bg-amber-50"
                >
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-2 font-semibold">Mã đơn</th>
                      <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                      <th className="px-2 py-2 font-semibold text-center">SL</th>
                      <th className="px-2 py-2 font-semibold text-right">Giá trị</th>
                      <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                      <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {mockRecentOrders.map((o) => (
                      <tr key={o.orderId} className="hover:bg-amber-50/40">
                        <td className="px-4 py-2 font-semibold text-stone-900">{o.orderId}</td>
                        <td className="px-4 py-2 text-stone-800">{o.itemName}</td>
                        <td className="px-2 py-2 text-center text-stone-800">{o.quantity}</td>
                        <td className="px-2 py-2 text-right text-stone-900">
                          {(o.amount / 1000).toFixed(0)}K
                        </td>
                        <td className="px-4 py-2 text-stone-700">{o.customer}</td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                              statusColor[o.status] ?? 'bg-stone-200 text-stone-700 border-stone-300'
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

          {/* Trending Items - mapping products/categories (giả lập) */}
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Sản phẩm phổ biến
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Gợi ý mapping sang bảng products/categories trong DB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {mockTrendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-2.5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-base">
                    🍽️
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                    <p className="text-[11px] text-stone-500">{item.category}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px]">
                      <span className="text-amber-500">★</span>
                      <span className="font-medium text-stone-800">{item.rating}</span>
                      <span className="text-stone-400">({item.reviewCount})</span>
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-amber-700">
                      {(item.price / 1000).toFixed(0)}K
                    </p>
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
