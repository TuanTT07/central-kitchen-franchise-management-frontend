import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { ADMIN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService, type StoreResponse, type UserResponse } from '@/services/adminServices';
import { cn } from '@/lib/utils';
import { AlertTriangle, Building2, RefreshCcw, Shield, Store, Users, UserX, Loader2 } from 'lucide-react';

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

  if (loadState === 'loading') {
    return (
      <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Quản trị hệ thống
              </h1>
              <p className="text-sm text-slate-500 sm:text-base">
                Tổng quan tài khoản và cửa hàng.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={refresh}
              disabled={loadState !== 'idle'}
              className="h-9 shrink-0 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className={cn('mr-2 h-4 w-4', loadState !== 'idle' && 'animate-spin')} />
              Làm mới dữ liệu
            </Button>
          </header>

          {loadState === 'error' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Không tải được dữ liệu từ API. Vui lòng bấm “Làm mới dữ liệu” để thử lại.
            </div>
          )}

          {/* KPI Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tổng user
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {metrics.totalUsers}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Tổng tài khoản hệ thống</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      User active
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {metrics.activeUsers}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {metrics.totalUsers
                        ? `${((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}%`
                        : '0%'}{' '}
                      hoạt động
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tổng store
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {metrics.totalStores}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Tổng cửa hàng</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Store className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Store active
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {metrics.activeStores}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {metrics.totalStores
                        ? `${((metrics.activeStores / metrics.totalStores) * 100).toFixed(1)}%`
                        : '0%'}{' '}
                      hoạt động
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Phân bố role + trạng thái store */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Phân bố tài khoản theo role
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Tính theo danh sách users hiện tại
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {roleRows.length === 0 ? (
                  <div className="text-sm text-slate-500">Chưa có dữ liệu role.</div>
                ) : (
                  roleRows.map((r) => (
                    <div key={r.role} className="flex items-center gap-3">
                      <div className="w-44 text-xs font-semibold text-slate-800">{r.role}</div>
                      <div className="flex-1">
                        <div className="h-2.5 overflow-hidden rounded-full border border-amber-100 bg-amber-50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-10 text-right text-xs font-bold text-slate-800">{r.count}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Trạng thái cửa hàng
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Tỷ lệ ACTIVE / INACTIVE (donut)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
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
                        <span className="font-semibold text-slate-800">
                          {s.count}{' '}
                          <span className="font-normal text-slate-500">({s.pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                    ))}
                    <div className="pt-1 text-[11px] text-slate-500">
                      Tổng:{' '}
                      <span className="font-semibold text-slate-800">
                        {metrics.totalStores}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cảnh báo + sức khỏe nhân sự */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Cảnh báo quản trị
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Gợi ý kiểm tra chất lượng dữ liệu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-2 text-sm">
                <div className="flex items-start gap-2 text-slate-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <span className="font-semibold">{metrics.activeStoresNoStaff.length}</span> store chưa có staff
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <span className="font-semibold">{metrics.staffNoStore.length}</span> staff chưa gán store
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <span className="font-semibold">
                      {metrics.storesInactiveButHasStaff.length}
                    </span>{' '}
                    store INACTIVE còn staff
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <UserX className="mt-0.5 h-4 w-4 text-rose-500" />
                  <div>
                    <span className="font-semibold">{metrics.inactiveUsers}</span> user đang INACTIVE
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Sức khỏe phân bổ nhân sự cửa hàng
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Top store theo số staff (cảnh báo khi = 0)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {metrics.staffHealth.length === 0 ? (
                  <div className="text-sm text-slate-500">Chưa có dữ liệu cửa hàng.</div>
                ) : (
                  metrics.staffHealth.map(({ store, count }) => (
                    <div
                      key={store.storeId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{store.storeName}</div>
                        <div className="text-[11px] text-slate-500">
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
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
