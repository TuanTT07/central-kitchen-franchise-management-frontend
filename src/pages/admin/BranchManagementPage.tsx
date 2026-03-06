import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft } from 'lucide-react';
import { adminService, type StoreResponse, type UserResponse } from '../../services/adminServices';
import { cn } from '@/lib/utils';
import { Role } from '../../Types/Role';
import { useForm } from 'react-hook-form';

interface formData {
  storeName: string;
  address: string;
  phone: string;
  managerUserId: number;
  isActive: boolean;
}

const BranchManagementPage = () => {
  // register, reset... từ useForm
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<formData>();

  // state
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreResponse | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<StoreResponse | null>(null);

  // status page
  const [loading, setLoading] = useState(false);

  // Các user có role Manager
  const [userRoleManager, setUserRoleManager] = useState<UserResponse[]>([]);

  // --- STATE QUẢN LÝ PHÂN TRANG (PAGINATION) ---
  const [currentPage, setCurrentPage] = useState(0); // Trang hiện tại (bắt đầu từ 0)
  const [pageSize] = useState(10); // Số lượng phần tử mỗi trang
  const [pageInfo, setPageInfo] = useState({
    totalPages: 0,
    totalElements: 0,
    isFirst: true,
    isLast: true,
  });



  const fetchStore = useCallback(
    async (page: number = 0) => {
      setLoading(true);
      try {
        const response = (await adminService.getAllStores(page, pageSize)).data;
        if (response) {
          const mappedStores = response.content.map((s: StoreResponse) => ({
            storeId: s.storeId,
            storeName: s.storeName,
            address: s.address,
            phone: s.phone,
            managerUserId: s.managerUserId,
            managerUserName: s.managerUserName,
            managerFullName: s.managerFullName,
            isActive: s.isActive,
          }));
          setStores(mappedStores);
          setPageInfo({
            totalPages: response.totalPages,
            totalElements: response.totalElements,
            isFirst: response.first,
            isLast: response.last,
          });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchStore(currentPage);
  }, [fetchStore, currentPage]);

  const filteredStores = stores.filter(
    (s) =>
      s.storeName.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = async () => {
    setEditingStore(null);
    try {
      const response = (await adminService.getAllUsers()).data;
      if (response) {
        const mappedUserRoleManager = response.content.filter((u: UserResponse) => u.role === Role.MANAGER);
        setUserRoleManager(mappedUserRoleManager);
        
        // Reset form về giá trị mặc định, managerUserId lấy từ user đầu tiên nếu có
        reset({
          storeName: '',
          address: '',
          phone: '',
          managerUserId: mappedUserRoleManager.length > 0 ? mappedUserRoleManager[0].userId : 0,
          isActive: true
        });
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách Manager:", error);
    }
    setDialogOpen(true);
  };

  const openEdit = (store: StoreResponse) => {
    setEditingStore(store);
    reset({
      storeName: store.storeName,
      address: store.address,
      phone: store.phone,
      managerUserId: store.managerUserId,
      isActive: store.isActive,
    });
    setDialogOpen(true);
  };

  const openDelete = (store: StoreResponse) => {
    setStoreToDelete(store);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async (data: formData) => {
    try {
      setLoading(true);
      // Ép kiểu managerUserId sang number vì thẻ select trả về string
      const payload = {
        ...data,
        managerUserId: Number(data.managerUserId),
        isActive: editingStore ? data.isActive : true
      };

      if (editingStore) {
        // Nếu có API updateStore trong adminService thì gọi ở đây
        // Hiện tại chỉ thấy createStore, tạm thời update local state hoặc đợi API update
        setStores((prev) => prev.map((s) => (s.storeId === editingStore.storeId ? { ...s, ...payload } : s)));
        alert('Cập nhật cửa hàng thành công');
      } else {
        const response = await adminService.createStore(payload);
        if (response) {
          await fetchStore();
          alert('Tạo cửa hàng thành công');
        }
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Lỗi khi lưu cửa hàng:", error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (storeToDelete) {
      setStores((prev) => prev.filter((s) => s.storeId !== storeToDelete.storeId));
      setDeleteConfirmOpen(false);
      setStoreToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full w-full">
        <Card className="border-amber-200/60 bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
            <CardTitle className="text-xl font-bold text-amber-900">Quản lý Cửa hàng (Store)</CardTitle>
            <Button onClick={openAdd} className="gap-2 bg-amber-500 text-white hover:bg-amber-600">
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

            <div className=" overflow-x-auto rounded-xl border border-amber-200/60 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200 bg-amber-100/80 text-left">
                    <th className="px-5 py-4 font-semibold text-amber-900">ID</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Tên cửa hàng</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Địa chỉ</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Số điện thoại</th>
                    <th className="px-5 py-4 font-semibold text-amber-900">Cửa hàng trưởng</th>
                    <th className="px-5 py-4 text-right font-semibold text-amber-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20">
                        <div className="flex flex-col items-center justify-center w-full">
                          <Loader2 className="size-10 animate-spin text-amber-500" />
                          <p className="mt-2 text-amber-600 animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((store) => (
                      <tr
                        key={store.storeId}
                        className="border-b border-amber-100/80 transition-colors hover:bg-amber-50/70"
                      >
                        <td className="px-5 py-4 font-mono text-amber-700">{store.storeId}</td>
                        <td className="px-5 py-4 font-medium text-amber-900">{store.storeName}</td>
                        <td className="px-5 py-4 text-stone-700">{store.address}</td>
                        <td className="px-5 py-4 text-stone-700">{store.phone}</td>
                        <td className="px-5 py-4 text-stone-700">{store.managerFullName}</td>
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
                    ))
                  )}
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
              </div>
            </div>

            {!loading && filteredStores.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-amber-600/60 bg-white rounded-b-xl border border-t-0 border-amber-200/60">
                <Search className="size-12 mb-3 opacity-20" />
                <p className="py-12 text-center text-amber-600">Không có cửa hàng nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-2xl min-w-[28rem] p-8">
          <form onSubmit={handleSubmit(handleSave)} noValidate>
            <DialogHeader>
              <DialogTitle>{editingStore ? 'Chỉnh sửa cửa hàng' : 'Thêm cửa hàng mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="store_name" className="text-base">
                  Tên cửa hàng
                </Label>
                <Input
                  id="store_name"
                  placeholder="Nhập tên cửa hàng"
                  className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
                  {...register('storeName', {
                    required: 'Tên cửa hàng không được để trống',
                  })}
                />
                {errors.storeName && <p className="text-red-500">{errors.storeName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-base">
                  Địa chỉ
                </Label>
                <Input
                  id="address"
                  placeholder="Nhập địa chỉ"
                  className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
                  {...register('address', {
                    required: 'Địa chỉ không được để trống',
                  })}
                />
                {errors.address && <p className="text-red-500">{errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  placeholder="Nhập số điện thoại (084 xxx xxx)"
                  className="h-11 border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200"
                  {...register('phone', {
                    required: 'Số điện thoại không được để trống',
                  })}
                />
                {errors.phone && <p className="text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_id" className="text-base">
                  Cửa hàng trưởng (User)
                </Label>

                <select
                  id="manager_id"
                  className="h-11 w-full rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2.5 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  {...register('managerUserId', {
                    required: 'Cửa hàng trưởng không được để trống',
                  })}
                >
                  {userRoleManager.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName} ({u.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="lg" className="min-w-[6rem]" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="lg" className="min-w-[6rem] bg-amber-500 text-white hover:bg-amber-600">
                {editingStore ? 'Cập nhật' : 'Thêm'}
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
            Bạn có chắc muốn xóa cửa hàng <strong>{storeToDelete?.storeName}</strong>? Thao tác này không thể hoàn tác.
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

export default BranchManagementPage;
