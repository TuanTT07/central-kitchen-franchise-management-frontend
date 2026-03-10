/**
 * File: OrderTrackingPage.tsx
 * Description: Trang theo dõi trạng thái đơn hàng và phiếu xuất kho của chi nhánh
 * Author: Tuan Tran, Dat Tran
 */

// ================= IMPORTS =================

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarClock, Receipt, Search, Truck, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { franchiseServices, type OrderResponse, type OrderDetailResponse, type ExportNotesResponse } from '@/services/franchiseServices';

/**
 * Component Description
 * - Hiển thị danh sách đơn hàng đã đặt
 * - Theo dõi trạng thái duyệt đơn và trạng thái xuất kho
 * - Hiển thị thông tin lô hàng (phiếu xuất) tương ứng
 */

const STORE_ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CONSOLIDATED: 'Đã gộp đơn',
  CANCELLED: 'Đã hủy',
};

const STORE_ORDER_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CONSOLIDATED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
};

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'CONSOLIDATED', 'CANCELLED'] as const;
type FilterStatus = (typeof FILTER_OPTIONS)[number];

const OrderTrackingPage = () => {

  // ================= STATE =================

  // Danh sách đơn hàng từ API
  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  
  // Dữ liệu phiếu xuất kho (có thể chứa thông tin lô hàng)
  const [exportData, setExportData] = useState<ExportNotesResponse | null>(null);

  // Trạng thái loading
  const [loading, setLoading] = useState(true);

  // Ô tìm kiếm
  const [search, setSearch] = useState('');

  // Bộ lọc trạng thái
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // ================= EFFECT =================

  useEffect(() => {
    fetchData();
  }, []);

  // ================= API =================

  /**
   * Lấy dữ liệu đơn hàng và phiếu xuất kho đồng thời
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, exportRes] = await Promise.all([
        franchiseServices.getOrders(),
        franchiseServices.getExportNote()
      ]);

      if (orderRes.success && orderRes.data) {
        setOrders(orderRes.data.items);
      }
      
      if (exportRes.success && exportRes.data) {
        setExportData(exportRes.data);
      }
    } catch (error) {
      console.error('Fetch data failed', error);
      alert('Không thể tải dữ liệu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLER =================

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
  };

  // ================= UTILS =================

  // Logic join dữ liệu đơn hàng với thông tin từ phiếu xuất (nếu có theo quy tắc nghiệp vụ)
  // Lưu ý: Hiện tại API trả về 2 danh sách tách biệt, tôi sẽ giả định kết nối qua logic nào đó 
  // hoặc chỉ hiển thị đơn hàng và thông tin liên quan nếu API hỗ trợ.
  // Ở đây chúng ta sẽ hiển thị danh sách đơn hàng làm chính.
  const filteredOrders = useMemo(() => {
    let data = [...orders];

    if (statusFilter !== 'ALL') {
      data = data.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          (o.deliveryDate || '').toLowerCase().includes(q)
      );
    }

    return data;
  }, [orders, search, statusFilter]);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const approvedCount = orders.filter((o) => o.status === 'APPROVED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;

  // ================= RENDER =================

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-amber-500" />
        <span className="text-amber-700 font-medium">Đang tải dữ liệu đơn hàng...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        {/* Header Section */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Truck className="size-6 text-amber-500" />
              Theo dõi đơn đặt hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi trạng thái đơn hàng và thông tin lô hàng của cửa hàng.
            </CardDescription>
          </div>
          
          {/* Stats Bar */}
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng đơn</span>
              <span className="text-lg font-semibold text-amber-900">{orders.length}</span>
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
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã đơn, ngày giao..."
                value={search}
                onChange={handleSearch}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs shadow-sm">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleFilterChange(opt)}
                    className={cn(
                      'px-3 py-1.5 transition-all duration-200',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt ? 'bg-amber-500 text-white font-semibold' : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : STORE_ORDER_STATUS_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Orders Table */}
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2 overflow-hidden">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3 py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <Receipt className="size-4 text-amber-500" />
                  Danh sách đơn đặt hàng thực tế
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900 uppercase">
                        <th className="px-4 py-3 font-bold">Mã đơn</th>
                        <th className="px-4 py-3 font-bold">Ngày đặt</th>
                        <th className="px-4 py-3 font-bold text-center">Ngày giao</th>
                        <th className="px-4 py-3 font-bold text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50/50">
                      {filteredOrders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-stone-900">{o.orderCode}</p>
                            <p className="text-[10px] text-stone-500">ID: {o.orderId}</p>
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {new Date(o.orderDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-center text-stone-800 font-medium">
                            {o.deliveryDate}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm',
                                STORE_ORDER_STATUS_CLASS[o.status] || 'bg-stone-100 text-stone-800'
                              )}
                            >
                              {STORE_ORDER_STATUS_LABEL[o.status] || o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                    <div className="bg-amber-50 p-3 rounded-full">
                      <Search className="size-6 text-amber-200" />
                    </div>
                    <p className="text-sm font-medium text-stone-400">Không tìm thấy đơn đặt hàng nào.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Sidebar */}
            <div className="space-y-5">
              <Card className="border-amber-100 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3 py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <CalendarClock className="size-4 text-amber-500" />
                    Thống kê nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 px-4 pb-4">
                  <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 p-3 hover:bg-amber-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-900">Đơn chờ duyệt</p>
                        <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Pending</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-amber-900">{pendingCount}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 hover:bg-emerald-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                        <Truck className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-900">Đơn đã duyệt</p>
                        <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Approved</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-emerald-900">{approvedCount}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/50 p-3 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-stone-400 text-white shadow-sm">
                        <Receipt className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-900">Đơn đã hủy</p>
                        <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Cancelled</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-stone-900">{cancelledCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info / Export Note Section */}
              <Card className="border-blue-100 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-blue-50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 pb-3 py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-blue-900">
                    <Truck className="size-4 text-blue-500" />
                    Thông tin lô hàng (Mới nhất)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {exportData && exportData.items.length > 0 ? (
                    <div className="space-y-4">
                      {exportData.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1 border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                             <span className="text-[11px] font-bold text-stone-800">{item.productName}</span>
                             <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">{item.batchCode}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                            <span>S.Lượng: {item.quantity} {item.unitName}</span>
                            <span>HSD: {item.expiryDate}</span>
                          </div>
                        </div>
                      ))}
                      {exportData.items.length > 3 && (
                        <p className="text-[10px] text-center text-blue-600 font-semibold cursor-pointer hover:underline">
                          Xem thêm {exportData.items.length - 3} lô hàng khác...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                       <p className="text-[11px] text-stone-400 italic">Chưa có thông tin lô hàng được xuất.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchData()}
              className="h-9 border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-50 shadow-sm"
            >
              Làm mới dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTrackingPage;

