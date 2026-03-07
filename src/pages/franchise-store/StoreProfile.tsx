import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Store,
  MapPin,
  Phone,
  User,
  Info,
  CheckCircle,
  XCircle,
  Receipt,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Đồng bộ DB (public schema):
 *
 * stores:
 *   store_id (PK, identity), store_name (NOT NULL), address, phone,
 *   is_active (boolean), manager_id (FK users, nullable)
 *
 * users (cho manager): user_id, full_name, user_name, email, role_id (FK role)
 */

interface StoreInfo {
  store_id: number;
  store_name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  manager_id: number | null;
}

interface UserInfo {
  user_id: number;
  full_name: string | null;
  user_name: string;
  email: string | null;
}

const CURRENT_STORE_ID = 1;

const MOCK_STORE: StoreInfo = {
  store_id: 1,
  store_name: 'Cửa hàng phân phối Quận 1',
  address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
  phone: '028 3825 1234',
  is_active: true,
  manager_id: 10,
};

const MOCK_MANAGER: UserInfo = {
  user_id: 10,
  full_name: 'Nguyễn Văn Quản lý',
  user_name: 'manager_q1',
  email: 'manager.q1@example.com',
};

/** Số đơn của cửa hàng (từ store_orders) — giả lập */
const MOCK_ORDER_STATS = {
  total: 24,
  pending: 2,
  approved: 18,
};

function StoreProfile() {
  const manager = MOCK_STORE.manager_id != null ? MOCK_MANAGER : null;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Store className="size-6 text-amber-500" />
              Thông tin cửa hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Thông tin từ bảng stores · manager_id tham chiếu users
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Thông tin cơ bản */}
          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Info className="size-4 text-amber-500" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                stores.store_id, store_name, address, phone, is_active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
                <Store className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Tên cửa hàng
                  </p>
                  <p className="text-sm font-semibold text-stone-900">{MOCK_STORE.store_name}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">ID: {MOCK_STORE.store_id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Địa chỉ
                  </p>
                  <p className="text-sm text-stone-800">
                    {MOCK_STORE.address ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Số điện thoại
                  </p>
                  <p className="text-sm text-stone-800">{MOCK_STORE.phone ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
                {MOCK_STORE.is_active ? (
                  <CheckCircle className="size-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="size-5 shrink-0 text-stone-400" />
                )}
                <div className="flex items-center justify-between gap-2 flex-1">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                      Trạng thái hoạt động
                    </p>
                    <p className="text-sm font-semibold text-stone-900">
                      {MOCK_STORE.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold',
                      MOCK_STORE.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 bg-stone-100 text-stone-600'
                    )}
                  >
                    {MOCK_STORE.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quản lý cửa hàng (stores.manager_id → users) */}
          {manager && (
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <User className="size-4 text-amber-500" />
                  Quản lý cửa hàng
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  stores.manager_id → users (full_name, user_name, email)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                    {manager.full_name?.charAt(0) ?? manager.user_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {manager.full_name ?? manager.user_name}
                    </p>
                    <p className="text-[11px] text-stone-600">@{manager.user_name}</p>
                    {manager.email && (
                      <p className="text-[11px] text-stone-500">{manager.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thống kê nhanh (từ store_orders) */}
          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Receipt className="size-4 text-amber-500" />
                Thống kê đơn hàng
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                store_orders (store_store_id = {CURRENT_STORE_ID}) · giả lập
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-5 text-amber-600" />
                    <span className="text-xs font-medium text-stone-700">Tổng đơn</span>
                  </div>
                  <span className="text-lg font-bold text-amber-900">{MOCK_ORDER_STATS.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Package className="size-5 text-amber-600" />
                    <span className="text-xs font-medium text-stone-700">Chờ duyệt</span>
                  </div>
                  <span className="text-lg font-bold text-amber-900">{MOCK_ORDER_STATS.pending}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-5 text-emerald-600" />
                    <span className="text-xs font-medium text-stone-700">Đã duyệt</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-900">
                    {MOCK_ORDER_STATS.approved}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default StoreProfile;
