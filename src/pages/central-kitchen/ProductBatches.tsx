import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Boxes,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Filter,
  SlidersHorizontal,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';
import { kitchenServices, type ProductBatchesResponse, type ProductBatchStatus } from '@/services/kitchenServices';
import { managerServices, type ProductsResponse } from '@/services/managerServices';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useGlobalListPageSize } from '@/hooks/useGlobalListPageSize';
import StatusBadge from '@/components/ui/StatusBadge';

/**
 * Trang Lô sản phẩm (Central Kitchen): danh sách lô từ `GET /api/v1/product-batches`,
 * popup chi tiết (ảnh sản phẩm qua `productId` + `GET /api/v1/products/{id}`).
 * Các helper `getProductionDate` / `getProductIdFromBatch` map field từ DTO — xem comment tại chỗ.
 */
const FILTER_OPTIONS: (ProductBatchStatus | 'ALL')[] = [
  'ALL',
  'WAITING_FOR_STOCK',
  'AVAILABLE',
  'OUT_OF_STOCK',
  'EXPIRED',
];

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * NSX (ngày sản xuất) — đọc các field tùy chọn đã khai báo trong `ProductBatchesResponse` (`kitchenServices.ts`).
 * BE chỉ cần trả **một** trong các tên đó; thứ tự dưới đây là ưu tiên (field đầu tiên có giá trị được dùng).
 * Nếu BE đổi/ thêm tên field mới → cập nhật interface + thêm vào mảng `candidates` bên dưới.
 */
const getProductionDate = (b: ProductBatchesResponse): string | null => {
  const candidates = [
    b.manufacturingDate,
    b.manufacturing_date,
    b.productionDate,
    b.production_date,
    b.manufactureDate,
    b.manufacture_date,
    b.mfgDate,
    b.dateOfManufacture,
    b.producedAt,
  ];
  for (const v of candidates) {
    if (v == null) continue;
    const s = typeof v === 'string' ? v : String(v);
    if (s.trim() !== '') return s;
  }
  return null;
};

/**
 * ID sản phẩm gắn với lô — dùng gọi `GET /api/v1/products/{id}` (ảnh trong popup).
 * Chỉ có `productId` trên type; JSON thường gặp thêm `product_id` (snake_case) nên đọc qua intersection.
 */
type BatchPayload = ProductBatchesResponse & { product_id?: unknown };

const getProductIdFromBatch = (b: ProductBatchesResponse): number | null => {
  const row = b as BatchPayload;
  const raw: unknown = row.productId ?? row.product_id;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const n = parseInt(raw, 10);
    return n > 0 ? n : null;
  }
  return null;
};

/** Lô sắp hết hạn trong N ngày tới */
const isNearExpiry = (expiryDate: string, daysThreshold = 3): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= daysThreshold;
};

type BatchDetailPanelProps = {
  batch: ProductBatchesResponse;
  productDetail: ProductsResponse | null;
  productDetailLoading: boolean;
};

