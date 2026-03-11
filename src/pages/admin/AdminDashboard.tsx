import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/layout';
import { ADMIN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService, type StoreResponse, type UserResponse } from '@/services/adminServices';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Building2,
  Plus,
  RefreshCcw,
  Shield,
  Sparkles,
  Store,
  Users,
  UserX,
} from 'lucide-react';

type LoadState = 'idle' | 'loading' | 'error';

async function fetchAllPages<T>(fetchPage: (page: number) => Promise<{ items: T[]; totalPages?: number }>) {
  const items: T[] = [];
  let page = 0;
  let totalPages = 1;

  const HARD_PAGE_CAP = 50;

  while (page < totalPages && page < HARD_PAGE_CAP) {
    const res = await fetchPage(page);
    items.push(...res.items);
    totalPages = Math.max(1, Number(res.totalPages ?? totalPages));
    page += 1;
  }

  return items;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);

  const refresh = async () => {
    setLoadState('loading');
    try {
      const [allUsers, allStores] = await Promise.all([
        fetchAllPages<UserResponse>(async (page) => {
          const resp = await adminService.getAllUsers(page, 100);
          const data = resp.data?.data;
          return { items: data?.items ?? [], totalPages: data?.totalPages ?? 1 };
        }),
        fetchAllPages<StoreResponse>(async (page) => {
          const resp = await adminService.getAllStores(page, 100);
          const data = resp.data?.data;
          return { items: data?.items ?? [], totalPages: data?.totalPages ?? 1 };
        }),
      ]);

      setUsers(allUsers);
      setStores(allStores);
      setLoadState('idle');
    } catch (e) {
      console.error(e);
      setLoadState('error');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
    const inactiveUsers = totalUsers - activeUsers;
    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.status === 'ACTIVE').length;
    const inactiveStores = totalStores - activeStores;

    const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});

    const staffByStoreId = users.reduce<Record<number, number>>((acc, u) => {
      const sid = Number(u.storeId);
      if (!Number.isFinite(sid) || sid <= 0) return acc;
      acc[sid] = (acc[sid] ?? 0) + 1;
      return acc;
    }, {});

    const activeStoresNoStaff = stores.filter((s) => s.status === 'ACTIVE' && (staffByStoreId[s.storeId] ?? 0) === 0);
    const storesInactiveButHasStaff = stores.filter(
      (s) => s.status === 'INACTIVE' && (staffByStoreId[s.storeId] ?? 0) > 0
    );
    const staffNoStore = users.filter((u) => !Number.isFinite(Number(u.storeId)) || Number(u.storeId) <= 0);

    const staffHealth = stores
      .map((s) => ({ store: s, count: staffByStoreId[s.storeId] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const recentActivity = [
      { time: '10:15', text: 'Tạo user staff.hn.03', tone: 'good' as const },
      { time: '09:40', text: 'Khóa user manager.old', tone: 'warn' as const },
      { time: '09:10', text: 'Store Quận 9 → INACTIVE', tone: 'warn' as const },
      { time: '08:55', text: 'Tạo store Bình Tân', tone: 'good' as const },
    ];

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStores,
      activeStores,
      inactiveStores,
      roleCounts,
      activeStoresNoStaff,
      storesInactiveButHasStaff,
      staffNoStore,
      staffHealth,
      recentActivity,
    };
  }, [users, stores]);

  const roleRows = useMemo(() => {
    const entries = Object.entries(metrics.roleCounts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([role, count]) => ({ role, count, pct: (count / max) * 100 }));
  }, [metrics.roleCounts]);

  const storeStatusRows = useMemo(() => {
    const total = Math.max(1, metrics.totalStores);
    return [
      { label: 'ACTIVE', count: metrics.activeStores, pct: (metrics.activeStores / total) * 100, tone: 'ok' as const },
      {
        label: 'INACTIVE',
        count: metrics.inactiveStores,
        pct: (metrics.inactiveStores / total) * 100,
        tone: 'muted' as const,
      },
    ];
  }, [metrics.activeStores, metrics.inactiveStores, metrics.totalStores]);

  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <div className="space-y-5">
        {/* Header */}
        <div className="relative flex items-center overflow-hidden rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 shadow-sm">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/15 to-transparent" />
          <div className="relative flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/25 shadow-sm">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-white md:text-base">
                  ADMIN DASHBOARD
                </h1>
                <p className="mt-0.5 truncate text-xs leading-tight text-amber-50/90">
                  Quản trị tài khoản và cửa hàng
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={refresh}
              disabled={loadState === 'loading'}
              className="h-8 border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white text-xs"
            >
              <RefreshCcw className={cn('mr-1.5 size-3.5', loadState === 'loading' && 'animate-spin')} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">Tổng User</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{metrics.totalUsers}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-stone-500">Tổng tài khoản hệ thống</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-emerald-200/60 bg-white shadow-lg shadow-emerald-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-emerald-600" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Shield className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/90">
                    User ACTIVE
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{metrics.activeUsers}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                    {metrics.totalUsers ? `${((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}%` : '0%'}{' '}
                    hoạt động
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/70 bg-white shadow-lg shadow-amber-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
                  <Store className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">Tổng Store</p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{metrics.totalStores}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-stone-500">Tổng cửa hàng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-emerald-200/60 bg-white shadow-lg shadow-emerald-500/5 transition hover:shadow-xl">
            <CardContent className="relative p-0">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-emerald-600" />
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/90">
                    Store ACTIVE
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-stone-900">{metrics.activeStores}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                    {metrics.totalStores ? `${((metrics.activeStores / metrics.totalStores) * 100).toFixed(1)}%` : '0%'}{' '}
                    hoạt động
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phân bố role + trạng thái store */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Phân bố tài khoản theo role</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Tính theo danh sách users hiện tại
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {roleRows.length === 0 ? (
                <div className="text-sm text-stone-500">Chưa có dữ liệu role.</div>
              ) : (
                roleRows.map((r) => (
                  <div key={r.role} className="flex items-center gap-3">
                    <div className="w-44 text-xs font-semibold text-stone-800">{r.role}</div>
                    <div className="flex-1">
                      <div className="h-2.5 rounded-full bg-amber-50 overflow-hidden border border-amber-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs font-bold text-stone-800">{r.count}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Trạng thái cửa hàng</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Tỷ lệ ACTIVE / INACTIVE (donut)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="size-24 shrink-0 rounded-full border-4 border-white shadow-inner"
                  style={{
                    background: `conic-gradient(#10b981 0% ${
                      storeStatusRows[0]?.pct ?? 0
                    }%, #d6d3d1 ${storeStatusRows[0]?.pct ?? 0}% 100%)`,
                  }}
                />
                <div className="flex-1 space-y-2">
                  {storeStatusRows.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'size-2.5 rounded-full',
                            s.tone === 'ok' ? 'bg-emerald-500' : 'bg-stone-400'
                          )}
                        />
                        {s.label}
                      </span>
                      <span className="font-semibold text-stone-800">
                        {s.count}{' '}
                        <span className="font-normal text-stone-500">({s.pct.toFixed(1)}
                        %)</span>
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 text-[11px] text-stone-500">
                    Tổng:{' '}
                    <span className="font-semibold text-stone-800">
                      {metrics.totalStores}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cảnh báo + sức khỏe nhân sự */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Cảnh báo quản trị</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Gợi ý kiểm tra chất lượng dữ liệu
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex items-start gap-2 text-stone-700">
                <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
                <div>
                  <span className="font-semibold">{metrics.activeStoresNoStaff.length}</span> store chưa có staff
                </div>
              </div>
              <div className="flex items-start gap-2 text-stone-700">
                <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
                <div>
                  <span className="font-semibold">{metrics.staffNoStore.length}</span> staff chưa gán store
                </div>
              </div>
              <div className="flex items-start gap-2 text-stone-700">
                <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
                <div>
                  <span className="font-semibold">
                    {metrics.storesInactiveButHasStaff.length}
                  </span>{' '}
                  store INACTIVE còn staff
                </div>
              </div>
              <div className="flex items-start gap-2 text-stone-700">
                <UserX className="mt-0.5 size-4 text-rose-500" />
                <div>
                  <span className="font-semibold">{metrics.inactiveUsers}</span> user đang INACTIVE
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">
                Sức khỏe phân bổ nhân sự cửa hàng
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Top store theo số staff (cảnh báo khi = 0)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {metrics.staffHealth.length === 0 ? (
                <div className="text-sm text-stone-500">Chưa có dữ liệu cửa hàng.</div>
              ) : (
                metrics.staffHealth.map(({ store, count }) => (
                  <div
                    key={store.storeId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-stone-900">{store.storeName}</div>
                      <div className="text-[11px] text-stone-500">
                        {store.status} · ID #{store.storeId}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                        count === 0
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {count} staff{count === 0 ? ' · Cảnh báo' : ''}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Thao tác nhanh */}
        <div className="grid gap-6">
          <Card className="border-amber-100 bg-white shadow-md">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="text-sm font-bold text-amber-900">Thao tác nhanh</CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Điều hướng nhanh tới các trang quản trị
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="h-11 justify-start gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md"
              >
                <Plus className="size-4" />
                Tạo tài khoản
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/admin/stores')}
                className="h-11 justify-start gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md"
              >
                <Plus className="size-4" />
                Tạo cửa hàng
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                className="h-11 justify-start gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
              >
                <UserX className="size-4 text-rose-500" />
                Xem user bị khóa
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/stores')}
                className="h-11 justify-start gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
              >
                <Store className="size-4 text-stone-600" />
                Xem store inactive
              </Button>
            </CardContent>
          </Card>
        </div>

        {loadState === 'error' && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Không tải được dữ liệu từ API. Bạn có thể bấm “Làm mới” để thử lại.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
