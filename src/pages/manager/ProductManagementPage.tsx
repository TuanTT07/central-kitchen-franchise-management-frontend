import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Package,
  Tag,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Info,
  Scale,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { managerServices, type categoryResponse, type productsResponse } from '@/services/managerServices';

type ProductStatus = 'ACTIVE' | 'INACTIVE' | null;

const UNIT_OPTIONS = ['phần', 'kg', 'lít', 'hộp', 'chai', 'bịch'];

const ProductManagementPage = () => {
  const [products, setProducts] = useState<productsResponse[]>([]);
  const [categories, setCategories] = useState<categoryResponse[]>([]);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<productsResponse | null>(null);
  const [productToDelete, setProductToDelete] = useState<productsResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<productsResponse>();

  const getProducts = async () => {
    try {
      const response = (await managerServices.getAllProducts()).data;
      if (response) {
        setProducts(response);
      }
    } catch (error) {}
  };

  useEffect(() => {
    getProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    // if (!search.trim()) return products;
    // // const keyword = search.toLowerCase();
    // return products.filter((p) => {
    //   const categoryName =
    //     p.category_id !== null
    //       ? (MOCK_CATEGORIES.find((c) => c.category_id === p.category_id)?.category_name ?? '')
    //       : '';
    //   return ;
    //     p.product_name.toLowerCase().includes(keyword) ||
    //     categoryName.toLowerCase().includes(keyword) ||
    //     (p.unit && p.unit.toLowerCase().includes(keyword))
    // });
  }, [products, search]);

  // lấy ra danh sách category
  const getCategories = async () => {
    try {
      const response = (await managerServices.getAllCategories()).data;
      if (response) {
        setCategories(response);
      }
    } catch (error) {}
  };

  const openAdd = () => {
    setEditingProduct(null);
    getCategories();
    reset({
      productName: '',
      unit: '',
      imageUrl: '',
      description: '',
      categoryID: 0,
      status: 'ACTIVE',
    });
    setDialogOpen(true);
  };

  const openEdit = (product: productsResponse) => {
    setEditingProduct(product);
    getCategories();
    reset({
      productId: product.productId,
      productName: product.productName,
      unit: product.unit,
      imageUrl: product.imageUrl ?? undefined,
      description: product.description ?? undefined,
      categoryID: product.categoryID,
    });
    setDialogOpen(true);
  };

  const openDelete = (product: productsResponse) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async (data: productsResponse) => {
    if (editingProduct) {
      try {
        const response = await managerServices.updateProduct(data.productId, {
          productName: data.productName,
          unit: data.unit,
          imageUrl: data.imageUrl,
          description: data.description,
          categoryId: Number(data.categoryID),
        });

        if (response) {
          getProducts();
        }
      } catch (error) {}
    } else {
      try {
        const response = await managerServices.createProduct({
          productName: data.productName,
          unit: data.unit,
          imageUrl: data.imageUrl,
          description: data.description,
          categoryId: Number(data.categoryID),
        });
        if (response) {
          getProducts();
        }
      } catch (error) {}
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const response = await managerServices.deleteProduct(productToDelete.productId);
      if (response.success) {
        getProducts();
      }
    } catch (error) {}

    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const statusLabel: Record<Exclude<ProductStatus, null>, string> = {
    ACTIVE: 'Đang kinh doanh',
    INACTIVE: 'Ngừng bán',
  };

  const statusColor: Record<Exclude<ProductStatus, null>, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-stone-100 text-stone-600 border-stone-200',
  };

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Quản lý Sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Danh sách món ăn/nguyên liệu, phục vụ cho việc đặt hàng và sản xuất
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 items-center md:flex">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên sản phẩm, danh mục..."
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
              Thêm sản phẩm
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên sản phẩm, danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/50 pl-9 focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
          </div>

          <div className="relative overflow-x-auto rounded-xl border border-amber-200/60 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/60 text-left text-xs font-bold uppercase tracking-wider text-amber-900">
                  <th className="px-6 py-4">STT</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Đơn vị</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60">
                {products.map((product, index) => (
                  <tr key={product.productId} className="group transition hover:bg-amber-50/40">
                    <td className="px-6 py-4 text-xs font-mono text-amber-600/70">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg border border-amber-100 bg-amber-50/60">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.productName} className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-stone-900">{product.productName}</span>
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                              ID #{product.productId}
                            </span>
                          </div>
                          {product.description && (
                            <p className="line-clamp-1 text-xs text-stone-500">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/**
                       * <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                        <Tag className="size-3" />
                        {MOCK_CATEGORIES.find((c) => c.category_id === product.category_id)?.category_name ?? 'N/A'}
                      </div>
                       */}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                        <Scale className="size-3 text-amber-500" />
                        {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border shadow-sm',
                          statusColor[(product.status as 'ACTIVE' | 'INACTIVE') ?? 'INACTIVE']
                        )}
                      >
                        {(product.status ?? 'INACTIVE') === 'ACTIVE' ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <XCircle className="size-3" />
                        )}
                        {statusLabel[(product.status as 'ACTIVE' | 'INACTIVE') ?? 'INACTIVE']}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                          onClick={() => openEdit(product)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                          onClick={() => openDelete(product)}
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-amber-700/70">
                <Search className="mb-1 size-10 opacity-30" />
                <p className="text-sm font-medium">Không tìm thấy sản phẩm nào phù hợp</p>
                <p className="text-xs text-amber-700/70">Hãy thử lại với từ khóa khác hoặc thêm sản phẩm mới.</p>
              </div>
            ) */}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onClose={() => setDialogOpen(false)}
          className="max-w-2xl min-w-[320px] overflow-hidden border-none p-0 shadow-2xl"
        >
          <form
            noValidate
            onSubmit={handleSubmit(handleSave)}
            className="flex max-h-[80vh] flex-col overflow-hidden rounded-2xl"
          >
            <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 pb-6 pt-8 text-white">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                {editingProduct ? <Pencil className="size-6" /> : <Plus className="size-6" />}
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </DialogTitle>
              <p className="mt-1 text-sm text-amber-50/80">
                Nhập thông tin chi tiết cho món ăn/nguyên liệu trong kho trung tâm.
              </p>
            </DialogHeader>

            <div className="flex-1 space-y-6 overflow-y-auto bg-white px-8 py-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldLabel
                    htmlFor="product_name"
                    className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold"
                  >
                    <Package className="size-4 text-amber-500" />
                    Tên sản phẩm
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="productName"
                      placeholder="Ví dụ: Cơm gà xối mỡ"
                      className="h-11 border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-200"
                      {...register('productName', {
                        required: 'Tên sản phẩm là bắt buộc',
                        minLength: { value: 3, message: 'Ít nhất 3 ký tự' },
                      })}
                    />
                    {errors.productName && <FieldError errors={[errors.productName]} />}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="category_id"
                    className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold"
                  >
                    <Tag className="size-4 text-amber-500" />
                    Danh mục
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="category_id"
                      className="h-11 w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 text-sm transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                      {...register('categoryID', { valueAsNumber: true })}
                    >
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.categoryId} - {c.categoryName}
                        </option>
                      ))}
                    </select>
                    {errors.categoryID && <FieldError errors={[errors.categoryID]} />}
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="unit" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <Scale className="size-4 text-amber-500" />
                    Đơn vị tính
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="unit"
                      className="h-11 w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 text-sm transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                      {...register('unit', { required: 'Đơn vị là bắt buộc' })}
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    {errors.unit && <FieldError errors={[errors.unit]} />}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="status" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Trạng thái kinh doanh
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="status"
                      className="h-11 w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      {...register('status')}
                    >
                      <option value="ACTIVE">Đang kinh doanh</option>
                      <option value="INACTIVE">Ngừng bán</option>
                    </select>
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="image_url" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                  <ImageIcon className="size-4 text-amber-500" />
                  Ảnh sản phẩm (URL)
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="image_url"
                    placeholder="Dán đường dẫn ảnh minh họa (tùy chọn)"
                    className="h-11 border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-200"
                    {...register('imageUrl')}
                  />
                  {errors.imageUrl && <FieldError errors={[errors.imageUrl]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="description"
                  className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold"
                >
                  <Info className="size-4 text-amber-500" />
                  Mô tả sản phẩm
                </FieldLabel>
                <FieldContent>
                  <textarea
                    id="description"
                    placeholder="Ghi chú nhanh về cách dùng, đặc điểm, lưu ý bảo quản..."
                    className="min-h-[80px] w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
                    {...register('description')}
                  />
                  {errors.description && <FieldError errors={[errors.description]} />}
                </FieldContent>
              </Field>
            </div>

            <DialogFooter className="gap-3 border-t border-stone-100 bg-stone-50 px-8 py-5">
              <Button
                type="button"
                variant="outline"
                className="h-10 min-w-[5rem] border-stone-300 text-stone-700 hover:bg-white hover:text-stone-900"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 min-w-[7rem] bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-white shadow-md hover:from-amber-600 hover:to-orange-600"
              >
                {editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          onClose={() => setDeleteConfirmOpen(false)}
          className="max-w-md border-amber-200/60 bg-white p-8 shadow-xl"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-stone-900">
              <Trash2 className="size-5 text-rose-500" />
              Xác nhận xóa sản phẩm
            </DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-stone-700">
            Bạn có chắc muốn xóa sản phẩm{' '}
            <span className="font-semibold text-amber-800">{productToDelete?.productName}</span>? Thao tác này không thể
            hoàn tác và có thể ảnh hưởng đến các đơn hàng đang sử dụng sản phẩm này.
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
    </div>
  );
};

{
  /**
  function prevMaxId(items: Product[]): number {
  if (!items.length) return 0;
  return items.reduce((max, item) => (item.product_id > max ? item.product_id : max), items[0].product_id);
} */
}

export default ProductManagementPage;
