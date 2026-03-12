/**
 * File: DistributionPlanPage.tsx
 * Description: Trang quản lý kế hoạch phân phối hàng hóa. 
 *             Hiển thị danh sách phiếu xuất kho và hỗ trợ tạo đợt phân phối mới qua Popup.
 * Author: Tuan Tran
 * Created: 2026-03-12
 */

// ================= IMPORT =================

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutGrid, MapPin, Search, Loader2, Package } from 'lucide-react';
import { supplyServices, type ExportNotesResponse, type ExportNoteItem } from '@/services/supplyServices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { OrderResponse, OrderDetailResponse } from '@/services/franchiseServices';

// ================= TYPES =================

type PlanStatus = 'READY' | 'SHIPPED' | 'CANCEL';

// ================= CONSTANTS =================

const STATUS_LABEL: Record<PlanStatus, string> = {
  READY: 'Sẵn sàng giao',
  SHIPPED: 'Đã giao',
  CANCEL: 'Đã hủy',
};

const STATUS_CLASS: Record<PlanStatus, string> = {
  READY: 'bg-amber-100 text-amber-800 border-amber-200',
  SHIPPED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCEL: 'bg-stone-100 text-stone-600 border-stone-200',
};

/**
 * DistributionPlanPage Component
 * - Hiển thị danh sách phiếu xuất kho
 * - Thống kê trạng thái phân phối
 * - Tạo đợt phân phối mới từ các đơn hàng sẵn sàng
 */

