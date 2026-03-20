/**
 * File: ProductManagementPage.tsx
 * Description: Quản lý danh sách sản phẩm, danh mục và đơn vị tính cho Manager
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  ChevronLeft,
  ChevronRight,
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
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import {
  managerServices,
  type CategoryResponse,
  type ProductsResponse,
  type UnitResponse,
} from '@/services/managerServices';
import { toast } from 'sonner';

/**
 * ProductManagementPage Component
 * - Quản lý sản phẩm (Thêm, Sửa, Xóa, Chi tiết)
 * - Quản lý đơn vị tính
 * - Tìm kiếm và phân trang sản phẩm
 * - Upload và Preview ảnh (Chỉ cho phép import 1 ảnh)
 */

type ProductStatus = 'ACTIVE' | 'INACTIVE' | null;

const ProductManagementPage = () => {
  // ================= STATE =================

  // Danh sách sản phẩm từ API
  const [products, setProducts] = useState<ProductsResponse[]>([]);
  // Danh sách danh mục từ API
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // Từ khóa tìm kiếm
  const [search, setSearch] = useState('');
  // Trang hiện tại
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  
  // Trạng thái Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Sản phẩm đang tác động (Sửa/Xóa/Chi tiết)
  const [editingProduct, setEditingProduct] = useState<ProductsResponse | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductsResponse | null>(null);

  // Unit states (Quản lý đơn vị)
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [unitToDelete, setUnitToDelete] = useState<UnitResponse | null>(null);
  const [unitDeleteConfirmOpen, setUnitDeleteConfirmOpen] = useState(false);

  // Quan trọng: Chỉ cho phép import 1 ảnh
  // File ảnh được chọn từ máy
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // URL phục vụ xem trước (preview)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form hooks cho Sản phẩm
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductsResponse>();

  // Form hooks cho Đơn vị
  const {
    register: registerUnit,
    handleSubmit: handleSubmitUnit,
    reset: resetUnit,
    formState: { errors: errorsUnit },
  } = useForm<UnitResponse>();

  // ================= EFFECT =================

  // Khởi tạo dữ liệu khi component mount
  useEffect(() => {
    getProducts();
    getUnits();
    getCategories();
  }, []);

  // Dọn dẹp URL tạm thời khi previewUrl thay đổi hoặc component unmount để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ================= API CALLS =================

  // Lấy danh sách danh mục từ backend
  const getCategories = async () => {
    try {
      const response = (await managerServices.getAllCategories()).data;
      if (response) {
        setCategories(response);
      }
    } catch (error) {
      console.error('Fetch categories failed', error);
    }
  };

  // Lấy danh sách sản phẩm từ backend
  const getProducts = async () => {
    try {
      const response = (await managerServices.getAllProducts()).data;
      if (response) {
        setProducts(response);
      }
    } catch (error) {
      console.error('Fetch products failed', error);
    }
  };

  // Lấy thông tin chi tiết một sản phẩm theo ID
  const getProductDetail = async (id: number) => {
    try {
      const response = await managerServices.getProductDetail(id);
      return response.data || response;
    } catch (error) {
      toast.error('Lỗi khi tải thông tin sản phẩm');
      throw error;
    }
  };

  // Lấy danh sách các đơn vị tính
  const getUnits = async () => {
    try {
      const response = (await managerServices.getAllUnits()).data;
      if (response) {
        setUnits(response);
      }
    } catch (error) {
      console.error('Fetch units failed', error);
    }
  };

  // ================= HANDLER =================

  // Xử lý tìm kiếm sản phẩm và reset về trang 1
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Xử lý khi người dùng chọn file ảnh từ máy tính (Chỉ lấy 1 file đầu tiên)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Chỉ lấy tệp tin đầu tiên
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Xóa tệp tin ảnh đang chọn và reset preview
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Mở modal thêm sản phẩm mới
  const openAdd = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    getCategories();
    reset({
      productName: '',
      unitId: 0,
      imageUrl: '',
      description: '',
      categoryId: 0,
      status: 'ACTIVE',
      price: 0,
      shelfLifeDays: 1,
    });
    setDialogOpen(true);
  };

  // Mở modal xem chi tiết sản phẩm
  const openDetail = async (product: ProductsResponse) => {
    const toastId = toast.loading('Đang tải thông tin chi tiết...');
    try {
      const detailedProduct = await getProductDetail(product.productId);
      setEditingProduct(detailedProduct);
      setDetailDialogOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss(toastId);
    }
  };

  // Mở modal chỉnh sửa sản phẩm hiện có
  const openEdit = async (product: ProductsResponse) => {
    setEditingProduct(product);
    setSelectedFile(null);
    setPreviewUrl(product.imageUrl || null);
    getCategories();
    getUnits();
    
    const toastId = toast.loading('Đang tải thông tin chi tiết...');
    try {
      const detailedProduct = await getProductDetail(product.productId);

      reset({
        productId: detailedProduct.productId,
        productName: detailedProduct.productName,
        unitId: Number(detailedProduct.unitId),
        imageUrl: detailedProduct.imageUrl ?? undefined,
        description: detailedProduct.description ?? undefined,
        categoryId: detailedProduct.categoryId,
        status: detailedProduct.status,
        price: detailedProduct.price ?? 0,
        shelfLifeDays: detailedProduct.shelfLifeDays ?? 1,
      });
      setPreviewUrl(detailedProduct.imageUrl || null);
      setDialogOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      toast.error('Lỗi lấy thông tin sản phẩm', { id: toastId });
    }
  };

  // Mở modal xác nhận xóa
  const openDelete = (product: ProductsResponse) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  // Lưu thông tin sản phẩm (Thêm mới hoặc Cập nhật sử dụng FormData)
  const handleSave = async (data: ProductsResponse) => {
    const formData = new FormData();
    formData.append('productName', data.productName);
    formData.append('unitId', String(data.unitId));
    formData.append('description', data.description || '');
    formData.append('categoryId', String(data.categoryId));
    formData.append('price', String(data.price));
    formData.append('shelfLifeDays', String(data.shelfLifeDays));
    
    // Đính kèm file ảnh nếu có lựa chọn mới, nếu không giữ URL cũ
    if (selectedFile) {
      formData.append('image', selectedFile);
    } else if (data.imageUrl) {
      formData.append('image', data.imageUrl);
    }

    if (editingProduct) {
      try {
        const response = await managerServices.updateProduct(data.productId, formData);
        if (response) {
          getProducts();
          toast.success(`${response.message}`);
        }
      } catch (error) {
        toast.error('Không thể cập nhật sản phẩm');
      }
    } else {
      try {
        const response = await managerServices.createProduct(formData);
        if (response) {
          getProducts();
          toast.success(`${response.message}`);
        }
      } catch (error) {
        toast.error('Không thể thêm sản phẩm');
      }
    }
    setDialogOpen(false);
  };

  // Xử lý xóa sản phẩm sau khi xác nhận
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const response = await managerServices.deleteProduct(productToDelete.productId);
      if (response.success) {
        getProducts();
        toast.success(`${response.message}`);
      }
    } catch (error) {
      toast.error('Không thể xóa sản phẩm');
    }
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  // Quản lý Đơn vị tính
  const openSettingUnit = () => {
    setEditingUnit(false);
    setUnitDialogOpen(true);
  };
  
  const handleEditUnit = (unit: UnitResponse) => {
    setEditingUnit(unit);
    resetUnit({
      unitName: unit.unitName,
      description: unit.description,
    });
  };

  const handleSaveUnit = async (data: UnitResponse) => {
    try {
      if (editingUnit) {
        const response = await managerServices.updateUnit(editingUnit.unitId, {
          unitName: data.unitName,
          description: data.description,
        });
        if (response) {
          getUnits();
          setEditingUnit(null);
          resetUnit({ unitName: '', description: '' });
          toast.success(`${response.message}`);
        }
      } else {
        const response = await managerServices.createUnit({
          unitName: data.unitName,
          description: data.description,
        });
        if (response) {
          getUnits();
          resetUnit({ unitName: '', description: '' });
          toast.success(`${response.message}`);
        }
      } 
    }catch (error) {
      toast.error('Không thể lưu đơn vị');
    }
  };

  const openDeleteUnit = (unit: UnitResponse) => {
    setUnitToDelete(unit);
    setUnitDeleteConfirmOpen(true);
  };

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    try {
      const response = await managerServices.deleteUnit(unitToDelete.unitId);
      if (response.success) {
        getUnits();
        toast.success(`${response.message}`);
      }
    } catch (error) {
      toast.error('Không thể xóa đơn vị');
    }
    setUnitDeleteConfirmOpen(false);
    setUnitToDelete(null);
  };

  // ================= UTILS =================

  // Ép kiểu hiển thị trạng thái
  const statusLabel: Record<Exclude<ProductStatus, null>, string> = {
    ACTIVE: 'Đang kinh doanh',
    INACTIVE: 'Ngừng bán',
  };

  const statusColor: Record<Exclude<ProductStatus, null>, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-stone-100 text-stone-600 border-stone-200',
  };

  // Hợp nhất dữ liệu Products với Category Name, Unit Name và thực hiện lọc/tìm kiếm
  const displayProducts = useMemo(() => {
    const rawList = products.map((p: ProductsResponse) => {
      const category = categories.find((c) => c.categoryId === p.categoryId);
      const unit = units.find((u: UnitResponse) => u.unitId === Number(p.unitId));
      return {
        ...p,
        categoryName: category?.categoryName || p.categoryName || 'Chưa phân loại',
        unitName: unit?.unitName || p.unitName || 'Không xác định',
      };
    });

    if (!search.trim()) return rawList;
    const keyword = search.toLowerCase();
    return rawList.filter((p) => {
      const productName = String(p.productName).toLowerCase();
      const categoryName = String(p.categoryName).toLowerCase();
      const unitName = String(p.unitName).toLowerCase();
      return productName.includes(keyword) || categoryName.includes(keyword) || unitName.includes(keyword);
    });
  }, [products, categories, units, search]);

  // Phân trang
  const totalPages = Math.ceil(displayProducts.length / PAGE_SIZE);
  const paginatedProducts = displayProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ================= RENDER =================

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Quản lý Sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Danh sách món ăn/nguyên liệu trong kho trung tâm.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 items-center md:flex">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên sản phẩm, danh mục..."
                value={search}
                onChange={handleSearch}
                className="border-amber-200 bg-amber-50/50 pl-9 focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <Button
              onClick={openAdd}
              className="h-10 gap-2 bg-amber-600 px-5 text-white shadow-md hover:bg-amber-700"
            >
              <Plus className="size-4" />
              Thêm sản phẩm
            </Button>
            <Button
              onClick={openSettingUnit}
              className="h-10 gap-2 bg-amber-600 px-5 text-white shadow-md hover:bg-amber-700"
            >
              <Scale className="size-4" />
              Thiết lập đơn vị
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên sản phẩm, danh mục..."
                value={search}
                onChange={handleSearch}
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
                {paginatedProducts.map((product, index) => (
                  <tr 
                    key={product.productId} 
                    className="group cursor-pointer transition hover:bg-amber-50/40"
                    onClick={() => openDetail(product)}
                  >
                    <td className="px-6 py-4 text-xs font-mono text-amber-600/70">{(page - 1) * PAGE_SIZE + index + 1}</td>
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
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        <Tag className="size-3 text-amber-500" />
                        {product.categoryName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                        <Scale className="size-3 text-amber-500" />
                        {product.unitName}
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
                      <div className="flex justify-end gap-2 ">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-700 hover:cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(product);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {product.status !== 'INACTIVE' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full text-rose-500 hover:bg-rose-100 hover:text-rose-600 hover:cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDelete(product);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {displayProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-amber-700/70">
                <Search className="mb-1 size-10 opacity-30" />
                <p className="text-sm font-medium">Không tìm thấy sản phẩm nào</p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-amber-100 px-4 py-3">
                <p className="text-xs text-stone-500 whitespace-nowrap">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayProducts.length)} / {displayProducts.length}
                </p>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar ml-4">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        'flex size-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-semibold',
                        p === page
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Thêm/Sửa sản phẩm */}
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
            <DialogHeader className="bg-amber-600 px-8 pb-6 pt-8 text-white">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                {editingProduct ? <Pencil className="size-6" /> : <Plus className="size-6" />}
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </DialogTitle>
              <p className="mt-1 text-sm text-amber-50/80">
                Nhập thông tin chi tiết cho sản phẩm.
              </p>
            </DialogHeader>

            <div className="flex-1 space-y-6 overflow-y-auto bg-white px-8 py-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="productName" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <Package className="size-4 text-amber-500" />
                    Tên sản phẩm
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="productName"
                      placeholder="Ví dụ: Cơm gà"
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
                  <FieldLabel htmlFor="categoryId" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <Tag className="size-4 text-amber-500" />
                    Danh mục
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="categoryId"
                      className="h-11 w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 text-sm transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                      {...register('categoryId', { valueAsNumber: true })}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <FieldError errors={[errors.categoryId]} />}
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="unitId" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <Scale className="size-4 text-amber-500" />
                    Đơn vị tính
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="unitId"
                      className="h-11 w-full rounded-md border border-amber-200 bg-amber-50/40 px-3 text-sm transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                      {...register('unitId', {
                        required: 'Đơn vị là bắt buộc',
                        valueAsNumber: true,
                      })}
                    >
                      <option value="">Chọn đơn vị</option>
                      {units.map((u) => (
                        <option key={u.unitId} value={u.unitId}>
                          {u.unitName}
                        </option>
                      ))}
                    </select>
                    {errors.unitId && <FieldError errors={[errors.unitId]} />}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="status" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Trạng thái
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

              {/* Khu vực Upload Ảnh Sản phẩm */}
              <Field>
                <FieldLabel htmlFor="image_upload" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                  <ImageIcon className="size-4 text-amber-500" />
                  Ảnh sản phẩm (Chỉ chọn 1 ảnh)
                </FieldLabel>
                <FieldContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <label 
                        htmlFor="image_upload"
                        className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-amber-200 bg-amber-50/40 px-4 text-sm font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-100/50"
                      >
                        <Upload className="size-4" />
                        {selectedFile ? 'Thay đổi ảnh' : 'Chọn ảnh sản phẩm'}
                        <input
                          id="image_upload"
                          type="file"
                          accept="image/*"
                          multiple={false} // Ràng buộc chỉ chọn 1 file
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                      
                      {previewUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSelectedFile}
                          className="h-11 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="mr-1 size-4" />
                          Gỡ ảnh
                        </Button>
                      )}
                    </div>

                    {previewUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-amber-100 bg-stone-50 shadow-inner">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="size-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </FieldContent>
              </Field>

              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="price" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <Tag className="size-4 text-emerald-500" />
                    Đơn giá (VNĐ)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Ví dụ: 50000"
                      className="h-11 border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-200"
                      {...register('price', {
                        required: 'Giá là bắt buộc',
                        min: { value: 0, message: 'Giá không hợp lệ' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.price && <FieldError errors={[errors.price]} />}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="shelfLifeDays" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Hạn dùng (Ngày)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="shelfLifeDays"
                      type="number"
                      placeholder="Ví dụ: 30"
                      className="h-11 border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-200"
                      {...register('shelfLifeDays', {
                        required: 'Hạn dùng là bắt buộc',
                        min: { value: 1, message: 'Tối thiểu 1 ngày' },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.shelfLifeDays && <FieldError errors={[errors.shelfLifeDays]} />}
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="description" className="mb-1.5 flex items-center gap-2 text-amber-900 font-semibold">
                  <Info className="size-4 text-amber-500" />
                  Mô tả sản phẩm
                </FieldLabel>
                <FieldContent>
                  <textarea
                    id="description"
                    placeholder="Thông tin thêm..."
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
                className="h-10 border-stone-300 text-stone-700 hover:bg-white"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 min-w-[7rem] bg-amber-600 px-6 text-white shadow-md hover:bg-amber-700"
              >
                {editingProduct ? 'Lưu' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết sản phẩm */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl border-none !p-0 shadow-2xl overflow-hidden rounded-[24px]">
          <div className="flex flex-col bg-white text-stone-900 w-full">
            {/* Header */}
            <div className="relative flex min-h-[80px] w-full items-center bg-amber-600 px-8 py-4 text-white">
              <div className="relative z-10 flex w-full items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                    <Package className="size-6 shadow-sm" />
                  </div>
                  Thông tin chi tiết
                </DialogTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDetailDialogOpen(false)}
                  className="rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-white px-8 pb-8 pt-8">
              <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
                {/* Cột trái: Hình ảnh & Badge */}
                <div className="flex flex-col gap-6">
                  <div className="group relative aspect-square overflow-hidden rounded-[24px] border-4 border-white bg-amber-50/50 shadow-2xl transition-transform hover:scale-[1.02]">
                    {editingProduct?.imageUrl ? (
                      <img src={editingProduct.imageUrl} alt={editingProduct.productName} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-3">
                        <ImageIcon className="size-20 text-amber-200" />
                        <span className="text-xs font-medium text-amber-400">Chưa có ảnh mô tả</span>
                      </div>
                    )}
                    {/* Badge trạng thái nổi lên trên ảnh */}
                    <div className={cn(
                      "absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md border",
                      editingProduct?.status === 'ACTIVE' 
                        ? "bg-emerald-500/90 text-white border-emerald-400" 
                        : "bg-stone-500/90 text-white border-stone-400"
                    )}>
                      {editingProduct?.status === 'ACTIVE' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                      {editingProduct?.status === 'ACTIVE' ? 'ĐANG KINH DOANH' : 'NGỪNG KINH DOANH'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                      <Tag className="size-3.5" />
                      DANH MỤC & ĐƠN VỊ
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 shadow-sm border border-amber-100">
                         {editingProduct?.categoryName}
                       </span>
                       <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 shadow-sm border border-amber-100">
                         {editingProduct?.unitName}
                       </span>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Thông tin chi tiết */}
                <div className="flex flex-col gap-8">
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">Sản phẩm món ăn</span>
                    <h2 className="text-4xl font-black leading-tight text-stone-900">{editingProduct?.productName}</h2>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">
                      MÃ SỐ: #{editingProduct?.productId}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-amber-100/30 p-5 border border-amber-100/50">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-600/70">Đơn giá niêm yết</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-amber-700">
                          {editingProduct?.price?.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs font-bold text-amber-600/60 uppercase">vnđ</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50/50 p-5 border border-emerald-100/50">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Hạn sử dụng</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-emerald-700">{editingProduct?.shelfLifeDays}</span>
                        <span className="text-xs font-bold text-emerald-600/60 uppercase">ngày</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-stone-400">
                      <Info className="size-3.5" />
                      Mô tả chi tiết
                    </div>
                    <div className="rounded-[20px] bg-stone-50 p-6 text-sm leading-relaxed text-stone-600 border border-stone-100 shadow-inner">
                      {editingProduct?.description || "Sản phẩm chưa cập nhật mô tả chi tiết. Vui lòng bổ sung để hỗ trợ quản lý tốt hơn."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-stone-100 bg-white p-6 gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setDetailDialogOpen(false)} 
                className="h-12 px-8 rounded-xl text-stone-500 font-bold hover:bg-stone-50 transition-all"
              >
                Đóng
              </Button>
              <Button 
                onClick={() => {
                  setDetailDialogOpen(false);
                  if (editingProduct) openEdit(editingProduct);
                }}
                className="h-12 flex-1 md:flex-none px-10 rounded-xl bg-amber-600 text-white font-bold shadow-lg shadow-amber-100 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
              >
                Chỉnh sửa thông tin
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận xóa */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          onClose={() => setDeleteConfirmOpen(false)}
          className="max-w-md border-amber-200/60 bg-white p-8 shadow-xl"
        >
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-stone-900">
            <Trash2 className="size-5 text-rose-500" />
            Xác nhận xóa
          </DialogTitle>
          <p className="py-4 text-sm text-stone-700">
            Bạn có chắc muốn xóa <span className="font-semibold text-amber-800">{productToDelete?.productName}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ================= UNIT SETTINGS ================= */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="max-w-2xl border-none p-0 shadow-2xl">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white text-stone-900">
            <div className="bg-amber-600 px-6 py-4 text-white">
              <DialogTitle className="flex items-center gap-2 font-bold">
                <Scale className="size-5" />
                Thiết lập Đơn vị
              </DialogTitle>
            </div>
            <div className="p-6">
              <form noValidate onSubmit={handleSubmitUnit(handleSaveUnit)}>
                <div className="mb-8 grid gap-4 rounded-xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-amber-900">Tên đơn vị</label>
                      <Input
                        placeholder="kg, lít..."
                        className="h-10 border-amber-200"
                        {...registerUnit('unitName', { required: 'Không được để trống' })}
                      />
                      {errorsUnit.unitName && <FieldError errors={[errorsUnit.unitName]} />}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-amber-900">Mô tả</label>
                      <Input
                        placeholder="Ghi chú..."
                        className="h-10 border-amber-200"
                        {...registerUnit('description', { required: 'Không được để trống' })}
                      />
                      {errorsUnit.description && <FieldError errors={[errorsUnit.description]} />}
                    </div>
                  </div>
                  <Button type="submit" className="mt-2 w-full bg-amber-500 text-white hover:bg-amber-600">
                    {editingUnit ? 'Cập nhật' : 'Thêm đơn vị'}
                  </Button>
                </div>
              </form>
              
              <div className="max-h-[300px] overflow-y-auto rounded-xl border border-stone-100 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-stone-50 text-left text-xs text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Tên đơn vị</th>
                      <th className="px-4 py-3">Mô tả</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {units.map((u) => (
                      <tr key={u.unitId} className="hover:bg-amber-50/30">
                        <td className="px-4 py-3 font-medium">{u.unitName}</td>
                        <td className="px-4 py-3 text-stone-500">{u.description}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditUnit(u)}><Pencil className="size-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => openDeleteUnit(u)}><Trash2 className="size-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter className="bg-stone-50 p-4">
              <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>Đóng</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal xác nhận xóa đơn vị */}
      <Dialog open={unitDeleteConfirmOpen} onOpenChange={setUnitDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Xác nhận xóa đơn vị</DialogTitle>
          <p className="py-2 text-sm text-stone-600">Bạn muốn xóa đơn vị <span className="font-bold">{unitToDelete?.unitName}</span>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDeleteConfirmOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteUnit}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProductManagementPage;
