import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Boxes,
  AlertTriangle,
  Store as StoreIcon,
  UtensilsCrossed,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CalendarClock,
} from 'lucide-react';

// ==== Mock dữ liệu bám sát schema DB ====

type BatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';
type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';
type TransactionType = 'IMPORT' | 'EXPORT' | 'DISPOSAL';

interface Product {
  product_id: number;
  product_name: string;
  unit: string;
}

interface ProductBatch {
  batch_id: number;
  batch_code: string;
  product_id: number;
  manu_order_id: number | null;
  initial_quantity: number;
  current_quantity: number;
  manufacturing_date: string | null;
  expiry_date: string | null;
  status: BatchStatus;
}

interface Store {
  store_id: number;
  store_name: string;
}

interface StoreOrder {
  order_id: number;
  order_code: string;
  store_store_id: number;
  order_date: string;
  delivery_date: string | null;
  status: StoreOrderStatus;
}

interface OrderDetail {
  detail_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
}

interface InventoryTransaction {
  transaction_id: number;
  product_batch_id: number;
  transaction_type: TransactionType;
  quantity: number;
  transaction_date: string;
  reference_code: string | null;
  note: string | null;
}

const PRODUCTS: Product[] = [
  { product_id: 1, product_name: 'Cơm gà xối mỡ', unit: 'phần' },
  { product_id: 2, product_name: 'Phở bò tái', unit: 'tô' },
  { product_id: 3, product_name: 'Trà chanh sả', unit: 'ly' },
  { product_id: 4, product_name: 'Thịt bò phi lê', unit: 'kg' },
];

const PRODUCT_BATCHES: ProductBatch[] = [
  {
    batch_id: 1,
    batch_code: 'LOT-COMGA-001',
    product_id: 1,
    manu_order_id: 10,
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
    manu_order_id: 11,
    initial_quantity: 150,
    current_quantity: 150,
    manufacturing_date: '2026-03-03',
    expiry_date: '2026-03-08',
    status: 'WAITING_FOR_STOCK',
  },
  {
    batch_id: 3,
    batch_code: 'LOT-PHOBO-001',
    product_id: 2,
    manu_order_id: 12,
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
    manu_order_id: 13,
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
    manu_order_id: 8,
    initial_quantity: 80,
    current_quantity: 0,
    manufacturing_date: '2026-02-20',
    expiry_date: '2026-02-28',
    status: 'EXPIRED',
  },
];

const STORES: Store[] = [
  { store_id: 1, store_name: 'Cửa hàng Quận 1' },
  { store_id: 2, store_name: 'Cửa hàng Quận 3' },
  { store_id: 3, store_name: 'Cửa hàng Quận 7' },
];

const STORE_ORDERS: StoreOrder[] = [
  {
    order_id: 1,
    order_code: 'SO-20260301-001',
    store_store_id: 1,
    order_date: '2026-03-01T09:00:00Z',
    delivery_date: '2026-03-02',
    status: 'APPROVED',
  },
  {
    order_id: 2,
    order_code: 'SO-20260301-002',
    store_store_id: 2,
    order_date: '2026-03-01T10:30:00Z',
    delivery_date: '2026-03-02',
    status: 'PENDING',
  },
  {
    order_id: 3,
    order_code: 'SO-20260302-001',
    store_store_id: 1,
    order_date: '2026-03-02T08:15:00Z',
    delivery_date: '2026-03-03',
    status: 'APPROVED',
  },
  {
    order_id: 4,
    order_code: 'SO-20260302-002',
    store_store_id: 3,
    order_date: '2026-03-02T11:45:00Z',
    delivery_date: '2026-03-03',
    status: 'CANCELLED',
  },
];

const ORDER_DETAILS: OrderDetail[] = [
  { detail_id: 1, order_id: 1, product_id: 1, quantity: 60 },
  { detail_id: 2, order_id: 1, product_id: 3, quantity: 40 },
  { detail_id: 3, order_id: 2, product_id: 2, quantity: 50 },
  { detail_id: 4, order_id: 3, product_id: 1, quantity: 80 },
  { detail_id: 5, order_id: 3, product_id: 2, quantity: 30 },
  { detail_id: 6, order_id: 4, product_id: 3, quantity: 20 },
];

