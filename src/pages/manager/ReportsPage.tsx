import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Boxes,
  AlertTriangle,
  Store as StoreIcon,
  UtensilsCrossed,
  ArrowUpRight,
  ArrowDownRight,
  CalendarClock,
  Loader2,
} from 'lucide-react';
import {
  managerServices,
  type NearExpiryItem,
  type TopStoreReportItem,
  type TopProductReportItem,
  type InventoryReportResponse,
} from '@/services/managerServices';

const NEAR_EXPIRY_DAYS = 3;

/** Lấy mảng items từ response API (hỗ trợ cả data.items và data.data.items) */
function getItems<T>(res: { data?: { items?: T[]; data?: { items?: T[] } } }): T[] {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray((d as { items?: T[] }).items)) return (d as { items: T[] }).items;
  const inner = (d as { data?: { items?: T[] } }).data;
  return (inner?.items && Array.isArray(inner.items)) ? inner.items : [];
}

/** Lấy totalElements từ response phân trang */
function getTotal(res: { data?: { totalElements?: number; data?: { totalElements?: number } } }): number {
  const d = res?.data;
  if (!d) return 0;
  const t = (d as { totalElements?: number }).totalElements;
  if (typeof t === 'number') return t;
  const inner = (d as { data?: { totalElements?: number } }).data;
  return typeof inner?.totalElements === 'number' ? inner.totalElements : 0;
}

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalStockUnits, setTotalStockUnits] = useState(0);
  const [nearExpiryBatches, setNearExpiryBatches] = useState<NearExpiryItem[]>([]);
  /** Tổng số lô sắp hết hạn từ API (totalElements), để KPI và bảng cùng nguồn */
  const [nearExpiryTotal, setNearExpiryTotal] = useState(0);
  const [totalStoreOrders, setTotalStoreOrders] = useState(0);
  const [approvedOrders, setApprovedOrders] = useState(0);
  const [topStores, setTopStores] = useState<TopStoreReportItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductReportItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [stockRes, nearExpiryRes, ordersRes, approvedRes, topStoresRes, topProductsRes] =
          await Promise.all([
            managerServices.getInventoryStock(),
            managerServices.getNearExpiryBatches(NEAR_EXPIRY_DAYS),
            managerServices.getOrders(0, 1),
            managerServices.getOrders(0, 1, { status: 'APPROVED' }),
            managerServices.getTopImportingStores(10),
            managerServices.getTopConsumedProducts(10),
          ]);

        if (cancelled) return;

        const stockPayload = (stockRes as { data?: unknown }).data;
        const stockItems = getItems<InventoryReportResponse>({ data: stockPayload as never }) ??
          (stockPayload as { data?: { items?: InventoryReportResponse[] } })?.data?.items ?? [];
        const totalStock = Array.isArray(stockItems)
          ? stockItems.reduce((sum, i) => sum + (Number(i?.totalStock) || 0), 0)
          : 0;
        setTotalStockUnits(totalStock);

        const nearPayload = (nearExpiryRes as unknown as { data?: { items?: NearExpiryItem[]; totalElements?: number } })?.data;
        const nearItems = nearPayload?.items ?? [];
        setNearExpiryBatches(Array.isArray(nearItems) ? nearItems : []);
        const total = nearPayload?.totalElements ?? (Array.isArray(nearItems) ? nearItems.length : 0);
        setNearExpiryTotal(total);

        setTotalStoreOrders(getTotal(ordersRes as never));
        setApprovedOrders(getTotal(approvedRes as never));

        const storesList = (topStoresRes as unknown as { data?: { items?: TopStoreReportItem[] } })?.data?.items ?? [];
        setTopStores(Array.isArray(storesList) ? storesList : []);

        const productsList = (topProductsRes as unknown as { data?: { items?: TopProductReportItem[] } })?.data?.items ?? [];
        setTopProducts(Array.isArray(productsList) ? productsList : []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được báo cáo');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const today = new Date();

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
        <p className="font-medium">Lỗi tải báo cáo</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

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
              Tổng đơn vị còn trong tất cả lô hàng
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
              Lô sắp hết hạn (≤ {NEAR_EXPIRY_DAYS} ngày)
            </CardTitle>
            <CardDescription className="text-xs">
              Cùng API near-expiry (≤ {NEAR_EXPIRY_DAYS} ngày) với bảng bên dưới
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-6 pb-5 pt-0">
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {nearExpiryTotal}
              </p>
              <p className="text-xs text-stone-500">Lô cần ưu tiên xuất (FEFO)</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
              <CalendarClock className="size-3" />
              Hôm nay: {today.toLocaleDateString('vi-VN')}
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
              Tổng đơn từ API /orders
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

      {/* Lô sắp hết hạn + Top cửa hàng nhập */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <AlertTriangle className="size-5 text-amber-600" />
              Lô hàng sắp hết hạn
            </CardTitle>
            <CardDescription className="text-xs">
              Cùng API near-expiry (≤ {NEAR_EXPIRY_DAYS} ngày). Hiển thị {nearExpiryBatches.length}
              {nearExpiryTotal > nearExpiryBatches.length ? ` / ${nearExpiryTotal} lô` : ' lô'}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {nearExpiryBatches.map((batch, idx) => (
                    <tr key={`${batch.batchCode}-${idx}`} className="hover:bg-amber-50/60">
                      <td className="px-4 py-2.5 text-[11px] font-medium text-stone-800">
                        {batch.product ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-amber-800">
                        {batch.batchCode}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-stone-800">
                        {Number(batch.stock).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-stone-700">
                        {batch.expiryDate
                          ? new Date(batch.expiryDate).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {nearExpiryBatches.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-xs text-amber-700/70">
                        Hiện chưa có lô nào sắp hết hạn (≤ {NEAR_EXPIRY_DAYS} ngày).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <StoreIcon className="size-5 text-amber-600" />
              Cửa hàng nhập nhiều nhất
            </CardTitle>
            <CardDescription className="text-xs">
              API top-importing-stores
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-4 pt-0">
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                    <th className="px-4 py-3">Cửa hàng</th>
                    <th className="px-4 py-3 text-right">Tổng SL nhập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {topStores.map((row, idx) => (
                    <tr key={`${row.storeName}-${idx}`} className="hover:bg-amber-50/60">
                      <td className="px-4 py-2.5 text-[11px] font-medium text-stone-800">
                        {row.storeName}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] font-semibold text-amber-700">
                        {Number(row.totalImported).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  {topStores.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-10 text-center text-xs text-amber-700/70">
                        Chưa có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top sản phẩm tiêu thụ — không có nút Xuất báo cáo (không có API) */}
      <Card className="border-border bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <UtensilsCrossed className="size-5 text-amber-600" />
            Món tiêu thụ mạnh nhất
          </CardTitle>
          <CardDescription className="text-xs">
            API top-consumed
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-4 pt-0">
          <div className="max-h-[260px] overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">SL tiêu thụ</th>
                  <th className="px-4 py-3 text-right">Xu hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {topProducts.map((row, index) => (
                  <tr key={`${row.product}-${index}`} className="hover:bg-amber-50/60">
                    <td className="px-4 py-2.5 text-[11px] font-medium text-stone-800">
                      {index < 3 ? (
                        <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                          {index + 1}
                        </span>
                      ) : null}
                      {row.product}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] font-semibold text-stone-900">
                      {Number(row.totalConsumed).toLocaleString('vi-VN')}
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
                    <td colSpan={3} className="px-4 py-10 text-center text-xs text-amber-700/70">
                      Chưa có dữ liệu tiêu thụ.
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
