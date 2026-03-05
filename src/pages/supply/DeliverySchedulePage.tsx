import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Truck, MapPin } from 'lucide-react';
import { mockRecentOrders } from '@/services/mockDashboardData';

const DeliverySchedulePage = () => {
  const transferOrders = mockRecentOrders.filter((o) => o.orderType === 'TRANSFER');
  const totalTrips = transferOrders.length;
  const branchCount = new Set(transferOrders.map((o) => o.customer)).size;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
                <Truck className="size-6 text-amber-500" />
                Lịch giao hàng
              </CardTitle>
              <CardDescription className="text-xs font-medium text-amber-700/80">
                Xem và điều phối các chuyến giao từ bếp trung tâm tới chi nhánh.
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="hidden flex-col text-right text-xs text-amber-800/90 md:flex">
                <span className="font-semibold uppercase tracking-wide">Tổng chuyến</span>
                <span className="text-sm font-bold text-amber-900">{totalTrips}</span>
              </div>
              <div className="hidden h-8 w-px bg-amber-200/70 md:block" />
              <div className="hidden flex-col text-right text-xs text-amber-800/90 md:flex">
                <span className="font-semibold uppercase tracking-wide">Chi nhánh</span>
                <span className="text-sm font-bold text-amber-900">{branchCount}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-stone-500">
                Lọc theo ngày và ca để xem các chuyến giao tương ứng.
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  defaultValue="today"
                  className="h-8 w-32 rounded-md border border-amber-200 bg-white px-2 text-xs text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="today">Hôm nay</option>
                  <option value="tomorrow">Ngày mai</option>
                  <option value="week">7 ngày tới</option>
                </select>
                <select
                  defaultValue="all"
                  className="h-8 w-32 rounded-md border border-amber-200 bg-white px-2 text-xs text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="all">Tất cả ca</option>
                  <option value="morning">Sáng</option>
                  <option value="afternoon">Chiều</option>
                  <option value="evening">Tối</option>
                </select>
                <Button className="h-8 rounded-full bg-amber-500 px-3 text-xs text-white hover:bg-amber-600">
                  <CalendarClock className="mr-1.5 size-3.5" />
                  Lên lịch mới
                </Button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                  <CardTitle className="text-sm font-bold text-amber-900">
                    Danh sách chuyến giao (giả lập)
                  </CardTitle>
                  <CardDescription className="text-[11px] text-amber-700/80">
                    Tạm thời hiển thị từ đơn Transfer trong mockRecentOrders
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                          <th className="px-4 py-2 font-semibold">Mã chuyến</th>
                          <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                          <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                          <th className="px-2 py-2 font-semibold text-center">SL</th>
                          <th className="px-4 py-2 font-semibold text-right">Khung giờ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {transferOrders.map((o, index) => (
                          <tr key={o.orderId} className="hover:bg-amber-50/40">
                            <td className="px-4 py-2 font-semibold text-stone-900">
                              TRIP-{index + 1}
                            </td>
                            <td className="px-4 py-2 text-stone-800">{o.customer}</td>
                            <td className="px-4 py-2 text-stone-800">{o.itemName}</td>
                            <td className="px-2 py-2 text-center text-stone-800">{o.quantity}</td>
                            <td className="px-4 py-2 text-right text-stone-700">Ca sáng (giả lập)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-100 bg-white shadow-sm">
                <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                  <CardTitle className="text-sm font-bold text-amber-900">
                    Tình hình theo chi nhánh
                  </CardTitle>
                  <CardDescription className="text-[11px] text-amber-700/80">
                    Nhóm các chuyến giao theo điểm đến
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs">
                  {Array.from(
                    new Map(transferOrders.map((o) => [o.customer, o])).values()
                  ).map((o) => (
                    <div
                      key={o.customer}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                          <MapPin className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-900">{o.customer}</p>
                          <p className="text-[10px] text-stone-500">{o.itemName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-stone-900">
                          {
                            transferOrders.filter((x) => x.customer === o.customer).length
                          }{' '}
                          chuyến
                        </p>
                        <p className="mt-0.5 text-[10px] text-stone-500">
                          Ca sáng / chiều (giả lập)
                        </p>
                      </div>
                    </div>
                  ))}
                  {transferOrders.length === 0 && (
                    <p className="text-xs text-stone-500">Chưa có chuyến giao nào.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default DeliverySchedulePage;
