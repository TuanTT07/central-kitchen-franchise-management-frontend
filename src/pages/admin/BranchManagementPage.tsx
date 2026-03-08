/**
 * =========================================================
 * Component: BranchManagementPage
 * Description: Trang quản lý danh sách các chi nhánh (Store).
 *             Cho phép xem, thêm, sửa, xóa và phân trang các chi nhánh.
 * Author:Dat Tran, Tuan Tran
 * Created: 2026-03-08
 * =========================================================
 */

// ================= IMPORT =================
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft } from 'lucide-react';
import { adminService, type StoreResponse } from '../../services/adminServices';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';

// ================= COMPONENT =================
const BranchManagementPage = () => {
  // ================= INTERNAL COMPONENTS =================
  /**
   * Component hiển thị Badge trạng thái cao cấp
   * @param status Trạng thái của cửa hàng ('ACTIVE' | 'INACTIVE')
   */
  const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === 'ACTIVE';
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-300 shadow-sm',
          isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        )}
      >
        <span className={cn('size-1.5 rounded-full', isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
        {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
      </div>
    );
  };

  // ================= FORM SETUP =================
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreResponse>();

  // ================= STATE =================
  // Danh sách cửa hàng lấy từ API
  const [stores, setStores] = useState<StoreResponse[]>([]);
  // Nội dung tìm kiếm
  const [search, setSearch] = useState('');
  // Quản lý đóng/mở Dialog thêm/sửa
  const [dialogOpen, setDialogOpen] = useState(false);
  // Quản lý đóng/mở Dialog xác nhận xóa
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // Cửa hàng đang được chỉnh sửa
  const [editingStore, setEditingStore] = useState<StoreResponse | null>(null);
  // Cửa hàng đang được chọn để xóa
  const [storeToDelete, setStoreToDelete] = useState<StoreResponse | null>(null);

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

  // ================= API CALLS =================
  /**
   * Gọi API lấy danh sách cửa hàng có phân trang
   * @param page Số trang cần lấy
   */

  const fetchStore = useCallback(
    async (page: number = 0) => {
      setLoading(true);
      try {
        const response = await adminService.getAllStores(page, pageSize);
        if (response && response.data.success) {
          const paginationData = response.data.data;
          const mappedStores = paginationData.items.map((s: StoreResponse) => ({
            storeId: s.storeId,
            storeName: s.storeName,
            address: s.address,
            phone: s.phone,
            status: s.status,
          }));
          setStores(mappedStores);
          setPageInfo({
            totalPages: paginationData.totalPages,
            totalElements: paginationData.totalElements,
            isFirst: paginationData.first,
            isLast: paginationData.last,
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

  // ================= EFFECT =================
  useEffect(() => {
    fetchStore(currentPage);
  }, [fetchStore, currentPage]);

  // ================= LOGIC / FILTER =================
  /**
   * Lọc danh sách cửa hàng dựa trên từ khóa tìm kiếm
   */
  const filteredStores = stores.filter(
    (s) =>
      s.storeName.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase())
  );

  // ================= HANDLERS =================
  /**
   * Mở Dialog để thêm cửa hàng mới
   */
  const openAdd = () => {
    setEditingStore(null);
    reset({
      storeName: '',
      address: '',
      phone: '',
      status: 'ACTIVE',
    });
    setDialogOpen(true);
  };

  /**
   * Mở Dialog để chỉnh sửa thông tin cửa hàng
   * @param store Dữ liệu cửa hàng cần sửa
   */
  const openEdit = (store: StoreResponse) => {
    setEditingStore(store);
    reset({
      storeName: store.storeName,
      address: store.address,
      phone: store.phone,
      status: store.status,
    });
    setDialogOpen(true);
  };

  /**
   * Mở Dialog xác nhận xóa cửa hàng
   * @param store Cửa hàng cần xóa
   */
  const openDelete = (store: StoreResponse) => {
    setStoreToDelete(store);
    setDeleteConfirmOpen(true);
  };

  /**
   * Xử lý lưu thông tin (Thêm mới hoặc Cập nhật)
   * @param data Dữ liệu từ form
   */
  const handleSave = async (data: StoreResponse) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        isActive: editingStore ? data.status : true,
      };

      if (editingStore) {
        // TODO: Gọi API updateStore khi adminService hỗ trợ
        setStores((prev) => prev.map((s) => (s.storeId === editingStore.storeId ? { ...s, ...payload } : s)));
        alert('Cập nhật cửa hàng thành công');
      } else {
        // TODO: Gọi API createStore
        // const response = await adminService.createStore(payload);
        // if (response) { ... }
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Lỗi khi lưu cửa hàng:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý xóa cửa hàng
   */
  const handleDelete = () => {
    if (storeToDelete) {
      // TODO: Gọi API deleteStore
      setStores((prev) => prev.filter((s) => s.storeId !== storeToDelete.storeId));
      setDeleteConfirmOpen(false);
      setStoreToDelete(null);
    }
  };

  // ================= RENDER =================

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
                <Search className="absolute  size-4 left-3 top-1/4  -translate-y-1/4 text-amber-600" />
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
                    <th className="px-5 py-4 font-semibold text-amber-900">Trạng thái</th>
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
                        <td className="px-5 py-4">
                          <StatusBadge status={store.status} />
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
                trên tổng số <span className="text-amber-600">{pageInfo.totalElements}</span> cửa hàng
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
                <Label htmlFor="status" className="text-base font-semibold text-amber-900">
                  Trạng thái cửa hàng
                </Label>
                <select
                  id="status"
                  className="w-full h-11 px-3 rounded-md border border-amber-200 bg-amber-50/50 text-base focus:border-amber-400 focus:ring-amber-200 outline-none transition-all"
                  {...register('status')}
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
                <p className="text-xs text-amber-600/70 italic">
                  * Trạng thái ngừng hoạt động sẽ tạm ẩn cửa hàng khỏi danh sách kinh doanh.
                </p>
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