/** Nội dung popup chi tiết — tách riêng để tránh IIFE, layout flex ổn định */
function BatchDetailPanel({ batch, productDetail, productDetailLoading }: BatchDetailPanelProps) {
  const nsxRaw = getProductionDate(batch);
  const pid = getProductIdFromBatch(batch);

  return (
    <>
      <section className="border-b border-stone-100 bg-white px-5 py-5 sm:px-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-800">Sản phẩm</h3>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative mx-auto aspect-square w-full max-w-[180px] shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 sm:mx-0 sm:w-40">
            {productDetailLoading ? (
              <div className="absolute inset-0 animate-pulse bg-amber-100" />
            ) : productDetail?.imageUrl ? (
              <img
                src={productDetail.imageUrl}
                alt={productDetail.productName || batch.productName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center">
                <Boxes className="size-9 text-amber-300" />
                <p className="text-[11px] text-amber-900/60">
                  {pid == null ? 'Thiếu productId — không tải ảnh.' : 'Chưa có ảnh.'}
                </p>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h4 className="text-lg font-bold text-stone-900">{productDetail?.productName ?? batch.productName}</h4>
            {productDetail ? (
              <div className="flex flex-wrap gap-2">
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                  ID #{productDetail.productId}
                </span>
                {productDetail.categoryName ? (
                  <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-900">
                    {productDetail.categoryName}
                  </span>
                ) : null}
              </div>
            ) : null}
            {productDetail?.description ? (
              <p className="line-clamp-4 text-[13px] leading-relaxed text-stone-600">{productDetail.description}</p>
            ) : null}
            {pid != null && !productDetailLoading && !productDetail ? (
              <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                Không tải được chi tiết sản phẩm.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-100 bg-white px-5 py-5 sm:px-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-800">Thông tin lô</h3>
        <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-amber-950">{batch.batchCode}</p>
            <p className="text-[12px] text-stone-600">ID lô #{batch.batchId}</p>
          </div>
          <StatusBadge status={batch.status} />
        </div>
      </section>

      <section className="bg-white px-5 py-5 sm:px-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-800">Tồn kho & hạn</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
            <p className="text-[10px] font-medium uppercase text-amber-800/80">SL ban đầu</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-stone-900">
              {batch.initialQuantity.toLocaleString('vi-VN')}
              {batch.unitName ? <span className="ml-1 text-sm font-normal text-stone-600">{batch.unitName}</span> : null}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
            <p className="text-[10px] font-medium uppercase text-amber-800/80">SL hiện tại</p>
            <p
              className={cn(
                'mt-1 text-xl font-bold tabular-nums',
                batch.currentQuantity === 0 ? 'text-amber-900/70' : 'text-stone-900'
              )}
            >
              {batch.currentQuantity.toLocaleString('vi-VN')}
              {batch.unitName ? <span className="ml-1 text-sm font-normal text-stone-600">{batch.unitName}</span> : null}
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-amber-800/80">
              <CalendarClock className="size-3.5 text-amber-600" />
              NSX
            </div>
            <p className="text-base font-semibold text-stone-900">{formatDate(nsxRaw)}</p>
            {!nsxRaw ? (
              <p className="mt-1.5 text-[11px] text-stone-500">
                Chưa có từ API (<code className="font-mono text-[10px]">manufacturingDate</code>).
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-amber-800/80">
              <CalendarClock className="size-3.5 text-amber-600" />
              HSD
            </div>
            <p className="text-base font-semibold text-stone-900">{formatDate(batch.expiryDate)}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductBatches() {
  // ================= STATE =================
  const [productBatches, setProductBatches] = useState<ProductBatchesResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductBatchStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = useGlobalListPageSize();
  const [isLoading, setIsLoading] = useState(true);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatchesResponse | null>(null);
  const [productDetail, setProductDetail] = useState<ProductsResponse | null>(null);
  const [productDetailLoading, setProductDetailLoading] = useState(false);

  // ================= COMPUTED =================
  const availableCount = useMemo(() => productBatches.filter((b) => b.status === 'AVAILABLE').length, [productBatches]);

  const batchesAlert = useMemo(
    () =>
      productBatches.filter(
        (b) =>
          b.status === 'OUT_OF_STOCK' ||
          b.status === 'EXPIRED' ||
          (b.status === 'AVAILABLE' && isNearExpiry(b.expiryDate))
      ),
    [productBatches]
  );

  // ================= API =================
  const getAllProductBatches = async () => {
    try {
      setIsLoading(true);
      const response = await kitchenServices.getAllProductBatches();
      const raw = response?.data as unknown;
      let list: ProductBatchesResponse[] = [];
      if (Array.isArray(raw)) {
        list = raw as ProductBatchesResponse[];
      } else if (raw && typeof raw === 'object' && 'items' in raw && Array.isArray((raw as { items: unknown }).items)) {
        list = (raw as { items: ProductBatchesResponse[] }).items;
      }
      setProductBatches(list);
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= EFFECT (Initial Load) =================
  useEffect(() => {
    getAllProductBatches();
  }, []);

  /** Khi mở chi tiết lô: tải chi tiết sản phẩm (ảnh, danh mục, …) theo productId */
  // ================= EFFECT (Load product detail) =================
  useEffect(() => {
    if (!isDetailOpen || !selectedBatch) {
      setProductDetail(null);
      setProductDetailLoading(false);
      return;
    }
    const pid = getProductIdFromBatch(selectedBatch);
    if (pid == null) {
      setProductDetail(null);
      setProductDetailLoading(false);
      return;
    }

    let cancelled = false;
    setProductDetail(null);
    setProductDetailLoading(true);

    managerServices
      .getProductDetail(pid)
      .then((res) => {
        if (cancelled) return;
        const raw = res as { success?: boolean; data?: ProductsResponse; message?: string } | ProductsResponse;
        const product =
          raw && typeof raw === 'object' && 'data' in raw && raw.data && 'productId' in raw.data
            ? raw.data
            : raw && typeof raw === 'object' && 'productId' in raw
              ? (raw as ProductsResponse)
              : null;
        if (product) {
          setProductDetail(product);
        } else {
          setProductDetail(null);
          const msg =
            'message' in (raw as { message?: string }) ? (raw as { message?: string }).message : undefined;
          toast.error(msg || 'Không tải được chi tiết sản phẩm');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProductDetail(null);
          toast.error('Không tải được chi tiết sản phẩm');
        }
      })
      .finally(() => {
        if (!cancelled) setProductDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDetailOpen, selectedBatch]);

  // ================= COMPUTED =================
  const filteredBatches = useMemo(() => {
    let data = productBatches;

    if (statusFilter !== 'ALL') {
      data = data.filter((b) => b.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((b) => b.batchCode.toLowerCase().includes(q) || b.productName.toLowerCase().includes(q));
    }

    return data;
  }, [search, statusFilter, productBatches]);

  // ================= EFFECT =================
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useLayoutEffect(() => {
    setPage(1);
  }, [pageSize]);

  // ================= COMPUTED =================
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBatches.length / pageSize)),
    [filteredBatches.length, pageSize]
  );
  const paginatedBatches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, page, pageSize]);

  // ================= RENDER =================
  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header (giống Supply / InventoryPage) ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Boxes className="size-6 text-amber-500" />
              Lô sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi danh sách lô sản phẩm tại kho trung tâm.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng lô</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{productBatches.length}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Khả dụng</span>
              <span className="mt-0.5 text-2xl font-bold text-emerald-700">{availableCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-rose-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Cần chú ý</span>
              <span className="mt-0.5 text-2xl font-bold text-rose-700">{batchesAlert.length}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar: một hàng căn giữa theo trục dọc, cùng chiều cao h-9 ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border border-amber-100 bg-white px-4 py-2.5 shadow-sm">
        {/* Tìm kiếm */}
        <div className="relative min-w-0 flex-[1_1_16rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-amber-400" />
          <Input
            type="search"
            placeholder="Tìm theo mã lô, tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 focus-visible:border-amber-400 focus-visible:ring-amber-200/60"
          />
        </div>

        {/* Bộ lọc — cùng h-9 với ô tìm kiếm */}
        <div className="relative flex h-9 min-w-0 flex-[1_1_14rem] shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 sm:flex-[0_1_260px]">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="shrink-0 text-[11px] font-semibold leading-none text-amber-800">Bộ lọc:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductBatchStatus | 'ALL')}
            className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent py-0 pr-7 text-xs font-semibold leading-none text-amber-900 outline-none"
            aria-label="Bộ lọc trạng thái lô"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'ALL' ? 'Tất cả' : translateStatus(opt)}
              </option>
            ))}
          </select>
          <Filter className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        {/* Làm mới — size default = h-9 (không dùng size="sm" = h-8) */}
        <Button
          type="button"
          variant="outline"
          onClick={getAllProductBatches}
          disabled={isLoading}
          className="h-9 shrink-0 gap-1.5 border-amber-200 px-3 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className={cn('size-3.5 shrink-0', isLoading && 'animate-spin')} />
          Làm mới
        </Button>

        {/* Ghi chú — căn giữa theo hàng, text 1 dòng trên màn lớn */}
        <div className="flex min-h-9 w-full flex-[1_1_100%] items-center gap-1.5 text-[11px] text-amber-700/85 sm:w-auto sm:flex-[1_1_auto] sm:justify-end lg:ml-auto lg:max-w-none">
          <Info className="size-3.5 shrink-0 text-amber-400" />
          <span className="leading-tight lg:whitespace-nowrap">Dữ liệu từ hệ thống quản lý kho trung tâm</span>
        </div>
      </div>

      {/* ── Bảng full width (không còn cột “Tình hình lô”) ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                  <th className="px-6 py-3">Mã lô</th>
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3 text-center">SL ban đầu</th>
                  <th className="px-6 py-3 text-center">SL hiện tại</th>
                  <th className="px-6 py-3 text-center">Ngày sản xuất</th>
                  <th className="px-6 py-3 text-center">Hạn dùng</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-amber-500">
                        <RefreshCw className="size-8 animate-spin opacity-50" />
                        <p className="text-xs text-stone-500">Đang tải danh sách lô...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <Boxes className="size-10 opacity-30" />
                        <p className="text-sm font-medium">Không có lô nào khớp với bộ lọc</p>
                        <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBatches.map((b) => {
                    const prodDate = getProductionDate(b);
                    return (
                      <tr key={b.batchId} className="group transition-colors hover:bg-amber-50/50">
                        <td className="px-6 py-3">
                          <p className="text-xs font-semibold text-stone-900">{b.batchCode}</p>
                          <p className="font-mono text-[10px] text-stone-400">ID: {b.batchId}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-xs font-semibold text-stone-900">{b.productName}</p>
                          {b.unitName ? (
                            <p className="text-[10px] text-stone-400">{b.unitName}</p>
                          ) : null}
                        </td>
                        <td className="px-6 py-3 text-center text-xs font-semibold text-stone-800">
                          {b.initialQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              b.currentQuantity === 0 ? 'text-rose-600' : 'text-stone-900'
                            )}
                          >
                            {b.currentQuantity.toLocaleString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center text-xs text-stone-800">
                          {formatDate(prodDate)}
                        </td>
                        <td className="px-6 py-3 text-center text-xs text-stone-800">
                          {formatDate(b.expiryDate)}
                          {b.status === 'AVAILABLE' && isNearExpiry(b.expiryDate) && (
                            <span className="ml-1 text-amber-600" title="Sắp hết hạn">
                              *
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-amber-200 bg-amber-50 px-3 text-[11px] text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                                setSelectedBatch(b);
                                setIsDetailOpen(true);
                              }}
                          >
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredBatches.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-amber-50 bg-amber-50/30 px-6 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-stone-500 flex flex-wrap items-center gap-1.5">
                <Info className="size-3.5 text-amber-400" />
                Hiển thị{' '}
                <span className="font-bold text-stone-700">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredBatches.length)}
                </span>{' '}
                / <span className="font-bold text-stone-700">{filteredBatches.length}</span> lô · Trang{' '}
                <span className="font-bold text-stone-700">{page}</span> /{' '}
                <span className="font-bold text-stone-700">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 border-amber-200 p-0 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-1 text-stone-400">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(item as number)}
                        className={cn(
                          'h-7 w-7 border-amber-200 p-0 text-xs font-semibold',
                          item === page
                            ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600'
                            : 'text-amber-900 hover:bg-amber-50'
                        )}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 border-amber-200 p-0 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chi tiết lô — layout flex: header cố định, body cuộn, footer cố định */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedBatch(null);
            setProductDetail(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-xl border border-stone-200 bg-white p-0 shadow-lg sm:w-full">
          <div className="shrink-0 bg-amber-500 px-5 pb-5 pt-5 text-white sm:px-6">
            <DialogHeader className="space-y-0 text-left">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/20">
                  <Boxes className="size-5" />
                </span>
                Chi tiết lô & sản phẩm
              </DialogTitle>
              <p className="mt-2 text-sm text-amber-50">Ảnh sản phẩm, mã lô và số lượng.</p>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-amber-50/50">
            {selectedBatch ? (
              <BatchDetailPanel
                batch={selectedBatch}
                productDetail={productDetail}
                productDetailLoading={productDetailLoading}
              />
            ) : (
              <p className="p-6 text-center text-sm text-stone-500">Không có dữ liệu lô.</p>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-amber-200 bg-amber-50/80 px-5 py-3 sm:px-6">
            <Button
              type="button"
              className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
              onClick={() => setIsDetailOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductBatches;
