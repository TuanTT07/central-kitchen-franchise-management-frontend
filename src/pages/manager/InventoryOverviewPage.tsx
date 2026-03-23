/**
 * ========================================================================
 * COMPONENT: InventoryOverviewPage
 * DESCRIPTION: Hiển thị tổng quan tồn kho của trung tâm, bao gồm danh sách
 *              sản phẩm, số lượng tồn, số lô và hạn sử dụng gần nhất.
 * ========================================================================
 */

import { useEffect, useMemo, useState } from 'react';
/* [IMPORT] - Thành phần UI và Icons */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Info,
  Clock3,
} from 'lucide-react';

/* [IMPORT] - Utils và Services */
import { cn } from '@/lib/utils';
import { managerServices, type InventoryReportResponse } from '@/services/managerServices';
import { toast } from 'sonner';

/* ========================================================================
   [TYPES] - Định nghĩa các Interface và Type cho Component
   ======================================================================== */

// type BatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';

interface InventoryRow {
  product: InventoryReportResponse;
  total_quantity: number;
  unit: string;
  batch_count: number;
  nearest_expiry: string | null;
  critical_batches: number;
}

/* ========================================================================
   [MAIN COMPONENT]
   ======================================================================== */

const InventoryOverviewPage = () => {
  /* --- [STATE] --- */
  const [inventory, setInventory] = useState<InventoryReportResponse[]>([]);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const TODAY = new Date();

  /* --- [API] --- */

  /**
   * Lấy dữ liệu báo cáo tồn kho từ Backend
   */
  const getInventoryData = async () => {
    try {
      setIsLoading(true);
      const response = await managerServices.getInventoryStock();
      if (response.data.success) {
        // Response data structure: response.data.data.items
        setInventory(response.data.data.items as unknown as InventoryReportResponse[]);
      }
    } catch (error) {
      toast.error('Lỗi khi lấy dữ liệu tồn kho');
    } finally {
      setIsLoading(false);
    }
  };

  /* --- [EFFECTS] --- */

  useEffect(() => {
    getInventoryData();
  }, []);

  /* --- [HELPERS] --- */

  /**
   * Kiểm tra xem lô hàng có sắp hết hạn không (ngưỡng 3 ngày)
   */
  const isNearExpiry = (expiryDate: string | null, daysThreshold = 3): boolean => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const diffMs = exp.getTime() - TODAY.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= daysThreshold;
  };

  /**
   * Nhãn tiếng Việt cho trạng thái lô hàng
   */
  const batchStatusLabel: Record<string, string> = {
    WAITING_FOR_STOCK: 'Chờ nhập kho',
    AVAILABLE: 'Đang sử dụng',
    OUT_OF_STOCK: 'Hết hàng',
    EXPIRED: 'Hết hạn',
  };

  /**
   * Màu sắc UI cho trạng thái lô hàng
   */
  const batchStatusColor: Record<string, string> = {
    WAITING_FOR_STOCK: 'bg-sky-50 text-sky-700 border-sky-200',
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OUT_OF_STOCK: 'bg-stone-100 text-stone-600 border-stone-200',
    EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  /* --- [COMPUTED] --- */

  /**
   * Xử lý dữ liệu tồn kho để hiển thị trên bảng tổng quan
   */
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

      return {
        product: item,
        total_quantity: total,
        unit: item.unit,
        batch_count: batches.length,
        nearest_expiry: nearest,
        critical_batches: critical,
      };
    });
  }, [inventory]);

  /**
   * Lọc danh sách theo từ khóa tìm kiếm
   */
  const filteredRows = useMemo(() => {
    if (!search.trim()) return overviewRows;
    const keyword = search.toLowerCase();
    return overviewRows.filter((row) => row.product.productName.toLowerCase().includes(keyword));
  }, [overviewRows, search]);

  const totalItems = overviewRows.reduce((sum, r) => sum + r.total_quantity, 0);
  const totalProducts = overviewRows.length;
  const criticalCount = overviewRows.filter((r) => r.critical_batches > 0).length;

  /* --- [HANDLERS] --- */

  /**
   * Mở Dialog chi tiết các lô hàng của sản phẩm
   */
  const openDetail = (product: InventoryReportResponse) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  /* ========================================================================
     [RENDER]
     ======================================================================== */

  return (
    <div className="h-full w-full space-y-5">
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        {/* Header Section */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Boxes className="size-6 text-amber-500" />
              Tổng quan tồn kho trung tâm
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
            <div className="flex flex-col items-center rounded-xl border border-yellow-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-600">Sắp hết hạn</span>
              <span className="mt-0.5 text-2xl font-bold text-yellow-700">{criticalCount}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
        <div className="relative w-full max-w-md flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <Input
            placeholder="Tìm theo tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={getInventoryData}
          className="h-9 flex-none gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          Làm mới
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700/70">
          <Info className="size-3.5 text-amber-400" />
          <span>Dữ liệu từ hệ thống quản lý kho trung tâm</span>
        </div>
      </div>

      {/* Main Content */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3">Tổng tồn</th>
                  <th className="px-6 py-3 text-center">Số lô</th>
                  <th className="px-6 py-3">Hạn sử dụng gần nhất</th>
                  <th className="px-6 py-3">Cảnh báo</th>
                  <th className="px-6 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-amber-500">
                        <Info className="size-8 opacity-30" />
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
                        <p className="text-xs">Thử thay đổi từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isLowStock = row.total_quantity === 0;
                    const hasCritical = row.critical_batches > 0;
                    const nearestLabel = row.nearest_expiry
                      ? new Date(row.nearest_expiry).toLocaleDateString('vi-VN')
                      : '—';

                    return (
                      <tr key={row.product.productId} className="group transition-colors hover:bg-amber-50/50">
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
                        <td className="px-6 py-3">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                            <Scale className="size-3 text-amber-500" />
                            {row.total_quantity.toLocaleString('vi-VN')} {row.unit}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center text-xs font-semibold text-stone-700">
                          {row.batch_count}
                        </td>
                        <td className="px-6 py-3">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                            <CalendarClock className="size-3" />
                            {nearestLabel}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-50 px-2.5 py-0.5 text-[11px] text-stone-700">
                              <XCircle className="size-3 text-stone-500" />
                              Hết hàng
                            </span>
                          )}
                          {!isLowStock && hasCritical && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] text-amber-800">
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
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-amber-200 bg-amber-50 px-3 text-[11px] text-amber-700 hover:bg-amber-100"
                            onClick={() => openDetail(row.product)}
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl min-w-[320px] overflow-hidden border-none p-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 pb-6 pt-8 text-white">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Boxes className="size-6" />
              {selectedProduct ? `Chi tiết lô hàng - ${selectedProduct.productName}` : 'Chi tiết lô hàng'}
            </DialogTitle>
            <p className="mt-1 text-sm text-amber-50/80">Danh sách các lô hàng đang lưu kho phục vụ điều phối FEFO.</p>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto bg-white px-8 py-6">
            {selectedProduct ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                      <Package className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-amber-900">{selectedProduct.productName}</span>
                      <span className="text-[11px] font-mono text-amber-700/80">
                        ID #{selectedProduct.productId} • ĐVT: {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-amber-100 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        <th className="px-4 py-3">Mã lô</th>
                        <th className="px-4 py-3">Hạn sử dụng</th>
                        <th className="px-4 py-3 text-right">SL gốc</th>
                        <th className="px-4 py-3 text-right">SL hiện tại</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {selectedProduct.productBatch?.map((batch) => (
                        <tr key={batch.batchId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-3 font-mono text-xs text-amber-800">{batch.batchCode}</td>
                          <td className="px-4 py-3 text-xs text-stone-700">
                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-stone-700">
                            {batch.initialQuantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-stone-800">
                            {batch.currentQuantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold border',
                                batchStatusColor[batch.status] || 'bg-stone-50 text-stone-600 border-stone-200'
                              )}
                            >
                              {batch.status === 'AVAILABLE' && <CheckCircle2 className="size-3" />}
                              {batch.status === 'EXPIRED' && <XCircle className="size-3" />}
                              {batch.status === 'WAITING_FOR_STOCK' && <Clock3 className="size-3" />}
                              {batch.status === 'OUT_OF_STOCK' && <AlertTriangle className="size-3" />}
                              {batchStatusLabel[batch.status] || batch.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-stone-700">Vui lòng chọn sản phẩm để xem chi tiết.</p>
            )}
          </div>

          <DialogFooter className="border-t border-stone-100 bg-stone-50 px-8 py-4">
            <Button
              variant="outline"
              className="border-stone-300 text-stone-700 hover:bg-white hover:text-stone-900"
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

export default InventoryOverviewPage;
