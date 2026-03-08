import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Store, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { OrderDetailResponse, OrderResponse } from '@/services/franchiseServices';
import type { ConsolidationProduct, ConsolidationResponse } from '@/services/supplyServices';
import { supplyServices } from '@/services/supplyServices';

function SummaryOrdersPage() {
  // State lưu trữ danh sách đơn hàng lấy từ API
  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  // State phục vụ việc tìm kiếm (hiện tại chưa dùng trong filter nhưng để sẵn)
  const [search, setSearch] = useState('');

  // State quản lý Dialog thông báo kết quả gom đơn
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consolidationResult, setConsolidationResult] = useState<ConsolidationResponse | null>(null);
  const [editedProducts, setEditedProducts] = useState<ConsolidationProduct[]>([]);

  // State quản lý Gom đơn thủ công
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

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

  // State quản lý trạng thái đang gửi API tạo lệnh sản xuất
  const [isFinalizing, setIsFinalizing] = useState(false);

  /**
   * NGHIỆP VỤ: Gom đơn tự động (Auto Consolidate)
   * Hệ thống sẽ gọi API để tự động lấy các đơn hàng ở trạng thái APPROVED
   * và gom lại theo từng ID sản phẩm.
   */
  async function autoConsolidate() {
    try {
      const response = await supplyServices.consolidateAuto();

      if (response.success) {
        setConsolidationResult(response.data);
        // Lưu danh sách sản phẩm gom được vào state để người dùng có thể chỉnh sửa số lượng
        setEditedProducts(response.data.products);
        setIsModalOpen(true); // Hiển thị Dialog kết quả & chỉnh sửa
        getAllOrders(); // Reload danh sách để cập nhật trạng thái đơn sang CONSOLIDATED
      }
    } catch (error) {
      console.error('Gom đơn tự động thất bại:', error);
    }
  }

  /**
   * NGHIỆP VỤ: Chỉnh sửa số lượng sản phẩm sau khi gom
   * Cho phép SUPPLY_COORDINATOR thay đổi số lượng tổng hợp trước khi tạo lệnh sản xuất thực tế.
   */
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setEditedProducts((prev) => prev.map((p) => (p.productId === productId ? { ...p, quantity: newQuantity } : p)));
  };

  /**
   * NGHIỆP VỤ: Gom đơn thủ công (Manual Consolidate)
   * Mở Dialog để người dùng tự chọn các đơn hàng muốn gom.
   */
  function manuConsolidate() {
    setSelectedOrderIds([]); // Reset danh sách chọn
    setIsManualModalOpen(true);
  }

  // Hàm xử lý chọn/bỏ chọn đơn hàng trong danh sách thủ công
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  /**
   * NGHIỆP VỤ: Thực hiện gom các đơn đã chọn thủ công
   */
  const handleManualConsolidate = async () => {
    console.log('đã chạy');
    if (selectedOrderIds.length === 0) return;
    try {
      const response = await supplyServices.consolidateManual(selectedOrderIds);
      if (response.success) {
        setConsolidationResult(response.data);
        setEditedProducts(response.data.products);
        setIsManualModalOpen(false); // Đóng dialog chọn đơn
        setIsModalOpen(true); // Mở dialog kết quả & chỉnh sửa số lượng
        getAllOrders();
      }
    } catch (error) {
      console.error('Gom đơn thủ công thất bại:', error);
    }
  };

  /**
   * NGHIỆP VỤ: Tạo lệnh sản xuất
   * Kết thúc quá trình gom đơn và chuyển sang giai đoạn sản xuất thực tế.
   */
  const handleFinalize = async () => {
    // 1. Chuẩn bị dữ liệu theo yêu cầu của Backend
    // Cấu trúc yêu cầu: { items: [ { batchId: number, quantity: number } ] }
    // CHÚ Ý: batchId hiện tại được map từ productId do bên Backend thiết kế sai (theo yêu cầu của bạn)
    const requestBody = {
      items: editedProducts.map((product) => ({
        productId: product.productId, //
        quantity: product.quantity, // Lấy số lượng đã được điều chỉnh (nếu có)
      })),
    };
    console.log(requestBody.items);

    setIsFinalizing(true); // Bật trạng thái loading để tránh bấm đúp

    try {
      // 2. Gọi API tạo lệnh sản xuất
      const response = await supplyServices.createManufacturingOrder(requestBody);

      if (response.success) {
        console.log('Tạo lệnh sản xuất thành công:', response.data);
        // Ở đây bạn có thể thêm Toast thông báo thành công nếu dự án đã có thư viện phù hợp

        // 3. Đóng Modal và clear dữ liệu
        setIsModalOpen(false);
        setConsolidationResult(null);
        setEditedProducts([]);

        // Cập nhật lại danh sách đơn hàng để đồng bộ trạng thái mới
        getAllOrders();
      } else {
        console.error('Lỗi từ API:', response.message);
      }
    } catch (error) {
      console.error('Thực hiện tạo lệnh sản xuất thất bại:', error);
    } finally {
      setIsFinalizing(false); // Tắt trạng thái loading
    }
  };

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
              <Button
                className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600"
                onClick={() => autoConsolidate()}
              >
                Tổng hợp đơn giao tự động
              </Button>
              <Button
                className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600"
                onClick={manuConsolidate}
              >
                Tổng hợp đơn giao thủ công
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <Package className="size-5 text-amber-500" />
              Xác nhận & Điều chỉnh số lượng
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Hệ thống đã gom thành công <strong>{consolidationResult?.totalOrders}</strong> đơn hàng. Bạn có thể điều
                chỉnh số lượng tổng hợp bên dưới trước khi xác nhận.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Danh sách sản phẩm tổng hợp:</p>
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                {editedProducts.map((p) => (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between rounded-lg border border-stone-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-900">{p.productName}</p>
                      <p className="text-[10px] text-stone-500">Tổng hợp từ {p.orderIds.length} đơn hàng</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-24">
                        <Input
                          type="number"
                          value={p.quantity}
                          onChange={(e) => handleQuantityChange(p.productId, Number(e.target.value))}
                          className="h-9 border-amber-200 bg-amber-50/20 text-right font-bold text-amber-700 focus:border-amber-400 focus:ring-amber-200"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-stone-400 uppercase">Đơn vị</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-full border-amber-200 px-6 text-stone-600 hover:bg-stone-50"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="rounded-full bg-amber-500 px-8 text-white hover:bg-amber-600 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isFinalizing ? 'Đang tạo...' : 'Tạo lệnh sản xuất'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setIsManualModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <Filter className="size-5 text-amber-500" />
              Chọn đơn hàng để tổng hợp
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Lưu ý: Chỉ các đơn hàng ở trạng thái <strong>Đã duyệt (APPROVED)</strong> mới có thể tham gia tổng hợp
                thủ công.
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                    <th className="px-4 py-2 font-semibold w-10">Chọn</th>
                    <th className="px-4 py-2 font-semibold">Mã đơn</th>
                    <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                    <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                    <th className="px-4 py-2 font-semibold text-center">SL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {orders
                    .filter((o) => o.status === 'APPROVED')
                    .map((o) => (
                      <tr
                        key={o.orderId}
                        className={`hover:bg-amber-50/40 cursor-pointer ${selectedOrderIds.includes(o.orderId) ? 'bg-amber-50' : ''}`}
                        onClick={() => toggleOrderSelection(o.orderId)}
                      >
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(o.orderId)}
                            onChange={() => {}} // Handle via tr onClick
                            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-2 font-semibold text-stone-900">{o.orderCode}</td>
                        <td className="px-4 py-2 text-stone-800">{o.storeName}</td>
                        <td className="px-4 py-2 text-stone-800">{o.details?.[0]?.productName || 'N/A'}</td>
                        <td className="px-4 py-2 text-center text-stone-800">
                          {o.details?.reduce((acc, curr) => acc + curr.quantity, 0) || 0}
                        </td>
                      </tr>
                    ))}
                  {orders.filter((o) => o.status === 'APPROVED').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-stone-500">
                        Không có đơn hàng nào đã duyệt để tổng hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <p className="text-xs text-stone-500">
              Đã chọn: <strong>{selectedOrderIds.length}</strong> đơn hàng
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-full border-amber-200 px-6 text-stone-600 hover:bg-stone-50"
              >
                Đóng
              </Button>
              <Button
                onClick={handleManualConsolidate}
                disabled={selectedOrderIds.length === 0}
                className="rounded-full bg-amber-500 px-8 text-white hover:bg-amber-600 shadow-md disabled:opacity-50"
              >
                Tiến hành gom đơn
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SummaryOrdersPage;