const INVENTORY_TRANSACTIONS: InventoryTransaction[] = [
  // Xuất kho cho đơn SO-20260301-001
  {
    transaction_id: 1,
    product_batch_id: 1,
    transaction_type: 'EXPORT',
    quantity: 50,
    transaction_date: '2026-03-02T03:00:00Z',
    reference_code: 'PX-20260302-001',
    note: 'Xuất cho SO-20260301-001',
  },
  {
    transaction_id: 2,
    product_batch_id: 3,
    transaction_type: 'EXPORT',
    quantity: 40,
    transaction_date: '2026-03-02T03:05:00Z',
    reference_code: 'PX-20260302-001',
    note: 'Xuất cho SO-20260301-001',
  },
  // Xuất kho cho đơn SO-20260302-001
  {
    transaction_id: 3,
    product_batch_id: 1,
    transaction_type: 'EXPORT',
    quantity: 40,
    transaction_date: '2026-03-03T02:50:00Z',
    reference_code: 'PX-20260303-001',
    note: 'Xuất cho SO-20260302-001',
  },
  {
    transaction_id: 4,
    product_batch_id: 3,
    transaction_type: 'EXPORT',
    quantity: 25,
    transaction_date: '2026-03-03T02:55:00Z',
    reference_code: 'PX-20260303-001',
    note: 'Xuất cho SO-20260302-001',
  },
  // Nhập kho (IMPORT) & huỷ (DISPOSAL) để minh hoạ
  {
    transaction_id: 5,
    product_batch_id: 4,
    transaction_type: 'IMPORT',
    quantity: 300,
    transaction_date: '2026-03-02T01:00:00Z',
    reference_code: 'PN-20260302-001',
    note: 'Nhập kho trà chanh sả',
  },
  {
    transaction_id: 6,
    product_batch_id: 5,
    transaction_type: 'DISPOSAL',
    quantity: 80,
    transaction_date: '2026-02-28T04:00:00Z',
    reference_code: null,
    note: 'Hủy lô thịt bò hết hạn',
  },
];

const TODAY = new Date('2026-03-04');

