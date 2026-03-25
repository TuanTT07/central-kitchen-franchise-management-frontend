/**
 * File: IssueHandlingPage.tsx
 * Description: Trang quản lý và xử lý các sự cố giao hàng từ các cửa hàng
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Loader2, Package, User, Calendar, Clock, Plus, RotateCcw, Truck } from 'lucide-react';
import { supplyServices, type DeliveryIssueResponse } from '@/services/supplyServices';
import StatusBadge from '@/components/ui/StatusBadge';
import { translateStatus } from '@/utils/labelMapping';
import { ISSUE_LIST_PAGE_SIZE } from '@/utils/pagination';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

/**
 * IssueHandlingPage Component
 * - Hiển thị danh sách các sự cố giao hàng
 * - Bộ lọc theo trạng thái (Tất cả, Chờ xử lý, Đã duyệt, Từ chối)
 * - Tìm kiếm theo mã đơn hàng hoặc tên cửa hàng
 * - Hỗ trợ phân trang dữ liệu từ API
 */

const IssueHandlingPage = () => {
  // ================= STATE =================

  // Danh sách sự cố từ API
  const [issues, setIssues] = useState<DeliveryIssueResponse[]>([]);
  
  // Trạng thái loading
  const [loading, setLoading] = useState(true);
  
  // Từ khóa tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bộ lọc trạng thái (ALL, PENDING_REVIEW, APPROVED, REJECTED)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Thông tin phân trang
  const [pagination, setPagination] = useState({
    page: 0,
    size: ISSUE_LIST_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  // Sự cố đang được xem chi tiết
  const [selectedIssue, setSelectedIssue] = useState<DeliveryIssueResponse | null>(null);

  // Trạng thái mở modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trạng thái load chi tiết
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Trạng thái đang xử lý duyệt/từ chối
  const [isReviewing, setIsReviewing] = useState(false);

  // Ngày giao hàng dự kiến mới (cho đơn thay thế / giao lại)
  const [newDeliveryDate, setNewDeliveryDate] = useState('');

  // ================= EFFECT =================

  // Tải dữ liệu khi component mount hoặc khi thay đổi trang/bộ lọc
  useEffect(() => {
    fetchIssues();
  }, [pagination.page, statusFilter]);

  // ================= API =================

  // Gọi API lấy danh sách sự cố
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await supplyServices.getAllDeliveryIssues(pagination.page, pagination.size);
      
      if (res.success && res.data) {
        setIssues(res.data.items);
        setPagination(prev => ({
          ...prev,
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages,
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách sự cố:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết một sự cố
  const handleShowDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const res = await supplyServices.getDeliveryIssueById(id);

      if (res.success && res.data) {
        setSelectedIssue(res.data);
        // Khởi tạo ngày giao mới từ ngày gốc (cắt chuỗi ISO cho datetime-local)
        if (res.data.originalDeliveryDate) {
          setNewDeliveryDate(res.data.originalDeliveryDate.slice(0, 16));
        } else {
          setNewDeliveryDate(new Date().toISOString().slice(0, 16));
        }
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết sự cố:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xử lý Phê duyệt / Từ chối sự cố
  const handleReview = async (decision: string) => {
    if (!selectedIssue) return;

    try {
      setIsReviewing(true);
      
      // Sử dụng ngày giao mới do người dùng chọn
      const res = await supplyServices.reviewDeliveryIssue(
        selectedIssue.issueId, 
        decision, 
        newDeliveryDate
      );

      if (res.success) {
        toast.success(decision === 'CREATE_REPLACEMENT_ORDER' ? 'Đã duyệt sự cố và tạo đơn giao bù' : 'Đã từ chối sự cố thành công');
        setIsModalOpen(false);
        fetchIssues(); // Refresh danh sách
      } else {
        toast.error(res.message || 'Xử lý thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý sự cố:', error);
      toast.error('Có lỗi xảy ra trong quá trình xử lý');
    } finally {
      setIsReviewing(false);
    }
  };

  // ================= HANDLER =================

  // Thay đổi trang
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Thay đổi bộ lọc trạng thái
  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 0 })); // Reset về trang đầu
  };

  // ================= UTILS =================

  // Lọc dữ liệu theo searchTerm và statusFilter (lọc ở client nếu API chỉ trả về danh sách thô)
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.originalOrderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.storeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || issue.issueStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ================= RENDER =================

  return (
    <div className="flex flex-col gap-6 p-2 md:p-1">
      {/* ── Tiêu đề trang (Đã đồng bộ) ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <AlertCircle className="size-6 text-amber-500" />
              Sự cố giao hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi và quản lý các đơn bị chi nhánh từ chối nhận hoặc gặp sự cố.
            </CardDescription>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng sự cố</span>
                <span className="mt-0.5 text-2xl font-bold text-amber-900">{pagination.totalElements}</span>
             </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar (Đã đồng bộ) ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center p-4 bg-white rounded-xl border border-amber-100 shadow-sm">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
          <Input
            placeholder="Tìm theo mã đơn / store"
            className="h-10 pl-9 text-xs border-amber-200 bg-amber-50/40 focus:ring-amber-500/20 focus:border-amber-400 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1" />

        {/* Bộ lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Tất cả', value: 'ALL' },
            { label: 'Chờ xử lý', value: 'PENDING_REVIEW' },
            { label: 'Đã duyệt', value: 'APPROVED' },
            { label: 'Đã từ chối', value: 'REJECTED' },
          ].map((btn) => (
            <Button
              key={btn.value}
              variant={statusFilter === btn.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(btn.value)}
              className={cn(
                "h-9 px-4 text-[11px] font-bold rounded-lg transition-all hover:cursor-pointer uppercase tracking-wide",
                statusFilter === btn.value 
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200" 
                  : "bg-white text-amber-700 hover:bg-amber-50 border-amber-200"
              )}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Bảng dữ liệu ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-amber-50/30 border-b border-amber-100 text-[10px] font-black uppercase tracking-widest text-amber-900/60">
                <tr>
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4">Trạng thái issue</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <tr key={issue.issueId} className="hover:bg-amber-50/20 transition-all border-b border-amber-100 group">
                      <td className="px-6 py-4 uppercase font-bold text-amber-900 tracking-tight">
                        <span className="bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                           {issue.originalOrderCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-700">{issue.storeName}</td>
                      <td className="px-6 py-4 text-stone-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          {translateStatus(issue.issueReason)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.issueStatus} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] h-8 px-4 font-bold rounded-lg shadow-sm shadow-amber-200 transition-all active:scale-95"
                          onClick={() => handleShowDetail(issue.issueId)}
                          disabled={loadingDetail}
                        >
                          {loadingDetail && selectedIssue?.issueId === issue.issueId ? (
                             <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : 'Xem chi tiết'}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <AlertCircle className="h-10 w-10 opacity-20" />
                        <p className="font-medium text-slate-500">Không tìm thấy sự cố nào</p>
                        <p className="text-xs">Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Phân trang ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50"
            disabled={pagination.page === 0}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={pagination.page === i ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-9 w-9 text-xs font-bold rounded-lg transition-all",
                pagination.page === i 
                   ? "bg-amber-500 text-white shadow-md shadow-amber-200 border-amber-500" 
                   : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
              )}
              onClick={() => handlePageChange(i)}
            >
              {i + 1}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Modal Chi tiết Sự cố ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="min-w-2xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-xl"
          onClose={() => setIsModalOpen(false)}
        >
          {selectedIssue && (
            <div className="flex flex-col bg-white overflow-hidden rounded-xl">
              {/* Header */}
              <div className="px-6 py-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg">
                <DialogHeader className="pb-0">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Chi tiết sự cố giao hàng
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6">
                {/* Phần 1: Chi tiết đơn và báo cáo */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Chi tiết đơn và báo cáo</h3>
                  
                  <div className="space-y-3 text-sm">
                    {/* Mã đơn gốc */}
                    <div className="flex items-start">
                      <span className="w-40 text-slate-600">Mã đơn gốc:</span>
                      <span className="font-semibold text-blue-600 flex items-center gap-1">
                        {selectedIssue.originalOrderCode}
                      </span>
                    </div>

                    {/* Store */}
                    <div className="flex items-start">
                      <span className="w-40 text-slate-600">Store:</span>
                      <span className="font-semibold text-slate-900">{selectedIssue.storeName}</span>
                    </div>

                    {/* Trạng thái đơn */}
                    <div className="flex items-center">
                      <span className="w-40 text-slate-600">Trạng thái đơn hiện tại:</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-[11px] font-bold uppercase">
                        <Clock className="h-3 w-3" />
                        {translateStatus(selectedIssue.originalOrderStatus)}
                      </div>
                    </div>

                    {/* Lý do */}
                    <div className="flex items-start">
                      <span className="w-40 text-slate-600">Lý do store báo:</span>
                      <span className="font-semibold text-slate-900">{translateStatus(selectedIssue.issueReason)}</span>
                    </div>

                    {/* Ghi chú */}
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-600">Ghi chú:</span>
                      <div className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-lg text-slate-700 italic text-sm">
                        {selectedIssue.issueNote || 'Không có ghi chú'}
                      </div>
                    </div>

                    {/* Ảnh minh chứng */}
                    <div className="flex flex-col gap-3">
                      <span className="text-slate-600">Ảnh minh chứng:</span>
                      <div className="flex flex-wrap gap-2">
                         {selectedIssue.images && selectedIssue.images.length > 0 ? (
                            selectedIssue.images.map((img, idx) => (
                              <div key={idx} className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                                <img src={img} alt={`Proof ${idx}`} className="h-full w-full object-cover" />
                              </div>
                            ))
                         ) : (
                            <div className="flex gap-2">
                              {/* Mock images in case of empty for demonstration as requested by user */}
                              <div className="h-20 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8X3z-c8pY0M8_e7L0N3k5_1s7_D5vM5e1Vg&s" className="h-full w-full object-cover opacity-80" alt="mock" />
                              </div>
                              <div className="h-20 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-M8v4-5Lz2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C" className="h-full w-full object-cover opacity-80" alt="mock" />
                              </div>
                              <div className="h-20 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                                Xem thêm
                              </div>
                            </div>
                         )}
                      </div>
                    </div>

                    {/* Thông tin người báo */}
                    <div className="pt-2 flex items-center text-xs text-slate-400 gap-4">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        Người báo: <span className="text-slate-600 font-medium">{selectedIssue.reportedBy.username}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Thời gian báo: <span className="text-slate-600 font-medium">{new Date(selectedIssue.reportedAt).toLocaleString('vi-VN')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Phần 2: Sản phẩm liên quan */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Sản phẩm liên quan</h3>
                  <div className="space-y-3">
                    {selectedIssue.issueItems && selectedIssue.issueItems.length > 0 ? (
                      selectedIssue.issueItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{item.productName}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">x {item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-3">
                        {/* Mock items for demonstration */}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                              <img src="https://img.freepik.com/premium-photo/raw-pork-belly-isolated-white-background_1235831-2895.jpg" className="h-full w-full object-cover" alt="mock" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Pork Belly</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">x 3</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-M8v4-5Lz2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C6_E9z2-C&s" className="h-full w-full object-cover" alt="mock" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Sốt ướp đặc chế</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">x 2</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                {selectedIssue.issueStatus === 'PENDING_REVIEW' ? (
                  <>
                    {/* Trường chọn ngày mới */}
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                          Ngày giao dự kiến mới <span className="text-red-500">*</span>
                       </label>
                       <div className="relative">
                          <Calendar className="absolute left-3 top-1/4 -translate-y-1/4 h-4 w-4 text-amber-500" />
                          <Input 
                            type="datetime-local"
                            className="pl-10 h-10 border-amber-200 bg-white focus:ring-amber-500/20 focus:border-amber-400 rounded-lg text-xs"
                            value={newDeliveryDate}
                            onChange={(e) => setNewDeliveryDate(e.target.value)}
                          />
                       </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-11 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        onClick={() => handleReview('CREATE_REPLACEMENT_ORDER')}
                        disabled={isReviewing || !newDeliveryDate}
                      >
                        {isReviewing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {isReviewing ? 'Đang xử lý...' : 'Duyệt & tạo đơn giao bù'}
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-11 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        onClick={() => handleReview('RESCHEDULE_CURRENT_ORDER')}
                        disabled={isReviewing || !newDeliveryDate}
                      >
                        {isReviewing ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        ) : (
                          <RotateCcw className="h-4 w-4 text-red-500" />
                        )}
                        {isReviewing ? 'Đang xử lý...' : 'Từ chối & giao lại đơn cũ'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-11 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98]"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Đóng
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueHandlingPage;