const DistributionPlanPage = () => {

  // ================= STATE =================

  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [search, setSearch] = useState('');

  // Trạng thái modal và dữ liệu tạo đợt mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [readyOrders, setReadyOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [isFetchingReady, setIsFetchingReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ================= EFFECT =================

  useEffect(() => {
    getExportNotes();
  }, []);

  // ================= API =================

  /**
   * Lấy danh sách phiếu xuất kho
   */
  const getExportNotes = async () => {
    try {
      setLoading(true);
      const response = await supplyServices.getAllExportNote();
      if (response.data.success) {
        setExportNotes(response.data.data.items);
      }
    } catch (error) {
      console.error('Fetch export notes failed', error);
      // toast.error('Không thể tải danh sách phiếu xuất kho');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy danh sách đơn hàng sẵn sàng để phân phối
   */
  const fetchReadyOrders = async () => {
    try {
      setIsFetchingReady(true);
      const response = await supplyServices.getStoreOrderReadyForManufacturing();
      if (response.success) {
        setReadyOrders(response.data);
      }
    } catch (error) {
      console.error('Fetch ready orders failed', error);
      // toast.error('Không thể tải danh sách đơn hàng sẵn sàng');
    } finally {
      setIsFetchingReady(false);
    }
  };

  /**
   * Thực hiện tạo phiếu xuất kho từ các đơn hàng đã chọn
   */
  const handleCreateExportNote = async () => {
    if (selectedOrderIds.length === 0) {
      // toast.warning('Vui lòng chọn ít nhất một đơn hàng');
      return;
    }

    try {
      setIsCreating(true);
      const response = await supplyServices.createExportNote(selectedOrderIds);
      if (response.success) {
        // toast.success('Tạo đợt phân phối thành công');
        setIsCreateModalOpen(false);
        setSelectedOrderIds([]);
        getExportNotes();
      }
    } catch (error) {
      console.error('Create export note failed', error);
      // toast.error('Tạo đợt phân phối thất bại');
    } finally {
      setIsCreating(false);
    }
  };

  // ================= HANDLER =================

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    fetchReadyOrders();
  };

  const handleToggleOrder = (orderId: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // ================= UTILS =================

  /**
   * Lọc phiếu xuất kho theo từ khóa
   */
  const filteredPlans = useMemo(() => {
    if (!search.trim()) return exportNotes;
    const q = search.toLowerCase();
    return exportNotes.filter(
      (p: ExportNotesResponse) =>
        p.exportCode.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        p.items.some((item: ExportNoteItem) => item.productName.toLowerCase().includes(q))
    );
  }, [search, exportNotes]);

  /**
   * Thống kê số lượng
   */
  const stats = useMemo(() => {
    return {
      total: exportNotes.length,
      ready: exportNotes.filter((p: ExportNotesResponse) => p.status === 'READY').length,
      shipped: exportNotes.filter((p: ExportNotesResponse) => p.status === 'SHIPPED').length,
    };
  }, [exportNotes]);

  /**
   * Nhóm theo chi nhánh
   */
  const storeGroups = useMemo(() => {
    const groups: Record<string, { storeName: string; count: number; totalQty: number; status: string }> = {};
    exportNotes.forEach((p: ExportNotesResponse) => {
      if (!groups[p.storeName]) {
        groups[p.storeName] = { storeName: p.storeName, count: 0, totalQty: 0, status: p.status };
      }
      groups[p.storeName].count += 1;
      groups[p.storeName].totalQty += p.items.reduce((sum: number, item: ExportNoteItem) => sum + item.quantity, 0);
    });
    return Object.values(groups);
  }, [exportNotes]);

  // ================= RENDER =================

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <LayoutGrid className="size-6 text-amber-500" />
              Kế hoạch phân phối
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Lập và theo dõi các đợt phân phối từ bếp trung tâm tới chi nhánh.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng đợt</span>
              <span className="text-lg font-semibold text-amber-900">{stats.total}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Sẵn sàng giao</span>
              <span className="text-lg font-semibold text-amber-900">{stats.ready}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Đã giao</span>
              <span className="text-lg font-semibold text-amber-900">{stats.shipped}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã đợt, chi nhánh hoặc sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <Button 
              onClick={handleOpenCreateModal}
              className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600"
            >
              Tạo đợt phân phối
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Danh sách phiếu xuất kho</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Thông tin chi tiết các đợt hàng chuẩn bị xuất kho
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã phiếu</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                        <th className="px-2 py-2 font-semibold text-center">SL mặt hàng</th>
                        <th className="px-2 py-2 font-semibold text-right">Tổng SL</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center">
                            <Loader2 className="mx-auto size-6 animate-spin text-amber-500" />
                          </td>
                        </tr>
                      ) : filteredPlans.map((p: ExportNotesResponse) => (
                        <tr key={p.exportId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-3 font-semibold text-stone-900">{p.exportCode}</td>
                          <td className="px-4 py-3 text-stone-800">{p.storeName}</td>
                          <td className="px-4 py-3 text-stone-600 italic">
                            {p.items.map((i: ExportNoteItem) => i.productName).join(', ')}
                          </td>
                          <td className="px-2 py-3 text-center text-stone-800 font-medium">{p.items.length}</td>
                          <td className="px-2 py-3 text-right text-stone-800 font-bold">
                            {p.items.reduce((sum: number, i: ExportNoteItem) => sum + i.quantity, 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[p.status as PlanStatus] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {STATUS_LABEL[p.status as PlanStatus] || p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!loading && filteredPlans.length === 0 && (
                  <div className="py-10 text-center text-xs text-stone-500">Không có đợt phân phối nào phù hợp.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Theo chi nhánh</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Phân bổ hàng hóa theo điểm đến
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {storeGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900">{group.storeName}</p>
                        <p className="text-[10px] text-stone-500 italic">
                          {group.count} đợt · {group.totalQty} sản phẩm
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[group.status as PlanStatus] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABEL[group.status as PlanStatus] || group.status}
                    </span>
                  </div>
                ))}
                {storeGroups.length === 0 && (
                  <div className="py-4 text-center text-[10px] text-stone-400">Không có dữ liệu chi nhánh.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ================= MODAL: TẠO ĐỢT PHÂN PHỐI ================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b border-amber-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Package className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-amber-900">Tạo đợt phân phối mới</DialogTitle>
                <p className="text-xs text-amber-700/70">Chọn các đơn hàng chi nhánh đã sẵn sàng để lập đợt phân phối hàng.</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isFetchingReady ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3">
                <Loader2 className="size-8 animate-spin text-amber-500" />
                <p className="text-xs text-stone-500">Đang tải danh sách đơn hàng...</p>
              </div>
            ) : readyOrders.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <div className="rounded-full bg-stone-50 p-3">
                  <Package className="size-8 text-stone-300" />
                </div>
                <p className="text-sm font-medium text-stone-500">Không có đơn hàng nào sẵn sàng</p>
                <p className="text-xs text-stone-400">Tất cả đơn hàng đã được xử lý hoặc chưa được phê duyệt.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-100 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-amber-50/60 text-amber-900 border-b border-amber-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-10 text-center">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          checked={readyOrders.length > 0 && selectedOrderIds.length === readyOrders.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrderIds(readyOrders.map(o => o.orderId));
                            } else {
                              setSelectedOrderIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 font-semibold">Mã đơn hàng</th>
                      <th className="px-4 py-3 font-semibold">Chi nhánh</th>
                      <th className="px-4 py-3 font-semibold text-right">Tổng sản phẩm</th>
                      <th className="px-4 py-3 font-semibold text-right">Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50 bg-white">
                    {readyOrders.map((order: OrderResponse<OrderDetailResponse[]>) => (
                      <tr
                        key={order.orderId}
                        className={`hover:bg-amber-50/30 transition-colors cursor-pointer ${
                          selectedOrderIds.includes(order.orderId) ? 'bg-amber-50/50' : ''
                        }`}
                        onClick={() => handleToggleOrder(order.orderId)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              checked={selectedOrderIds.includes(order.orderId)}
                              onChange={() => handleToggleOrder(order.orderId)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-950">{order.orderCode}</td>
                        <td className="px-4 py-3 text-stone-700">{order.storeName}</td>
                        <td className="px-4 py-3 text-right font-medium text-stone-900">
                          {order.details.reduce((sum: number, d: OrderDetailResponse) => sum + d.quantity, 0)} sản phẩm
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500">
                          {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-amber-100 pt-5 mt-auto">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-stone-500">
                Đã chọn: <span className="font-bold text-amber-600">{selectedOrderIds.length}</span> đơn hàng
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-amber-200 text-amber-800 hover:bg-amber-50"
                >
                  Hủy bỏ
                </Button>
                <Button
                  disabled={selectedOrderIds.length === 0 || isCreating}
                  onClick={handleCreateExportNote}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200/50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Tạo đợt mới'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistributionPlanPage;
