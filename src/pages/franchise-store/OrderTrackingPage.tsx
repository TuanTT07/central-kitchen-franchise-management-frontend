import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarClock, Receipt, Search, Truck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Đồng bộ DB (public schema):
 *
 * store_orders:
 *   order_id (PK, identity), order_code (UNIQUE), store_store_id (FK stores),
 *   order_date (timestamp), delivery_date (date), status CHECK (PENDING|APPROVED|CANCELLED)
 *
 * export_notes:
 *   export_id (PK, identity), export_code (UNIQUE), store_order_id (FK store_orders),
 *   export_date (timestamptz), status CHECK (READY|SHIPPED|CANCEL), created_by (FK users, nullable)
 */

type StoreOrderStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';
type ExportStatus = 'READY' | 'SHIPPED' | 'CANCEL';

interface StoreOrder {
  order_id: number;
  order_code: string;
  store_store_id: number;
  order_date: string;
  delivery_date: string | null;
  status: StoreOrderStatus;
}

interface ExportNote {
  export_id: number;
  export_code: string;
  store_order_id: number;
  export_date: string;
  status: ExportStatus;
  created_by?: number | null;
}

const STORE_ORDER_STATUS_LABEL: Record<StoreOrderStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
};

const STORE_ORDER_STATUS_CLASS: Record<StoreOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
};

const EXPORT_STATUS_LABEL: Record<ExportStatus, string> = {
  READY: 'Sẵn sàng xuất',
  SHIPPED: 'Đã giao',
  CANCEL: 'Hủy xuất',
};

const EXPORT_STATUS_CLASS: Record<ExportStatus, string> = {
  READY: 'bg-sky-100 text-sky-800 border-sky-200',
  SHIPPED: 'bg-amber-500 text-white border-amber-600 shadow-sm',
  CANCEL: 'bg-stone-200 text-stone-700 border-stone-300',
};

const MOCK_STORE_ORDERS: StoreOrder[] = [
  {
    order_id: 1,
    order_code: 'SO-20260304-001',
    store_store_id: 1,
    order_date: '2026-03-04T08:30:00Z',
    delivery_date: '2026-03-06',
    status: 'PENDING',
  },
  {
    order_id: 2,
    order_code: 'SO-20260303-002',
    store_store_id: 1,
    order_date: '2026-03-03T10:15:00Z',
    delivery_date: '2026-03-05',
    status: 'APPROVED',
  },
  {
    order_id: 3,
    order_code: 'SO-20260302-001',
    store_store_id: 1,
    order_date: '2026-03-02T14:00:00Z',
    delivery_date: '2026-03-04',
    status: 'APPROVED',
  },
  {
    order_id: 4,
    order_code: 'SO-20260301-003',
    store_store_id: 1,
    order_date: '2026-03-01T09:45:00Z',
    delivery_date: '2026-03-03',
    status: 'CANCELLED',
  },
];

const MOCK_EXPORT_NOTES: ExportNote[] = [
  {
    export_id: 10,
    export_code: 'EX-20260304-001',
    store_order_id: 2,
    export_date: '2026-03-04T06:30:00Z',
    status: 'SHIPPED',
  },
  {
    export_id: 11,
    export_code: 'EX-20260303-001',
    store_order_id: 3,
    export_date: '2026-03-03T05:45:00Z',
    status: 'READY',
  },
];

const CURRENT_STORE_ID = 1;
const FILTER_OPTIONS: (StoreOrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'CANCELLED'];

const OrderTrackingPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreOrderStatus | 'ALL'>('ALL');

  const ordersWithExport = useMemo(() => {
    return MOCK_STORE_ORDERS.filter((o) => o.store_store_id === CURRENT_STORE_ID).map((o) => {
      const exportNote = MOCK_EXPORT_NOTES.find((e) => e.store_order_id === o.order_id);
      return {
        ...o,
        export_code: exportNote?.export_code ?? '—',
        export_status: exportNote?.status ?? null,
        export_date: exportNote?.export_date ?? null,
      };
    });
  }, []);

  const filteredOrders = useMemo(() => {
    let data = ordersWithExport;

    if (statusFilter !== 'ALL') {
      data = data.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          o.export_code.toLowerCase().includes(q) ||
          (o.delivery_date ?? '').toLowerCase().includes(q)
      );
    }

    return data;
  }, [ordersWithExport, search, statusFilter]);

  const pendingCount = ordersWithExport.filter((o) => o.status === 'PENDING').length;
  const approvedCount = ordersWithExport.filter((o) => o.status === 'APPROVED').length;
  const cancelledCount = ordersWithExport.filter((o) => o.status === 'CANCELLED').length;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Truck className="size-6 text-amber-500" />
              Theo dõi đơn đặt hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi trạng thái store_orders và phiếu xuất export_notes của cửa hàng.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng đơn</span>
              <span className="text-lg font-semibold text-amber-900">{ordersWithExport.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Chờ duyệt</span>
              <span className="text-lg font-semibold text-amber-900">{pendingCount}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Đã duyệt</span>
              <span className="text-lg font-semibold text-amber-900">{approvedCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã đơn, mã phiếu xuất, ngày giao..."
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
                    {opt === 'ALL' ? 'Tất cả' : STORE_ORDER_STATUS_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <Receipt className="size-4 text-amber-500" />
                  Danh sách đơn đặt hàng
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  store_orders · join export_notes theo store_order_id
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã đơn</th>
                        <th className="px-4 py-2 font-semibold">Ngày đặt</th>
                        <th className="px-2 py-2 font-semibold text-center">Ngày giao dự kiến</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái đơn</th>
                        <th className="px-4 py-2 font-semibold text-right">Phiếu xuất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filteredOrders.map((o) => (
                        <tr key={o.order_id} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{o.order_code}</p>
                            <p className="text-[11px] text-stone-500">ID: {o.order_id}</p>
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {o.order_date.replace('T', ' ').replace('Z', '')}
                          </td>
                          <td className="px-2 py-2 text-center text-[11px] text-stone-800">{o.delivery_date ?? '—'}</td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                STORE_ORDER_STATUS_CLASS[o.status]
                              )}
                            >
                              {STORE_ORDER_STATUS_LABEL[o.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {o.export_status ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[11px] font-medium text-stone-800">{o.export_code}</span>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                    EXPORT_STATUS_CLASS[o.export_status]
                                  )}
                                >
                                  <Truck className="size-3" />
                                  {EXPORT_STATUS_LABEL[o.export_status]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400">Chưa lập phiếu xuất</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="py-10 text-center text-xs text-stone-500">Không tìm thấy đơn nào phù hợp bộ lọc.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Tình hình đơn
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">store_orders.status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-amber-500 text-white">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">Chờ duyệt</p>
                      <p className="text-[11px] text-stone-600">PENDING</p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-amber-900">{pendingCount}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500 text-white">
                      <Truck className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">Đã duyệt</p>
                      <p className="text-[11px] text-stone-600">APPROVED</p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-emerald-900">{approvedCount}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-stone-400 text-white">
                      <Receipt className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">Đã hủy</p>
                      <p className="text-[11px] text-stone-600">CANCELLED</p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-stone-900">{cancelledCount}</span>
                </div>

                <div className="border-t border-amber-100 pt-2 text-[11px] text-stone-500">
                  Dữ liệu lọc theo store_store_id = cửa hàng hiện tại. Phiếu xuất từ bảng export_notes.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-amber-200 text-xs text-amber-800 hover:bg-amber-50"
            >
              Xuất danh sách
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTrackingPage;
