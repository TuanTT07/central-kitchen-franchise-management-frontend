import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldDescription, FieldLabel, FieldSet, FieldTitle } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { Lock, Shield, Store, Users, Mail, SlidersHorizontal, LayoutList } from 'lucide-react';
import type { Role } from '@/Types';

type SystemSettings = {
  // Tài khoản & bảo mật
  passwordMinLength: number;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireSpecial: boolean;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  sessionTimeoutMinutes: number;

  // Cửa hàng
  defaultStoreStatus: 'ACTIVE' | 'INACTIVE';
  allowUserOnInactiveStore: boolean;
  recommendedStaffPerStore: number;

  // Quy tắc role & store
  defaultUserRole: Role;
  requireStoreWhenCreateUser: boolean;
  allowSystemUserNoStore: boolean;

  // Thông báo & email
  notifyOnUserCreated: boolean;
  notifyOnUserLocked: boolean;
  notifyOnRoleChanged: boolean;
  systemEmailFrom: string;

  // Hiển thị & phân trang
  pageSizeUsers: number;
  pageSizeStores: number;
  userDefaultSort: 'createdAt' | 'username';
  storeDefaultSort: 'storeName' | 'status';
};

const defaultSettings: SystemSettings = {
  passwordMinLength: 8,
  passwordRequireNumber: true,
  passwordRequireUppercase: true,
  passwordRequireSpecial: false,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  sessionTimeoutMinutes: 120,

  defaultStoreStatus: 'ACTIVE',
  allowUserOnInactiveStore: false,
  recommendedStaffPerStore: 2,

  defaultUserRole: 'FRANCHISE_STORE_STAFF',
  requireStoreWhenCreateUser: true,
  allowSystemUserNoStore: true,

  notifyOnUserCreated: true,
  notifyOnUserLocked: true,
  notifyOnRoleChanged: true,
  systemEmailFrom: 'no-reply@kitchen-hub.local',

  pageSizeUsers: 10,
  pageSizeStores: 10,
  userDefaultSort: 'createdAt',
  storeDefaultSort: 'storeName',
};

