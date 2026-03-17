import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/labelMapping';

/**
 * Đồng bộ DB (public schema):
 *
 * products: product_id (PK), product_name, unit, status, category_id (FK)
 * product_batches: batch_id (PK), batch_code (UNIQUE), product_id (FK),
 *   initial_quantity, current_quantity, manufacturing_date, expiry_date,
 *   status CHECK (WAITING_FOR_STOCK | AVAILABLE | OUT_OF_STOCK | EXPIRED)
 *
 * Tổng tồn = SUM(current_quantity) của các lô theo product_id
 */

type BatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';

interface Product {
  product_id: number;
  product_name: string;
  unit: string;
}

interface ProductBatch {
  batch_id: number;
  batch_code: string;
  product_id: number;
  initial_quantity: number;
  current_quantity: number;
  manufacturing_date: string | null;
  expiry_date: string | null;
  status: BatchStatus;
}

interface InventoryRow {
  product: Product;
  total_quantity: number;
  unit: string;
  batch_count: number;
  nearest_expiry: string | null;
  critical_batches: number;
}

const MOCK_PRODUCTS: Product[] = [
  { product_id: 1, product_name: 'Cơm gà xối mỡ', unit: 'phần' },
  { product_id: 2, product_name: 'Phở bò tái', unit: 'tô' },
  { product_id: 3, product_name: 'Trà chanh sả', unit: 'ly' },
  { product_id: 4, product_name: 'Thịt bò phi lê', unit: 'kg' },
];

const MOCK_BATCHES: ProductBatch[] = [
  {
    batch_id: 1,
    batch_code: 'LOT-COMGA-001',
    product_id: 1,
    initial_quantity: 200,
    current_quantity: 120,
    manufacturing_date: '2026-03-01',
    expiry_date: '2026-03-05',
    status: 'AVAILABLE',
  },
  {
    batch_id: 2,
    batch_code: 'LOT-COMGA-002',
    product_id: 1,
    initial_quantity: 150,
    current_quantity: 150,
    manufacturing_date: '2026-03-04',
    expiry_date: '2026-03-08',
    status: 'WAITING_FOR_STOCK',
  },
  {
    batch_id: 3,
    batch_code: 'LOT-PHOBO-001',
    product_id: 2,
    initial_quantity: 180,
    current_quantity: 40,
    manufacturing_date: '2026-02-28',
    expiry_date: '2026-03-04',
    status: 'AVAILABLE',
  },
  {
    batch_id: 4,
    batch_code: 'LOT-TRACHANH-001',
    product_id: 3,
    initial_quantity: 300,
    current_quantity: 260,
    manufacturing_date: '2026-03-02',
    expiry_date: '2026-03-12',
    status: 'AVAILABLE',
  },
  {
    batch_id: 5,
    batch_code: 'LOT-BOFILE-001',
    product_id: 4,
    initial_quantity: 80,
    current_quantity: 0,
    manufacturing_date: '2026-02-20',
    expiry_date: '2026-02-28',
    status: 'EXPIRED',
  },
];

function isNearExpiry(expiryDate: string | null, daysThreshold = 3): boolean {
  if (!expiryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= daysThreshold;
}

const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  WAITING_FOR_STOCK: 'Chờ nhập kho',
  AVAILABLE: 'Đang sử dụng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRED: 'Hết hạn',
};

const BATCH_STATUS_CLASS: Record<BatchStatus, string> = {
  WAITING_FOR_STOCK: 'bg-sky-50 text-sky-700 border-sky-200',
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OUT_OF_STOCK: 'bg-stone-100 text-stone-600 border-stone-200',
  EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
};

