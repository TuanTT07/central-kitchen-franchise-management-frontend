import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { ADMIN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { adminService, type StoreResponse, type UserResponse } from '@/services/adminServices';
import { cn } from '@/lib/utils';
import { translateRole, translateStatus } from '@/utils/labelMapping';
import { DEFAULT_API_PAGE_SIZE, fetchAllPages } from '@/utils/pagination';
import { Role } from '@/Types';
import {
  AlertTriangle,
  Building2,
  RefreshCcw,
  Shield,
  Store,
  Users,
  UserX,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

type LoadState = 'idle' | 'loading' | 'error';
const AdminDashboard = () => {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);

  const refresh = async () => {
    setLoadState('loading');
    try {
      const [allUsers, allStores] = await Promise.all([
        fetchAllPages<UserResponse>({
          fetchPage: async (page, size) => {
            const resp = await adminService.getAllUsers(page, size);
            const data = resp.data?.data;
            return { items: data?.items ?? [], totalPages: data?.totalPages ?? 1 };
          },
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
        fetchAllPages<StoreResponse>({
          fetchPage: async (page, size) => {
            const resp = await adminService.getAllStores(page, size);
            const data = resp.data?.data;
            return { items: data?.items ?? [], totalPages: data?.totalPages ?? 1 };
          },
          pageSize: DEFAULT_API_PAGE_SIZE,
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
      if (u.role !== Role.FRANCHISE_STORE_STAFF) return acc;
      const sid = Number(u.storeId);
      if (!Number.isFinite(sid) || sid <= 0) return acc;
      acc[sid] = (acc[sid] ?? 0) + 1;
      return acc;
    }, {});

    const activeStoresNoStaff = stores.filter(
      (s) => s.status === 'ACTIVE' && (staffByStoreId[s.storeId] ?? 0) === 0
    );
    const storesInactiveButHasStaff = stores.filter(
      (s) => s.status === 'INACTIVE' && (staffByStoreId[s.storeId] ?? 0) > 0
    );
    const staffNoStore = users.filter(
      (u) =>
        u.role === Role.FRANCHISE_STORE_STAFF &&
        (!Number.isFinite(Number(u.storeId)) || Number(u.storeId) <= 0)
    );
    const staffHealth = stores
      .map((s) => ({ store: s, count: staffByStoreId[s.storeId] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalUsers, activeUsers, inactiveUsers,
      totalStores, activeStores, inactiveStores,
      roleCounts, activeStoresNoStaff, storesInactiveButHasStaff,
      staffNoStore, staffHealth,
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
      { label: 'ACTIVE', count: metrics.activeStores, pct: (metrics.activeStores / total) * 100 },
      { label: 'INACTIVE', count: metrics.inactiveStores, pct: (metrics.inactiveStores / total) * 100 },
    ];
  }, [metrics]);

  if (loadState === 'loading') {
    return (
      <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Đang tải dữ liệu...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <div className="min-h-screen bg-slate-50/60">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">

          {/* ── TOOLBAR ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Quản trị hệ thống</h1>
              <p className="text-sm text-stone-500">Tổng quan tài khoản và cửa hàng</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loadState !== 'idle'}
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
            >
              <RefreshCcw className={cn('size-4 text-amber-600', loadState !== 'idle' && 'animate-spin')} />
              Làm mới
            </button>
          </div>

          {loadState === 'error' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Không tải được dữ liệu từ API. Vui lòng bấm "Làm mới" để thử lại.
            </div>
          )}

          {/* ── KPI CARDS ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Users}    label="Tổng tài khoản"       value={String(metrics.totalUsers)}  sub="Tài khoản hệ thống"  color="amber" />
            <KpiCard icon={Shield}   label="Tài khoản hoạt động"  value={String(metrics.activeUsers)} sub={`${metrics.totalUsers ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1) : 0}% hoạt động`} color="green" />
            <KpiCard icon={Store}    label="Tổng cửa hàng"        value={String(metrics.totalStores)} sub="Cửa hàng hệ thống"   color="amber" />
            <KpiCard icon={Building2} label="Cửa hàng hoạt động"  value={String(metrics.activeStores)} sub={`${metrics.totalStores ? ((metrics.activeStores / metrics.totalStores) * 100).toFixed(1) : 0}% hoạt động`} color="green" />
          </div>

          {/* ── CHARTS ROW ── */}
          <div className="grid gap-5 lg:grid-cols-2">

            {/* Phân bố role */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Users className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Phân bố tài khoản theo vai trò</p>
                  <p className="text-[11px] text-stone-500">Tính theo danh sách tài khoản hiện tại</p>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4">
                {roleRows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-stone-400">Chưa có dữ liệu.</p>
                ) : roleRows.map((r) => (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs font-semibold text-stone-700">
                      {translateRole(r.role)}
                    </span>
                    <div className="flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-bold text-stone-700">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trạng thái cửa hàng */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Store className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Trạng thái cửa hàng</p>
                  <p className="text-[11px] text-stone-500">Tỷ lệ hoạt động / ngừng</p>
                </div>
              </div>
              <div className="flex items-center gap-6 px-5 py-4">
                <div
                  className="size-24 shrink-0 rounded-full border-4 border-white shadow-md"
                  style={{
                    background: `conic-gradient(#f59e0b 0% ${storeStatusRows[0]?.pct ?? 0}%, #d6d3d1 ${storeStatusRows[0]?.pct ?? 0}% 100%)`,
                  }}
                />
                <div className="flex-1 space-y-2.5">
                  {storeStatusRows.map((s, i) => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-stone-600">
                        <span className={cn('size-2.5 rounded-full', i === 0 ? 'bg-amber-400' : 'bg-stone-400')} />
                        {translateStatus(s.label)}
                      </span>
                      <span className="font-bold text-stone-800">
                        {s.count} <span className="font-normal text-stone-400">({s.pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                    Tổng: <span className="font-bold text-stone-800">{metrics.totalStores}</span> cửa hàng
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ALERTS + STAFF HEALTH ── */}
          <div className="grid gap-5 lg:grid-cols-2">

            {/* Cảnh báo */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Cảnh báo quản trị</p>
                  <p className="text-[11px] text-stone-500">Gợi ý kiểm tra chất lượng dữ liệu</p>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                <AlertRow
                  count={metrics.activeStoresNoStaff.length}
                  text="cửa hàng chưa có nhân viên"
                  warn={metrics.activeStoresNoStaff.length > 0}
                />
                <AlertRow
                  count={metrics.staffNoStore.length}
                  text="nhân viên chưa gán cửa hàng"
                  warn={metrics.staffNoStore.length > 0}
                />
                <AlertRow
                  count={metrics.storesInactiveButHasStaff.length}
                  text="cửa hàng ngừng hoạt động nhưng còn nhân viên"
                  warn={metrics.storesInactiveButHasStaff.length > 0}
                />
                <AlertRow
                  count={metrics.inactiveUsers}
                  text="tài khoản đang ngừng hoạt động"
                  warn={false}
                  icon={<UserX className="size-4 text-stone-400" />}
                />
              </div>
            </div>

            {/* Sức khỏe nhân sự */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Building2 className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Sức khỏe phân bổ nhân sự</p>
                  <p className="text-[11px] text-stone-500">Top cửa hàng theo số nhân viên</p>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {metrics.staffHealth.length === 0 ? (
                  <p className="py-10 text-center text-sm text-stone-400">Chưa có dữ liệu.</p>
                ) : metrics.staffHealth.map(({ store, count }) => (
                  <div key={store.storeId} className="flex items-center gap-3 px-5 py-3 transition hover:bg-amber-50/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">{store.storeName}</p>
                      <p className="text-[11px] text-stone-400">
                        {translateStatus(store.status)} · ID #{store.storeId}
                      </p>
                    </div>
                    <span className={cn(
                      'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      count === 0
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    )}>
                      {count} nhân viên{count === 0 ? ' · Cảnh báo' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── KPI Card ── */
function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: 'amber' | 'green';
}) {
  const palette = {
    amber: { border: 'border-amber-100', icon: 'bg-amber-100 text-amber-600', num: 'text-amber-700', dot: 'bg-amber-500' },
    green: { border: 'border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', num: 'text-emerald-700', dot: 'bg-emerald-500' },
  }[color];

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md', palette.border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className={cn('mt-2 text-3xl font-extrabold', palette.num)}>{value}</p>
          <p className="mt-0.5 text-[11px] text-stone-400">{sub}</p>
        </div>
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl shadow-inner', palette.icon)}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className={cn('pointer-events-none absolute -bottom-3 -right-3 size-16 rounded-full opacity-[0.08]', palette.dot)} />
    </div>
  );
}

/* ── Alert Row ── */
function AlertRow({
  count, text, warn, icon,
}: {
  count: number;
  text: string;
  warn: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {icon ?? (
        warn
          ? <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          : <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
      )}
      <span className="text-sm text-stone-700">
        <span className={cn('font-bold', warn && count > 0 ? 'text-amber-700' : 'text-stone-900')}>{count}</span>{' '}
        {text}
      </span>
    </div>
  );
}

export default AdminDashboard;
