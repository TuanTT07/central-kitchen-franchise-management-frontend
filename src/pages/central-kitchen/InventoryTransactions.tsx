import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeftRight, CalendarClock, Package, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Đồng bộ DB (public schema – giả định từ mô tả trước):
 *
 * inventory_transactions:
 *   transaction_id (PK, identity),
 *   product_id (FK products),
 *   batch_id   (FK product_batches, nullable),
 *   quantity   (integer, >0),
 *   unit       (text),
 *   transaction_type CHECK ('IMPORT' | 'EXPORT' | 'ADJUST'),
 *   ref_code   (mã chứng từ: IR-..., EX-...),
 *   created_at (timestamptz)
 *
 * Giao diện mô phỏng:
 * - IMPORT  = nhập kho từ `inventory_receipts` (IR-...)
 * - EXPORT  = xuất kho theo `export_notes` (EX-...)
 * - ADJUST  = điều chỉnh tồn kho (kiểm kê, hủy hỏng, ...)
 */

type TransactionType = 'IMPORT' | 'EXPORT' | 'ADJUST';
type TransactionSource = 'RECEIPT' | 'EXPORT_NOTE' | 'MANUAL';

interface InventoryTransaction {
  transaction_id: number;
  product_id: number;
  product_name: string;
  batch_code: string | null;
  quantity: number;
  unit: string;
  transaction_type: TransactionType;
  source: TransactionSource;
  ref_code: string;
  created_at: string;
}

const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  ADJUST: 'Điều chỉnh',
};

const TRANSACTION_TYPE_CLASS: Record<TransactionType, string> = {
  IMPORT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPORT: 'bg-rose-50 text-rose-700 border-rose-200',
  ADJUST: 'bg-amber-50 text-amber-800 border-amber-200',
};

const FILTER_OPTIONS: (TransactionType | 'ALL')[] = ['ALL', 'IMPORT', 'EXPORT', 'ADJUST'];

