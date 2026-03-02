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

interface Store {
  store_id: number;
  store_name: string;
  address: string;
  phone: string;
  manager_id: number | null;
}

const MOCK_USERS = [
  { user_id: 1, full_name: 'Nguyễn Văn A' },
  { user_id: 2, full_name: 'Trần Thị B' },
  { user_id: 3, full_name: 'Lê Văn C' },
];

const MOCK_STORES: Store[] = [
  {
    store_id: 1,
    store_name: 'Cửa hàng Quận 1',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    phone: '028 1234 5678',
    manager_id: 1,
  },
  {
    store_id: 2,
    store_name: 'Cửa hàng Quận 3',
    address: '45 Lê Lợi, Q3, TP.HCM',
    phone: '028 2345 6789',
    manager_id: 2,
  },
  {
    store_id: 3,
    store_name: 'Cửa hàng Quận 7',
    address: '78 Nguyễn Văn Linh, Q7, TP.HCM',
    phone: '028 3456 7890',
    manager_id: null,
  },
];

const BranchManagementPage = () => {
  const [stores, setStores] = useState<Store[]>(MOCK_STORES);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [formData, setFormData] = useState<{
    store_name: string;
    address: string;
    phone: string;
    manager_id: number | null;
  }>({
    store_name: '',
    address: '',
    phone: '',
    manager_id: null,
  });

  const filteredStores = stores.filter(
    (s) =>
      s.store_name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const getManagerName = (managerId: number | null) => {
    if (managerId == null) return '—';
    return MOCK_USERS.find((u) => u.user_id === managerId)?.full_name ?? `#${managerId}`;
  };

  const openAdd = () => {
    setEditingStore(null);
    setFormData({ store_name: '', address: '', phone: '', manager_id: null });
    setDialogOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      store_name: store.store_name,
      address: store.address,
      phone: store.phone,
      manager_id: store.manager_id,
    });
    setDialogOpen(true);
  };

  const openDelete = (store: Store) => {
    setStoreToDelete(store);
    setDeleteConfirmOpen(true);
  };

  const handleSave = () => {
    if (!formData.store_name.trim()) return;

    if (editingStore) {
      setStores((prev) =>
        prev.map((s) =>
          s.store_id === editingStore.store_id
            ? { ...s, ...formData }
            : s
        )
      );
    } else {
      const newId = Math.max(0, ...stores.map((s) => s.store_id)) + 1;
      setStores((prev) => [...prev, { store_id: newId, ...formData }]);
    }

    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (storeToDelete) {
      setStores((prev) => prev.filter((s) => s.store_id !== storeToDelete.store_id));
      setDeleteConfirmOpen(false);
      setStoreToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full w-full">
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
            <CardTitle className="text-xl font-bold text-amber-900">
              Quản lý Cửa hàng (Store)
            </CardTitle>
            <Button
              onClick={openAdd}
              className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Plus className="size-4" />
              Thêm cửa hàng
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
                <Input
                  placeholder="Tìm theo tên, địa chỉ..."
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
                    <th className="px-5 py-4 font-semibold text-amber-900">Tên cửa hàng</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Địa chỉ</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Số điện thoại</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Cửa hàng trưởng</th>
                    <th className="px-5 py-4 text-right font-semibold text-amber-900">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store) => (
                    <tr
                      key={store.store_id}
                      className="border-b border-amber-100/80 transition-colors hover:bg-amber-50/70"
                    >
                      <td className="px-5 py-4 font-mono text-amber-700">
                        {store.store_id}
                      </td>
                      <td className="px-5 py-4 font-medium text-amber-900">
                        {store.store_name}
                      </td>
                      <td className="px-5 py-4 text-stone-700">{store.address}</td>
                      <td className="px-5 py-4 text-stone-700">{store.phone}</td>
                      <td className="px-5 py-4 text-stone-700">
                        {getManagerName(store.manager_id)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => openEdit(store)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(store)}
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

            {filteredStores.length === 0 && (
              <p className="py-12 text-center text-amber-600">Không có cửa hàng nào</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onClose={() => setDialogOpen(false)}
          className="max-w-2xl min-w-[28rem] p-8"
        >
          <DialogHeader>
            <DialogTitle>
              {editingStore ? 'Chỉnh sửa cửa hàng' : 'Thêm cửa hàng mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="store_name" className="text-base">
                Tên cửa hàng
              </Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, store_name: e.target.value }))
                }
                placeholder="VD: Cửa hàng Quận 1"
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-base">
                Địa chỉ
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Địa chỉ đầy đủ"
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="028 xxx xxxx"
                className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager_id" className="text-base">
                Cửa hàng trưởng (User)
              </Label>
              <select
                id="manager_id"
                value={formData.manager_id ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    manager_id:
                      e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                className="h-11 w-full rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="">— Không chọn —</option>
                {MOCK_USERS.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name} (#{u.user_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[6rem]"
              onClick={() => setDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              size="lg"
              className="min-w-[6rem] bg-amber-500 text-white hover:bg-amber-600"
              onClick={handleSave}
            >
              {editingStore ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          onClose={() => setDeleteConfirmOpen(false)}
          className="max-w-md p-8"
        >
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-stone-700">
            Bạn có chắc muốn xóa cửa hàng{' '}
            <strong>{storeToDelete?.store_name}</strong>? Thao tác này không thể
            hoàn tác.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[6rem]"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="min-w-[6rem]"
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BranchManagementPage;
