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
  Scale,
  CheckCircle2,
  XCircle,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
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
      orderMultiplier: 1,
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
        orderMultiplier: detailedProduct.orderMultiplier,
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
    formData.append('orderMultiplier', String(data.orderMultiplier));
    formData.append('shelfLifeDays', String(data.shelfLifeDays));
    formData.append('status', String(data.status));

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
          setPage(1);
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
    } catch (error) {
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
    const rawList = products
      .map((p: ProductsResponse) => {
        const category = categories.find((c) => c.categoryId === p.categoryId);
        const unit = units.find((u: UnitResponse) => u.unitId === Number(p.unitId));
        return {
          ...p,
          categoryName: category?.categoryName || p.categoryName || 'Chưa phân loại',
          unitName: unit?.unitName || p.unitName || 'Không xác định',
        };
      })
      .sort((a, b) => (b.productId || 0) - (a.productId || 0));

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
    <div className="h-full w-full space-y-5">
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-start border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Quản lý Sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Danh sách món ăn/nguyên liệu trong kho trung tâm.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <Input
            placeholder="Tìm theo tên sản phẩm, danh mục..."
            value={search}
            onChange={handleSearch}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto md:justify-end">
          <Button onClick={openAdd} className="h-10 gap-2 bg-amber-500 px-5 text-white shadow-md hover:bg-amber-600">
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
          <Button
            onClick={openSettingUnit}
            className="h-10 gap-2 bg-amber-500 px-5 text-white shadow-md hover:bg-amber-600"
          >
            <Scale className="size-4" />
            Thiết lập đơn vị
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                    <td className="px-6 py-4 text-xs font-mono text-amber-600/70">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
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
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayProducts.length)} /{' '}
                  {displayProducts.length}
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
          className="max-w-2xl overflow-hidden border border-amber-100 p-0"
        >
          <form
            noValidate
            onSubmit={handleSubmit(handleSave)}
            className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-4">
              <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100">
                  {editingProduct ? (
                    <Pencil className="size-3.5 text-amber-600" />
                  ) : (
                    <Plus className="size-3.5 text-amber-600" />
                  )}
                </div>
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body: 2 cột — trái: ảnh, phải: form */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Cột trái: upload ảnh */}
              <div className="flex w-48 shrink-0 flex-col gap-3 border-r border-amber-100 bg-amber-50/40 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Ảnh sản phẩm</p>
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-amber-100 bg-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 text-amber-200">
                      <ImageIcon className="size-8" />
                      <span className="text-[10px] font-medium text-amber-500">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="image_upload"
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-white py-2 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                >
                  <Upload className="size-3.5" />
                  {selectedFile ? 'Đổi ảnh' : 'Chọn ảnh'}
                  <input
                    id="image_upload"
                    type="file"
                    accept="image/*"
                    multiple={false}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-100 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-50"
                  >
                    <X className="size-3" /> Gỡ ảnh
                  </button>
                )}
              </div>

              {/* Cột phải: các fields */}
              <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
                <div className="space-y-4">
                  {/* Tên */}
                  <Field>
                    <FieldLabel htmlFor="productName" className="mb-1 text-sm font-medium text-amber-900">
                      Tên sản phẩm <span className="text-rose-400">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="productName"
                        placeholder="Ví dụ: Cơm gà"
                        className="h-9 border-amber-100 bg-amber-50/30 text-sm focus:border-amber-400 focus:ring-amber-100"
                        {...register('productName', {
                          required: 'Tên sản phẩm là bắt buộc',
                          minLength: { value: 3, message: 'Ít nhất 3 ký tự' },
                        })}
                      />
                      {errors.productName && <FieldError errors={[errors.productName]} />}
                    </FieldContent>
                  </Field>

                  {/* Danh mục + Đơn vị */}
                  <div className="grid gap-3 grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="categoryId" className="mb-1 text-sm font-medium text-amber-900">
                        Danh mục
                      </FieldLabel>
                      <FieldContent>
                        <select
                          id="categoryId"
                          className="h-9 w-full rounded-md border border-amber-100 bg-amber-50/30 px-3 text-sm text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          {...register('categoryId', { valueAsNumber: true })}
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                              {c.categoryName}
                            </option>
                          ))}
                        </select>
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="unitId" className="mb-1 text-sm font-medium text-amber-900">
                        Đơn vị tính <span className="text-rose-400">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <select
                          id="unitId"
                          className="h-9 w-full rounded-md border border-amber-100 bg-amber-50/30 px-3 text-sm text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          {...register('unitId', { required: 'Đơn vị là bắt buộc', valueAsNumber: true })}
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
                  </div>

                  {/* Trạng thái */}
                  <Field>
                    <FieldLabel htmlFor="status" className="mb-1 text-sm font-medium text-amber-900">
                      Trạng thái
                    </FieldLabel>
                    <FieldContent>
                      <select
                        id="status"
                        className="h-9 w-full rounded-md border border-amber-100 bg-amber-50/30 px-3 text-sm text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        {...register('status')}
                      >
                        <option value="ACTIVE">Đang kinh doanh</option>
                        <option value="INACTIVE">Ngừng bán</option>
                      </select>
                    </FieldContent>
                  </Field>

                  <div className="border-t border-amber-100 pt-1" />

                  {/* Giá + Hạn dùng + Bội số */}
                  <div className="grid gap-3 grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="price" className="mb-1 text-sm font-medium text-amber-900">
                        Đơn giá (₫) <span className="text-rose-400">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="price"
                          type="number"
                          placeholder="50000"
                          className="h-9 border-amber-100 bg-amber-50/30 text-sm focus:border-amber-400 focus:ring-amber-100"
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
                      <FieldLabel htmlFor="shelfLifeDays" className="mb-1 text-sm font-medium text-amber-900">
                        Hạn dùng (ngày) <span className="text-rose-400">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="shelfLifeDays"
                          type="number"
                          placeholder="30"
                          className="h-9 border-amber-100 bg-amber-50/30 text-sm focus:border-amber-400 focus:ring-amber-100"
                          {...register('shelfLifeDays', {
                            required: 'Hạn dùng là bắt buộc',
                            min: { value: 1, message: 'Tối thiểu 1 ngày' },
                            valueAsNumber: true,
                          })}
                        />
                        {errors.shelfLifeDays && <FieldError errors={[errors.shelfLifeDays]} />}
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="orderMultiplier" className="mb-1 text-sm font-medium text-amber-900">
                        Bội số ĐH <span className="text-rose-400">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="orderMultiplier"
                          type="number"
                          placeholder="1"
                          className="h-9 border-amber-100 bg-amber-50/30 text-sm focus:border-amber-400 focus:ring-amber-100"
                          {...register('orderMultiplier', {
                            required: 'Bội số là bắt buộc',
                            min: { value: 1, message: 'Tối thiểu là 1' },
                            valueAsNumber: true,
                          })}
                        />
                        {errors.orderMultiplier && <FieldError errors={[errors.orderMultiplier]} />}
                      </FieldContent>
                    </Field>
                  </div>

                  <div className="border-t border-amber-100 pt-1" />

                  {/* Mô tả */}
                  <Field>
                    <FieldLabel htmlFor="description" className="mb-1 text-sm font-medium text-amber-900">
                      Mô tả
                    </FieldLabel>
                    <FieldContent>
                      <textarea
                        id="description"
                        rows={3}
                        placeholder="Thông tin thêm về sản phẩm..."
                        className="w-full resize-none rounded-lg border border-amber-100 bg-amber-50/30 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        {...register('description')}
                      />
                    </FieldContent>
                  </Field>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-amber-100 bg-amber-50/30 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-9 border-stone-200 text-stone-600 hover:bg-stone-50"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" className="h-9 bg-amber-500 px-6 text-sm font-medium text-white hover:bg-amber-600">
                {editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết sản phẩm */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-xl border border-amber-100 !p-0 overflow-hidden rounded-xl">
          <div className="flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-3.5">
              <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100">
                  <Package className="size-3.5 text-amber-600" />
                </div>
                Chi tiết sản phẩm
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDetailDialogOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body: 2 cột — trái ảnh, phải info */}
            <div className="flex gap-0">
              {/* Ảnh */}
              <div className="flex w-44 shrink-0 flex-col items-center gap-3 border-r border-amber-100 bg-amber-50/40 p-5">
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-amber-100 bg-white">
                  {editingProduct?.imageUrl ? (
                    <img
                      src={editingProduct.imageUrl}
                      alt={editingProduct.productName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 text-amber-200">
                      <ImageIcon className="size-10" />
                      <span className="text-[10px] text-amber-500">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
                {/* Status badge dưới ảnh */}
                <span
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium',
                    editingProduct?.status === 'ACTIVE'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 bg-stone-100 text-stone-500'
                  )}
                >
                  {editingProduct?.status === 'ACTIVE' ? (
                    <>
                      <CheckCircle2 className="size-3" /> Đang bán
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3" /> Ngừng bán
                    </>
                  )}
                </span>
              </div>

              {/* Thông tin */}
              <div className="flex-1 px-5 py-5">
                <p className="text-xs font-mono text-stone-500">#{editingProduct?.productId}</p>
                <h2 className="mt-0.5 text-lg font-bold leading-snug text-stone-900">{editingProduct?.productName}</h2>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    <Tag className="size-3" />
                    {editingProduct?.categoryName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-600">
                    <Scale className="size-3" />
                    {editingProduct?.unitName}
                  </span>
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 divide-x divide-amber-100 rounded-xl border border-amber-100 bg-amber-50/30">
                  <div className="px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Đơn giá</p>
                    <p className="mt-1 text-sm font-bold text-amber-700">
                      {editingProduct?.price?.toLocaleString('vi-VN')}
                      <span className="ml-0.5 text-xs font-normal text-amber-600">₫</span>
                    </p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Hạn dùng</p>
                    <p className="mt-1 text-sm font-bold text-stone-700">
                      {editingProduct?.shelfLifeDays}
                      <span className="ml-0.5 text-xs font-normal text-stone-400">ngày</span>
                    </p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Bội số</p>
                    <p className="mt-1 text-sm font-bold text-stone-700">x{editingProduct?.orderMultiplier}</p>
                  </div>
                </div>

                {/* Mô tả */}
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">Mô tả</p>
                  <p className="text-sm leading-relaxed text-stone-700">
                    {editingProduct?.description || 'Chưa có mô tả.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-amber-100 bg-amber-50/30 px-5 py-3.5">
              <Button
                variant="outline"
                onClick={() => setDetailDialogOpen(false)}
                className="h-8 border-stone-200 px-4 text-xs text-stone-600 hover:bg-stone-50"
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  if (editingProduct) openEdit(editingProduct);
                }}
                className="h-8 bg-amber-500 px-4 text-xs font-medium text-white hover:bg-amber-600"
              >
                <Pencil className="mr-1.5 size-3" />
                Chỉnh sửa
              </Button>
            </div>
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
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
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
                            <Button variant="ghost" size="icon" onClick={() => handleEditUnit(u)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-500"
                              onClick={() => openDeleteUnit(u)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter className="bg-stone-50 p-4">
              <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận xóa đơn vị */}
      <Dialog open={unitDeleteConfirmOpen} onOpenChange={setUnitDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Xác nhận xóa đơn vị</DialogTitle>
          <p className="py-2 text-sm text-stone-600">
            Bạn muốn xóa đơn vị <span className="font-bold">{unitToDelete?.unitName}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDeleteConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteUnit}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagementPage;
