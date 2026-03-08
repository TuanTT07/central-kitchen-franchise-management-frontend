import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Store, Search, Filter } from 'lucide-react';
import type { OrderDetailResponse, OrderResponse } from '@/services/franchiseServices';
import { supplyServices } from '@/services/supplyServices';

function SummaryOrdersPage() {
  // State lưu trữ danh sách đơn hàng lấy từ API
  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  // State phục vụ việc tìm kiếm (hiện tại chưa dùng trong filter nhưng để sẵn)
  const [search, setSearch] = useState('');

  // Hàm gọi API lấy danh sách đơn hàng
  const getAllOrders = async () => {
    try {
      const response = await supplyServices.getAllOrders();
      // Kiểm tra nếu API trả về thành công và có dữ liệu trong items (do cấu trúc phân trang)
      if (response.success && response.data.items) {
        setOrders(response.data.items); // Cập nhật state orders
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  // Chạy duy nhất 1 lần khi component được render lần đầu tiên
  useEffect(() => {
    getAllOrders();
  }, []);

  /**
   * Component con hiển thị Badge trạng thái với màu sắc tương ứng
   * @param status Chuỗi trạng thái từ API (ví dụ: PENDING, APPROVED)
   */
  function OrderStatusBadge({ status }: { status: string | undefined }) {
    if (!status)
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          Chưa có trạng thái
        </span>
      );

    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Chờ xử lý
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Đã duyệt
          </span>
        );
      case 'CONSOLIDATED':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Đã tổng hợp
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  }

  // Tự động tính toán lại các con số thống kê mỗi khi danh sách 'orders' thay đổi
  const stats = useMemo(() => {
    const total = orders.length; // Tổng số đơn hàng
    // Đếm số đơn hàng có trạng thái là PENDING
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    // Tính tổng số lượng tất cả sản phẩm trong tất cả các đơn hàng
    const totalProducts = orders.reduce((acc, current) => {
      // Mỗi đơn hàng có 1 mảng details, chúng ta cộng dồn quantity trong đó
      return acc + current.details.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
    return { total, pending, totalProducts };
  }, [orders]);

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        {/* Header: Hiển thị tiêu đề và các con số thống kê nhanh */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Tổng hợp đơn Supply
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Danh sách các đơn hàng từ chi nhánh gửi về bếp trung tâm.
            </CardDescription>
          </div>
          {/* Khu vực hiển thị con số thống kê (Stats) */}
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng đơn</span>
              <span className="text-lg font-semibold text-amber-900">{stats.total}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Chờ xử lý</span>
              <span className="text-lg font-semibold text-amber-900">{stats.pending}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng SP</span>
              <span className="text-lg font-semibold text-amber-900">{stats.totalProducts}</span>
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
                {/* <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 ${
                    typeFilter === 'ALL' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('PO')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${
                    typeFilter === 'PO' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  PO
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('TRANSFER')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${
                    typeFilter === 'TRANSFER' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Transfer
                </button> */}
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
                <CardTitle className="text-sm font-bold text-amber-900">Danh sách đơn hàng</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Dữ liệu thực tế từ hệ thống quản lý đơn hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã đơn</th>
                        <th className="px-4 py-2 font-semibold">Trạng thái</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                        <th className="px-2 py-2 font-semibold text-center">SL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {orders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 font-semibold text-stone-900">{o.orderCode}</td>
                          <td className="px-4 py-2 text-stone-700">
                            <OrderStatusBadge status={o.status} />
                          </td>
                          <td className="px-4 py-2 text-stone-800">{o.storeName}</td>
                          <td className="px-4 py-2 text-stone-800">
                            {o.details?.[0]?.productName || 'N/A'}
                            {o.details?.length > 1 ? ` (+${o.details.length - 1})` : ''}
                          </td>
                          <td className="px-2 py-2 text-center text-stone-800">
                            {o.details?.reduce((acc, curr) => acc + curr.quantity, 0) || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* {filteredOrders.length === 0 && (
                  <div className="py-10 text-center text-xs text-stone-500">
                    Không có đơn nào phù hợp với bộ lọc hiện tại.
                  </div>
                )} */}
              </CardContent>
            </Card>

            {/* Thống kê theo loại đơn / chi nhánh */}
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Thống kê nhanh</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Phân bổ đơn hàng theo chi nhánh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="space-y-2">
                  {/* Dùng dữ liệu thực tế cho thống kê */}
                  {Array.from(new Set(orders.map((o) => o.storeName)))
                    .slice(0, 5)
                    .map((storeName) => {
                      const count = orders.filter((o) => o.storeName === storeName).length;
                      const percent = Math.round((count / orders.length) * 100) || 0;
                      return (
                        <div key={storeName} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-stone-700">
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                              {percent}%
                            </span>
                            <span>{storeName}</span>
                          </div>
                          <span className="text-[11px] text-stone-500">{count} đơn</span>
                        </div>
                      );
                    })}
                </div>
                <div className="h-px bg-amber-100" />
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-amber-900">Chi nhánh tích cực nhất</p>
                  {Array.from(new Map(orders.map((o) => [o.storeName, o])).values())
                    .slice(0, 3)
                    .map((o) => (
                      <div
                        key={o.storeName}
                        className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                            <Store className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-stone-900">{o.storeName}</p>
                            <p className="text-[10px] text-stone-500">{o.details?.[0]?.productName || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-stone-600">
                          <span>{orders.filter((x) => x.storeName === o.storeName).length} đơn</span>
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
