/**
 * File: InventoryPage.tsx
 * Description: Trang xem tồn kho dành cho Supply Coordinator.
 *              Hiển thị tổng quan tồn kho theo sản phẩm, số lô và hạn sử dụng gần nhất.
 *              Dữ liệu lấy từ cùng API với trang Tổng quan kho của Manager.
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Boxes,
  Search,
  Package,
  Scale,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock3,
  RefreshCw,
  SlidersHorizontal,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { managerServices, type InventoryReportResponse } from '@/services/managerServices';
import { toast } from 'sonner';

// ================= TYPES =================
interface InventoryRow {
  product: InventoryReportResponse;
  total_quantity: number;
  unit: string;
  batch_count: number;
  nearest_expiry: string | null;
  critical_batches: number;
}

type StockFilter = '' | 'OK' | 'LOW' | 'CRITICAL';

// ================= COMPONENT =================
const InventoryPage = () => {
  // ================= STATE =================
  const [inventory, setInventory] = useState<InventoryReportResponse[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const TODAY = new Date();

  // ================= API =================
  const getInventoryData = async () => {
    try {
      setIsLoading(true);
      const response = await managerServices.getInventoryStock();
      if (response.data.success) {
        setInventory(response.data.data.items as unknown as InventoryReportResponse[]);
      }
    } catch {
      toast.error('Lỗi khi lấy dữ liệu tồn kho');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= EFFECT =================
  useEffect(() => {
    getInventoryData();
  }, []);

  // ================= UTILS =================
  const isNearExpiry = (expiryDate: string | null, daysThreshold = 3): boolean => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const diffDays = (exp.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= daysThreshold;
  };

  const batchStatusLabel: Record<string, string> = {
    WAITING_FOR_STOCK: 'Chờ nhập kho',
    AVAILABLE: 'Đang sử dụng',
    OUT_OF_STOCK: 'Hết hàng',
    EXPIRED: 'Hết hạn',
  };

  const batchStatusColor: Record<string, string> = {
    WAITING_FOR_STOCK: 'bg-sky-50 text-sky-700 border-sky-200',
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OUT_OF_STOCK: 'bg-stone-100 text-stone-600 border-stone-200',
    EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  // ================= COMPUTED =================
  const overviewRows: InventoryRow[] = useMemo(() => {
    return inventory.map((item) => {
      const batches = item.productBatch || [];
      const total = item.totalStock || 0;
      const nearest =
        batches
          .filter((b) => b.expiryDate)
          .map((b) => b.expiryDate)
          .sort()[0] ?? null;
      const critical = batches.filter((b) => isNearExpiry(b.expiryDate)).length;
      return { product: item, total_quantity: total, unit: item.unit, batch_count: batches.length, nearest_expiry: nearest, critical_batches: critical };
    });
  }, [inventory]);

  const filteredRows = useMemo(() => {
    let data = overviewRows;

    if (stockFilter === 'LOW') data = data.filter((r) => r.total_quantity === 0);
    else if (stockFilter === 'CRITICAL') data = data.filter((r) => r.critical_batches > 0);
    else if (stockFilter === 'OK') data = data.filter((r) => r.total_quantity > 0 && r.critical_batches === 0);

    if (search.trim()) {
      const kw = search.toLowerCase();
      data = data.filter((r) => r.product.productName.toLowerCase().includes(kw));
    }

    // Sort theo ưu tiên cảnh báo:
    // 1) Hết hàng (total_quantity === 0)
    // 2) Sắp hết hạn (critical_batches > 0)
    // 3) Hạn gần nhất (tăng dần)
    // 4) Tên sản phẩm (A → Z)
    return [...data].sort((a, b) => {
      const aOut = a.total_quantity === 0 ? 1 : 0;
      const bOut = b.total_quantity === 0 ? 1 : 0;
      if (aOut !== bOut) return bOut - aOut;

      const aCritical = a.critical_batches > 0 ? 1 : 0;
      const bCritical = b.critical_batches > 0 ? 1 : 0;
      if (aCritical !== bCritical) return bCritical - aCritical;

      const aExp = a.nearest_expiry ? new Date(a.nearest_expiry).getTime() : Number.POSITIVE_INFINITY;
      const bExp = b.nearest_expiry ? new Date(b.nearest_expiry).getTime() : Number.POSITIVE_INFINITY;
      if (aExp !== bExp) return aExp - bExp;

      return a.product.productName.localeCompare(b.product.productName, 'vi');
    });
  }, [overviewRows, search, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset về trang 0 khi filter/search thay đổi
  useEffect(() => { setPage(0); }, [search, stockFilter]);

  const totalItems = overviewRows.reduce((sum, r) => sum + r.total_quantity, 0);
  const totalProducts = overviewRows.length;
  const criticalCount = overviewRows.filter((r) => r.critical_batches > 0).length;
  const outOfStockCount = overviewRows.filter((r) => r.total_quantity === 0).length;

  // ================= RENDER =================
  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header Card ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Boxes className="size-6 text-amber-500" />
              Tồn kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi số lượng tồn theo sản phẩm, số lô và hạn sử dụng gần nhất.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng đơn vị</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{totalItems.toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-sky-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">Sản phẩm</span>
              <span className="mt-0.5 text-2xl font-bold text-sky-700">{totalProducts}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-red-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Hết hàng</span>
              <span className="mt-0.5 text-2xl font-bold text-red-600">{outOfStockCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-yellow-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-600">Sắp hết hạn</span>
              <span className="mt-0.5 text-2xl font-bold text-yellow-700">{criticalCount}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
        {/* Search */}
        <div className="relative w-72 flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        {/* Stock Filter */}
        <div className="relative flex h-9 flex-none items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-amber-900 outline-none"
          >
            <option value="">Tất cả</option>
            <option value="OK">An toàn</option>
            <option value="LOW">Hết hàng</option>
            <option value="CRITICAL">Sắp hết hạn</option>
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={getInventoryData}
          className="h-9 flex-none gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Info */}
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700/70">
          <Info className="size-3.5 text-amber-400" />
          <span>Dữ liệu từ hệ thống quản lý kho trung tâm</span>
        </div>
      </div>

      {/* ── Content ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3">Tổng tồn</th>
                  <th className="px-6 py-3 text-center">Số lô</th>
                  <th className="px-6 py-3">Hạn gần nhất</th>
                  <th className="px-6 py-3">Tình trạng</th>
                  <th className="px-6 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-amber-500">
                        <RefreshCw className="size-8 animate-spin opacity-50" />
                        <p className="text-xs text-stone-500">Đang tải dữ liệu tồn kho...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <Boxes className="size-10 opacity-30" />
                        <p className="text-sm font-medium">Không tìm thấy sản phẩm phù hợp</p>
                        <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const isLowStock = row.total_quantity === 0;
                    const hasCritical = row.critical_batches > 0;
                    const nearestLabel = row.nearest_expiry
                      ? new Date(row.nearest_expiry).toLocaleDateString('vi-VN')
                      : '—';

                    return (
                      <tr key={row.product.productId} className="group transition-colors hover:bg-amber-50/50">
                        {/* Sản phẩm */}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                              <Package className="size-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-stone-900">{row.product.productName}</p>
                              <p className="font-mono text-[10px] text-stone-400">ID #{row.product.productId}</p>
                            </div>
                          </div>
                        </td>

                        {/* Tổng tồn */}
                        <td className="px-6 py-3">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                            <Scale className="size-3 text-amber-500" />
                            {row.total_quantity.toLocaleString('vi-VN')} {row.unit}
                          </div>
                        </td>

                        {/* Số lô */}
                        <td className="px-6 py-3 text-center text-xs font-semibold text-stone-700">
                          {row.batch_count}
                        </td>

                        {/* Hạn gần nhất */}
                        <td className="px-6 py-3">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                            <CalendarClock className="size-3" />
                            {nearestLabel}
                          </div>
                        </td>

                        {/* Tình trạng */}
                        <td className="px-6 py-3">
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-50 px-2.5 py-0.5 text-[11px] text-stone-700">
                              <XCircle className="size-3 text-stone-500" />
                              Hết hàng
                            </span>
                          )}
                          {hasCritical && !isLowStock && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-0.5 text-[11px] text-yellow-800">
                              <AlertTriangle className="size-3" />
                              {row.critical_batches} lô sắp hết hạn
                            </span>
                          )}
                          {!isLowStock && !hasCritical && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] text-emerald-700">
                              <CheckCircle2 className="size-3" />
                              An toàn
                            </span>
                          )}
                        </td>

                        {/* Chi tiết */}
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-amber-200 bg-amber-50 px-3 text-[11px] text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                              setSelectedProduct(row.product);
                              setDetailOpen(true);
                            }}
                          >
                            Xem lô hàng
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!isLoading && filteredRows.length > 0 && (
            <div className="flex items-center justify-between border-t border-amber-50 bg-amber-50/30 px-6 py-2.5 text-xs">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Info className="size-3.5 text-amber-400" />
                Trang <span className="font-bold text-stone-700">{page + 1}</span> /{' '}
                <span className="font-bold text-stone-700">{totalPages}</span>
                <span className="text-stone-400 ml-1">({filteredRows.length} sản phẩm)</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 border-amber-200 p-0 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, i, idx, arr) => {
                    if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-1 text-stone-400">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(item as number)}
                        className={`h-7 w-7 border-amber-200 p-0 text-xs font-semibold ${
                          item === page
                            ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                            : 'text-amber-900 hover:bg-amber-50'
                        }`}
                      >
                        {(item as number) + 1}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 border-amber-200 p-0 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog Chi tiết lô hàng ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl overflow-hidden border-none p-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 pb-6 pt-8 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Boxes className="size-6" />
              {selectedProduct ? `Chi tiết lô hàng — ${selectedProduct.productName}` : 'Chi tiết lô hàng'}
            </DialogTitle>
            <p className="mt-1 text-sm text-amber-50/80">Danh sách các lô đang lưu kho, phục vụ điều phối FEFO.</p>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto bg-white px-6 py-5">
            {selectedProduct ? (
              <>
                {/* Product summary */}
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{selectedProduct.productName}</p>
                    <p className="font-mono text-[11px] text-amber-700/70">
                      ID #{selectedProduct.productId} · ĐVT: {selectedProduct.unit}
                    </p>
                  </div>
                </div>

                {/* Batch table */}
                <div className="overflow-hidden rounded-xl border border-amber-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                        <th className="px-4 py-3">Mã lô</th>
                        <th className="px-4 py-3">Hạn sử dụng</th>
                        <th className="px-4 py-3 text-right">SL gốc</th>
                        <th className="px-4 py-3 text-right">SL hiện tại</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {selectedProduct.productBatch?.length ? (
                        selectedProduct.productBatch.map((batch) => (
                          <tr key={batch.batchId} className="hover:bg-amber-50/40">
                            <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-amber-800">
                              {batch.batchCode}
                            </td>
                            <td className="px-4 py-2.5 text-stone-700">
                              {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right text-stone-600">
                              {batch.initialQuantity.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-stone-800">
                              {batch.currentQuantity.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                  batchStatusColor[batch.status] ?? 'bg-stone-50 text-stone-600 border-stone-200'
                                )}
                              >
                                {batch.status === 'AVAILABLE' && <CheckCircle2 className="size-3" />}
                                {batch.status === 'EXPIRED' && <XCircle className="size-3" />}
                                {batch.status === 'WAITING_FOR_STOCK' && <Clock3 className="size-3" />}
                                {batch.status === 'OUT_OF_STOCK' && <AlertTriangle className="size-3" />}
                                {batchStatusLabel[batch.status] ?? batch.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-stone-400">
                            Không có lô hàng nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-stone-500">Vui lòng chọn sản phẩm để xem chi tiết.</p>
            )}
          </div>

          <DialogFooter className="border-t border-stone-100 bg-stone-50 px-6 py-3">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-900 hover:bg-amber-50"
              onClick={() => setDetailOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
