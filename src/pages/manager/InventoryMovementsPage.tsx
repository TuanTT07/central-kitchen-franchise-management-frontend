/**
 * File: InventoryMovementsPage.tsx
 * Description: Trang "Biến động kho" cho manager - hiển thị lịch sử giao dịch tồn kho (sổ cái kho).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Info,
  UtensilsCrossed,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { kitchenServices, type InventoryTransactionResponse, type TransactionType } from '@/services/kitchenServices';

const PAGE_SIZE = 10;

const FILTER_OPTIONS: (TransactionType | 'ALL')[] = ['ALL', 'IMPORT', 'EXPORT', 'ADJUST'];

const FILTER_LABEL: Record<TransactionType | 'ALL', string> = {
  ALL: 'Tất cả',
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  ADJUST: 'Điều chỉnh',
};

const formatDateTime = (value: string | null | undefined) => {
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

function TxBadge({ type }: { type: string }) {
  const transactionType = type as TransactionType;

  if (transactionType === 'IMPORT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 border border-green-100">
        <ArrowDownToLine className="size-3" /> Nhập kho
      </span>
    );
  }

  if (transactionType === 'EXPORT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
        <ArrowUpFromLine className="size-3" /> Xuất kho
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
      <SlidersHorizontal className="size-3" /> Điều chỉnh
    </span>
  );
}

const PaginationBar = ({
  page,
  totalPages,
  totalItems,
  unit,
  loading,
  onPrev,
  onNext,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  unit: string;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const current = page + 1; // UI dùng 1-based
  const windowStart = Math.max(1, current - 2);
  const windowEnd = Math.min(safeTotalPages, current + 2);
  const pagesSet = new Set<number>([1, safeTotalPages]);
  for (let p = windowStart; p <= windowEnd; p += 1) pagesSet.add(p);
  const pages = Array.from(pagesSet).sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50/30 px-5 py-3">
      <p className="text-xs text-stone-500">
        {(page) * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalItems)} / {totalItems} {unit}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 0 || loading}
          className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((p) => {
          const isActive = p === page + 1;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p - 1)}
              disabled={loading}
              className={cn(
                'flex size-7 items-center justify-center rounded-lg border text-xs font-semibold transition',
                isActive
                  ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                  : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50',
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onNext}
          disabled={page >= safeTotalPages - 1 || loading}
          className="flex size-7 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default function InventoryMovementsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // page: 0-based để khớp backend (PaginatedResponse.page)
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [transactions, setTransactions] = useState<InventoryTransactionResponse[]>([]);

  // lọc client-side (chỉ áp dụng trên trang hiện tại)
  const [searchCode, setSearchCode] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');

  const fetchPage = async (pageIndex: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await kitchenServices.getInventoryTransaction({
        sort: 'transactionDate,desc',
        size: PAGE_SIZE,
        page: pageIndex,
      });

      const payload = res as unknown as {
        success?: boolean;
        data?: {
          items?: InventoryTransactionResponse[];
          totalPages?: number;
          totalElements?: number;
        };
      };

      const items = payload?.data?.items;
      setTransactions(Array.isArray(items) ? items : []);
      setTotalPages(payload?.data?.totalPages ?? 1);
      setTotalElements(payload?.data?.totalElements ?? (Array.isArray(items) ? items.length : 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu biến động kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const displayTransactions = useMemo(() => {
    let data = transactions;
    if (typeFilter !== 'ALL') {
      data = data.filter((t) => t.transactionType === typeFilter);
    }
    const q = searchCode.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (t) =>
          t.referenceCode?.toLowerCase().includes(q) ||
          t.productName?.toLowerCase().includes(q) ||
          t.batchCode?.toLowerCase().includes(q),
      );
    }
    return data;
  }, [transactions, searchCode, typeFilter]);

  const today = useMemo(() => new Date(), []);

  if (loading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-9 animate-spin text-amber-500" />
        <p className="text-sm font-medium text-amber-700">Đang tải biến động kho...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <p className="font-semibold">Lỗi tải dữ liệu</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2 md:p-1">
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <UtensilsCrossed className="size-6 text-amber-500" />
              Biến động kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Lịch sử nhập / xuất / điều chỉnh tồn kho (sắp xếp theo thời gian mới nhất).
            </CardDescription>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Cập nhật</span>
              <span className="mt-0.5 text-xs font-semibold text-amber-900">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3 text-amber-500" />
                  {today.toLocaleDateString('vi-VN')}
                </span>
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Toolbar (giống kiểu trang trong supply) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center p-4 bg-white rounded-xl border border-amber-100 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <Input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Tìm theo mã GD, sản phẩm, mã lô..."
            className="h-10 pl-9 text-xs border-amber-200 bg-amber-50/40 focus:ring-amber-500/20 focus:border-amber-400 rounded-lg"
          />
        </div>

        <div className="relative flex h-9 flex-none items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'ALL')}
            className="cursor-pointer appearance-none bg-transparent pr-6 text-xs font-semibold text-amber-900 outline-none"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {FILTER_LABEL[opt]}
              </option>
            ))}
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchCode('');
            setTypeFilter('ALL');
            if (page !== 0) setPage(0);
            fetchPage(0);
          }}
          className="h-9 flex-none gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-amber-700/70">
          <Info className="size-3.5 text-amber-400" />
          Dữ liệu từ hệ thống quản lý kho trung tâm
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-amber-50/30 border-b border-amber-100 text-[10px] font-black uppercase tracking-widest text-amber-900/60">
                <tr>
                  <th className="px-6 py-4">Mã GD</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Mã lô</th>
                  <th className="px-6 py-4 text-right">Số lượng</th>
                  <th className="px-6 py-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {displayTransactions.map((row) => (
                  <tr key={row.transactionId} className="transition hover:bg-amber-50/40">
                    <td className="px-6 py-3 font-mono text-[11px] text-stone-500">{row.referenceCode}</td>
                    <td className="px-6 py-3">
                      <TxBadge type={row.transactionType} />
                    </td>
                    <td className="px-6 py-3 font-medium text-stone-800">{row.productName}</td>
                    <td className="px-6 py-3 font-mono text-amber-700">{row.batchCode}</td>
                    <td className="px-6 py-3 text-right font-semibold text-stone-900">
                      {row.quantity.toLocaleString('vi-VN')} {row.unit}
                    </td>
                    <td className="px-6 py-3 text-stone-500">{formatDateTime(row.transactionDate)}</td>
                  </tr>
                ))}

                {displayTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-xs italic text-stone-400">
                      Không có giao dịch phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {totalElements > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalElements}
            unit="giao dịch"
            loading={loading}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            onPage={(p) => setPage(p)}
          />
        )}
      </Card>
    </div>
  );
}

