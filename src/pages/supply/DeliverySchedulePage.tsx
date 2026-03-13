/**
 * File: DeliverySchedulePage.tsx
 * Description: Quản lý và hiển thị lịch trình giao hàng từ bếp trung tâm
 * Author: Tuan Tran, Dat Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Trash2, Edit, Calendar, User, Search } from 'lucide-react';
import { supplyServices, type DeliveryPlanResponse } from '@/services/supplyServices';
import { useEffect, useState } from 'react';

/**
 * DeliverySchedulePage Component
 * - Hiển thị danh sách các chuyến giao hàng
 * - Cho phép theo dõi trạng thái và thông tin tài xế
 * - Hỗ trợ thao tác cập nhật và hủy đơn
 */
const DeliverySchedulePage = () => {

  // ================= STATE =================

  // Danh sách lịch giao hàng từ API
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlanResponse[]>([]);
  
  // Trạng thái loading khi gọi API
  const [loading, setLoading] = useState<boolean>(false);

  // Giá trị tìm kiếm (nếu cần mở rộng sau này)
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ================= EFFECT =================

  // Tự động fetch data khi component mount
  useEffect(() => {
    fetchDeliveryPlans();
  }, []);

  // ================= API =================

  // Gọi API lấy danh sách lịch giao hàng
  const fetchDeliveryPlans = async () => {
    try {
      setLoading(true);
      const response = await supplyServices.getDeliveryPlan();
      // Truy cập vào đúng cấu trúc JSON: response.data.items
      if (response && response.data && Array.isArray(response.data.items)) {
        setDeliveryPlans(response.data.items);
      } else {
        console.warn('API returned unexpected data structure:', response);
        setDeliveryPlans([]);
      }
    } catch (error) {
      console.error('Error fetching delivery plans:', error);
      setDeliveryPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLER =================

  // Xử lý khi nhấn nút Hủy chuyến
  const handleCancel = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn hủy lịch trình giao hàng này không?")) {
      console.log("Yêu cầu hủy chuyến:", id);
      // Logic gọi API hủy sẽ thực hiện tại đây
    }
  };

  // Xử lý khi nhấn nút Cập nhật
  const handleUpdate = (plan: DeliveryPlanResponse) => {
    console.log("Mở modal cập nhật cho chuyến:", plan.deliveryCode);
    // Logic mở Modal/Form cập nhật sẽ thực hiện tại đây
  };

  // Xử lý thay đổi ô tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // ================= UTILS =================

  // Render nhãn trạng thái với màu sắc tương ứng (Premium Design Style)
  const renderStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PLANNED: "bg-blue-50 text-blue-600 border-blue-100",
      IN_TRANSIT: "bg-amber-50 text-amber-600 border-amber-100",
      COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
      CANCELLED: "bg-rose-50 text-rose-600 border-rose-100",
    };

    const statusLabels: Record<string, string> = {
      PLANNED: "Chờ giao",
      IN_TRANSIT: "Đang giao",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Đã hủy",
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyles[status] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  // Lọc danh sách theo từ khóa tìm kiếm (Đảm bảo deliveryPlans là mảng)
  const filteredPlans = Array.isArray(deliveryPlans) 
    ? deliveryPlans.filter(plan => 
        (plan?.deliveryCode?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (plan?.driverName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      )
    : [];

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ================= RENDER =================

  return (
    <div className="h-full w-full space-y-6">
      {/* Header Card với thống kê nhanh */}
      <Card className="border-amber-200/60 bg-white shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Truck className="size-6 text-amber-500" />
              Lịch giao hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi và điều phối các chuyến hàng từ kho trung tâm tới chi nhánh.
            </CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden flex-col text-right md:flex border-r border-amber-200 pr-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">Tổng chuyến giao</span>
              <span className="text-xl font-black text-amber-900">{deliveryPlans.length}</span>
            </div>
            <Button className="h-10 rounded-xl bg-amber-500 px-5 text-xs font-bold text-white hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-amber-200">
              Tạo lịch mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Thanh công cụ: Tìm kiếm và lọc */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã chuyến, tài xế..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-10 w-full rounded-xl border border-amber-100 bg-amber-50/30 pl-10 pr-4 text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Thời gian:</span>
                <select className="h-9 w-32 rounded-lg border border-amber-100 bg-white px-3 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50">
                  <option value="today">Hôm nay</option>
                  <option value="tomorrow">Ngày mai</option>
                  <option value="week">7 ngày tới</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Trạng thái:</span>
                <select className="h-9 w-32 rounded-lg border border-amber-100 bg-white px-3 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50">
                  <option value="all">Tất cả</option>
                  <option value="PLANNED">Chờ giao</option>
                  <option value="IN_TRANSIT">Đang giao</option>
                  <option value="COMPLETED">Hoàn tất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bảng dữ liệu chính */}
          <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm shadow-amber-50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-amber-50 bg-amber-50/30 text-[10px] font-black uppercase tracking-widest text-amber-900/60">
                  <th className="px-6 py-4">Mã chuyến</th>
                  <th className="px-6 py-4">Chi nhánh nhận</th>
                  <th className="px-6 py-4">Tài xế phụ trách</th>
                  <th className="px-6 py-4">Ngày dự kiến</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <tr key={plan.deliveryId} className="group hover:bg-amber-50/20 transition-all">
                      <td className="px-6 py-4">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[11px] border border-amber-100">
                          {plan.deliveryCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {plan.exportNotes.map((note, idx) => (
                            <div key={idx} className="flex items-center gap-2 font-semibold text-stone-800">
                              <MapPin className="size-3 text-amber-500" />
                              <span className="truncate max-w-[150px]">{note.storeName}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 ring-2 ring-white">
                            <User className="size-4" />
                          </div>
                          <span className="text-xs font-bold text-stone-700">{plan.driverName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-600 font-medium whitespace-nowrap">
                          <Calendar className="size-3.5 text-stone-400" />
                          {formatDate(plan.scheduledDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(plan.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdate(plan)}
                            className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-colors"
                            title="Cập nhật"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCancel(plan.deliveryId)}
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hủy chuyến"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Truck className="size-8 text-stone-300" />
                        <span className="text-xs font-medium text-stone-400 italic">
                          {loading ? "Đang tải dữ liệu..." : "Không tìm thấy chuyến giao hàng nào."}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Gợi ý / Ghi chú phía dưới */}
      <div className="flex items-start gap-2 px-6 py-3 bg-amber-50/50 rounded-xl border border-dashed border-amber-200">
        <div className="mt-0.5 rounded-full bg-amber-200 p-1">
          <Truck className="size-3 text-amber-700" />
        </div>
        <p className="text-[10px] font-medium text-amber-800/80 leading-relaxed">
          <span className="font-bold">Lưu ý:</span> Lịch giao hàng được đồng bộ tự động từ hệ thống điều phối vận tải. Các thay đổi về tài xế hoặc lộ trình cần được cập nhật trước khi chuyến hàng bắt đầu trạng thái "Đang giao".
        </p>
      </div>
    </div>
  );
};

export default DeliverySchedulePage;
