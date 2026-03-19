import { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Store as StoreIcon,
  UtensilsCrossed,
  CalendarClock,
  Loader2,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Trophy,
} from 'lucide-react';
import {
  managerServices,
  type NearExpiryItem,
  type TopStoreReportItem,
  type InventoryReportResponse,
} from '@/services/managerServices';
import { kitchenServices, type InventoryTransactionResponse } from '@/services/kitchenServices';
import { cn } from '@/lib/utils';

const NEAR_EXPIRY_DAYS = 3;

function getItems<T>(res: { data?: { items?: T[]; data?: { items?: T[] } } }): T[] {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray((d as { items?: T[] }).items)) return (d as { items: T[] }).items;
  const inner = (d as { data?: { items?: T[] } }).data;
  return inner?.items && Array.isArray(inner.items) ? inner.items : [];
}

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalStockUnits, setTotalStockUnits] = useState(0);
  const [nearExpiryBatches, setNearExpiryBatches] = useState<NearExpiryItem[]>([]);
  const [nearExpiryTotal, setNearExpiryTotal] = useState(0);
  const [topStores, setTopStores] = useState<TopStoreReportItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransactionResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [stockRes, nearExpiryRes, topStoresRes, inventoryTxRes] = await Promise.all([
          managerServices.getInventoryStock(),
          managerServices.getNearExpiryBatches(NEAR_EXPIRY_DAYS),
          managerServices.getTopImportingStores(10),
          kitchenServices.getInventoryTransaction(),
        ]);
        if (cancelled) return;

        const stockPayload = (stockRes as { data?: unknown }).data;
        const stockItems =
          getItems<InventoryReportResponse>({ data: stockPayload as never }) ??
          (stockPayload as { data?: { items?: InventoryReportResponse[] } })?.data?.items ?? [];
        setTotalStockUnits(
          Array.isArray(stockItems)
            ? stockItems.reduce((sum, i) => sum + (Number(i?.totalStock) || 0), 0)
            : 0
        );

        const nearPayload = (
          nearExpiryRes as unknown as { data?: { items?: NearExpiryItem[]; totalElements?: number } }
        )?.data;
        const nearItems = nearPayload?.items ?? [];
        setNearExpiryBatches(Array.isArray(nearItems) ? nearItems : []);
        setNearExpiryTotal(nearPayload?.totalElements ?? (Array.isArray(nearItems) ? nearItems.length : 0));

        const storesList =
          (topStoresRes as unknown as { data?: { items?: TopStoreReportItem[] } })?.data?.items ?? [];
        setTopStores(Array.isArray(storesList) ? storesList : []);

        const txPayload = inventoryTxRes as unknown as {
          success?: boolean;
          data?: { items?: InventoryTransactionResponse[] };
        };
        if (txPayload?.success && Array.isArray(txPayload.data?.items)) {
          setInventoryTransactions(txPayload.data.items);
        } else if (Array.isArray((txPayload as { data?: InventoryTransactionResponse[] }).data)) {
          setInventoryTransactions((txPayload as { data: InventoryTransactionResponse[] }).data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Không tải được báo cáo');
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
      <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-9 animate-spin text-amber-500" />
        <p className="text-sm font-medium text-amber-700">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <p className="font-semibold">Lỗi tải báo cáo</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const sortedTx = [...inventoryTransactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-full space-y-6 p-1">

      {/* ── KPI CARDS ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={Boxes}
          label="Tổng tồn kho"
          value={totalStockUnits.toLocaleString('vi-VN')}
          sub="Đơn vị trong tất cả lô hàng"
          accent="amber"
        />
        <KpiCard
          icon={TrendingDown}
          label={`Lô sắp hết hạn (≤ ${NEAR_EXPIRY_DAYS} ngày)`}
          value={String(nearExpiryTotal)}
          sub="Cần ưu tiên xuất kho (FEFO)"
          accent="rose"
          badge={today.toLocaleDateString('vi-VN')}
        />
      </div>

      {/* ── 2 TABLES ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Lô sắp hết hạn */}
        <SectionCard
          icon={AlertTriangle}
          title="Lô hàng sắp hết hạn"
          desc={`Hiển thị ${nearExpiryBatches.length}${nearExpiryTotal > nearExpiryBatches.length ? ` / ${nearExpiryTotal}` : ''} lô ≤ ${NEAR_EXPIRY_DAYS} ngày`}
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Sản phẩm</th>
                <th className="px-4 py-2.5">Mã lô</th>
                <th className="px-4 py-2.5 text-right">Tồn</th>
                <th className="px-4 py-2.5">HSD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {nearExpiryBatches.map((b, i) => (
                <tr key={`${b.batchCode}-${i}`} className="transition hover:bg-amber-50/60">
                  <td className="px-4 py-2.5 text-[11px] text-stone-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-stone-800">{b.product ?? '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-amber-700">{b.batchCode}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-stone-900">
                    {Number(b.stock).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
              {nearExpiryBatches.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-xs italic text-stone-400">
                    Không có lô nào sắp hết hạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SectionCard>

        {/* Top cửa hàng nhập */}
        <SectionCard
          icon={Trophy}
          title="Top cửa hàng nhập nhiều nhất"
          desc="Xếp hạng theo tổng số lượng nhập"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                <th className="px-4 py-2.5">Hạng</th>
                <th className="px-4 py-2.5">Cửa hàng</th>
                <th className="px-4 py-2.5 text-right">Tổng SL nhập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topStores.map((row, i) => (
                <tr key={`${row.storeName}-${i}`} className="transition hover:bg-amber-50/60">
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold',
                      i === 0 ? 'bg-amber-400 text-white' :
                      i === 1 ? 'bg-stone-300 text-stone-700' :
                      i === 2 ? 'bg-amber-200 text-amber-800' :
                      'bg-stone-100 text-stone-500'
                    )}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-stone-800">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="size-3.5 shrink-0 text-amber-500" />
                      {row.storeName}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                    {Number(row.totalImported).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
              {topStores.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-xs italic text-stone-400">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      </div>

      {/* ── TRANSACTION TABLE ── */}
      <SectionCard
        icon={UtensilsCrossed}
        title="Giao dịch tồn kho mới nhất"
        desc="10 giao dịch nhập / xuất / điều chỉnh gần nhất"
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              <th className="px-4 py-2.5">Mã GD</th>
              <th className="px-4 py-2.5">Loại</th>
              <th className="px-4 py-2.5">Sản phẩm</th>
              <th className="px-4 py-2.5 text-right">Số lượng</th>
              <th className="px-4 py-2.5">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedTx.map((row) => (
              <tr key={row.transactionId} className="transition hover:bg-amber-50/40">
                <td className="px-4 py-2.5 font-mono text-[11px] text-stone-500">{row.referenceCode}</td>
                <td className="px-4 py-2.5">
                  <TxBadge type={row.transactionType} />
                </td>
                <td className="px-4 py-2.5 font-medium text-stone-800">{row.productName}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-stone-900">
                  {row.quantity.toLocaleString('vi-VN')} {row.unit}
                </td>
                <td className="px-4 py-2.5 text-stone-500">
                  {row.transactionDate
                    ? new Date(row.transactionDate).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: false,
                      })
                    : '—'}
                </td>
              </tr>
            ))}
            {sortedTx.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs italic text-stone-400">
                  Chưa có giao dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({
  icon: Icon, label, value, sub, accent, badge,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent: 'amber' | 'rose';
  badge?: string;
}) {
  const isRose = accent === 'rose';
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border p-5 shadow-sm',
      isRose ? 'border-rose-100 bg-white' : 'border-amber-100 bg-white'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className={cn('mt-2 text-4xl font-extrabold', isRose ? 'text-rose-600' : 'text-amber-700')}>
            {value}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">{sub}</p>
        </div>
        <div className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-inner',
          isRose ? 'bg-rose-50' : 'bg-amber-50'
        )}>
          <Icon className={cn('size-6', isRose ? 'text-rose-500' : 'text-amber-500')} />
        </div>
      </div>
      {badge && (
        <div className={cn(
          'mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium',
          isRose ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-amber-100 bg-amber-50 text-amber-700'
        )}>
          <CalendarClock className="size-3" />
          {badge}
        </div>
      )}
      <div className={cn(
        'pointer-events-none absolute -bottom-4 -right-4 size-20 rounded-full opacity-[0.07]',
        isRose ? 'bg-rose-500' : 'bg-amber-500'
      )} />
    </div>
  );
}

/* ── Section Card wrapper ── */
function SectionCard({
  icon: Icon, title, desc, children,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Icon className="size-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">{title}</p>
          {desc && <p className="mt-0.5 text-[11px] text-stone-500">{desc}</p>}
        </div>
      </div>
      <div className="max-h-72 overflow-auto">{children}</div>
    </div>
  );
}

/* ── Transaction type badge ── */
function TxBadge({ type }: { type: string }) {
  if (type === 'IMPORT') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 border border-green-100">
      <ArrowDownToLine className="size-3" /> Nhập kho
    </span>
  );
  if (type === 'EXPORT') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
      <ArrowUpFromLine className="size-3" /> Xuất kho
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
      <SlidersHorizontal className="size-3" /> Điều chỉnh
    </span>
  );
}

export default ReportsPage;
