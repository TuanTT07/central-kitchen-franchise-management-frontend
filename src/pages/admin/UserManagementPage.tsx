/**
 * =========================================================
 * Component: UserManagementPage
 * Description: Trang quản lý danh sách người dùng trong hệ thống.
 *             Cho phép xem, thêm, sửa, khóa (xóa) và phân quyền tài khoản.
 * Author: Tuan Tran, Dat Tran
 * Created: 2026-03-08
 * =========================================================
 */

// ================= IMPORT =================
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Loader2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Role, type Role as RoleType } from '@/Types';
import { adminService, type StoreResponse, type UserResponse } from '@/services/adminServices';
import { useForm } from 'react-hook-form';
import { Field, FieldLabel, FieldError, FieldContent } from '@/components/ui/field';
import { toast } from 'sonner';

// ================= CONSTANTS =================
const ROLES: { roleId: number; roleName: RoleType; label: string }[] = [
  { roleId: 1, roleName: 'ADMIN', label: 'Quản trị viên' },
  { roleId: 2, roleName: 'FRANCHISE_STORE_STAFF', label: 'Nhân viên cửa hàng' },
  { roleId: 3, roleName: 'MANAGER', label: 'Quản lý' },
  { roleId: 4, roleName: 'SUPPLY_COORDINATOR', label: 'Điều phối viên' },
  { roleId: 5, roleName: 'CENTRAL_KITCHEN_STAFF', label: 'Bếp trung tâm' },
];

