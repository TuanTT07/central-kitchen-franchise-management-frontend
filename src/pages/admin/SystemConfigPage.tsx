import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  SlidersHorizontal,
  Shield,
  Store,
  Briefcase,
  Truck,
  ChefHat,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Role, type Role as RoleType } from '@/Types';
import {
  ALL_ROLES,
  clampAdminPageSize,
  loadAdminPaginationPrefs,
  saveAdminPaginationPrefs,
} from '@/lib/adminPaginationSettings';

const DEFAULT_PAGE_SIZE = 10;

const ROLE_UI: {
  role: RoleType;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
}[] = [
  {
    role: Role.ADMIN,
    label: 'Quản trị viên',
    description: 'Người dùng, chi nhánh, cài đặt hệ thống.',
    icon: Shield,
    color: 'text-violet-600',
  },
  {
    role: Role.FRANCHISE_STORE_STAFF,
    label: 'Nhân viên cửa hàng',
    description: 'Đặt hàng, theo dõi giao hàng, dashboard chi nhánh.',
    icon: Store,
    color: 'text-sky-600',
  },
  {
    role: Role.MANAGER,
    label: 'Quản lý',
    description: 'Sản phẩm, danh mục, biên lai, biến động kho.',
    icon: Briefcase,
    color: 'text-emerald-600',
  },
  {
    role: Role.SUPPLY_COORDINATOR,
    label: 'Điều phối cung ứng',
    description: 'Tồn kho, lịch giao hàng, đơn tổng hợp, sự cố.',
    icon: Truck,
    color: 'text-amber-600',
  },
  {
    role: Role.CENTRAL_KITCHEN_STAFF,
    label: 'Bếp trung tâm',
    description: 'Lô sản phẩm, lệnh sản xuất, phiếu nhập kho.',
    icon: ChefHat,
    color: 'text-rose-600',
  },
];

function normalizeDraft(raw: string, fallback: number): string {
  const n = parseInt(raw.trim(), 10);
  return String(clampAdminPageSize(Number.isFinite(n) ? n : fallback));
}

function buildDraftMap(prefs: ReturnType<typeof loadAdminPaginationPrefs>): Record<RoleType, string> {
  const next = {} as Record<RoleType, string>;
  for (const r of ALL_ROLES) next[r] = String(prefs.pageSizeByRole[r]);
  return next;
}

const SystemConfigPage = () => {
  const initial = loadAdminPaginationPrefs();
  const [draftByRole, setDraftByRole] = useState<Record<RoleType, string>>(() => buildDraftMap(initial));
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  const setDraft = (role: RoleType, value: string) => {
    setDraftByRole((prev) => ({ ...prev, [role]: value }));
    markDirty();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pageSizeByRole = {} as Record<RoleType, number>;
      for (const r of ALL_ROLES) {
        pageSizeByRole[r] = clampAdminPageSize(parseInt(draftByRole[r], 10) || DEFAULT_PAGE_SIZE);
      }
      saveAdminPaginationPrefs({ pageSizeByRole });
      setDraftByRole(buildDraftMap(loadAdminPaginationPrefs()));
      setIsDirty(false);
      toast.success('Đã lưu cấu hình phân trang', {
        description: 'Mỗi vai trò dùng số bản ghi / trang đã cài khi xem danh sách.',
      });
    } catch (error) {
      toast.error('Không lưu được', { description: String(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const resetDefaults = () => {
    const s = String(DEFAULT_PAGE_SIZE);
    const next = {} as Record<RoleType, string>;
    for (const r of ALL_ROLES) next[r] = s;
    setDraftByRole(next);
    setIsDirty(true);
  };

  return (
    <div className="h-full w-full space-y-5">
      {/* ── Page header ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <SlidersHorizontal className="size-6 text-amber-500" />
              Phân trang theo vai trò
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Số bản ghi mỗi trang theo vai trò (5–100). Lưu trên trình duyệt; áp dụng sau khi bấm Lưu.
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={resetDefaults}
              className="h-9 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <RotateCcw className="size-3.5" />
              Mặc định (10)
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
              className={cn(
                'h-9 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600',
                !isDirty && 'opacity-70 cursor-not-allowed'
              )}
            >
              <Save className="size-3.5" />
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ── Role cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ROLE_UI.map(({ role, label, description, icon: Icon, color }) => (
          <Card
            key={role}
            className="overflow-hidden border-amber-200/60 bg-white shadow-md transition-shadow hover:shadow-lg"
          >
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Icon className={cn('size-4 shrink-0', color)} />
                {label}
              </CardTitle>
              <CardDescription className="mt-1 text-[11px] leading-snug text-amber-700/80">
                {description}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Số bản ghi / trang</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={draftByRole[role]}
                    onChange={(e) => setDraft(role, e.target.value.replace(/\D/g, ''))}
                    onBlur={() => {
                      setDraftByRole((prev) => {
                        const n = normalizeDraft(prev[role], DEFAULT_PAGE_SIZE);
                        if (n !== prev[role]) markDirty();
                        return { ...prev, [role]: n };
                      });
                    }}
                    className="h-9 w-20 border-amber-200 bg-amber-50/40 text-center text-sm tabular-nums focus:border-amber-400 focus:ring-amber-200"
                  />
                  <span className="text-xs text-stone-400">hàng</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SystemConfigPage;
