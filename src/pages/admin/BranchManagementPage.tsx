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
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, Store, MapPin, Phone, Shield } from 'lucide-react';
import { adminService, type StoreResponse } from '../../services/adminServices';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { toast } from 'sonner';
import { Role } from '@/Types';
import { ADMIN_PAGINATION_CHANGED_EVENT, getListPageSizeForRole, type AdminPaginationPrefs } from '@/lib/adminPaginationSettings';

// type của Filter
type StoreFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

// ================= COMPONENT =================
const BranchManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  // Quản lí status của Filter
  const [statusFilter, setStatusFilter] = useState<StoreFilter>('ALL');

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
  const [pageSize, setPageSize] = useState(() => getListPageSizeForRole(Role.ADMIN));
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
          toast.success(`${response.data.message}`);
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
        toast.error(`${error}`);
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

  useEffect(() => {
    const onPaginationChange = (ev: Event) => {
      const detail = (ev as CustomEvent<AdminPaginationPrefs>).detail;
      const next =
        detail?.pageSizeByRole?.[Role.ADMIN] ?? getListPageSizeForRole(Role.ADMIN);
      setPageSize(next);
      setCurrentPage(0);
    };
    window.addEventListener(ADMIN_PAGINATION_CHANGED_EVENT, onPaginationChange as EventListener);
    return () => window.removeEventListener(ADMIN_PAGINATION_CHANGED_EVENT, onPaginationChange as EventListener);
  }, []);

  /** Admin: mở sửa cửa hàng khi vào từ Quản lý người dùng (tài khoản franchise). */
  const editStoreIdParam = searchParams.get('editStoreId');
  useEffect(() => {
    if (!editStoreIdParam) return;
    const id = Number(editStoreIdParam);
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await adminService.getStoreById(id);
        const payload = res.data as { success?: boolean; data?: StoreResponse; message?: string };
        const store = payload?.data;
        if (cancelled) return;
        if (!store) {
          toast.error('Không tìm thấy cửa hàng.');
          return;
        }
        setEditingStore(store);
        reset({
          storeId: store.storeId,
          storeName: store.storeName,
          address: store.address,
          phone: store.phone,
          status: store.status,
        });
        setDialogOpen(true);
        setSearchParams((prev: URLSearchParams) => {
          const p = new URLSearchParams(prev);
          p.delete('editStoreId');
          return p;
        }, { replace: true });
      } catch {
        toast.error('Không tải được cửa hàng để chỉnh sửa.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editStoreIdParam, reset, setSearchParams]);

  // ================= LOGIC / FILTER =================
  /**
   * Lọc danh sách cửa hàng dựa trên từ khóa tìm kiếm và theo bộ lọc
   */
  const filteredStores = useMemo(() => {
    let listStore = [...stores];

    // Lọc theo trạng thái
    if (statusFilter !== 'ALL') {
      listStore = listStore.filter((s) => s.status === statusFilter);
    }

    // Lọc theo từ khóa tìm kiếm
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      listStore = listStore.filter(
        (s) => s.storeName.toLowerCase().includes(searchLower) || s.address.toLowerCase().includes(searchLower)
      );
    }
    return listStore;
  }, [stores, statusFilter, search]);

  // ================= HANDLERS =================
  /**
   * Mở Dialog để thêm cửa hàng mới
   */
  const openAdd = () => {
    setEditingStore(null);
    reset({
      storeId: 0,
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
      storeId: store.storeId,
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
      if (editingStore) {
        try {
          await adminService.updateStore(editingStore.storeId, {
            storeName: data.storeName,
            address: data.address,
            phone: data.phone,
            status: data.status,
          });
          toast.success('Cập nhật cửa hàng thành công');
          fetchStore();
        } catch (error) {
          toast.error(`Lỗi cập nhật cửa hàng: ${error}`);
        }
      } else {
        try {
          const response = await adminService.createStore({
            storeName: data.storeName,
            address: data.address,
            phone: data.phone,
            status: data.status === 'ACTIVE' ? data.status : 'INACTIVE',
          });
          if (response) {
            toast.success(`${response.data.message}`);
            fetchStore();
          }
        } catch (error) {
          toast.error(`Lỗi tạo cửa hàng: ${error}`);
        }
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
  const handleDelete = async () => {
    if (storeToDelete) {
      try {
        const response = await adminService.deleteStore(storeToDelete.storeId);
        if (response.data.success) {
          toast.success(`${response.data.message}`);
          fetchStore();
        }
      } catch (error) {
        toast.error(`Lỗi xóa cửa hàng: ${error}`);
      }
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
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
                <Input
                  placeholder="Tìm theo tên, địa chỉ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Bộ lọc trạng thái
              </span>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                  className={cn(
                    'h-8 rounded-full border-amber-200 px-3 text-xs',
                    statusFilter === 'ALL'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-white text-amber-800 hover:bg-amber-50'
                  )}
                  onClick={() => setStatusFilter('ALL')}
                >
                  Tất cả
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                  className={cn(
                    'h-8 rounded-full border-emerald-200 px-3 text-xs',
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  )}
                  onClick={() => setStatusFilter('ACTIVE')}
                >
                  Đang hoạt động
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
                  className={cn(
                    'h-8 rounded-full border-rose-200 px-3 text-xs',
                    statusFilter === 'INACTIVE'
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-white text-rose-700 hover:bg-rose-50'
                  )}
                  onClick={() => setStatusFilter('INACTIVE')}
                >
                  Ngừng hoạt động
                </Button>
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
        <DialogContent
          onClose={() => setDialogOpen(false)}
          className="max-w-2xl min-w-[28rem] p-0 overflow-hidden border-none shadow-2xl"
        >
          <form noValidate onSubmit={handleSubmit(handleSave)} className="flex flex-col">
            <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {editingStore ? <Pencil className="size-6" /> : <Plus className="size-6" />}
                {editingStore ? 'Chỉnh sửa cửa hàng' : 'Thêm cửa hàng mới'}
              </DialogTitle>
              <p className="text-amber-50/80 text-sm mt-1">
                {editingStore
                  ? 'Cập nhật thông tin chi tiết cho cửa hàng này'
                  : 'Điền thông tin bên dưới để tạo một cửa hàng mới'}
              </p>
            </DialogHeader>

            <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
              <Field>
                <FieldLabel htmlFor="store_name" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                  <Store className="size-4 text-amber-500" />
                  Tên cửa hàng
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="store_name"
                    placeholder="Nhập tên cửa hàng"
                    className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                    {...register('storeName', { required: 'Tên cửa hàng không được để trống' })}
                  />
                  {errors.storeName && <FieldError errors={[errors.storeName]} className="mt-1" />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="address" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                  <MapPin className="size-4 text-amber-500" />
                  Địa chỉ
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="address"
                    placeholder="Nhập địa chỉ"
                    className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                    {...register('address', { required: 'Địa chỉ không được để trống' })}
                  />
                  {errors.address && <FieldError errors={[errors.address]} className="mt-1" />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="phone" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                  <Phone className="size-4 text-amber-500" />
                  Số điện thoại
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="phone"
                    placeholder="Nhập số điện thoại (084 xxx xxx)"
                    className="h-12 border-amber-200 bg-amber-50/30 transition-all focus:bg-white focus:border-amber-500 focus:ring-amber-200"
                    {...register('phone', { required: 'Số điện thoại không được để trống' })}
                  />
                  {errors.phone && <FieldError errors={[errors.phone]} className="mt-1" />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="status" className="text-amber-900 font-semibold mb-1.5 flex items-center gap-2">
                  <Shield className="size-4 text-amber-500" />
                  Trạng thái cửa hàng
                </FieldLabel>
                <FieldContent>
                  <select
                    id="status"
                    className="h-12 w-full rounded-md border border-amber-200 bg-amber-50/30 px-4 text-[15px] transition-all focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23F59E0B%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat"
                    {...register('status')}
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                  <p className="mt-2 text-xs text-amber-600/70 italic">
                    * Trạng thái ngừng hoạt động sẽ tạm ẩn cửa hàng khỏi danh sách kinh doanh.
                  </p>
                </FieldContent>
              </Field>
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
                {editingStore ? 'Cập nhật' : 'Thêm cửa hàng'}
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
