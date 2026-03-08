import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarClock, ChefHat, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenServices, type ManufacturingOrderResponse } from '@/services/kitchenServices';

type ManuOrderStatus = 'PLANNED' | 'COOKING' | 'COMPLETED' | 'CANCELLED';

const FILTER_OPTIONS: (ManuOrderStatus | 'ALL')[] = ['ALL', 'PLANNED', 'COOKING', 'COMPLETED', 'CANCELLED'];

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

function ManufacturingOrders() {
  // state của manufacturing order
  const [manufacturingOrder, setManufacturingOrder] = useState<ManufacturingOrderResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ManuOrderStatus | 'ALL'>('ALL');

  const getAllManufacturing = async () => {
    try {
      const response = await kitchenServices.getAllOrders();
      if (response.success) {
        setManufacturingOrder(response.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    getAllManufacturing();
  }, []);

  const filteredOrders = useMemo(() => {
    // let data = ;
    // if (statusFilter !== 'ALL') {
    //   data = data.filter((o) => o.status === statusFilter);
    // }
    // if (search.trim()) {
    //   const q = search.toLowerCase();
    //   data = data.filter((o) => o.order_code.toLowerCase().includes(q) || o.product_name.toLowerCase().includes(q));
    // }
    // return data;
  }, [search, statusFilter]);

  // const activeOrders = useMemo(
  //   () => MOCK_MANUFACTURING_ORDERS.filter((o) => o.status === 'PLANNED' || o.status === 'COOKING'),
  //   []
  // );

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <ChefHat className="size-6 text-amber-500" />
              Lệnh sản xuất
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi trạng thái bảng `manufacturing_orders` theo từng sản phẩm.
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng lệnh</span>
              <span className="text-lg font-semibold text-amber-900">{manufacturingOrder.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Đang nấu</span>
              <span className="text-lg font-semibold text-amber-900">{}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Chờ sản xuất</span>
              <span className="text-lg font-semibold text-amber-900">{}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã lệnh, tên món..."
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
                    {/* {opt === 'ALL' ? 'Tất cả' : MANU_ORDER_STATUS_LABEL[opt]} */}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Danh sách lệnh sản xuất
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  manufacturing_orders · filter theo trạng thái, tìm kiếm theo mã và sản phẩm.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã lệnh</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                        <th className="px-2 py-2 font-semibold text-center">Số lượng kế hoạch</th>
                        <th className="px-4 py-2 font-semibold text-center">Thời gian</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                        <th className="px-4 py-2 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {manufacturingOrder.map((o) => (
                        <tr key={o.manuOrderId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{o.orderCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {o.manuOrderId}</p>
                          </td>
                          <td className="px-4 py-2">
                            <p className="text-sm font-medium text-stone-900">{o.productName}</p>
                            {/* <p className="text-[11px] text-stone-500">product_id: {o.}</p> */}
                          </td>
                          <td className="px-2 py-2 text-center text-sm font-semibold text-stone-900">
                            {o.quantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {o.startDate ?? 'false'} : (
                            <div className="flex flex-col gap-0.5">
                              <span>Bắt đầu: {formatDateTime(o.startDate)}</span>
                              {/* <span>Kết thúc: {formatDateTime()}</span> */}
                            </div>
                            ) : (<span className="text-stone-500">Chưa lên lịch</span>)
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold'
                                // MANU_ORDER_STATUS_CLASS[o.status]
                              )}
                            >
                              {/* {MANU_ORDER_STATUS_LABEL[o.status]} */}
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
                      {/* {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-xs text-stone-500">
                            Không có lệnh sản xuất nào khớp với bộ lọc.
                          </td>
                        </tr>
                      )} */}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/60 shadow-sm">
              <CardHeader className="border-b border-amber-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Tình hình sản xuất
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Tóm tắt trạng thái lệnh sản xuất hiện tại.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Đang nấu</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">{}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Chờ sản xuất</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">{}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Đã hoàn thành</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">{}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Đã hủy</p>
                    <p className="mt-1 text-xl font-semibold text-stone-700">{}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px]">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <p className="font-semibold text-amber-900">Lệnh đang hoạt động</p>
                  </div>
                  {/* {activeOrders.length > 0 ? (
                    <ul className="space-y-1.5">
                      {activeOrders.map((o) => (
                        <li key={o.manu_order_id} className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold text-stone-900">
                              {o.order_code} · {o.product_name}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              SL kế hoạch: {o.quantity_planned.toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              MANU_ORDER_STATUS_CLASS[o.status]
                            )}
                          >
                            {MANU_ORDER_STATUS_LABEL[o.status]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500">
                      Hiện tại không có lệnh nào ở trạng thái PLANNED/COOKING.
                    </p>
                  )} */}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ManufacturingOrders;
