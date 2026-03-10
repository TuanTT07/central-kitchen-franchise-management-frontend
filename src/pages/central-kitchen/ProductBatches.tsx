import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Boxes, CalendarClock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenServices, type ProductBatchesResponse, type ProductBatchStatus } from '@/services/kitchenServices';

const BATCH_STATUS_LABEL: Record<ProductBatchStatus, string> = {
  WAITING_FOR_STOCK: 'Chờ nhập kho',
  AVAILABLE: 'Khả dụng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRED: 'Hết hạn',
};

const BATCH_STATUS_CLASS: Record<ProductBatchStatus, string> = {
  WAITING_FOR_STOCK: 'bg-amber-100 text-amber-800 border-amber-200',
  AVAILABLE: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
  OUT_OF_STOCK: 'bg-rose-100 text-rose-800 border-rose-200',
  EXPIRED: 'bg-stone-200 text-stone-600 border-stone-300',
};

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

/** Lô sắp hết hạn trong N ngày tới */
const isNearExpiry = (expiryDate: string, daysThreshold = 3): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= daysThreshold;
};

function ProductBatches() {
  // Quản lí productBatches từ API
  const [productBatches, setProductBatches] = useState<ProductBatchesResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductBatchStatus | 'ALL'>('ALL');

  const availableCount = useMemo(() => productBatches.filter((b) => b.status === 'AVAILABLE').length, [productBatches]);
  const outOfStockCount = useMemo(
    () => productBatches.filter((b) => b.status === 'OUT_OF_STOCK').length,
    [productBatches]
  );
  const expiredCount = useMemo(() => productBatches.filter((b) => b.status === 'EXPIRED').length, [productBatches]);
  const waitingCount = useMemo(
    () => productBatches.filter((b) => b.status === 'WAITING_FOR_STOCK').length,
    [productBatches]
  );

  // ================= API CALLS =================
  /**
   * Gọi API lấy danh sách ProductBatches
   *
   */
  const getAllProductBatches = async () => {
    try {
      const response = await kitchenServices.getAllProductBatches();
      if (response.data) {
        setProductBatches(response.data);
      }
    } catch (error) {}
  };

  // ================= EFFECTS =================
  useEffect(() => {
    getAllProductBatches();
  }, []);

  const batchesAlert = useMemo(
    () =>
      productBatches.filter(
        (b) =>
          b.status === 'OUT_OF_STOCK' ||
          b.status === 'EXPIRED' ||
          (b.status === 'AVAILABLE' && isNearExpiry(b.expiryDate))
      ),
    []
  );

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
  }, [search, statusFilter]);

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Boxes className="size-6 text-amber-500" />
              Lô sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi danh sách lô sản phẩm
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng lô</span>
              <span className="text-lg font-semibold text-amber-900">{productBatches.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Khả dụng</span>
              <span className="text-lg font-semibold text-emerald-700">{availableCount}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Cần chú ý</span>
              <span className="text-lg font-semibold text-rose-700">{batchesAlert.length}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/4 size-4 -translate-y-1/4 text-amber-600" />
              <Input
                placeholder="Tìm theo mã lô, tên sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusFilter(opt)}
                    className={cn(
                      'px-3 py-1.5 transition',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : BATCH_STATUS_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <Boxes className="size-4 text-amber-500" />
                  Danh sách lô sản phẩm
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Theo dõi danh sách lô sản phẩm
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã lô</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                        <th className="px-2 py-2 font-semibold text-center">SL ban đầu</th>
                        <th className="px-2 py-2 font-semibold text-center">SL hiện tại</th>
                        <th className="px-4 py-2 font-semibold text-center">Hạn dùng</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                        <th className="px-4 py-2 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {productBatches.map((b) => (
                        <tr key={b.batchId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{b.batchCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {b.batchId}</p>
                          </td>
                          <td className="px-4 py-2">
                            <p className="text-sm font-medium text-stone-900">{b.productName}</p>
                            {/* <p className="text-[11px] text-stone-500">product_id: {b.}</p> */}
                          </td>
                          <td className="px-2 py-2 text-center text-sm font-semibold text-stone-900">
                            {b.initialQuantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span
                              className={cn(
                                'font-semibold',
                                b.currentQuantity === 0 ? 'text-rose-600' : 'text-stone-900'
                              )}
                            >
                              {b.currentQuantity.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-[11px] text-stone-800">
                            {formatDate(b.expiryDate)}
                            {b.status === 'AVAILABLE' && isNearExpiry(b.expiryDate) && (
                              <span className="ml-1 text-amber-600" title="Sắp hết hạn">
                                *
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                BATCH_STATUS_CLASS[b.status]
                              )}
                            >
                              {BATCH_STATUS_LABEL[b.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-200 bg-white text-[11px] text-amber-900 hover:bg-amber-50"
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredBatches.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-xs text-stone-500">
                            Không có lô nào khớp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/60 shadow-sm">
              <CardHeader className="border-b border-amber-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Tình hình lô
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">Tổng hợp tình hình lô hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Khả dụng</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">{availableCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Chờ nhập kho</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">{waitingCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Hết hàng</p>
                    <p className="mt-1 text-xl font-semibold text-rose-600">{outOfStockCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Hết hạn</p>
                    <p className="mt-1 text-xl font-semibold text-stone-600">{expiredCount}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px]">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <p className="font-semibold text-amber-900">Lô cần chú ý</p>
                  </div>
                  <p className="mb-2 text-[10px] text-stone-600">Lô hàng sắp hết hạn hoặc hết hàng</p>
                  {batchesAlert.length > 0 ? (
                    <ul className="space-y-1.5">
                      {batchesAlert.map((b) => (
                        <li key={b.batchId} className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold text-stone-900">
                              {b.batchCode} · {b.productName}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              SL: {b.currentQuantity}/{b.initialQuantity} · HSD: {formatDate(b.expiryDate)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              BATCH_STATUS_CLASS[b.status]
                            )}
                          >
                            {BATCH_STATUS_LABEL[b.status]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500">Không có lô cần chú ý.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductBatches;
