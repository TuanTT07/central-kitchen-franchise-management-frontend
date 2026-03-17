/**
 * File: DeliverySchedulePage.tsx
 * Description: Quản lý và hiển thị lịch trình giao hàng từ bếp trung tâm
 * Author: Tuan Tran, Dat Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Trash2, Edit, Calendar, User, Search, Check, ChevronRight, ChevronLeft, Plus, Loader2 } from 'lucide-react';
import { supplyServices, type DeliveryPlanResponse, type ExportNotesResponse } from '@/services/supplyServices';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { translateStatus } from '@/utils/labelMapping';

import { toast } from 'sonner';

// ================= TYPES =================

interface DeliveryFormInput {
  driverName: string;
  vehiclePlate: string;
  scheduledDate: string;
}

/**
 * DeliverySchedulePage Component
 * - Hiển thị danh sách các chuyến giao hàng
 * - Cho phép theo dõi trạng thái và thông tin tài xế
 * - Hỗ trợ thao tác cập nhật và hủy đơn
 * - Chức năng Tạo lịch mới qua quy trình 2 bước
 */
const DeliverySchedulePage = () => {

  // ================= STATE =================

  // Danh sách lịch giao hàng từ API
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlanResponse[]>([]);
  
  // Trạng thái loading khi gọi API danh sách
  const [loading, setLoading] = useState<boolean>(false);

  // Giá trị tìm kiếm trên trang chính
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ---------------- Modal State ----------------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [readyNotes, setReadyNotes] = useState<ExportNotesResponse[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ---------------- Status Modal State ----------------
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedPlanForStatus, setSelectedPlanForStatus] = useState<DeliveryPlanResponse | null>(null);

  // ---------------- Detail Modal State (UI only) ----------------
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<DeliveryPlanResponse | null>(null);

  // ================= FORM =================

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeliveryFormInput>();

  // ================= EFFECT =================

  // Tự động fetch data khi component mount
  useEffect(() => {
    fetchDeliveryPlans();
  }, []);

  // Fetch phiếu xuất kho khi mở modal
  useEffect(() => {
    if (isModalOpen && step === 1) {
      fetchReadyNotes();
    }
  }, [isModalOpen, step]);

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
        toast.error('Không thể lấy danh sách lịch giao hàng');
        setDeliveryPlans([]);
      }
    } catch (error) {
      toast.error('Không thể lấy danh sách lịch giao hàng');
      setDeliveryPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API lấy danh sách phiếu xuất kho sẵn sàng
  const fetchReadyNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const response = await supplyServices.getExportNoteReadyForDelivery();
      // Theo JSON mới: response.data là một mảng trực tiếp
      if (response && Array.isArray(response.data)) {
        setReadyNotes(response.data);
      } else {
        toast.error('Không thể lấy danh sách phiếu xuất kho');
        setReadyNotes([]);
      }
    } catch (error) {
      toast.error('Không thể lấy danh sách phiếu xuất kho');
      setReadyNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Gọi API tạo lịch giao hàng
  const onCreateDelivery = async (data: DeliveryFormInput) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        exportNoteIds: selectedNoteIds
      };
      await supplyServices.createDeliveryPlan(payload);
      // Thành công
      setIsModalOpen(false);
      resetModal();
      fetchDeliveryPlans();
      toast.success('Tạo lịch giao hàng thành công');
    } catch (error) {
      toast.error('Không thể tạo lịch giao hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= HANDLER =================

  // Reset trạng thái modal
  const resetModal = () => {
    setStep(1);
    setSelectedNoteIds([]);
    reset();
  };

  // Toggle chọn phiếu xuất kho
  const toggleSelectNote = (id: number) => {
    setSelectedNoteIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Xóa lịch giao hàng (UI only)
  const handleDeleteUI = (plan: DeliveryPlanResponse) => {
    console.log('Xóa lịch giao hàng (UI):', plan.deliveryId);
  };

  const handleOpenDetail = (plan: DeliveryPlanResponse) => {
    setSelectedPlanForDetail(plan);
    setIsDetailModalOpen(true);
  };

  // Xử lý khi nhấn nút Cập nhật
  const handleUpdate = (plan: DeliveryPlanResponse) => {
    if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
      toast.error("Chuyến hàng đã hoàn tất hoặc đã hủy, không thể cập nhật thêm.");
      return;
    }
    setSelectedPlanForStatus(plan);
    setIsStatusModalOpen(true);
  };

  // Xác nhận cập nhật trạng thái
  const handleUpdateStatusConfirm = async () => {
    if (!selectedPlanForStatus) return;

    try {
      setIsSubmitting(true);
      let response;
      if (selectedPlanForStatus.status === 'PLANNED') {
        response = await supplyServices.updateDeliveryStatusStart(selectedPlanForStatus.deliveryId);
      } else if (selectedPlanForStatus.status === 'IN_TRANSIT') {
        response = await supplyServices.updateDeliveryStatusComplete(selectedPlanForStatus.deliveryId);
      }
      
      setIsStatusModalOpen(false);
      setSelectedPlanForStatus(null);
      fetchDeliveryPlans();
      toast.success(`${response?.message}`);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý thay đổi ô tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // ================= UTILS =================

  // Render nhãn trạng thái với màu sắc tương ứng
  const renderStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PLANNED: "bg-blue-50 text-blue-600 border-blue-100",
      IN_TRANSIT: "bg-amber-50 text-amber-600 border-amber-100",
      COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
      CANCELLED: "bg-rose-50 text-rose-600 border-rose-100",
    };

    const statusLabels: Record<string, string> = {
      PLANNED: translateStatus('PLANNED') || 'Chờ giao',
      IN_TRANSIT: translateStatus('IN_TRANSIT') || 'Đang giao',
      COMPLETED: translateStatus('COMPLETED') || 'Hoàn tất',
      CANCELLED: translateStatus('CANCELLED') || 'Đã hủy',
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
      {/* Header Card */}
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
            <Button 
                onClick={() => setIsModalOpen(true)}
                className="h-10 rounded-xl bg-amber-500 px-5 text-xs font-bold text-white hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-amber-200"
            >
              <Plus className="size-4 mr-2" />
              Tạo lịch mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Toolbar */}
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
          </div>

          {/* Main Table */}
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
                    <tr
                      key={plan.deliveryId}
                      className="group cursor-pointer hover:bg-amber-50/20 transition-all"
                      onClick={() => handleOpenDetail(plan)}
                      title="Xem chi tiết lịch giao hàng"
                    >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUI(plan);
                            }}
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                            title="Xóa"
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

      {/* MODAL TẠO LỊCH MỚI */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { 
          setIsModalOpen(open);
          if(!open) resetModal();
      }}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 rounded-2xl border-none shadow-2xl">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="size-6" />
                Lên lịch giao hàng mới
            </h2>
            <p className="text-amber-50 text-xs mt-1 font-medium opacity-90">
                {step === 1 ? "Bước 1: Chọn phiếu xuất kho cần giao" : "Bước 2: Nhập thông tin chi tiết chuyến giao"}
            </p>
            
            {/* Step Indicator */}
            <div className="mt-6 flex items-center gap-3">
                <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'} transition-all`} />
                <div className={`h-2 flex-1 rounded-full ${step === 2 ? 'bg-white' : 'bg-white/30'} transition-all`} />
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto bg-white/50 backdrop-blur-sm">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-stone-800 uppercase tracking-wide">
                        Danh sách phiếu xuất sẵn sàng ({readyNotes.length})
                    </Label>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        Đã chọn: {selectedNoteIds.length}
                    </span>
                </div>
                
                {isLoadingNotes ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
                        <Loader2 className="size-8 animate-spin text-amber-500" />
                        <span className="text-xs font-medium italic">Đang tải danh sách...</span>
                    </div>
                ) : readyNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {readyNotes.map((note) => (
                            <div 
                                key={note.exportId}
                                onClick={() => toggleSelectNote(note.exportId)}
                                className={`group flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                    selectedNoteIds.includes(note.exportId)
                                    ? 'bg-amber-50 border-amber-500 shadow-md shadow-amber-100'
                                    : 'bg-white border-stone-100 hover:border-amber-200 hover:bg-stone-50/50'
                                }`}
                            >
                                <div className={`mt-0.5 flex size-5 items-center justify-center rounded-full border transition-colors ${
                                    selectedNoteIds.includes(note.exportId)
                                    ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'bg-white border-stone-300 group-hover:border-amber-400'
                                }`}>
                                    {selectedNoteIds.includes(note.exportId) && <Check className="size-3 stroke-[4]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-black text-amber-700">{note.exportCode}</p>
                                        <span className="text-[9px] font-bold text-stone-400">
                                            {note.items?.length || 0} mục
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-stone-800 mt-0.5">{note.storeName}</p>
                                    
                                    {/* Preview sản phẩm bên trong */}
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {note.items?.slice(0, 3).map((item, id) => (
                                            <span key={id} className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                                                {item.productName}
                                            </span>
                                        ))}
                                        {(note.items?.length || 0) > 3 && (
                                            <span className="text-[9px] text-stone-400 font-bold px-1 italic">
                                                +{note.items.length - 3}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/30">
                        <Truck className="size-8 text-stone-200 mx-auto" />
                        <p className="text-xs font-bold text-stone-400 mt-2 italic">Không có phiếu xuất kho nào sẵn sàng giao.</p>
                    </div>
                )}
              </div>
            ) : (
              <form id="delivery-form" onSubmit={handleSubmit(onCreateDelivery)} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-stone-700 ml-1">Tên tài xế phụ trách <span className="text-rose-500">*</span></Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/4 -translate-y-1/4 size-6 text-stone-400" />
                            <Input 
                                {...register("driverName", { required: "Vui lòng nhập tên tài xế" })}
                                placeholder="Nhập tên tài xế..."
                                className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl font-medium text-stone-800"
                                errorMessage={errors.driverName?.message}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-stone-700 ml-1">Biển số xe vận chuyển <span className="text-rose-500">*</span></Label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/4 -translate-y-1/4 size-6 text-stone-400" />
                            <Input 
                                {...register("vehiclePlate", { required: "Vui lòng nhập biển số xe" })}
                                placeholder="49A-XXXXX"
                                className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl font-medium text-stone-800"
                                errorMessage={errors.vehiclePlate?.message}
                            />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-xs font-bold text-stone-700 ml-1">Ngày dự kiến giao hàng <span className="text-rose-500">*</span></Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/4 -translate-y-1/4 size-6 text-stone-400" />
                        <Input 
                            type="datetime-local"
                        {...register("scheduledDate", {
                          required: "Vui lòng chọn ngày giao hàng",
                          validate: (value) => {
                            const selectedDate = new Date(value);
                            const now = new Date();
                            return selectedDate > now || "Ngày giao hàng phải lớn hơn ngày hiện tại";
                          }
                        })}
                            className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl font-medium text-stone-800"
                            errorMessage={errors.scheduledDate?.message}
                        />
                        
                    </div>
                 </div>

                 <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-[11px] font-bold text-orange-800 mb-2 uppercase tracking-wide">Chi tiết chuyến giao:</p>
                    <div className="flex flex-wrap gap-2">
                        {readyNotes.filter(n => selectedNoteIds.includes(n.exportId)).map(n => (
                            <span key={n.exportId} className="px-3 py-1 bg-white border border-orange-200 rounded-full text-[10px] font-black text-orange-700 truncate max-w-[150px]">
                                {n.storeName}
                            </span>
                        ))}
                    </div>
                 </div>
              </form>
            )}
          </div>

          <DialogFooter className="p-6 bg-stone-50/80 border-t border-stone-100">
            <div className="flex w-full items-center justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="text-stone-500 font-bold text-xs"
                >
                    Hủy bỏ
                </Button>
                
                <div className="flex gap-3">
                    {step === 2 && (
                        <Button 
                            variant="outline" 
                            onClick={() => setStep(1)}
                            className="h-10 rounded-xl px-5 border-stone-300 font-bold text-xs text-stone-700 hover:bg-white"
                        >
                            <ChevronLeft className="size-4 mr-1" />
                            Quay lại
                        </Button>
                    )}
                    
                    {step === 1 ? (
                        <Button 
                            disabled={selectedNoteIds.length === 0}
                            onClick={() => setStep(2)}
                            className="h-10 rounded-xl px-6 bg-amber-500 font-black text-xs text-white hover:bg-amber-600 disabled:opacity-40 shadow-lg shadow-amber-200"
                        >
                            Tiếp theo
                            <ChevronRight className="size-4 ml-1" />
                        </Button>
                    ) : (
                        <Button 
                            type="submit"
                            form="delivery-form"
                            disabled={isSubmitting}
                            className="h-10 rounded-xl px-10 bg-gradient-to-r from-amber-500 to-orange-600 font-black text-sm text-white hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-amber-200 active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : "Xác nhận tạo lịch"}
                        </Button>
                    )}
                </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* MODAL XÁC NHẬN CẬP NHẬT TRẠNG THÁI */}
      {/* MODAL CHI TIẾT LỊCH GIAO HÀNG (UI only) */}
      <Dialog
        open={isDetailModalOpen}
        onOpenChange={(open) => {
          setIsDetailModalOpen(open);
          if (!open) setSelectedPlanForDetail(null);
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <h3 className="text-base font-bold text-amber-900">Chi tiết lịch giao hàng</h3>
            <p className="mt-1 text-xs text-amber-700/80">Mô phỏng UI hiển thị chi tiết chuyến giao.</p>
          </div>
          <div className="space-y-4 px-6 py-5 text-sm">
            {!selectedPlanForDetail ? (
              <p className="text-sm text-stone-500">Đang tải...</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Mã chuyến</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedPlanForDetail.deliveryCode}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Trạng thái</p>
                    <p className="mt-1 font-bold text-stone-900">{translateStatus(selectedPlanForDetail.status)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Tài xế</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedPlanForDetail.driverName}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-stone-500">Biển số</p>
                    <p className="mt-1 font-bold text-stone-900">{selectedPlanForDetail.vehiclePlate ?? '—'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-semibold text-stone-500">Ngày dự kiến</p>
                    <p className="mt-1 font-bold text-stone-900">{formatDate(selectedPlanForDetail.scheduledDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700">Danh sách phiếu xuất</p>
                  <div className="space-y-2">
                    {selectedPlanForDetail.exportNotes?.length ? (
                      selectedPlanForDetail.exportNotes.map((note, idx) => (
                        <div
                          key={`${note.exportId ?? idx}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-stone-900">{note.storeName}</p>
                            <p className="text-[11px] text-stone-600">
                              Phiếu: {note.exportCode ?? `#${note.exportId ?? '—'}`}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-amber-800">
                            {Array.isArray(note.items) ? `${note.items.length} mặt hàng` : '—'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-stone-500">Chưa có phiếu xuất nào.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="border-t border-stone-100 bg-stone-50 px-6 py-3">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-900 hover:bg-amber-50"
              onClick={() => setIsDetailModalOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0 rounded-2xl border-none shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                <Truck className="size-6" />
                Xác nhận cập nhật trạng thái
            </h2>
            <p className="text-blue-50 text-xs mt-1 font-medium opacity-90">
                Chuyến hàng: <span className="font-black text-white">{selectedPlanForStatus?.deliveryCode}</span>
            </p>
          </div>

          <div className="p-8 space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="flex flex-col items-center gap-1 opacity-50">
                        <span className="text-[10px] uppercase text-stone-400">Hiện tại</span>
                        {selectedPlanForStatus && renderStatusBadge(selectedPlanForStatus.status)}
                    </div>
                    <ChevronRight className="size-5 text-stone-300 mt-4" />
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-stone-400">Tiếp theo</span>
                        {selectedPlanForStatus?.status === 'PLANNED' ? renderStatusBadge('IN_TRANSIT') : renderStatusBadge('COMPLETED')}
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 w-full text-left">
                    <p className="text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wide">Chi tiết chuyến hàng:</p>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-stone-700">Tài xế: <span className="font-bold">{selectedPlanForStatus?.driverName}</span></p>
                        <p className="text-xs font-medium text-stone-700">Lộ trình: <span className="font-bold">{selectedPlanForStatus?.exportNotes.map(n => n.storeName).join(', ')}</span></p>
                    </div>
                </div>

                <p className="text-xs font-medium text-stone-600 leading-relaxed italic">
                    Bạn có chắc chắn muốn chuyển trạng thái chuyến hàng này không? Hành động này sẽ được ghi lại vào lịch sử.
                </p>
            </div>
          </div>

          <DialogFooter className="p-4 bg-stone-50/80 border-t border-stone-100">
            <div className="flex w-full gap-3">
                <Button 
                    variant="ghost" 
                    onClick={() => setIsStatusModalOpen(false)}
                    className="flex-1 text-stone-500 font-bold text-xs h-11"
                >
                    Hủy bỏ
                </Button>
                <Button 
                    onClick={handleUpdateStatusConfirm}
                    disabled={isSubmitting}
                    className="flex-[2] h-11 rounded-xl bg-blue-600 font-black text-sm text-white hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : "Xác nhận chuyển trạng thái"}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
