import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalendarClock, FileText, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReceiptStatus = 'DRAFT' | 'COMPLETED';

interface InventoryReceiptRow {
  receiptId: number;
  receiptCode: string;
  status: ReceiptStatus;
  receiptDate: string | null;
  createdByName: string;
}

const MOCK_RECEIPTS: InventoryReceiptRow[] = [
  {
    receiptId: 1,
    receiptCode: 'RC-20250310-001',
    status: 'COMPLETED',
    receiptDate: '2025-03-10T09:15:00Z',
    createdByName: 'Nguyễn Văn A',
  },
  {
    receiptId: 2,
    receiptCode: 'RC-20250310-002',
    status: 'DRAFT',
    receiptDate: '2025-03-10T10:30:00Z',
    createdByName: 'Trần Thị B',
  },
  {
    receiptId: 3,
    receiptCode: 'RC-20250309-005',
    status: 'COMPLETED',
    receiptDate: '2025-03-09T17:45:00Z',
    createdByName: 'Lê Văn C',
  },
];

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'ALL'>('ALL');
  const [receipts] = useState<InventoryReceiptRow[]>(MOCK_RECEIPTS);

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
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <FileText className="size-6 text-amber-500" />
              Biên lai nhập kho trung tâm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Manager xem lịch sử các phiếu nhập kho (inventory_receipts) do bếp trung tâm tạo.
            </CardDescription>
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
                          <td className="px-4 py-2 text-[11px] text-stone-800">{r.createdByName}</td>
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
                        </tr>
                      ))}
                      {filteredReceipts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-xs text-stone-500">
                            Không có biên lai nào khớp với bộ lọc.
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerReceiptsPage;
