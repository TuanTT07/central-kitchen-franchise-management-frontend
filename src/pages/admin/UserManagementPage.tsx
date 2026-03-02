import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Role entity: role_id, role_name (Enum: ADMIN, STORE_MANAGER, CHEF, COORDINATOR) */
const ROLES = [
  { role_id: 1, role_name: 'ADMIN' },
  { role_id: 2, role_name: 'STORE_MANAGER' },
  { role_id: 3, role_name: 'CHEF' },
  { role_id: 4, role_name: 'COORDINATOR' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  STORE_MANAGER: 'Quản lý cửa hàng',
  CHEF: 'Bếp trưởng',
  COORDINATOR: 'Điều phối',
};

/** User entity: user_id, username, password, full_name, email, role_id, is_active */
interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role_id: number;
  is_active: boolean;
}

const MOCK_USERS: User[] = [
  { user_id: 1, username: 'admin', full_name: 'Nguyễn Văn Admin', email: 'admin@kitchen.vn', role_id: 1, is_active: true },
  { user_id: 2, username: 'store_mgr_1', full_name: 'Trần Thị Quản lý', email: 'manager@kitchen.vn', role_id: 2, is_active: true },
  { user_id: 3, username: 'chef_center', full_name: 'Lê Văn Bếp', email: 'chef@kitchen.vn', role_id: 3, is_active: false },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    full_name: string;
    email: string;
    role_id: number;
    is_active: boolean;
  }>({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role_id: 2,
    is_active: true,
  });

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleName = (roleId: number) => {
    const role = ROLES.find((r) => r.role_id === roleId);
    return role ? ROLE_LABELS[role.role_name] ?? role.role_name : `#${roleId}`;
  };

  const openAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role_id: 2,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      is_active: user.is_active,
    });
    setDialogOpen(true);
  };

  const openDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleSave = () => {
    if (!formData.username.trim() || !formData.full_name.trim()) return;
    if (!editingUser && !formData.password.trim()) return;
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === editingUser.user_id
            ? {
                ...u,
                username: formData.username,
                full_name: formData.full_name,
                email: formData.email,
                role_id: formData.role_id,
                is_active: formData.is_active,
              }
            : u
        )
      );
    } else {
      const newId = Math.max(0, ...users.map((u) => u.user_id)) + 1;
      setUsers((prev) => [
        ...prev,
        {
          user_id: newId,
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          role_id: formData.role_id,
          is_active: formData.is_active,
        },
      ]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
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
            <Button onClick={openAdd} className="gap-2 bg-amber-500 hover:bg-amber-600">
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
                    <th className="px-5 py-4 font-semibold text-amber-900 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="border-b border-amber-100/80 transition-colors hover:bg-amber-50/70">
                      <td className="px-5 py-4 font-mono text-amber-700">{user.user_id}</td>
                      <td className="px-5 py-4 font-medium text-amber-900">{user.username}</td>
                      <td className="px-5 py-4 text-stone-700">{user.full_name}</td>
                      <td className="px-5 py-4 text-stone-700">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className="rounded bg-amber-200/80 px-2 py-1 text-xs font-semibold text-amber-800">
                          {getRoleName(user.role_id)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            user.is_active ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-300 text-stone-600'
                          )}
                        >
                          {user.is_active ? 'Hoạt động' : 'Khóa'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="size-8 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => openEdit(user)}>
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
            {filteredUsers.length === 0 && (
              <p className="py-12 text-center text-amber-600">Không có người dùng nào</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-2xl min-w-[28rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-5 overflow-y-auto py-2">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base">Username (Unique)</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                placeholder="username"
                disabled={!!editingUser}
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Mật khẩu {editingUser && '(để trống nếu không đổi)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder={editingUser ? '••••••••' : 'Nhập mật khẩu'}
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-base">Họ tên</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@kitchen.vn"
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_id" className="text-base">Vai trò (Role)</Label>
              <select
                id="role_id"
                value={formData.role_id}
                onChange={(e) => setFormData((p) => ({ ...p, role_id: Number(e.target.value) }))}
                className="h-11 w-full rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                {ROLES.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {ROLE_LABELS[r.role_name]} ({r.role_name})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                className="size-5 rounded border-amber-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer text-base">
                Tài khoản hoạt động (is_active)
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-3 pt-6">
            <Button variant="outline" size="lg" className="min-w-[6rem]" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button size="lg" className="min-w-[6rem] bg-amber-500 hover:bg-amber-600" onClick={handleSave}>
              {editingUser ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent onClose={() => setDeleteConfirmOpen(false)} className="max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-muted-foreground">
            Bạn có chắc muốn xóa người dùng <strong>{userToDelete?.full_name}</strong> ({userToDelete?.username})? Thao tác này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
};

export default UserManagementPage;
