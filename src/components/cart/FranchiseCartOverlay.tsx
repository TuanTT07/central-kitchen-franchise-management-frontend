import React, { useMemo, useRef, useState } from 'react';
import { CalendarDays, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import http from '@/lib/axios';
import CartDrawer from '@/components/cart/CartDrawer';
import FloatingCart from '@/components/cart/FloatingCart';
import { cn } from '@/lib/utils';

type Step = 'REVIEW' | 'DATE';

const formatCurrencyVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function FranchiseCartOverlay({ children }: { children: React.ReactNode }) {
  const { items, totalQuantity, updateQuantity, removeItem, clear } = useCart();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('REVIEW');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const deliveryDateRef = useRef<HTMLInputElement | null>(null);

  const canProceed = items.length > 0;
  const totalAmount = useMemo(
    () =>
      items.reduce((sum, i) => {
        const unitPrice = Number(i.unitPrice ?? 0);
        return sum + (Number.isFinite(unitPrice) ? unitPrice : 0) * i.quantity;
      }, 0),
    [items]
  );

  const closeAndReset = () => {
    setOpen(false);
    setStep('REVIEW');
    setDeliveryDate('');
    setSubmitting(false);
  };

  const openDatePicker = () => {
    const el = deliveryDateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
      return;
    }
    el.focus();
    el.click();
  };

  const submitOrder = async () => {
    let currentUser: any = user;
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) currentUser = JSON.parse(storedUser);
      } catch {
        // ignore invalid stored user
      }
    }

    const finalStoreId = Number(currentUser?.id);
    if (!Number.isFinite(finalStoreId) || finalStoreId <= 0) {
      toast.error('Không xác định được tài khoản. Vui lòng đăng nhập lại.');
      return;
    }
    if (!deliveryDate) {
      toast.error('Vui lòng chọn ngày giao dự kiến.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (deliveryDate < todayStr) {
      toast.error('Ngày giao phải từ hôm nay trở đi.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        storeId: finalStoreId,
        deliveryDate,
        details: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      await http.post('/orders', payload);

      toast.success('Tạo đơn hàng thành công! Yêu cầu của bạn đã được gửi lên Bếp trung tâm.');
      clear();
      closeAndReset();
    } catch (error) {
      console.error(error);
      toast.error('Gửi yêu cầu thất bại (xem Console/Network để biết lỗi backend).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {children}

      <FloatingCart onClick={() => setOpen(true)} />

      <CartDrawer
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}
        title={
          <div className="flex items-center justify-between">
            <span>Giỏ hàng</span>
            <span className="text-sm font-semibold text-amber-700">
              {items.length} món · {totalQuantity} đơn vị
            </span>
          </div>
        }
      >
        {step === 'REVIEW' && (
          <div className="space-y-5 px-6 py-5">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-10 text-center text-sm text-amber-800">
                Giỏ hàng đang trống. Hãy thêm món từ menu.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((i) => {
                  const itemUnitPrice = Number(i.unitPrice ?? 0);
                  const itemAmount = (Number.isFinite(itemUnitPrice) ? itemUnitPrice : 0) * i.quantity;
                  return (
                    <div
                      key={i.productId}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-stone-900">{i.name}</p>
                        <p className="text-sm text-stone-600">
                          Đơn vị: <span className="font-medium text-stone-800">{i.unitName ?? '—'}</span>
                        </p>
                        <p className="text-sm text-stone-600">
                          Đơn giá: <span className="font-medium text-stone-800">{formatCurrencyVND(itemUnitPrice)}</span>
                        </p>
                        <p className="text-sm font-bold text-amber-700">
                          Thành tiền: <span className="text-amber-800">{formatCurrencyVND(itemAmount)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity({ productId: i.productId, quantity: i.quantity - 1 })}
                            className="flex size-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-[2.75rem] text-center text-base font-bold text-stone-900">
                            {i.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity({ productId: i.productId, quantity: i.quantity + 1 })}
                            className="flex size-10 items-center justify-center rounded-full border border-amber-400 bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem({ productId: i.productId })}
                          className="flex size-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          aria-label="Xóa"
                          title="Xóa"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <div className="mr-auto rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 text-sm text-amber-900">
                <span className="font-semibold">Tổng tiền:</span>{' '}
                <span className="text-base font-bold text-amber-800">{formatCurrencyVND(totalAmount)}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 border-amber-200 px-4 text-sm text-amber-900 hover:bg-amber-50"
                disabled={items.length === 0}
                onClick={() => {
                  clear();
                  toast.success('Đã xóa giỏ hàng');
                }}
              >
                Xóa giỏ
              </Button>
              <Button
                type="button"
                size="sm"
                className={cn(
                  'h-10 bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-semibold text-white',
                  'hover:from-amber-600 hover:to-orange-600'
                )}
                disabled={!canProceed}
                onClick={() => setStep('DATE')}
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )}

        {step === 'DATE' && (
          <div className="space-y-4 px-5 py-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Chọn ngày giao dự kiến</p>
              <p className="mt-1 text-[11px] text-stone-600">
                Bếp trung tâm sẽ xử lý theo ngày giao bạn chọn.
              </p>
              <div className="mt-3">
                <label className="text-[11px] font-medium text-stone-700">Ngày giao</label>
                <div className="relative mt-1">
                  <input
                    ref={deliveryDateRef}
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    onFocus={openDatePicker}
                    className={cn(
                      'h-9 w-full rounded-md border border-amber-200 bg-white pl-3 pr-10 text-xs text-stone-900',
                      'focus-visible:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300'
                    )}
                  />
                  <button
                    type="button"
                    onClick={openDatePicker}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-amber-700 hover:bg-amber-100"
                    aria-label="Mở lịch chọn ngày"
                  >
                    <CalendarDays className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 border-amber-200 text-xs text-amber-900 hover:bg-amber-50"
                onClick={() => setStep('REVIEW')}
                disabled={submitting}
              >
                Quay lại
              </Button>
              <Button
                type="button"
                size="sm"
                className={cn(
                  'h-9 bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-xs font-semibold text-white',
                  'hover:from-amber-600 hover:to-orange-600'
                )}
                onClick={submitOrder}
                disabled={submitting || items.length === 0}
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu lên bếp trung tâm'}
              </Button>
            </div>
          </div>
        )}
      </CartDrawer>
    </>
  );
}

