/**
 * File: InventoryTransactions.tsx
 * Description: Hiển thị nhật ký giao dịch kho (Sổ cái kho), cho phép theo dõi
 *              các hoạt động nhập, xuất và điều chỉnh tồn kho.
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { useEffect, useMemo, useState } from 'react';

/* Thành phần UI và Icons */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeftRight, Package, Search } from 'lucide-react';

/* Utils và Services */
import { cn } from '@/lib/utils';
import { kitchenServices, type InventoryTransactionResponse, type TransactionType } from '@/services/kitchenServices';

// ================= UTILS (CONSTANTS) =================

/**
 * Nhãn hiển thị cho các loại giao dịch
 */
const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  ADJUST: 'Điều chỉnh',
};

/**
 * Class CSS cho các loại giao dịch
 */
const TRANSACTION_TYPE_CLASS: Record<TransactionType, string> = {
  IMPORT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPORT: 'bg-rose-50 text-rose-700 border-rose-200',
  ADJUST: 'bg-amber-50 text-amber-800 border-amber-200',
};

const FILTER_OPTIONS: (TransactionType | 'ALL')[] = ['ALL', 'IMPORT', 'EXPORT', 'ADJUST'];

/**
 * InventoryTransactions Component
 * - Hiển thị danh sách giao dịch kho
 * - Thống kê tổng nhập, tổng xuất
 * - Hỗ trợ lọc theo loại giao dịch và tìm kiếm
 */
const InventoryTransactions = () => {

  // ================= STATE =================

  // Danh sách giao dịch từ API
  const [inventoryTransaction, setInventoryTransaction] = useState<InventoryTransactionResponse[]>([]);

  // Từ khóa tìm kiếm
  const [search, setSearch] = useState('');

  // Bộ lọc loại giao dịch
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // ================= EFFECT =================

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchInventoryTransaction();
  }, []);

  // ================= API =================

  /**
   * Lấy dữ liệu nhật ký giao dịch từ Backend
   */
  const fetchInventoryTransaction = async () => {
    try {
      setIsLoading(true);
      const response = await kitchenServices.getInventoryTransaction();
      if (response.success) {
        setInventoryTransaction(response.data.items);
      }
    } catch (error) {
      console.error('Lỗi khi tải giao dịch kho:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= HANDLER =================

  /**
   * Cập nhật loại bộ lọc
   */
  const handleFilterChange = (opt: TransactionType | 'ALL') => {
    setTypeFilter(opt);
  };

  /**
   * Cập nhật từ khóa tìm kiếm
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // ================= UTILS (COMPUTED) =================

  /**
   * Định dạng thời gian sang kiểu Việt Nam
   */
  const formatDateTime = (value: string) => {
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

  const totalImport = useMemo(
    () => inventoryTransaction.filter((t) => t.transactionType === 'IMPORT').reduce((sum, t) => sum + t.quantity, 0),
    [inventoryTransaction]
  );

  const totalExport = useMemo(
    () => inventoryTransaction.filter((t) => t.transactionType === 'EXPORT').reduce((sum, t) => sum + t.quantity, 0),
    [inventoryTransaction]
  );

  const netChange = useMemo(() => totalImport - totalExport, [totalImport, totalExport]);

  /**
   * Lọc và sắp xếp danh sách giao dịch
   */
  const filteredTransactions = useMemo(() => {
    let data = [...inventoryTransaction];

    if (typeFilter !== 'ALL') {
      data = data.filter((t) => t.transactionType === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.productName.toLowerCase().includes(q) ||
          t.referenceCode.toLowerCase().includes(q) ||
          (t.batchCode ?? '').toLowerCase().includes(q)
      );
    }

    // Sắp xếp mới nhất trước
    return data.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [inventoryTransaction, search, typeFilter]);

  // ================= RENDER =================

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        {/* Header Section */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <ArrowLeftRight className="size-6 text-amber-500" />
              Giao dịch tồn kho
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Nhật ký nhập, xuất và điều chỉnh tồn kho trung tâm.
            </CardDescription>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng nhập</span>
              <span className="text-lg font-semibold text-emerald-700">+{totalImport.toLocaleString('vi-VN')}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng xuất</span>
              <span className="text-lg font-semibold text-rose-700">-{totalExport.toLocaleString('vi-VN')}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Chênh lệch</span>
              <span className={cn('text-lg font-semibold', netChange >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                {netChange >= 0 ? '+' : ''}
                {netChange.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Filters and Search Section */}
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <input
                type="text"
                placeholder="Tìm theo sản phẩm, mã chứng từ, mã lô..."
                value={search}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-amber-200 bg-amber-50/40 py-2 pl-9 pr-3 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs text-amber-900">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleFilterChange(opt)}
                    className={cn(
                      'px-3 py-1.5 transition',
                      opt !== 'ALL' && 'border-l border-amber-200',
                      typeFilter === opt ? 'bg-amber-500 text-white' : 'hover:bg-amber-100'
                    )}
                  >
                    {opt === 'ALL' ? 'Tất cả' : TRANSACTION_TYPE_LABEL[opt]}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInventoryTransaction}
                className="rounded-full border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Main Table Section */}
          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <ArrowLeftRight className="size-4 text-amber-500" />
                Nhật ký giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                      <th className="px-4 py-3 font-semibold text-amber-900">Thời gian</th>
                      <th className="px-4 py-3 font-semibold text-amber-900">Sản phẩm</th>
                      <th className="px-2 py-3 font-semibold text-center text-amber-900">Mã lô</th>
                      <th className="px-2 py-3 font-semibold text-center text-amber-900">Loại</th>
                      <th className="px-2 py-3 font-semibold text-center text-amber-900">Số lượng</th>
                      <th className="px-4 py-3 font-semibold text-right text-amber-900">Chứng từ & Người tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-amber-700">
                          Đang tải dữ liệu...
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => {
                        const isImport = t.transactionType === 'IMPORT';
                        const isExport = t.transactionType === 'EXPORT';
                        const sign = isImport ? '+' : isExport ? '-' : '±';

                        return (
                          <tr key={t.transactionId} className="hover:bg-amber-50/40">
                            <td className="px-4 py-3 text-[11px] text-stone-800">{formatDateTime(t.transactionDate)}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-stone-900">{t.productName}</p>
                              <p className="text-[10px] text-stone-500 italic">{t.note}</p>
                            </td>
                            <td className="px-2 py-3 text-center text-[11px] font-mono text-stone-800">
                              {t.batchCode || '—'}
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                  TRANSACTION_TYPE_CLASS[t.transactionType]
                                )}
                              >
                                {TRANSACTION_TYPE_LABEL[t.transactionType]}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
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
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[11px] font-bold text-amber-900">{t.referenceCode}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[10px] font-medium text-stone-600">
                                  <Package className="size-3" />
                                  {t.createdByFullName}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {!isLoading && filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-stone-500">
                          Không có giao dịch nào phù hợp với bộ lọc và từ khóa tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info Section */}
          <div className="flex items-center gap-2 text-[11px] text-amber-700/80">
            <AlertTriangle className="size-4 text-amber-500" />
            <span>Dữ liệu giao dịch kho được cập nhật tự động từ các hoạt động nhập/xuất và điều chỉnh kho.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTransactions;