// ================= COMPONENT =================
const UserManagementPage = () => {
  // ================= STATE =================
  // Danh sách người dùng từ API
  const [users, setUsers] = useState<UserResponse[]>([]);
  // Danh sách cửa hàng còn hoạt động
  const [stores, setStores] = useState<StoreResponse[]>([]);
  // Từ khóa tìm kiếm
  const [search, setSearch] = useState('');
  // Quản lý đóng/mở Dialog thêm/sửa
  const [dialogOpen, setDialogOpen] = useState(false);
  // Quản lý đóng/mở Dialog xác nhận xóa
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Đối tượng người dùng đang được thực hiện thao tác (Sửa/Khóa)
  const [userToProcess, setUserToProcess] = useState<UserResponse | null>(null);

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(false);

  // --- QUẢN LÝ PHÂN TRANG (PAGINATION) ---
  const [currentPage, setCurrentPage] = useState(0); // Trang hiện tại (bắt đầu từ 0)
  const [pageSize] = useState(10); // Số lượng phần tử mỗi trang
  const [pageInfo, setPageInfo] = useState({
    totalPages: 0,
    totalElements: 0,
    isFirst: true,
    isLast: true,
  });

  // ================= FORM SETUP =================
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<UserResponse>();

  // Theo dõi trạng thái active trong form để hiển thị UI động
  const isActive = Boolean(watch('status'));
  const selectedRole = watch('role');

  /** Chỉ nhân viên cửa hàng gán storeId; role khác luôn 0. */
  useEffect(() => {
    if (selectedRole === Role.FRANCHISE_STORE_STAFF) {
      const current = Number(getValues('storeId'));
      if (!Number.isFinite(current) || current <= 0) {
        const first = stores[0]?.storeId;
        if (first) setValue('storeId', first);
      }
    } else {
      setValue('storeId', 0);
    }
  }, [selectedRole, stores, setValue, getValues]);

  // ================= API CALLS =================
  /**
   * Gọi API lấy danh sách người dùng có phân trang
   * @param page Số trang cần lấy (mặc định 0)
   */
  const fetchUsers = useCallback(
    async (page: number = 0) => {
      setLoading(true);
      try {
        const response = await adminService.getAllUsers(page, pageSize);
        if (response && response.data.success) {
          const paginationData = response.data.data;
          setUsers(paginationData.items);
          setPageInfo({
            totalPages: paginationData.totalPages,
            totalElements: paginationData.totalElements,
            isFirst: paginationData.first,
            isLast: paginationData.last,
          });
        }
      } catch (error) {
        toast.error(`${error}`);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  /**
   * Gọi API lấy danh sách cửa hàng còn hoạt động
   */
  const fetchActiveStores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllStores();
      if (response && response.data.success) {
        const storesData = response.data.data.items.filter((s: StoreResponse) => s.status === 'ACTIVE');
        setStores(storesData);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cửa hàng:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= EFFECTS =================
  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  useEffect(() => {
    fetchActiveStores();
  }, [fetchActiveStores]);

  // ================= LOGIC / FILTER =================
  /**
   * Lọc danh sách người dùng dựa trên từ khóa tìm kiếm
   */
  const filteredUsers = users.filter(
    (u) =>
      (u.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (u.fullName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // ================= HANDLERS =================
  /**
   * Mở Dialog để thêm người dùng mới
   */
  const openAdd = () => {
    setUserToProcess(null);
    reset({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'ADMIN',
      storeId: 0,
      status: true as any,
    });
    setDialogOpen(true);
  };

  /**
   * Mở Dialog để chỉnh sửa thông tin người dùng
   * @param user Đối tượng người dùng cần sửa
   */
  const openEdit = (user: UserResponse) => {
    setUserToProcess(user);
    reset({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      status: (user.status === 'ACTIVE') as any,
    });
    setDialogOpen(true);
  };

  /**
   * Mở Dialog xác nhận khóa/xóa người dùng
   * @param user Đối tượng người dùng cần xóa
   */
  const openDelete = (user: UserResponse) => {
    setUserToProcess(user);
    setDeleteConfirmOpen(true);
  };

  /**
   * Xử lý lưu thông tin (Thêm mới hoặc Cập nhật)
   * @param data Dữ liệu từ form
   */
  const handleSave = async (data: UserResponse) => {
    try {
      setLoading(true);
      const selectedRole = data.role as RoleType;
      const resolvedStoreId =
        selectedRole === Role.FRANCHISE_STORE_STAFF ? Number(data.storeId) : 0;

      const statusValue = ((data.status as unknown as boolean) ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE';

      if (userToProcess) {
        // Trường hợp Cập nhật
        const payload = {
          fullName: data.fullName,
          email: data.email,
          role: selectedRole,
          storeId: resolvedStoreId,
          status: statusValue,
          password: data.password || undefined,
        };
        const response = await adminService.updateAccount(userToProcess.userId, payload);
        if (response.status === 200) {
          await fetchUsers();
          toast.success(`${response.data.message}`);
        }
      } else {
        // Trường hợp Thêm mới
        const payload = {
          username: data.username,
          password: data.password || '',
          fullName: data.fullName,
          email: data.email,
          role: selectedRole as RoleType,
          storeId: resolvedStoreId,
        };
        const response = await adminService.registerAccount(payload);

        if (response.status === 200 || response.status === 201) {
          await fetchUsers();
          toast.success(`${response.data.message}`);
        }
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(`${error}`);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý xóa (ngừng kích hoạt) tài khoản
   */
  const handleDelete = async () => {
    if (userToProcess) {
      try {
        setLoading(true);
        const response = await adminService.deleteAccount(userToProcess.userId);
        if (response.status === 200 || response.status === 204) {
          await fetchUsers();
          toast.success(`${response.data.message}`);
        }
      } catch (error: any) {
        toast.error(`${error}`);
      } finally {
        setLoading(false);
        setDeleteConfirmOpen(false);
        setUserToProcess(null);
      }
    }
  };

  // ================= RENDER =================
  return (
    <>
      <div className="h-full w-full">
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
            <div className="flex flex-col">
              <CardTitle className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <Shield className="size-6 text-amber-500" />
                Quản lý Người dùng
              </CardTitle>
              <p className="text-xs text-amber-600/70 font-medium mt-0.5">
                Quản lý danh sách và phân quyền tài khoản hệ thống
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(currentPage)}
                disabled={loading}
                className="border-amber-200 text-amber-700 hover:bg-amber-100 h-10 px-4"
              >
                <Loader2 className={cn('size-4 mr-2', loading && 'animate-spin')} />
                Làm mới
              </Button>
              <Button
                onClick={openAdd}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md h-10 px-5"
              >
                <Plus className="size-4" />
                Thêm người dùng
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
                <Input
                  placeholder="Tìm theo username, họ tên, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-amber-200 bg-amber-50/50 pl-9 focus:border-amber-400 focus:ring-amber-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-amber-200/60 shadow-sm bg-white relative">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <Loader2 className="size-8 animate-spin text-amber-500" />
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200 bg-amber-50/50 text-left">
                    <th className="px-6 py-4 font-bold text-amber-900 uppercase tracking-wider text-xs">STT</th>
                    <th className="px-6 py-4 font-bold text-amber-900 uppercase tracking-wider text-xs">Username</th>
                    <th className="px-6 py-4 font-bold text-amber-900 uppercase tracking-wider text-xs">
                      Thông tin cá nhân
                    </th>
                    <th className="px-6 py-4 font-bold text-amber-900 uppercase tracking-wider text-xs">Vai trò</th>
                    <th className="px-6 py-4 font-bold text-amber-900 uppercase tracking-wider text-xs">Cửa hàng</th>
                    <th className="px-6 py-4 font-bold text-amber-900 uppercase tracking-wider text-xs">Trạng thái</th>
                    <th className="px-6 py-4 text-right font-bold text-amber-900 uppercase tracking-wider text-xs">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/50">
                  {filteredUsers.map((user, index) => (
                    <tr key={user.userId} className="transition-all hover:bg-amber-50/40 group">
                      <td className="px-6 py-4 font-mono text-amber-600/70 text-xs">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-amber-900 text-sm">{user.username}</span>
                          <span className="text-[10px] text-stone-400 font-mono">ID: #{user.userId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-800">{user.fullName}</div>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500">
                            <Mail className="size-3 text-amber-400" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 font-bold text-[10px] uppercase border border-amber-200 shadow-sm">
                          <Shield className="size-3" />
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 font-bold text-[10px] uppercase border border-amber-200 shadow-sm">
                          <Store className="size-3" />
                          {user.role === Role.FRANCHISE_STORE_STAFF
                            ? user.storeName
                              ? user.storeName
                              : 'Chưa gán cửa hàng'
                            : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 py-1 px-3 rounded-full text-[11px] font-bold shadow-sm border transition-all',
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          {user.status === 'ACTIVE' ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                          {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                          onClick={() => openEdit(user)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>

                        {user.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                            onClick={() => openDelete(user)}
                            title="Khóa tài khoản"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- GIAO DIỆN ĐIỀU KHIỂN PHÂN TRANG --- */}
            <div className="mt-6 flex items-center justify-between px-2">
              <div className="text-sm text-amber-900/60 font-medium">
                Hiển thị <span className="text-amber-600">{currentPage * pageSize + 1}</span> -{' '}
                <span className="text-amber-600">{Math.min((currentPage + 1) * pageSize, pageInfo.totalElements)}</span>{' '}
                trên tổng số <span className="text-amber-600">{pageInfo.totalElements}</span> người dùng
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  disabled={pageInfo.isFirst || loading}
                  className="border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Trang trước
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(pageInfo.totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                      className={cn(
                        'size-9 p-0',
                        currentPage === i
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-100'
                      )}
                      disabled={loading}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(pageInfo.totalPages - 1, prev + 1))}
                  disabled={pageInfo.isLast || loading}
                  className="border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  Trang sau
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>

            {!loading && filteredUsers.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-amber-600/60 bg-white rounded-b-xl border border-t-0 border-amber-200/60">
                <Search className="size-12 mb-3 opacity-20" />
                <p className="font-medium">Không tìm thấy người dùng nào phù hợp</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- DIALOG THÊM/SỬA NGƯỜI DÙNG --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onClose={() => setDialogOpen(false)}
          className="max-w-2xl min-w-[28rem] p-0 overflow-hidden border-none shadow-2xl"
        >
          <form noValidate onSubmit={handleSubmit(handleSave)} className="flex flex-col">
            <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {userToProcess ? <Pencil className="size-6" /> : <Plus className="size-6" />}
                {userToProcess ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
              </DialogTitle>
              <p className="text-amber-50/80 text-sm mt-1">
                {userToProcess
                  ? 'Cập nhật thông tin chi tiết cho người dùng này'
                  : 'Điền thông tin bên dưới để tạo một tài khoản mới'}
              </p>
            </DialogHeader>

            <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
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
                      disabled={!!userToProcess}
                      placeholder="Ví dụ: nva2024"
                      className={cn(
                        'h-12 border-amber-200 bg-amber-50/30 pl-4 pr-4 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200',
                        !!userToProcess && 'opacity-70 bg-stone-100 border-stone-200 cursor-not-allowed'
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

              {/* Password */}
              <Field>
                <FieldLabel htmlFor="password" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                  <Lock className="size-4 text-amber-500" />
                  Mật khẩu{' '}
                  {userToProcess && (
                    <span className="text-xs font-normal text-amber-600/70 italic">(để trống nếu không đổi)</span>
                  )}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    placeholder={userToProcess ? '••••••••' : 'Nhập mật khẩu ít nhất 6 ký tự'}
                    className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                    {...register('password', {
                      required: { value: !userToProcess, message: 'Mật khẩu là bắt buộc' },
                      minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                    })}
                  />
                  {errors.password && <FieldError errors={[errors.password]} className="mt-1" />}
                </FieldContent>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role selection */}
                <Field>
                  <FieldLabel htmlFor="roleId" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                    <Shield className="size-4 text-amber-500" />
                    Vai trò hệ thống
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="roleId"
                      className="h-12 w-full rounded-md border border-amber-200 bg-amber-50/30 px-4 text-[15px] transition-all focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23F59E0B%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat"
                      // Sử dụng trực tiếp role (string) làm value thay vì roleId (number) để khớp với UserResponse
                      {...register('role')}
                    >
                      {ROLES.map((r) => (
                        <option key={r.roleId} value={r.roleName}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {errors.role && <FieldError errors={[errors.role]} className="mt-1" />}
                  </FieldContent>
                </Field>
                {/* Store — chỉ áp dụng cho nhân viên cửa hàng */}
                {selectedRole === Role.FRANCHISE_STORE_STAFF ? (
                  <Field>
                    <FieldLabel htmlFor="storeId" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                      <Store className="size-4 text-amber-500" />
                      Cửa hàng
                    </FieldLabel>
                    <FieldContent>
                      <select
                        id="storeId"
                        className="h-12 w-full rounded-md border border-amber-200 bg-amber-50/30 px-4 text-[15px] transition-all focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23F59E0B%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat"
                        {...register('storeId', {
                          valueAsNumber: true,
                          validate: (v, formValues) => {
                            const r = (formValues as UserResponse).role;
                            if (r !== Role.FRANCHISE_STORE_STAFF) return true;
                            const n = Number(v);
                            if (!Number.isFinite(n) || n <= 0) return 'Vui lòng chọn cửa hàng';
                            return true;
                          },
                        })}
                      >
                        <option value="">-- Chọn cửa hàng --</option>
                        {stores.map((s) => (
                          <option key={s.storeId} value={s.storeId}>
                            {s.storeName}
                          </option>
                        ))}
                      </select>
                      {errors.storeId && <FieldError errors={[errors.storeId]} className="mt-1" />}
                    </FieldContent>
                  </Field>
                ) : (
                  <div className="flex flex-col justify-end pb-1">
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Chỉ tài khoản <span className="font-semibold text-amber-800">Nhân viên cửa hàng</span> được gán
                      cửa hàng. Các vai trò khác không dùng ngữ cảnh cửa hàng.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <Field>
                  <FieldLabel
                    htmlFor="fullName"
                    className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2"
                  >
                    <UserIcon className="size-4 text-amber-500" />
                    Họ và tên
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                      {...register('fullName', {
                        required: 'Họ tên là bắt buộc',
                        minLength: { value: 3, message: 'Họ tên phải có ít nhất 3 ký tự' },
                      })}
                    />
                    {errors.fullName && <FieldError errors={[errors.fullName]} className="mt-1" />}
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

              {/* Status Switch */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className="relative">
                    <input type="checkbox" id="isActive" className="peer sr-only" {...register('status')} />
                    <div
                      className={cn(
                        'w-12 h-6 rounded-full transition-colors border-2',
                        'bg-stone-200 border-stone-200 group-hover:bg-stone-300',
                        'peer-checked:bg-emerald-500 peer-checked:border-emerald-500'
                      )}
                    ></div>
                    <div
                      className={cn(
                        'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                        'peer-checked:translate-x-6'
                      )}
                    ></div>
                  </div>
                  <span className="text-base font-semibold text-amber-900">
                    Trạng thái tài khoản:
                    <span
                      className={cn(
                        'ml-2 text-sm font-medium px-3 py-1 rounded-full inline-flex items-center shadow-sm border transition-all',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
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
                {userToProcess ? 'Lưu thay đổi' : 'Tạo người dùng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG XÁC NHẬN KHÓA/XÓA --- */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent onClose={() => setDeleteConfirmOpen(false)} className="max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-stone-700">
            Bạn có chắc muốn xóa người dùng <strong>{userToProcess?.fullName}</strong> ({userToProcess?.username})? Thao
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