function InventoryCentral() {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const overviewRows: InventoryRow[] = useMemo(() => {
    return MOCK_PRODUCTS.map((p) => {
      const batches = MOCK_BATCHES.filter((b) => b.product_id === p.product_id);

      if (batches.length === 0) {
        return {
          product: p,
          total_quantity: 0,
          unit: p.unit,
          batch_count: 0,
          nearest_expiry: null,
          critical_batches: 0,
        };
      }

      const total = batches.reduce((sum, b) => sum + b.current_quantity, 0);
      const dates = batches
        .filter((b) => b.expiry_date)
        .map((b) => b.expiry_date as string)
        .sort();
      const nearest = dates[0] ?? null;
      const critical = batches.filter((b) => isNearExpiry(b.expiry_date)).length;

      return {
        product: p,
        total_quantity: total,
        unit: p.unit,
        batch_count: batches.length,
        nearest_expiry: nearest,
        critical_batches: critical,
      };
    });
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return overviewRows;
    const keyword = search.toLowerCase();
    return overviewRows.filter((row) =>
      row.product.product_name.toLowerCase().includes(keyword)
    );
  }, [overviewRows, search]);

  const totalItems = overviewRows.reduce((sum, r) => sum + r.total_quantity, 0);
  const totalProducts = overviewRows.length;
  const criticalCount = overviewRows.filter((r) => r.critical_batches > 0).length;

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const getBatchesByProduct = (productId: number) =>
    MOCK_BATCHES.filter((b) => b.product_id === productId).sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return a.expiry_date.localeCompare(b.expiry_date);
    });

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Boxes className="size-6 text-amber-500" />
              Tổng quan tồn kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi bảng `products` và `product_batches` – tổng tồn theo sản phẩm, số lô, hạn dùng gần nhất (FEFO).
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng đơn vị tồn
              </span>
              <span className="text-lg font-semibold text-amber-900">
                {totalItems.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Sản phẩm
              </span>
              <span className="text-lg font-semibold text-amber-900">{totalProducts}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Lô sắp hết hạn
              </span>
              <span className="text-lg font-semibold text-amber-900">{criticalCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
            <Input
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-amber-200/60 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Tổng tồn</th>
                  <th className="px-4 py-3">Số lô</th>
                  <th className="px-4 py-3">Hạn dùng gần nhất</th>
                  <th className="px-4 py-3">Cảnh báo</th>
                  <th className="px-4 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {filteredRows.map((row) => {
                  const isLowStock = row.total_quantity === 0;
                  const hasCritical = row.critical_batches > 0;
                  const nearestLabel = row.nearest_expiry
                    ? new Date(row.nearest_expiry).toLocaleDateString('vi-VN')
                    : '—';

                  return (
                    <tr key={row.product.product_id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <Package className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{row.product.product_name}</p>
                            <p className="text-[10px] font-mono text-stone-500">ID: {row.product.product_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700">
                          <Scale className="size-3 text-amber-500" />
                          {row.total_quantity.toLocaleString('vi-VN')} {row.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-stone-700">{row.batch_count}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          <CalendarClock className="size-3" />
                          {nearestLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-700">
                            <XCircle className="size-3" />
                            Hết hàng
                          </span>
                        )}
                        {hasCritical && !isLowStock && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                            <AlertTriangle className="size-3" />
                            {row.critical_batches} lô sắp hết hạn
                          </span>
                        )}
                        {!isLowStock && !hasCritical && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            An toàn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-200 bg-white text-[11px] text-amber-900 hover:bg-amber-50"
                          onClick={() => openDetail(row.product)}
                        >
                          Xem lô hàng
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-amber-700/70">
                <Search className="size-8 opacity-40" />
                <p className="text-xs font-medium">Không tìm thấy sản phẩm tồn kho phù hợp</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-700/80">
            <Info className="size-4 shrink-0 text-amber-500" />
            <span>
              Tổng tồn = SUM(current_quantity) từ product_batches theo product_id. FEFO dựa trên expiry_date.
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          onClose={() => setDetailOpen(false)}
          className="max-w-3xl min-w-[320px] overflow-hidden border border-amber-200/60 p-0 shadow-xl"
        >
          <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pb-5 pt-6 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Boxes className="size-5" />
              {selectedProduct ? `Chi tiết lô - ${selectedProduct.product_name}` : 'Chi tiết lô hàng'}
            </DialogTitle>
            <p className="mt-1 text-xs text-amber-50/90">
              product_batches theo product_id · sắp xếp FEFO (expiry_date tăng dần)
            </p>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto bg-white px-6 py-4">
            {selectedProduct ? (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-2">
                  <Package className="size-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-900">{selectedProduct.product_name}</span>
                  <span className="text-[11px] text-amber-700/80">ID #{selectedProduct.product_id} · {selectedProduct.unit}</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-amber-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-semibold text-amber-900">
                        <th className="px-4 py-2">Mã lô</th>
                        <th className="px-4 py-2">Ngày SX</th>
                        <th className="px-4 py-2">Hạn dùng</th>
                        <th className="px-4 py-2 text-right">SL gốc</th>
                        <th className="px-4 py-2 text-right">SL hiện tại</th>
                        <th className="px-4 py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {getBatchesByProduct(selectedProduct.product_id).map((batch) => (
                        <tr key={batch.batch_id} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 font-mono text-[11px] text-amber-800">{batch.batch_code}</td>
                          <td className="px-4 py-2 text-[11px] text-stone-700">
                            {batch.manufacturing_date
                              ? new Date(batch.manufacturing_date).toLocaleDateString('vi-VN')
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-700">
                            {batch.expiry_date
                              ? new Date(batch.expiry_date).toLocaleDateString('vi-VN')
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-right text-[11px] text-stone-700">
                            {batch.initial_quantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-2 text-right text-[11px] font-medium text-stone-800">
                            {batch.current_quantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                BATCH_STATUS_CLASS[batch.status]
                              )}
                            >
                              {batch.status === 'AVAILABLE' && <CheckCircle2 className="size-3" />}
                              {batch.status === 'EXPIRED' && <XCircle className="size-3" />}
                              {batch.status === 'WAITING_FOR_STOCK' && <Clock3 className="size-3" />}
                              {batch.status === 'OUT_OF_STOCK' && <AlertTriangle className="size-3" />}
                              {translateStatus(batch.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {getBatchesByProduct(selectedProduct.product_id).length === 0 && (
                  <p className="py-8 text-center text-xs text-amber-700/80">
                    Sản phẩm này chưa có lô nào trong product_batches.
                  </p>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-xs text-stone-600">Chọn sản phẩm ở bảng bên ngoài để xem chi tiết.</p>
            )}
          </div>

          <DialogFooter className="border-t border-stone-100 bg-stone-50 px-6 py-3">
            <Button
              variant="outline"
              size="sm"
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
}

export default InventoryCentral;
