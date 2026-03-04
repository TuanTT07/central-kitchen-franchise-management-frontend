import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, User as UserIcon, Mail, Lock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type User, type Role } from '@/Types';
import { adminService } from '@/services/adminServices';
import { useForm } from 'react-hook-form';
import { Field, FieldLabel, FieldError, FieldContent } from '@/components/ui/field';

const ROLES: { role_id: number; role_name: Role; label: string }[] = [
  { role_id: 1, role_name: 'ADMIN', label: 'Quản trị viên' },
  { role_id: 2, role_name: 'FRANCHISE_STORE_STAFF', label: 'Nhân viên cửa hàng phân phối' },
  { role_id: 3, role_name: 'MANAGER', label: 'Quản lý' },
  { role_id: 4, role_name: 'SUPPLY_COORDINATOR', label: 'Điều phối nhà cung cấp' },
  { role_id: 5, role_name: 'CENTRAL_KITCHEN_STAFF', label: 'Nhân viên bếp trung tâm' },
];

interface UserFormData {
  username: string;
  password?: string;
  full_name: string;
  email: string;
  role_id: number;
  is_active: boolean;
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>();

  const isActive = watch('is_active');
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingUser(null);
    reset({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role_id: 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    reset({
      username: user.username,
      password: '',
      full_name: user.fullName,
      email: user.email,
      role_id: user.roles[0] ? ROLES.find((r) => r.role_name === user.roles[0])?.role_id || 1 : 1,
      is_active: user.isActive,
    });
    setDialogOpen(true);
  };

  const openDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    try {
      if (editingUser) {
        // Tạm thời update local cho những phần không phải Add
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  username: data.username,
                  fullName: data.full_name,
                  email: data.email,
                  isActive: data.is_active,
                }
              : u
          )
        );
      } else {
        // GỌI API THÊM TÀI KHOẢN
        const response = await adminService.registerAccount({
          username: data.username,
          password: data.password || '',
          full_name: data.full_name,
          email: data.email,
          role_id: data.role_id,
        });

        if (response.status === 200 || response.status === 201) {
          // Sau khi add thành công, thêm vào list tạm thời
          const newId = response.data?.id || Math.max(0, ...users.map((u) => u.id)) + 1;
          setUsers((prev) => [
            ...prev,
            {
              id: newId,
              username: data.username,
              fullName: data.full_name,
              email: data.email,
              roles: ROLES.filter((r) => r.role_id === data.role_id).map((r) => r.role_name),
              isActive: data.is_active,
            } as User,
          ]);
          alert('Thêm người dùng thành công');
        }
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng');
    }
  };

  const handleDelete = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full w-full">
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
            <CardTitle className="text-xl font-bold text-amber-900">Quản lý Người dùng (User)</CardTitle>
            <Button onClick={openAdd} className="gap-2 bg-amber-500 text-white hover:bg-amber-600">
              <Plus className="size-4" />
              Thêm người dùng
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
                <Input
                  placeholder="Tìm theo username, họ tên, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-amber-200 bg-amber-50/50 pl-9 focus:border-amber-400 focus:ring-amber-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-amber-200/60 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200 bg-amber-100/80 text-left">
                    <th className="px-5 py-4 font-semibold text-amber-900">ID</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Username</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Họ tên</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Email</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Vai trò</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Trạng thái</th>
                    <th className="px-5 py-4 text-right font-semibold text-amber-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-amber-100/80 transition-colors hover:bg-amber-50/70">
                      <td className="px-5 py-4 font-mono text-amber-700">{user.id}</td>
                      <td className="px-5 py-4 font-medium text-amber-900">{user.username}</td>
                      <td className="px-5 py-4 text-stone-700">{user.fullName}</td>
                      <td className="px-5 py-4 text-stone-700">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className="rounded bg-amber-200/80 px-2 py-1 text-xs font-semibold text-amber-800">
                          {user.roles && user.roles.length > 0 ? user.roles[0] : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            user.isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-300 text-stone-600'
                          )}
                        >
                          {user.isActive ? 'Hoạt động' : 'Khóa'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(user)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && <p className="py-12 text-center text-amber-600">Không có người dùng nào</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-2xl min-w-[28rem] p-0 overflow-hidden border-none shadow-2xl">
          <form noValidate onSubmit={handleSubmit(handleSave)} className="flex flex-col">
            <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {editingUser ? <Pencil className="size-6" /> : <Plus className="size-6" />}
                {editingUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
              </DialogTitle>
              <p className="text-amber-50/80 text-sm mt-1">
                {editingUser ? 'Cập nhật thông tin chi tiết cho người dùng này' : 'Điền thông tin bên dưới để tạo một tài khoản mới'}
              </p>
            </DialogHeader>

            <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <Field>
                  <FieldLabel htmlFor="username" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                    <UserIcon className="size-4 text-amber-500" />
                    Tên đăng nhập
                  </FieldLabel>
                  <FieldContent>
                    <div className="relative group/input">
                      <Input
                        id="username"
                        disabled={!!editingUser}
                        placeholder="Ví dụ: nva2024"
                        className={cn(
                          "h-12 border-amber-200 bg-amber-50/30 pl-4 pr-4 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200",
                          !!editingUser && "opacity-70 bg-stone-100 border-stone-200 cursor-not-allowed"
                        )}
                        {...register('username', {
                          required: 'Tên đăng nhập là bắt buộc',
                          maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
                          minLength: { value: 3, message: 'Ít nhất 3 ký tự' },
                        })}
                      />
                    </div>
                    {errors.username && <FieldError errors={[errors.username]} className="mt-1" />}
                  </FieldContent>
                </Field>

                {/* Role selection */}
                <Field>
                  <FieldLabel htmlFor="role_id" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                    <Shield className="size-4 text-amber-500" />
                    Vai trò hệ thống
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="role_id"
                      className="h-12 w-full rounded-md border border-amber-200 bg-amber-50/30 px-4 text-[15px] transition-all focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23F59E0B%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat"
                      {...register('role_id', { valueAsNumber: true })}
                    >
                      {ROLES.map((r) => (
                        <option key={r.role_id} value={r.role_id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {errors.role_id && <FieldError errors={[errors.role_id]} className="mt-1" />}
                  </FieldContent>
                </Field>
              </div>

              {/* Password */}
              <Field>
                <FieldLabel htmlFor="password" title="" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                  <Lock className="size-4 text-amber-500" />
                  Mật khẩu {editingUser && <span className="text-xs font-normal text-amber-600/70 italic">(để trống nếu không đổi)</span>}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    placeholder={editingUser ? "••••••••" : "Nhập mật khẩu ít nhất 6 ký tự"}
                    className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                    {...register('password', {
                      required: { value: !editingUser, message: 'Mật khẩu là bắt buộc' },
                      minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                    })}
                  />
                  {errors.password && <FieldError errors={[errors.password]} className="mt-1" />}
                </FieldContent>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <Field>
                  <FieldLabel htmlFor="full_name" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                    <UserIcon className="size-4 text-amber-500" />
                    Họ và tên
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="full_name"
                      placeholder="Nguyễn Văn A"
                      className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                      {...register('full_name', {
                        required: 'Họ tên là bắt buộc',
                        minLength: { value: 3, message: 'Họ tên phải có ít nhất 3 ký tự' },
                      })}
                    />
                    {errors.full_name && <FieldError errors={[errors.full_name]} className="mt-1" />}
                  </FieldContent>
                </Field>

                {/* Email */}
                <Field>
                  <FieldLabel htmlFor="email" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                    <Mail className="size-4 text-amber-500" />
                    Địa chỉ Email
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                      {...register('email', {
                        required: 'Email là bắt buộc',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Email không hợp lệ',
                        },
                      })}
                    />
                    {errors.email && <FieldError errors={[errors.email]} className="mt-1" />}
                  </FieldContent>
                </Field>
              </div>

              {/* Status Switch-like */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="is_active"
                      className="sr-only"
                      {...register('is_active')}
                    />
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors border-2",
                      "bg-stone-200 border-stone-200 group-hover:bg-stone-300",
                      "peer-checked:bg-emerald-500 peer-checked:border-emerald-500",
                    )}></div>
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                      "peer-checked:translate-x-6"
                    )}></div>
                  </div>
                  <span className="text-base font-semibold text-amber-900">
                    Trạng thái tài khoản: 
                    <span className={cn(
                      "ml-2 text-sm font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors",
                      isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
                    )}>
                      {isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="px-8 py-6 bg-stone-50 border-t border-stone-100 gap-3">
              <Button 
                variant="outline" 
                type="button"
                className="px-6 h-11 border-stone-300 text-stone-700 hover:bg-white hover:text-stone-900" 
                onClick={() => setDialogOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                className="px-8 h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-orange-200 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                {editingUser ? 'Lưu thay đổi' : 'Tạo người dùng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent onClose={() => setDeleteConfirmOpen(false)} className="max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-stone-700">
            Bạn có chắc muốn xóa người dùng <strong>{userToDelete?.fullName}</strong> ({userToDelete?.username})? Thao
            tác này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" size="lg" className="min-w-[6rem]" onClick={() => setDeleteConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" size="lg" className="min-w-[6rem]" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagementPage;
