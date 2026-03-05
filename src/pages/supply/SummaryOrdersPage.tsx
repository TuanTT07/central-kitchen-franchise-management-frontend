
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockRecentOrders, mockOrderTypes } from '@/services/mockDashboardData';
import { Package, Store, Search, Filter } from 'lucide-react';

type OrderFilterType = 'ALL' | 'PO' | 'TRANSFER';

function SummaryOrdersPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrderFilterType>('ALL');

  const filteredOrders = useMemo(() => {
    let data = mockRecentOrders;

    if (typeFilter !== 'ALL') {
      data = data.filter((o) => o.orderType === typeFilter);
    }

    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.orderId.toLowerCase().includes(keyword) ||
          o.itemName.toLowerCase().includes(keyword) ||
          o.customer.toLowerCase().includes(keyword)
      );
    }

    return data;
  }, [search, typeFilter]);

  const totalOrders = mockRecentOrders.length;
  const totalPo = mockRecentOrders.filter((o) => o.orderType === 'PO').length;
  const totalTransfer = mockRecentOrders.filter((o) => o.orderType === 'TRANSFER').length;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Tổng hợp đơn Supply
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Tổng hợp các đơn mua (PO) và chuyển kho để chuẩn bị kế hoạch giao từ bếp trung tâm.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng đơn
              </span>
              <span className="text-lg font-semibold text-amber-900">{totalOrders}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Đơn mua (PO)
              </span>
              <span className="text-lg font-semibold text-amber-900">{totalPo}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Chuyển kho
              </span>
              <span className="text-lg font-semibold text-amber-900">{totalTransfer}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {/* Thanh công cụ lọc / tìm kiếm */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
                <Input
                  placeholder="Tìm theo mã đơn, sản phẩm hoặc chi nhánh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden h-9 items-center gap-1 rounded-full border-amber-200 text-xs text-amber-800 hover:bg-amber-50 sm:inline-flex"
              >
                <Filter className="size-3.5" />
                Bộ lọc nâng cao
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 ${
                    typeFilter === 'ALL'
                      ? 'bg-amber-500 text-white'
                      : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('PO')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${
                    typeFilter === 'PO'
                      ? 'bg-amber-500 text-white'
                      : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  PO
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('TRANSFER')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${
                    typeFilter === 'TRANSFER'
                      ? 'bg-amber-500 text-white'
                      : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Transfer
                </button>
              </div>
              <Button className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600">
                Tổng hợp đơn giao
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Bảng đơn chi tiết */}
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">
                  Danh sách đơn (giả lập)
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Mapping sau sang bảng store_orders / export_notes trong DB
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã đơn</th>
                        <th className="px-4 py-2 font-semibold">Loại</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                        <th className="px-2 py-2 font-semibold text-center">SL</th>
                        <th className="px-4 py-2 font-semibold text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filteredOrders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 font-semibold text-stone-900">{o.orderId}</td>
                          <td className="px-4 py-2 text-stone-700">
                            {o.orderType === 'PO' ? 'Đơn mua (PO)' : 'Chuyển kho'}
                          </td>
                          <td className="px-4 py-2 text-stone-800">{o.customer}</td>
                          <td className="px-4 py-2 text-stone-800">{o.itemName}</td>
                          <td className="px-2 py-2 text-center text-stone-800">{o.quantity}</td>
                          <td className="px-4 py-2 text-right text-stone-900">
                            {(o.amount / 1000).toFixed(0)}K
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="py-10 text-center text-xs text-stone-500">
                    Không có đơn nào phù hợp với bộ lọc hiện tại.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thống kê theo loại đơn / chi nhánh */}
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">
                  Thống kê nhanh
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Tỷ lệ PO / Transfer và một số chi nhánh chính
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="space-y-2">
                  {mockOrderTypes.map((ot) => (
                    <div key={ot.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-stone-700">
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                          {ot.percent}%
                        </span>
                        <span>{ot.name}</span>
                      </div>
                      <span className="text-[11px] text-stone-500">{ot.count} đơn</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-amber-100" />
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-amber-900">
                    Chi nhánh có nhiều đơn nhất (giả lập)
                  </p>
                  {Array.from(
                    new Map(mockRecentOrders.map((o) => [o.customer, o])).values()
                  ).map((o) => (
                    <div
                      key={o.customer}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                          <Store className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-900">{o.customer}</p>
                          <p className="text-[10px] text-stone-500">{o.itemName}</p>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-stone-600">
                        <span>
                          {
                            mockRecentOrders.filter((x) => x.customer === o.customer).length
                          }{' '}
                          đơn
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SummaryOrdersPage;