const SystemConfigPage = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: call backend save API when available
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsDirty(false);
      alert('Lưu cài đặt thành công (tạm thời mới lưu ở UI).');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-4 shadow-sm">
        <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-white/15 to-transparent" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight text-white md:text-lg">
              Cài đặt hệ thống
            </h1>
            <p className="mt-0.5 truncate text-xs leading-tight text-amber-50/90">
              Quản trị chính sách tài khoản, cửa hàng và hiển thị cho toàn hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSaving}
              onClick={() => setSettings(defaultSettings)}
              className="h-9 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white text-xs"
            >
              Khôi phục mặc định
            </Button>
            <Button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
              className={cn(
                'h-9 bg-white text-amber-700 hover:bg-amber-50 text-xs font-semibold',
                !isDirty && 'opacity-80 cursor-not-allowed'
              )}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </div>
        </div>
      </div>

      {/* Nội dung cài đặt */}
      <FieldSet className="space-y-5">
        {/* Tài khoản & bảo mật */}
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Lock className="size-4 text-amber-500" />
              Tài khoản & bảo mật
            </CardTitle>
            <CardDescription className="text-[11px] text-amber-700/80">
              Thiết lập chính sách mật khẩu và khóa tài khoản khi đăng nhập sai.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <Field>
              <FieldTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Lock className="size-4 text-amber-500" />
                Chính sách mật khẩu
              </FieldTitle>
              <FieldContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Độ dài tối thiểu</span>
                  <Input
                    type="number"
                    min={4}
                    max={64}
                    value={settings.passwordMinLength}
                    onChange={(e) => update('passwordMinLength', Number(e.target.value) || 0)}
                    className="h-9 w-20 border-amber-200 bg-amber-50/40 text-sm"
                  />
                  <span className="text-xs text-stone-500">ký tự</span>
                </div>
                <div className="space-y-1">
                  {[
                    {
                      key: 'passwordRequireNumber' as const,
                      label: 'Bắt buộc có số (0-9)',
                    },
                    {
                      key: 'passwordRequireUppercase' as const,
                      label: 'Bắt buộc có chữ hoa (A-Z)',
                    },
                    {
                      key: 'passwordRequireSpecial' as const,
                      label: 'Bắt buộc có ký tự đặc biệt (!@#$...)',
                    },
                  ].map((item) => (
                    <label key={item.key} className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                      <input
                        type="checkbox"
                        checked={settings[item.key] as boolean}
                        onChange={(e) => update(item.key, e.target.checked as any)}
                        className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Shield className="size-4 text-amber-500" />
                Khóa tài khoản & phiên đăng nhập
              </FieldTitle>
              <FieldContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Số lần đăng nhập sai tối đa</span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.maxLoginAttempts}
                    onChange={(e) => update('maxLoginAttempts', Number(e.target.value) || 0)}
                    className="h-9 w-20 border-amber-200 bg-amber-50/40 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Thời gian khóa tạm</span>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={settings.lockoutMinutes}
                    onChange={(e) => update('lockoutMinutes', Number(e.target.value) || 0)}
                    className="h-9 w-24 border-amber-200 bg-amber-50/40 text-sm"
                  />
                  <span className="text-xs text-stone-500">phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Thời gian hết hạn phiên đăng nhập</span>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => update('sessionTimeoutMinutes', Number(e.target.value) || 0)}
                    className="h-9 w-24 border-amber-200 bg-amber-50/40 text-sm"
                  />
                  <span className="text-xs text-stone-500">phút</span>
                </div>
                <FieldDescription className="text-[11px]">
                  Các giá trị này chỉ mới dùng cho UI. Khi backend hỗ trợ, có thể map sang config hệ thống.
                </FieldDescription>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Cửa hàng */}
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Store className="size-4 text-amber-500" />
              Cửa hàng
            </CardTitle>
            <CardDescription className="text-[11px] text-amber-700/80">
              Thiết lập trạng thái mặc định và phân bổ nhân sự cho cửa hàng.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <Field>
              <FieldLabel className="text-sm font-semibold text-amber-900">Trạng thái mặc định của store mới</FieldLabel>
              <FieldContent className="space-y-2">
                <div className="flex gap-3 text-sm text-stone-700">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="defaultStoreStatus"
                      value="ACTIVE"
                      checked={settings.defaultStoreStatus === 'ACTIVE'}
                      onChange={() => update('defaultStoreStatus', 'ACTIVE')}
                      className="size-4 border-amber-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Đang hoạt động (ACTIVE)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="defaultStoreStatus"
                      value="INACTIVE"
                      checked={settings.defaultStoreStatus === 'INACTIVE'}
                      onChange={() => update('defaultStoreStatus', 'INACTIVE')}
                      className="size-4 border-amber-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Ngừng hoạt động (INACTIVE)</span>
                  </label>
                </div>
                <FieldDescription className="text-[11px]">
                  Áp dụng khi admin tạo cửa hàng mới từ trang Quản lý Cửa hàng.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="text-sm font-semibold text-amber-900">Quy tắc nhân sự cửa hàng</FieldLabel>
              <FieldContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Số staff khuyến nghị / store</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.recommendedStaffPerStore}
                    onChange={(e) => update('recommendedStaffPerStore', Number(e.target.value) || 0)}
                    className="h-9 w-20 border-amber-200 bg-amber-50/40 text-sm"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={settings.allowUserOnInactiveStore}
                    onChange={(e) => update('allowUserOnInactiveStore', e.target.checked)}
                    className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Cho phép gán user vào store đang INACTIVE</span>
                </label>
                <FieldDescription className="text-[11px]">
                  Giá trị này có thể dùng để sinh cảnh báo khi store thiếu/không có nhân sự.
                </FieldDescription>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Quy tắc role & store */}
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Users className="size-4 text-amber-500" />
              Quy tắc gán role & store
            </CardTitle>
            <CardDescription className="text-[11px] text-amber-700/80">
              Điều khiển hành vi mặc định khi tạo tài khoản mới.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <Field>
              <FieldLabel className="text-sm font-semibold text-amber-900">Role mặc định khi tạo user mới</FieldLabel>
              <FieldContent>
                <select
                  className="h-10 w-full rounded-md border border-amber-200 bg-amber-50/30 px-3 text-sm focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  value={settings.defaultUserRole}
                  onChange={(e) => update('defaultUserRole', e.target.value as Role)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="SUPPLY_COORDINATOR">SUPPLY_COORDINATOR</option>
                  <option value="CENTRAL_KITCHEN_STAFF">CENTRAL_KITCHEN_STAFF</option>
                  <option value="FRANCHISE_STORE_STAFF">FRANCHISE_STORE_STAFF</option>
                </select>
                <FieldDescription className="text-[11px]">
                  Dùng để pre-select giá trị trong form Tạo người dùng.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="text-sm font-semibold text-amber-900">Quy tắc bắt buộc store</FieldLabel>
              <FieldContent className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={settings.requireStoreWhenCreateUser}
                    onChange={(e) => update('requireStoreWhenCreateUser', e.target.checked)}
                    className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Bắt buộc chọn store khi tạo tài khoản mới</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={settings.allowSystemUserNoStore}
                    onChange={(e) => update('allowSystemUserNoStore', e.target.checked)}
                    className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Cho phép user hệ thống không gán store (ví dụ: ADMIN tổng)</span>
                </label>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Thông báo & email */}
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Mail className="size-4 text-amber-500" />
              Thông báo & email
            </CardTitle>
            <CardDescription className="text-[11px] text-amber-700/80">
              Quy định khi nào hệ thống gửi thông báo email cho người dùng.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <Field>
              <FieldLabel className="text-sm font-semibold text-amber-900">
                Sự kiện gửi email (nếu được backend hỗ trợ)
              </FieldLabel>
              <FieldContent className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnUserCreated}
                    onChange={(e) => update('notifyOnUserCreated', e.target.checked)}
                    className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Gửi email khi tạo tài khoản mới</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnUserLocked}
                    onChange={(e) => update('notifyOnUserLocked', e.target.checked)}
                    className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Gửi email khi khóa / mở khóa tài khoản</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnRoleChanged}
                    onChange={(e) => update('notifyOnRoleChanged', e.target.checked)}
                    className="size-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Gửi email khi thay đổi role</span>
                </label>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="text-sm font-semibold text-amber-900">Email gửi đi từ</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  value={settings.systemEmailFrom}
                  onChange={(e) => update('systemEmailFrom', e.target.value)}
                  className="h-10 border-amber-200 bg-amber-50/30 text-sm focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                  placeholder="no-reply@kitchen-hub.local"
                />
                <FieldDescription className="text-[11px]">
                  Địa chỉ email này sẽ hiển thị trong phần From khi hệ thống gửi mail (sau khi tích hợp).
                </FieldDescription>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Hiển thị & phân trang */}
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <SlidersHorizontal className="size-4 text-amber-500" />
              Hiển thị & phân trang
            </CardTitle>
            <CardDescription className="text-[11px] text-amber-700/80">
              Tùy chỉnh kích thước trang và thứ tự sắp xếp mặc định cho danh sách.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <Field>
              <FieldTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <LayoutList className="size-4 text-amber-500" />
                Danh sách người dùng
              </FieldTitle>
              <FieldContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Số bản ghi mỗi trang</span>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.pageSizeUsers}
                    onChange={(e) => update('pageSizeUsers', Number(e.target.value) || 0)}
                    className="h-9 w-24 border-amber-200 bg-amber-50/40 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <span>Thứ tự sắp xếp mặc định</span>
                  <select
                    className="h-9 rounded-md border border-amber-200 bg-amber-50/30 px-3 text-sm focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    value={settings.userDefaultSort}
                    onChange={(e) => update('userDefaultSort', e.target.value as SystemSettings['userDefaultSort'])}
                  >
                    <option value="createdAt">Ngày tạo (mới nhất trước)</option>
                    <option value="username">Username (A → Z)</option>
                  </select>
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Store className="size-4 text-amber-500" />
                Danh sách cửa hàng
              </FieldTitle>
              <FieldContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-700">Số bản ghi mỗi trang</span>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.pageSizeStores}
                    onChange={(e) => update('pageSizeStores', Number(e.target.value) || 0)}
                    className="h-9 w-24 border-amber-200 bg-amber-50/40 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <span>Thứ tự sắp xếp mặc định</span>
                  <select
                    className="h-9 rounded-md border border-amber-200 bg-amber-50/30 px-3 text-sm focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    value={settings.storeDefaultSort}
                    onChange={(e) => update('storeDefaultSort', e.target.value as SystemSettings['storeDefaultSort'])}
                  >
                    <option value="storeName">Tên cửa hàng (A → Z)</option>
                    <option value="status">Trạng thái (ACTIVE trước)</option>
                  </select>
                </div>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>
      </FieldSet>
    </div>
  );
};

export default SystemConfigPage;