function daysUntil(expiry: string | null): number | null {
  if (!expiry) return null;
  const exp = new Date(expiry);
  const diffMs = exp.getTime() - TODAY.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function ReportsPage() {
  // KPI tồn kho trung tâm
  const totalStockUnits = useMemo(
    () => PRODUCT_BATCHES.reduce((sum, b) => sum + b.current_quantity, 0),
    []
  );

  const nearExpiryBatches = useMemo(
    () =>
      PRODUCT_BATCHES.filter((b) => {
        if (!b.expiry_date) return false;
        const d = daysUntil(b.expiry_date);
        return d !== null && d >= 0 && d <= 3 && b.status !== 'EXPIRED';
      }).sort((a, b) => (a.expiry_date ?? '').localeCompare(b.expiry_date ?? '')),
    []
  );

  const expiredBatches = useMemo(
    () => PRODUCT_BATCHES.filter((b) => b.status === 'EXPIRED'),
    []
  );

  // Top cửa hàng nhập nhiều
  const storeOrderAgg = useMemo(() => {
    const byStore: Record<
      number,
      {
        store: Store;
        totalOrders: number;
        totalQuantity: number;
      }
    > = {};

    for (const s of STORES) {
      byStore[s.store_id] = {
        store: s,
        totalOrders: 0,
        totalQuantity: 0,
      };
    }

    for (const order of STORE_ORDERS) {
      const storeAgg = byStore[order.store_store_id];
      if (!storeAgg) continue;
      storeAgg.totalOrders += 1;

      const details = ORDER_DETAILS.filter((d) => d.order_id === order.order_id);
      for (const d of details) {
        storeAgg.totalQuantity += d.quantity;
      }
    }

    return Object.values(byStore).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, []);

  // Top món tiêu thụ mạnh dựa trên INVENTORY_TRANSACTIONS (EXPORT)
  const topProducts = useMemo(() => {
    const exportTx = INVENTORY_TRANSACTIONS.filter((t) => t.transaction_type === 'EXPORT');
    const byProduct: Record<
      number,
      {
        product: Product;
        totalExported: number;
      }
    > = {};

    for (const tx of exportTx) {
      const batch = PRODUCT_BATCHES.find((b) => b.batch_id === tx.product_batch_id);
      if (!batch) continue;
      const product = PRODUCTS.find((p) => p.product_id === batch.product_id);
      if (!product) continue;

      if (!byProduct[product.product_id]) {
        byProduct[product.product_id] = {
          product,
          totalExported: 0,
        };
      }
      byProduct[product.product_id].totalExported += tx.quantity;
    }

    return Object.values(byProduct).sort((a, b) => b.totalExported - a.totalExported);
  }, []);

  const totalStoreOrders = STORE_ORDERS.length;
  const approvedOrders = STORE_ORDERS.filter((o) => o.status === 'APPROVED').length;

  return (
    <div className="h-full w-full space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Boxes className="size-5 text-amber-600" />
              Tồn kho trung tâm
            </CardTitle>
            <CardDescription className="text-xs">
              Tổng đơn vị còn trong tất cả lô hàng (`current_quantity`)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-6 pb-5 pt-0">
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {totalStockUnits.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-stone-500">Đơn vị (phần, tô, ly, kg...)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <AlertTriangle className="size-5 text-amber-600" />
              Lô sắp hết hạn (≤ 3 ngày)
            </CardTitle>
            <CardDescription className="text-xs">
              Dựa trên `expiry_date` trong bảng `product_batches`
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-6 pb-5 pt-0">
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {nearExpiryBatches.length}
              </p>
              <p className="text-xs text-stone-500">Lô cần ưu tiên xuất (FEFO)</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
              <CalendarClock className="size-3" />
              Hôm nay: {TODAY.toLocaleDateString('vi-VN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <StoreIcon className="size-5 text-amber-600" />
              Đơn yêu cầu cửa hàng
            </CardTitle>
            <CardDescription className="text-xs">
              Dựa trên bảng `store_orders` (mọi trạng thái)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-6 pb-5 pt-0">
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {totalStoreOrders.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-stone-500">
                {approvedOrders} đơn đã duyệt
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lô sắp hết hạn + top cửa hàng */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <AlertTriangle className="size-5 text-amber-600" />
              Lô hàng sắp hết hạn
            </CardTitle>
            <CardDescription className="text-xs">
              Ưu tiên xuất/tiêu thụ trước theo FEFO
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-4 pt-0">
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Mã lô</th>
                    <th className="px-4 py-3 text-right">Tồn</th>
                    <th className="px-4 py-3">HSD</th>
                    <th className="px-4 py-3 text-right">Còn (ngày)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {nearExpiryBatches.map((batch) => {
                    const product = PRODUCTS.find((p) => p.product_id === batch.product_id);
                    const d = daysUntil(batch.expiry_date);
                    return (
                      <tr key={batch.batch_id} className="hover:bg-amber-50/60">
                        <td className="px-4 py-2.5 text-[11px] font-medium text-stone-800">
                          {product?.product_name ?? `#${batch.product_id}`}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-amber-800">
                          {batch.batch_code}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[11px] text-stone-800">
                          {batch.current_quantity.toLocaleString('vi-VN')}{' '}
                          {product?.unit}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-stone-700">
                          {batch.expiry_date
                            ? new Date(batch.expiry_date).toLocaleDateString('vi-VN')
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[11px] font-semibold text-amber-700">
                          {d}
                        </td>
                      </tr>
                    );
                  })}
                  {nearExpiryBatches.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-xs text-amber-700/70"
                      >
                        Hiện chưa có lô nào sắp hết hạn (≤ 3 ngày).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {expiredBatches.length > 0 && (
              <div className="mt-3 px-4 text-[11px] text-rose-700">
                Đã có {expiredBatches.length} lô <span className="font-semibold">hết hạn</span>. Cần
                xử lý hủy/điều chỉnh trong module Kho.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <StoreIcon className="size-5 text-amber-600" />
              Cửa hàng nhập nhiều nhất
            </CardTitle>
            <CardDescription className="text-xs">
              Dựa trên tổng số lượng yêu cầu từ bảng `store_orders` + `order_details`
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-4 pt-0">
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                    <th className="px-4 py-3">Cửa hàng</th>
                    <th className="px-4 py-3 text-right">Số đơn</th>
                    <th className="px-4 py-3 text-right">Tổng SL yêu cầu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {storeOrderAgg.map((row) => (
                    <tr key={row.store.store_id} className="hover:bg-amber-50/60">
                      <td className="px-4 py-2.5 text-[11px] font-medium text-stone-800">
                        {row.store.store_name}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-stone-800">
                        {row.totalOrders}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] font-semibold text-amber-700">
                        {row.totalQuantity.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  {storeOrderAgg.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-xs text-amber-700/70"
                      >
                        Chưa có dữ liệu đơn yêu cầu nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top sản phẩm tiêu thụ */}
      <Card className="border-border bg-white">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <UtensilsCrossed className="size-5 text-amber-600" />
              Món tiêu thụ mạnh nhất
            </CardTitle>
            <CardDescription className="text-xs">
              Tính theo tổng số lượng xuất kho (`EXPORT` trong bảng `inventory_transactions`)
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-1 rounded-full border-amber-200 px-3 text-[11px] text-amber-800 hover:bg-amber-50"
          >
            <TrendingUp className="size-3" />
            Xuất báo cáo
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-4 pt-0">
          <div className="max-h-[260px] overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">SL xuất</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3 text-right">Xu hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {topProducts.map((row, index) => (
                  <tr key={row.product.product_id} className="hover:bg-amber-50/60">
                    <td className="px-4 py-2.5 text-[11px] font-medium text-stone-800">
                      {index < 3 ? (
                        <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                          {index + 1}
                        </span>
                      ) : null}
                      {row.product.product_name}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] font-semibold text-stone-900">
                      {row.totalExported.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-stone-600">
                      {row.product.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px]">
                      {index === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                          <ArrowUpRight className="size-3" />
                          Tăng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-600">
                          <ArrowDownRight className="size-3" />
                          Ổn định
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-xs text-amber-700/70">
                      Chưa có giao dịch xuất kho nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsPage;
