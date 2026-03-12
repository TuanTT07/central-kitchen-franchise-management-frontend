/**
 * =========================================================
 * Component: DistributionPlanPage
 * Description: Trang quản lý kế hoạch phân phối hàng hóa.
 *             Hiển thị danh sách phiếu xuất kho và tổng quan theo chi nhánh.
 * Author: Tuan Tran, Dat Tran
 * Created: 2026-03-10
 *
 * Features:
 * - Lấy dữ liệu phiếu xuất kho (export_notes) từ API.
 * - Tìm kiếm theo mã phiếu, chi nhánh hoặc tên sản phẩm.
 * - Hiển thị thống kê tổng quan (Tổng đợt, Sẵn sàng, Đã giao).
 * - Nhóm dữ liệu theo chi nhánh để theo dõi phân bổ.
 * =========================================================
 */

// ================= IMPORT =================
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutGrid, MapPin, Search } from 'lucide-react';
import { supplyServices, type ExportNotesResponse } from '@/services/supplyServices';

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

// ================= COMPONENT =================
const DistributionPlanPage = () => {
  // ================= STATE =================
  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [search, setSearch] = useState('');

  // ================= API =================
  /**
   * Gọi API lấy danh sách phiếu xuất kho.
   * Cập nhật danh sách exportNotes khi thành công.
   */
  const getExportNotes = async () => {
    try {
      const response = await supplyServices.getAllExportNote();
      if (response.data.success) {
        setExportNotes(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch export notes:', error);
    }
  };

  // ================= EFFECT =================
  useEffect(() => {
    getExportNotes();
  }, []);

  // ================= LOGIC / MEMO =================
  /**
   * Lọc danh sách phiếu xuất kho dựa trên từ khóa tìm kiếm.
   * Tìm kiếm trong: Mã phiếu, Tên chi nhánh, Tên sản phẩm.
   */
  const filteredPlans = useMemo(() => {
    if (!search.trim()) return exportNotes;
    const q = search.toLowerCase();
    return exportNotes.filter(
      (p) =>
        p.exportCode.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        p.items.some((item) => item.productName.toLowerCase().includes(q))
    );
  }, [search, exportNotes]);

  /**
   * Tính toán các thông số thống kê nhanh.
   */
  const stats = useMemo(() => {
    return {
      total: exportNotes.length,
      ready: exportNotes.filter((p) => p.status === 'READY').length,
      shipped: exportNotes.filter((p) => p.status === 'SHIPPED').length,
    };
  }, [exportNotes]);

  /**
   * Nhóm dữ liệu phiếu xuất kho theo từng chi nhánh để hiển thị ở Sidebar.
   */
  const storeGroups = useMemo(() => {
    const groups: Record<string, { storeName: string; count: number; totalQty: number; status: string }> = {};
    exportNotes.forEach((p) => {
      if (!groups[p.storeName]) {
        groups[p.storeName] = { storeName: p.storeName, count: 0, totalQty: 0, status: p.status };
      }
      groups[p.storeName].count += 1;
      groups[p.storeName].totalQty += p.items.reduce((sum, item) => sum + item.quantity, 0);
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
            <Button className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600">
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
                      {filteredPlans.map((p) => (
                        <tr key={p.exportId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-3 font-semibold text-stone-900">{p.exportCode}</td>
                          <td className="px-4 py-3 text-stone-800">{p.storeName}</td>
                          <td className="px-4 py-3 text-stone-600 italic">
                            {p.items.map((i) => i.productName).join(', ')}
                          </td>
                          <td className="px-2 py-3 text-center text-stone-800 font-medium">{p.items.length}</td>
                          <td className="px-2 py-3 text-right text-stone-800 font-bold">
                            {p.items.reduce((sum, i) => sum + i.quantity, 0)}
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
                {filteredPlans.length === 0 && (
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
    </div>
  );
};

export default DistributionPlanPage;
