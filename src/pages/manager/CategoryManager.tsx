import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { Tag, Plus, Pencil, Trash2, Search, CheckCircle2, Info } from 'lucide-react';

import { managerServices, type categoryResponse } from '@/services/managerServices';

type CategoryStatus = 'ACTIVE' | 'INACTIVE';
type CategoryFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

function CategoryManager() {
  const [categories, setCategories] = useState<categoryResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CategoryFilter>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<categoryResponse | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<categoryResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<categoryResponse>();

  // Lấy tất cả các categories
  const getCategories = async () => {
    try {
      const response = (await managerServices.getAllCategories()).data;
      if (response) {
        setCategories(response);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // const categoryStats = useMemo(() => {
  //   const stats: Record<number, { total: number; active: number }> = {};

  //   for (const p of MOCK_PRODUCTS_FOR_CATEGORY) {
  //     if (!stats[p.category_id]) {
  //       stats[p.category_id] = { total: 0, active: 0 };
  //     }
  //     stats[p.category_id].total += 1;
  //     if (p.status === 'ACTIVE') {
  //       stats[p.category_id].active += 1;
  //     }
  //   }

  //   return stats;
  // }, []);

  // const filteredCategories = useMemo(() => {
  //   let list = categories;

  //   if (statusFilter !== 'ALL') {
  //     list = list.filter(
  //       (c) => ( ?? 'INACTIVE') === statusFilter
  //     );
  //   }

  //   if (search.trim()) {
  //     const keyword = search.toLowerCase();
  //     list = list.filter((c) => c.category_name.toLowerCase().includes(keyword));
  //   }

  //   return list;
  // }, [categories, search, statusFilter]);

  const openAdd = () => {
    setEditingCategory(null);
    reset({
      categoryName: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (category: categoryResponse) => {
    //   setEditingCategory(category);
    //   reset({
    //     category_name: category.category_name,
    //     status: (category.status ?? 'ACTIVE') as CategoryStatus,
    //   });
    //   setDialogOpen(true);
  };

  const openDelete = (category: categoryResponse) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleSave = (data: categoryResponse) => {
    if (editingCategory) {
      // setCategories((prev) =>
      //   prev.map((c) =>
      //     c.category_id === editingCategory.category_id
      //       ? { ...c, category_name: data.category_name, status: data.status }
      //       : c
      //   )
      // );
    } else {
      // const newId = prevMaxId(categories) + 1;
      // setCategories((prev) => [
      //   ...prev,
      //   {
      //     category_id: newId,
      //     category_name: data.category_name,
      //     status: data.status,
      //   },
      // ]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!categoryToDelete) return;
    // setCategories((prev) => prev.filter((c) => c.category_id !== categoryToDelete.category_id));
    setCategoryToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // const statusLabel: Record<CategoryStatus, string> = {
  //   ACTIVE: 'Đang sử dụng',
  //   INACTIVE: 'Ngưng dùng',
  // };

  // const statusColor: Record<CategoryStatus, string> = {
  //   ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  //   INACTIVE: 'bg-stone-100 text-stone-600 border-stone-200',
  // };

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Tag className="size-6 text-amber-500" />
              Quản lý Danh mục sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Định nghĩa các nhóm món ăn/nguyên liệu để cửa hàng và bếp sử dụng thống nhất.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 items-center md:flex">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/50 pl-9 focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <Button
              onClick={openAdd}
              className="h-10 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-white shadow-md hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="size-4" />
              Thêm danh mục
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 md:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
                <Input
                  placeholder="Tìm theo tên danh mục..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-amber-200 bg-amber-50/50 pl-9 focus:border-amber-400 focus:ring-amber-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  Đang sử dụng
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
                  className={cn(
                    'h-8 rounded-full border-stone-300 px-3 text-xs',
                    statusFilter === 'INACTIVE'
                      ? 'bg-stone-700 text-white hover:bg-stone-800'
                      : 'bg-white text-stone-700 hover:bg-stone-50'
                  )}
                  onClick={() => setStatusFilter('INACTIVE')}
                >
                  Ngưng dùng
                </Button>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto rounded-xl border border-amber-200/60 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/60 text-left text-xs font-bold uppercase tracking-wider text-amber-900">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Tên danh mục</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60">
                {categories.map((category) => (
                  <tr key={category.categoryId} className="group transition hover:bg-amber-50/40">
                    <td className="px-6 py-4 font-mono text-xs text-amber-700">#{category.categoryId}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-stone-900">{category.categoryName}</span>
                        {/* Response from getCategories trả lên thiếu nên chưa làm được  */}
                        {/* {categoryStats[category.categoryId] && (
                          <span className="text-[11px] text-stone-500">
                            {categoryStats[category.categoryId].total} sản phẩm (
                            {categoryStats[category.categoryId].active} đang kinh doanh)
                          </span>
                        )} */}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Response from getCategories trả lên thiếu nên chưa làm được  
                       <div
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border shadow-sm',
                          statusColor[(category.status ?? 'INACTIVE') as CategoryStatus]
                        )}
                      >
                        {(category.status ?? 'INACTIVE') === 'ACTIVE' ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <XCircle className="size-3" />
                        )}
                        {statusLabel[(category.status ?? 'INACTIVE') as CategoryStatus]}
                      </div>*/}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                          onClick={() => openEdit(category)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                          onClick={() => openDelete(category)}
                          title="Xóa danh mục"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/**xử lí sau
             *  {filteredCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-amber-700/70">
                <Search className="mb-1 size-10 opacity-30" />
                <p className="text-sm font-medium">Không tìm thấy danh mục nào phù hợp</p>
                <p className="text-xs text-amber-700/70">
                  Hãy thử lại với từ khóa khác hoặc thêm danh mục mới.
                </p>
              </div>
            )}
             */}
          </div>
        </CardContent>
      </Card>

      {/**
      * Form edit chưa xử lí
      *  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onClose={() => setDialogOpen(false)}
          className="max-w-md min-w-[320px] overflow-hidden border-none p-0 shadow-2xl"
        >
          <form
            noValidate
            onSubmit={handleSubmit(handleSave)}
            className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl"
          >
            <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pb-5 pt-7 text-white">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                {editingCategory ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto bg-white px-6 py-5">
              <Field>
                <FieldLabel
                  htmlFor="category_name"
                  className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-amber-900"
                >
                  <Tag className="size-4 text-amber-500" />
                  Tên danh mục
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="category_name"
                    placeholder="Ví dụ: Món chính, Đồ uống..."
                    className="h-10 border-amber-200 bg-amber-50/40 text-sm focus:border-amber-500 focus:ring-amber-200"
                    {...register('category_name', {
                      required: 'Tên danh mục là bắt buộc',
                      minLength: { value: 2, message: 'Ít nhất 2 ký tự' },
                    })}
                  />
                  {errors.category_name && <FieldError errors={[errors.category_name]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="status"
                  className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-amber-900"
                >
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Trạng thái sử dụng
                </FieldLabel>
                <FieldContent>
                  <select
                    id="status"
                    className="h-10 w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    {...register('status')}
                  >
                    <option value="ACTIVE">Đang sử dụng</option>
                    <option value="INACTIVE">Ngưng dùng</option>
                  </select>
                </FieldContent>
              </Field>
            </div>

            <DialogFooter className="gap-3 border-t border-stone-100 bg-stone-50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-9 min-w-[5rem] border-stone-300 text-stone-700 hover:bg-white hover:text-stone-900"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-9 min-w-[7rem] bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-white shadow-md hover:from-amber-600 hover:to-orange-600"
              >
                {editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      */}

      {/** popup confirm delete
       * <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          onClose={() => setDeleteConfirmOpen(false)}
          className="max-w-md border-amber-200/60 bg-white p-8 shadow-xl"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-stone-900">
              <Trash2 className="size-5 text-rose-500" />
              Xác nhận xóa danh mục
            </DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-stone-700">
            Bạn có chắc muốn xóa danh mục{' '}
            <span className="font-semibold text-amber-800">{categoryToDelete?.category_name}</span>? Thao tác này không
            thể hoàn tác và có thể ảnh hưởng tới việc phân nhóm sản phẩm.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-w-[5rem] border-stone-300 text-stone-700 hover:bg-stone-50"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" className="min-w-[5rem] bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       */}
    </div>
  );
}

// function prevMaxId(items: Category[]): number {
//   if (!items.length) return 0;
//   return items.reduce((max, item) => (item.category_id > max ? item.category_id : max), items[0].category_id);
// }

export default CategoryManager;