const MOCK_TRANSACTIONS: InventoryTransaction[] = [
  {
    transaction_id: 1,
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    batch_code: 'LOT-COMGA-001',
    quantity: 200,
    unit: 'phần',
    transaction_type: 'IMPORT',
    source: 'RECEIPT',
    ref_code: 'IR-20260304-001',
    created_at: '2026-03-04T08:15:00Z',
  },
  {
    transaction_id: 2,
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    batch_code: 'LOT-COMGA-001',
    quantity: 80,
    unit: 'phần',
    transaction_type: 'EXPORT',
    source: 'EXPORT_NOTE',
    ref_code: 'EX-20260304-001',
    created_at: '2026-03-04T09:30:00Z',
  },
  {
    transaction_id: 3,
    product_id: 2,
    product_name: 'Phở bò tái',
    batch_code: 'LOT-PHO-001',
    quantity: 70,
    unit: 'tô',
    transaction_type: 'IMPORT',
    source: 'RECEIPT',
    ref_code: 'IR-20260303-001',
    created_at: '2026-03-03T07:45:00Z',
  },
  {
    transaction_id: 4,
    product_id: 2,
    product_name: 'Phở bò tái',
    batch_code: 'LOT-PHO-001',
    quantity: 40,
    unit: 'tô',
    transaction_type: 'EXPORT',
    source: 'EXPORT_NOTE',
    ref_code: 'EX-20260303-001',
    created_at: '2026-03-03T10:10:00Z',
  },
  {
    transaction_id: 5,
    product_id: 4,
    product_name: 'Thịt bò phi lê',
    batch_code: 'LOT-BOFILE-001',
    quantity: 5,
    unit: 'kg',
    transaction_type: 'ADJUST',
    source: 'MANUAL',
    ref_code: 'ADJ-20260302-001',
    created_at: '2026-03-02T15:20:00Z',
  },
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

function InventoryTransactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');

  const totalImport = useMemo(
    () =>
      MOCK_TRANSACTIONS.filter((t) => t.transaction_type === 'IMPORT').reduce(
        (sum, t) => sum + t.quantity,
        0
      ),
    []
  );
  const totalExport = useMemo(
    () =>
      MOCK_TRANSACTIONS.filter((t) => t.transaction_type === 'EXPORT').reduce(
        (sum, t) => sum + t.quantity,
        0
      ),
    []
  );
  const netChange = useMemo(() => totalImport - totalExport, [totalImport, totalExport]);

  const filteredTransactions = useMemo(() => {
    let data = MOCK_TRANSACTIONS;

    if (typeFilter !== 'ALL') {
      data = data.filter((t) => t.transaction_type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.product_name.toLowerCase().includes(q) ||
          t.ref_code.toLowerCase().includes(q) ||
          (t.batch_code ?? '').toLowerCase().includes(q)
      );
    }

    // Sắp xếp mới nhất trước theo created_at
    return [...data].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [search, typeFilter]);

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <ArrowLeftRight className="size-6 text-amber-500" />
              Giao dịch tồn kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Nhật ký `inventory_transactions` · nhập, xuất và điều chỉnh tồn kho theo sản phẩm / lô.
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng nhập
              </span>
              <span className="text-lg font-semibold text-emerald-700">
                +{totalImport.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng xuất
              </span>
              <span className="text-lg font-semibold text-rose-700">
                -{totalExport.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Chênh lệch
              </span>
              <span
                className={cn(
                  'text-lg font-semibold',
                  netChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                )}
              >
                {netChange >= 0 ? '+' : '-'}
                {Math.abs(netChange).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo sản phẩm, mã chứng từ, mã lô..."
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
                    onClick={() => setTypeFilter(opt)}
                    className={cn(
                      'px-3 py-1.5 transition',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      typeFilter === opt
                        ? 'bg-amber-500 text-white'
                        : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : TRANSACTION_TYPE_LABEL[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <ArrowLeftRight className="size-4 text-amber-500" />
                Nhật ký giao dịch
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                inventory_transactions · filter theo transaction_type, tìm kiếm theo sản phẩm / mã chứng từ / mã lô.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-2 font-semibold">Thời gian</th>
                      <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                      <th className="px-2 py-2 font-semibold text-center">Mã lô</th>
                      <th className="px-2 py-2 font-semibold text-center">Loại</th>
                      <th className="px-2 py-2 font-semibold text-center">Số lượng</th>
                      <th className="px-4 py-2 font-semibold text-right">Chứng từ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {filteredTransactions.map((t) => {
                      const isImport = t.transaction_type === 'IMPORT';
                      const isExport = t.transaction_type === 'EXPORT';
                      const sign = isImport ? '+' : isExport ? '-' : '±';

                      return (
                        <tr key={t.transaction_id} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 text-[11px] text-stone-800">
                            {formatDateTime(t.created_at)}
                          </td>
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-stone-900">
                              {t.product_name}
                            </p>
                            <p className="text-[11px] text-stone-500">product_id: {t.product_id}</p>
                          </td>
                          <td className="px-2 py-2 text-center text-[11px] text-stone-800">
                            {t.batch_code ?? '—'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                TRANSACTION_TYPE_CLASS[t.transaction_type]
                              )}
                            >
                              {TRANSACTION_TYPE_LABEL[t.transaction_type]}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                isImport
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : isExport
                                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-800'
                              )}
                            >
                              {sign}
                              {t.quantity.toLocaleString('vi-VN')} {t.unit}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[11px] font-medium text-stone-800">
                                {t.ref_code}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[10px] font-medium text-stone-600">
                                <Package className="size-3" />
                                {t.source === 'RECEIPT'
                                  ? 'Từ biên lai'
                                  : t.source === 'EXPORT_NOTE'
                                    ? 'Từ phiếu xuất'
                                    : 'Điều chỉnh thủ công'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-xs text-stone-500"
                        >
                          Không có giao dịch nào khớp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-[11px] text-amber-700/80">
            <AlertTriangle className="size-4 text-amber-500" />
            <span>
              Khi backend sẵn sàng, màn hình này sẽ lấy dữ liệu trực tiếp từ bảng
              `inventory_transactions` (JOIN products, product_batches, inventory_receipts,
              export_notes).
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InventoryTransactions;
