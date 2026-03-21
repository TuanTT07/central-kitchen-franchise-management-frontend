import { useEffect, useState } from 'react';
import { Store, MapPin, Phone, CheckCircle2, User2, IdCard, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { franchiseServices, type OrderResponse, type OrderDetailResponse } from '@/services/franchiseServices';
import { adminService } from '@/services/adminServices';
import { cn } from '@/lib/utils';

interface StoreBasicInfo {
  storeId: number;
  storeName: string;
  address?: string;
  phone?: string;
}

function StoreProfile() {
  const { user, userName } = useAuth();

  const [storeInfo, setStoreInfo] = useState<StoreBasicInfo | null>(null);
  const [, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveUserAndStore = () => {
    let u: any = user;
    if (!u) {
      try {
        const raw = localStorage.getItem('user');
        if (raw) u = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    return u;
  };

  useEffect(() => {
    franchiseServices
      .getOrders(0, 200)
      .then(async (res) => {
        if (res.success && res.data) {
          const items = res.data.items ?? [];
          setOrders(items);
          if (items.length > 0 && items[0].storeId && items[0].storeName) {
            const baseStoreInfo: StoreBasicInfo = {
              storeId: items[0].storeId,
              storeName: items[0].storeName,
            };

            try {
              const storeRes = await adminService.getStoreById(items[0].storeId);
              if (storeRes.data.success && storeRes.data.data) {
                const storeData = storeRes.data.data;
                setStoreInfo({
                  ...baseStoreInfo,
                  address: storeData.address,
                  phone: storeData.phone,
                });
                return;
              }
            } catch {
              // Keep base info if store detail endpoint is unavailable for this role.
            }

            setStoreInfo(baseStoreInfo);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const currentUser = resolveUserAndStore();
  const userId = Number(currentUser?.id);
  const userUsername = currentUser?.username ?? currentUser?.userName ?? '—';
  const userEmail = currentUser?.email ?? '—';
  const userFullName = currentUser?.userFullName ?? currentUser?.fullName ?? userName ?? '—';

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="size-10 animate-spin text-amber-500" />
        <p className="text-sm font-medium text-amber-700">Đang tải thông tin cửa hàng...</p>
      </div>
    );
  }

  const avatarInitial = userFullName !== '—' ? userFullName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-full space-y-6 p-1">
      {/* ── BOTTOM GRID: Store Info + Account Info ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Store detail card */}
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
              <Store className="size-4 text-amber-600" />
            </div>
            <h2 className="font-bold text-stone-800">Chi tiết cửa hàng</h2>
          </div>

          {storeInfo ? (
            <div className="space-y-3">
              <InfoRow icon={Store} label="Tên cửa hàng" value={storeInfo.storeName} />
              <InfoRow icon={IdCard} label="Mã cửa hàng" value={`#${storeInfo.storeId}`} />
              <InfoRow
                icon={MapPin}
                label="Địa chỉ"
                value={storeInfo.address || 'Chưa có thông tin'}
                muted={!storeInfo.address}
              />
              <InfoRow
                icon={Phone}
                label="Điện thoại"
                value={storeInfo.phone || 'Chưa có thông tin'}
                muted={!storeInfo.phone}
              />
              <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  <span className="text-sm font-medium">Trạng thái hoạt động</span>
                </div>
                <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                  Hoạt động
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-stone-400">
              <Store className="size-10 opacity-30" />
              <p className="text-sm italic">Chưa có đơn hàng, không xác định được cửa hàng</p>
            </div>
          )}
        </div>

        {/* Account card */}
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
              <User2 className="size-4 text-amber-600" />
            </div>
            <h2 className="font-bold text-stone-800">Tài khoản đăng nhập</h2>
          </div>

          {/* Avatar + name */}
          <div className="mb-5 flex items-center gap-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-extrabold text-white shadow-md ring-2 ring-white">
              {avatarInitial}
            </div>
            <div>
              <p className="text-base font-extrabold text-stone-900">{userFullName}</p>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5">
                <ShieldCheck className="size-3 text-amber-700" />
                <span className="text-[11px] font-semibold text-amber-800">Nhân viên cửa hàng</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow icon={User2} label="Tên đăng nhập" value={`@${userUsername}`} />
            <InfoRow
              icon={Mail}
              label="Email"
              value={userEmail !== '—' ? userEmail : undefined}
              muted={userEmail === '—'}
            />
            <InfoRow icon={IdCard} label="ID tài khoản" value={userId ? `#${userId}` : '—'} muted={!userId} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper component ── */
function InfoRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3">
      <Icon className="size-4 shrink-0 text-amber-500" />
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <span className="shrink-0 text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</span>
        <span className={cn('text-sm font-medium truncate', muted ? 'italic text-stone-400' : 'text-stone-800')}>
          {value ?? '—'}
        </span>
      </div>
    </div>
  );
}

export default StoreProfile;
