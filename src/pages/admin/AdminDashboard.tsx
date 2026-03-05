import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users as UsersIcon,
  Store,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { cn } from '@/lib/utils';

// --- Mock bám đúng schema DB: users, role, stores, store_orders (không có tiền) ---

type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

const MOCK_USERS_COUNT = 24;
const MOCK_STORES_COUNT = 8;
const MOCK_ROLES = ['ADMIN', 'MANAGER', 'SUPPLY_COORDINATOR', 'CENTRAL_KITCHEN_STAFF', 'FRANCHISE_STORE_STAFF'];

const MOCK_STORE_ORDERS = [
  { order_id: 1, order_code: 'SO-20260301-001', store_name: 'Cửa hàng Q1', status: 'APPROVED' as StoreOrderStatus },
  { order_id: 2, order_code: 'SO-20260301-002', store_name: 'Cửa hàng Q3', status: 'PENDING' as StoreOrderStatus },
  { order_id: 3, order_code: 'SO-20260302-001', store_name: 'Cửa hàng Q1', status: 'APPROVED' as StoreOrderStatus },
  { order_id: 4, order_code: 'SO-20260302-002', store_name: 'Cửa hàng Q7', status: 'CANCELLED' as StoreOrderStatus },
];

const MOCK_ORDERS_BY_DAY = [
  { day: 'T2', count: 18 },
  { day: 'T3', count: 22 },
  { day: 'T4', count: 20 },
  { day: 'T5', count: 28 },
  { day: 'T6', count: 25 },
  { day: 'T7', count: 19 },
  { day: 'CN', count: 12 },
];

const MOCK_ACTIVITY = [
  { id: '1', userName: 'Admin', action: 'Thêm tài khoản nhân viên mới', time: '11:20' },
  { id: '2', userName: 'Admin', action: 'Cập nhật quyền vai trò MANAGER', time: '11:00' },
  { id: '3', userName: 'System', action: 'Đăng nhập từ cửa hàng Q3', time: '10:45' },
];

const STORE_ORDER_STATUS_LABEL: Record<StoreOrderStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
};

const STORE_ORDER_STATUS_COLOR: Record<StoreOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  CANCELLED: 'bg-stone-200 text-stone-600 border-stone-300',
};

const AdminDashboard = () => {
  const pendingOrders = useMemo(
    () => MOCK_STORE_ORDERS.filter((o) => o.status === 'PENDING').length,
    []
  );
  const maxOrdersByDay = Math.max(...MOCK_ORDERS_BY_DAY.map((d) => d.count), 1);

  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <div className="space-y-5">
        {/* Hero banner — gọn gàng, chuẩn (theme Admin: indigo) */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-indigo-200/50 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-3 py-2 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-white/25">
              <Sparkles className="size-3 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xs font-semibold leading-tight text-white md:text-sm">
                Quản trị hệ thống · Người dùng, cửa hàng & phân quyền
              </h1>
              <p className="mt-0.5 truncate text-[9px] leading-tight text-indigo-50/90">
                Quản lý tài khoản, chi nhánh và vai trò theo bảng users, stores, role
              </p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="overflow-hidden border-indigo-200/70 bg-white shadow-lg shadow-indigo-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-indigo-600" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-md">
                  <UsersIcon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-600/90">Người dùng</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{MOCK_USERS_COUNT}</p>
                  <p className="text-[10px] text-stone-500">bảng users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-violet-200/70 bg-white shadow-lg shadow-violet-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-violet-500 to-violet-600" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-md">
                  <Store className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-violet-600/90">Cửa hàng</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{MOCK_STORES_COUNT}</p>
                  <p className="text-[10px] text-stone-500">bảng stores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-indigo-200/70 bg-white shadow-lg shadow-indigo-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
                  <Shield className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-600/90">Đơn chờ duyệt</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{pendingOrders}</p>
                  <p className="text-[10px] text-stone-500">store_orders PENDING</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Đơn theo ngày */}
          <Card className="border-indigo-100 bg-white shadow-md">
            <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                <TrendingUp className="size-4 text-indigo-600" />
                Đơn yêu cầu theo ngày
              </CardTitle>
              <CardDescription className="text-[10px] text-indigo-700/80">Tuần này · store_orders</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex h-36 items-end gap-1.5">
                {MOCK_ORDERS_BY_DAY.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        d.count === maxOrdersByDay
                          ? 'bg-gradient-to-t from-indigo-500 to-indigo-400 shadow-md'
                          : 'bg-gradient-to-t from-indigo-100 to-indigo-50'
                      )}
                      style={{
                        height: `${Math.max((d.count / maxOrdersByDay) * 100, 12)}%`,
                        minHeight: '24px',
                      }}
                    />
                    <span className="text-[10px] font-medium text-stone-600">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vai trò */}
          <Card className="border-indigo-100 bg-white shadow-md">
            <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                <Shield className="size-4 text-indigo-600" />
                Vai trò hệ thống
              </CardTitle>
              <CardDescription className="text-[10px] text-indigo-700/80">bảng role</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5">
                {MOCK_ROLES.map((role, i) => (
                  <li
                    key={role}
                    className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-stone-800">{role}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                      {i + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Hành động nhanh */}
          <Card className="border-indigo-100 bg-white shadow-md">
            <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-indigo-900">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-4">
              <Button className="w-full justify-start gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 py-4 text-sm text-white shadow-md hover:from-indigo-600 hover:to-violet-600">
                <UsersIcon className="size-4" />
                Quản lý người dùng
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg border-indigo-200 py-4 text-xs text-indigo-800 hover:bg-indigo-50"
              >
                <Store className="size-4" />
                Quản lý cửa hàng
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg border-indigo-200 py-4 text-xs text-indigo-800 hover:bg-indigo-50"
              >
                <Shield className="size-4" />
                Phân quyền
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-indigo-100 bg-white shadow-md">
            <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 py-3">
              <CardTitle className="text-sm font-bold text-indigo-900">Đơn yêu cầu gần đây</CardTitle>
              <CardDescription className="text-[10px] text-indigo-700/80">store_orders · không có tiền</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-indigo-50">
                {MOCK_STORE_ORDERS.map((o) => (
                  <li
                    key={o.order_id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-indigo-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900">{o.order_code}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">{o.store_name}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                        STORE_ORDER_STATUS_COLOR[o.status]
                      )}
                    >
                      {STORE_ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-indigo-100 bg-white shadow-md">
            <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 py-3">
              <CardTitle className="text-sm font-bold text-indigo-900">Hoạt động gần đây</CardTitle>
              <CardDescription className="text-[10px] text-indigo-700/80">Quản lý tài khoản & quyền</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-indigo-50">
                {MOCK_ACTIVITY.map((a) => (
                  <li key={a.id} className="flex gap-3 px-4 py-3 transition hover:bg-indigo-50/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-xs font-bold text-white shadow-sm">
                      {a.userName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-stone-800">{a.action}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
