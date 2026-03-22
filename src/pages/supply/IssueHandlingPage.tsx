/**
 * File: IssueHandlingPage.tsx
 * Description: Trang quản lý và xử lý các sự cố giao hàng từ các cửa hàng
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { supplyServices, type DeliveryIssueResponse } from '@/services/supplyServices';
import StatusBadge from '@/components/ui/StatusBadge';
import { translateStatus } from '@/utils/labelMapping';
import { cn } from '@/lib/utils';

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
    size: 5,
    totalElements: 0,
    totalPages: 0,
  });

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
    <div className="flex flex-col gap-6 p-2 md:p-4">
      {/* ── Tiêu đề trang ── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Sự cố giao hàng</h1>
        <p className="text-sm text-slate-500">Theo dõi các đơn bị store từ chối nhận</p>
      </div>

      {/* ── Thanh công cụ (Tìm kiếm & Bộ lọc) ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/4 h-4 w-4 -translate-y-1/4 text-slate-400" />
          <Input
            placeholder="Tìm theo mã đơn / store"
            className="h-9 pl-9 text-xs border-slate-200 focus:ring-amber-500/20 focus:border-amber-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
                "h-9 px-4 text-xs font-semibold rounded-md transition-all hover:cursor-pointer",
                statusFilter === btn.value 
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm" 
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
              )}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Bảng dữ liệu ── */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Mã đơn</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Store</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Lý do</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Trạng thái issue</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <tr key={issue.issueId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{issue.originalOrderCode}</td>
                      <td className="px-6 py-4 text-slate-600">{issue.storeName}</td>
                      <td className="px-6 py-4 text-slate-600">{translateStatus(issue.issueReason)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.issueStatus} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-4 font-medium"
                        >
                          Xem chi tiết
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
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md border border-slate-200"
            disabled={pagination.page === 0}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={pagination.page === i ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 w-8 text-xs font-medium rounded-md",
                pagination.page === i ? "bg-amber-500 text-white translate-y-[-1px]" : "text-slate-600"
              )}
              onClick={() => handlePageChange(i)}
            >
              {i + 1}
            </Button>
          ))}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md border border-slate-200"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default IssueHandlingPage;
