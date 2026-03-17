import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalendarClock, FileText, Search, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenServices, type InventoryReceiptApi } from '@/services/kitchenServices';
import { supplyServices, type ExportNotesResponse } from '@/services/supplyServices';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type ReceiptStatus = 'DRAFT' | 'COMPLETED';

const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  DRAFT: 'Nháp',
  COMPLETED: 'Hoàn thành',
};

const RECEIPT_STATUS_CLASS: Record<ReceiptStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
};

const FILTER_OPTIONS: (ReceiptStatus | 'ALL')[] = ['ALL', 'DRAFT', 'COMPLETED'];

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const ManagerReceiptsPage = () => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>('IMPORT');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'ALL'>('ALL');
  const [receipts, setReceipts] = useState<InventoryReceiptApi[]>([]);
  const [isLoadingImport, setIsLoadingImport] = useState(false);

  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [isLoadingExport, setIsLoadingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedExport, setSelectedExport] = useState<ExportNotesResponse | null>(null);
  const [isExportDetailOpen, setIsExportDetailOpen] = useState(false);
  const [isLoadingExportDetail, setIsLoadingExportDetail] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<InventoryReceiptApi | null>(null);
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);
  const [isLoadingReceiptDetail, setIsLoadingReceiptDetail] = useState(false);

  const fetchReceipts = async () => {
    setIsLoadingImport(true);
    try {
      const response = await kitchenServices.getInventoryReceipts();
      if (response.data) {
        setReceipts(response.data);
      }
    } catch {
      // TODO: toast khi có lỗi
    } finally {
      setIsLoadingImport(false);
    }
  };

  const fetchExportNotes = async () => {
    setIsLoadingExport(true);
    setExportError(null);
    try {
      const res = await supplyServices.getAllExportNote();
      const data = (res as { data?: { items?: ExportNotesResponse[] } }).data;
      const items = data?.items;
      if (Array.isArray(items)) {
        setExportNotes(items);
      } else {
        setExportNotes([]);
      }
    } catch (e) {
      setExportError('Không tải được danh sách phiếu xuất kho.');
      setExportNotes([]);
    } finally {
      setIsLoadingExport(false);
    }
  };

  const handleOpenExportDetail = async (note: ExportNotesResponse) => {
    // Ở context Manager, Supply đã tổng hợp sẵn chi tiết items trong ExportNotesResponse,
    // nên ta chỉ cần mở modal và hiển thị danh sách mặt hàng từ note.items.
    // Nếu sau này backend bổ sung API chi tiết riêng (ví dụ /export-notes/:id),
    // có thể mở rộng tại đây để gọi thêm.
    setIsLoadingExportDetail(true);
    try {
      // Dùng trực tiếp dữ liệu từ API /export-notes cho phiếu xuất được chọn.
      setSelectedExport(note);
      setIsExportDetailOpen(true);
    } finally {
      setIsLoadingExportDetail(false);
    }
  };

  const handleOpenReceiptDetail = async (receipt: InventoryReceiptApi) => {
    setSelectedReceipt(receipt);
    setIsReceiptDetailOpen(true);
    setIsLoadingReceiptDetail(true);
    try {
      const response = await kitchenServices.getInventoryReceiptById(receipt.receiptId);
      if (response.data) {
        setSelectedReceipt(response.data);
      }
    } catch {
      // Nếu API lỗi, giữ lại dữ liệu từ danh sách
    } finally {
      setIsLoadingReceiptDetail(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const draftCount = useMemo(
    () => receipts.filter((r) => r.status === 'DRAFT').length,
    [receipts]
  );

  const completedCount = useMemo(
    () => receipts.filter((r) => r.status === 'COMPLETED').length,
    [receipts]
  );

  const filteredReceipts = useMemo(() => {
    let data = receipts;

    if (statusFilter !== 'ALL') {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.receiptCode.toLowerCase().includes(q) ||
          (r.receiptDate && new Date(r.receiptDate).toLocaleDateString('vi-VN').toLowerCase().includes(q))
      );
    }

    return data;
  }, [receipts, search, statusFilter]);

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <FileText className="size-6 text-amber-500" />
              Biên lai kho trung tâm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Manager xem lịch sử phiếu nhập và phiếu xuất kho từ bếp trung tâm.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 p-1 text-xs md:self-start">
            <button
              type="button"
              onClick={() => setActiveTab('IMPORT')}
              className={cn(
                'rounded-full px-3 py-1.5 font-medium transition',
                activeTab === 'IMPORT'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              )}
            >
              Nhập kho
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('EXPORT');
                if (exportNotes.length === 0 && !isLoadingExport && !exportError) {
                  void fetchExportNotes();
                }
              }}
              className={cn(
                'rounded-full px-3 py-1.5 font-medium transition',
                activeTab === 'EXPORT'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              )}
            >
              Xuất kho
            </button>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng biên lai
              </span>
              <span className="text-lg font-semibold text-amber-900">{receipts.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Nháp
              </span>
              <span className="text-lg font-semibold text-amber-900">{draftCount}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Hoàn thành
              </span>
              <span className="text-lg font-semibold text-amber-900">{completedCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {activeTab === 'IMPORT' && (
            <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã biên lai, ngày..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusFilter(opt)}
                    className={cn(
                      'px-3 py-1.5 transition',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      statusFilter === opt
                        ? 'bg-amber-500 text-white'
                        : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : RECEIPT_STATUS_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <FileText className="size-4 text-amber-500" />
                  Danh sách biên lai
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  inventory_receipts · Manager xem read-only.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã biên lai</th>
                        <th className="px-4 py-2 font-semibold">Ngày lập</th>
                        <th className="px-4 py-2 font-semibold">Người lập</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                        <th className="px-4 py-2 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filteredReceipts.map((r) => (
                        <tr key={r.receiptId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{r.receiptCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {r.receiptId}</p>
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {formatDateTime(r.receiptDate)}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {r.createdByName ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                RECEIPT_STATUS_CLASS[r.status]
                              )}
                            >
                              {RECEIPT_STATUS_LABEL[r.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptDetail(r)}
                              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-50"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!isLoadingImport && filteredReceipts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-xs text-stone-500">
                            Không có biên lai nào khớp với bộ lọc.
                          </td>
                        </tr>
                      )}
                      {isLoadingImport && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-xs text-stone-500">
                            Đang tải danh sách biên lai...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/60 shadow-sm">
              <CardHeader className="border-b border-amber-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <CalendarClock className="size-4 text-amber-500" />
                  Tình hình biên lai
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Tóm tắt trạng thái inventory_receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Nháp</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900">{draftCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                    <p className="font-medium text-stone-500">Hoàn thành</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">{completedCount}</p>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600">
                  Dữ liệu đồng bộ trực tiếp từ kho trung tâm. Manager chỉ có quyền xem, không chỉnh sửa phiếu nhập.
                </p>
              </CardContent>
            </Card>
          </div>
            </>
          )}

          {activeTab === 'EXPORT' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 -mt-2 size-4 -translate-y-1/2 text-amber-600" />
                  <Input
                    placeholder="Tìm theo mã phiếu xuất..."
                    className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
                    // Giao diện, chưa filter client để giữ scope nhỏ
                  />
                </div>
              </div>

              <Card className="border-amber-100 bg-white shadow-sm">
                <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <FileText className="size-4 text-amber-500" />
                    Danh sách phiếu xuất kho
                  </CardTitle>
                  <CardDescription className="text-[11px] text-amber-700/80">
                    export_notes · sử dụng API thật từ Supply Service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã phiếu xuất</th>
                        <th className="px-4 py-2 font-semibold">Cửa hàng</th>
                        <th className="px-4 py-2 font-semibold">Ngày xuất</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                        <th className="px-4 py-2 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {exportNotes.map((note) => (
                        <tr key={note.exportId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">{note.exportCode}</p>
                            <p className="text-[11px] text-stone-500">ID: {note.exportId}</p>
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {note.storeName ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {note.exportDate
                              ? new Date(note.exportDate).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                              {note.status ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenExportDetail(note)}
                              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-50"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}

                        {exportError && !isLoadingExport && exportNotes.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-xs text-rose-600">
                              {exportError}
                            </td>
                          </tr>
                        )}

                        {!exportError && !isLoadingExport && exportNotes.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-xs text-stone-500">
                              Chưa có phiếu xuất kho nào.
                            </td>
                          </tr>
                        )}

                        {isLoadingExport && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-xs text-stone-500">
                              Đang tải danh sách phiếu xuất kho...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={isExportDetailOpen} onOpenChange={setIsExportDetailOpen}>
            <DialogContent className="max-w-2xl border-amber-200">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <FileText className="size-4 text-amber-500" />
                    Chi tiết phiếu xuất kho
                  </CardTitle>
                  <CardDescription className="text-[11px] text-amber-700/80">
                    Dữ liệu lấy trực tiếp từ API /export-notes (Supply Service).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingExportDetail || !selectedExport ? (
                    <p className="py-4 text-center text-xs text-stone-500">
                      Đang tải chi tiết phiếu xuất...
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="space-y-1">
                          <p className="font-medium text-stone-500">Mã phiếu xuất</p>
                          <p className="font-semibold text-stone-900">
                            {selectedExport.exportCode}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-stone-500">Cửa hàng</p>
                          <p className="font-semibold text-stone-900">
                            {selectedExport.storeName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-stone-500">Ngày xuất</p>
                          <p className="font-semibold text-stone-900">
                            {selectedExport.exportDate
                              ? new Date(selectedExport.exportDate).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-stone-500">Trạng thái</p>
                          <p className="font-semibold text-amber-800">
                            {selectedExport.status ?? '—'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-100 bg-amber-50/40">
                        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                          Danh sách mặt hàng xuất
                        </div>
                        <div className="max-h-60 overflow-auto">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b border-amber-100 bg-amber-50/60 text-left font-semibold text-amber-900">
                                <th className="px-4 py-2">Sản phẩm</th>
                                <th className="px-4 py-2 text-right">Số lượng</th>
                                <th className="px-4 py-2">Đơn vị</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                              {selectedExport.items.map((item) => (
                                <tr key={item.productId} className="hover:bg-amber-50/60">
                                  <td className="px-4 py-2 font-medium text-stone-800">
                                    {item.productName}
                                  </td>
                                  <td className="px-4 py-2 text-right font-semibold text-stone-900">
                                    {item.quantity.toLocaleString('vi-VN')}
                                  </td>
                                  <td className="px-4 py-2 text-stone-700">{item.unitName}</td>
                                </tr>
                              ))}
                              {!selectedExport.items.length && (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="px-4 py-4 text-center text-xs text-stone-500"
                                  >
                                    Phiếu xuất này chưa có danh sách mặt hàng chi tiết.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      <Dialog open={isReceiptDetailOpen} onOpenChange={setIsReceiptDetailOpen}>
        <DialogContent className="max-w-3xl border border-amber-200 bg-white p-0">
          {!selectedReceipt && (
            <div className="px-8 py-10 text-center text-xs text-stone-500">Đang tải chi tiết biên lai...</div>
          )}

          {selectedReceipt && (
            <>
              <div className="border-b border-amber-100 bg-amber-50/70 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <Hash className="size-4 text-amber-600" />
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/80">
                        Mã biên lai
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-stone-900">{selectedReceipt.receiptCode}</p>
                      <p className="mt-0.5 text-[11px] text-stone-500">ID: {selectedReceipt.receiptId}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold',
                      RECEIPT_STATUS_CLASS[selectedReceipt.status]
                    )}
                  >
                    {RECEIPT_STATUS_LABEL[selectedReceipt.status]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-amber-100 bg-white px-6 py-4 text-[11px]">
                <div>
                  <p className="font-medium text-stone-500">Ngày lập</p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {formatDateTime(selectedReceipt.receiptDate)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-stone-500">Người lập</p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {selectedReceipt.createdByName ?? '—'}
                  </p>
                </div>
              </div>

              <div className="max-h-72 overflow-auto px-6 py-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Danh sách mặt hàng
                </p>
                {isLoadingReceiptDetail && !selectedReceipt.items?.length ? (
                  <p className="py-6 text-center text-xs text-stone-500">
                    Đang tải danh sách mặt hàng...
                  </p>
                ) : selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-left font-semibold text-stone-600">
                        <th className="px-2 py-2">Mã lô</th>
                        <th className="px-2 py-2 text-center">Số lượng</th>
                        <th className="px-2 py-2 text-right">Batch ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedReceipt.items.map((item) => (
                        <tr key={item.receiptItemId}>
                          <td className="px-2 py-2 font-medium text-stone-900">{item.batchCode}</td>
                          <td className="px-2 py-2 text-center font-semibold text-stone-800">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-2 text-right text-stone-500">{item.batchId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="py-6 text-center text-xs text-stone-500">
                    Biên lai này chưa có mặt hàng nào.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerReceiptsPage;
