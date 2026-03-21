/**
 * File: FranchiseCartOverlay.tsx
 * Description: Hiển thị giỏ hàng dưới dạng Overlay/Drawer, hỗ trợ chọn ngày giao
 *              và cập nhật số lượng theo bội số sản phẩm.
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import React, { useMemo, useRef, useState } from 'react';
import { CalendarDays, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import http from '@/lib/axios';
import CartDrawer from '@/components/cart/CartDrawer';
import FloatingCart from '@/components/cart/FloatingCart';
import { cn } from '@/lib/utils';

type Step = 'REVIEW' | 'DATE';

// ================= UTILS =================

const formatCurrencyVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

/**
 * FranchiseCartOverlay Component
 * - Hiển thị danh sách món trong giỏ hàng
 * - Cho phép tăng/giảm số lượng theo orderMultiplier
 * - Chọn ngày giao hàng dự kiến và gửi đơn hàng
 */
export default function FranchiseCartOverlay({ children }: { children: React.ReactNode }) {

  // ================= CONTEXT =================

  const { items, totalQuantity, updateQuantity, removeItem, clear } = useCart();
  const { user } = useAuth();

  // ================= STATE =================

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('REVIEW');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // ================= REF =================

  const deliveryDateRef = useRef<HTMLInputElement | null>(null);

  // ================= UTILS =================

  const canProceed = items.length > 0;
  const totalAmount = useMemo(
    () =>
      items.reduce((sum, i) => {
        const unitPrice = Number(i.unitPrice ?? 0);
        return sum + (Number.isFinite(unitPrice) ? unitPrice : 0) * i.quantity;
      }, 0),
    [items]
  );

  // ================= HANDLER =================

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

  // ================= API =================

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

  // ================= RENDER =================

  return (
    <>
      {children}

      <FloatingCart onClick={() => setOpen(true)} />

      <CartDrawer
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}
        title={
          <div className="flex items-start justify-between gap-3 pr-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight text-amber-950">Giỏ hàng</h2>
              <p className="mt-0.5 text-xs font-medium text-amber-800/70">
                {items.length} món · {totalQuantity} đơn vị
              </p>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-amber-700/60 transition hover:bg-amber-100/80 hover:text-amber-900"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </button>
          </div>
        }
      >
        {step === 'REVIEW' && (
          <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-amber-50/30 to-white">
            <div
              className={cn(
                'min-h-0 grow overflow-y-auto overflow-x-hidden overscroll-y-contain',
                'px-6 pb-3 pt-5 [scrollbar-gutter:stable]',
                'rounded-b-lg'
              )}
            >
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-12 text-center text-sm text-amber-900/70">
                  Giỏ hàng đang trống. Hãy thêm món từ menu.
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((i) => {
                    const itemUnitPrice = Number(i.unitPrice ?? 0);
                    const safeUnit = Number.isFinite(itemUnitPrice) ? itemUnitPrice : 0;
                    return (
                      <li
                        key={i.productId}
                        className="flex items-center gap-4 rounded-xl border border-amber-100/90 bg-white p-4 shadow-sm shadow-amber-100/20"
                      >
                        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-amber-50 ring-1 ring-amber-100">
                          {i.imageUrl ? (
                            <img src={i.imageUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] font-medium text-amber-600/50">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold leading-tight text-stone-900">{i.name}</p>
                          <p className="mt-0.5 text-xs text-amber-900/55">
                            {formatCurrencyVND(safeUnit)}
                            {i.unitName ? <span className="text-amber-700/50"> · {i.unitName}</span> : null}
                            {i.orderMultiplier && i.orderMultiplier > 1 ? (
                              <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                Bội số: {i.orderMultiplier}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const multiplier = i.orderMultiplier || 1;
                              const nextQty = i.quantity - multiplier;
                              if (nextQty < multiplier) {
                                toast.error(`Số lượng tối thiểu là ${multiplier}`);
                                return;
                              }
                              updateQuantity({ productId: i.productId, quantity: nextQty });
                            }}
                            className="flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="size-3.5" strokeWidth={2.5} />
                          </button>
                          <span className="min-w-[1.75rem] text-center text-sm font-bold text-orange-600 tabular-nums">
                            {i.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const multiplier = i.orderMultiplier || 1;
                              updateQuantity({ productId: i.productId, quantity: i.quantity + multiplier });
                            }}
                            className="flex size-8 items-center justify-center rounded-lg border border-orange-300 bg-orange-500 text-white shadow-sm transition hover:bg-orange-600"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="size-3.5" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem({ productId: i.productId })}
                            className="ml-0.5 flex size-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                            aria-label="Xóa"
                            title="Xóa"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-auto flex shrink-0 flex-col border-t border-amber-100 bg-gradient-to-t from-orange-50/40 to-white px-6 pb-6 pt-5 shadow-[0_-6px_16px_-8px_rgba(251,146,60,0.12)]">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-amber-900/65">
                  <span>Tạm tính</span>
                  <span className="tabular-nums text-amber-950">{formatCurrencyVND(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-900/65">
                  <span>Thuế</span>
                  <span className="tabular-nums text-amber-950">{formatCurrencyVND(0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-amber-100/80 pt-2 text-base font-bold">
                  <span className="text-amber-950">Tổng cộng</span>
                  <span className="tabular-nums text-xl text-orange-600">{formatCurrencyVND(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={() => {
                    clear();
                    toast.success('Đã xóa giỏ hàng');
                  }}
                  className={cn(
                    'text-xs font-semibold text-amber-800/60 underline-offset-2 hover:text-orange-700 hover:underline',
                    'disabled:pointer-events-none disabled:opacity-40'
                  )}
                >
                  Xóa giỏ
                </button>
              </div>

              <Button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep('DATE')}
                className={cn(
                  'mt-3 h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white shadow-md shadow-orange-200/50',
                  'transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-50'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart className="size-5" />
                  Tiếp tục đặt hàng
                </span>
              </Button>
            </div>
          </div>
        )}

        {step === 'DATE' && (
          <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-amber-50/30 to-white">
            <div
              className={cn(
                'min-h-0 grow overflow-y-auto overflow-x-hidden overscroll-y-contain',
                'px-6 pb-3 pt-5 [scrollbar-gutter:stable] rounded-b-lg'
              )}
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-amber-950">Ngày giao dự kiến</p>
                  <p className="mt-1 text-xs text-amber-900/60">
                    Bếp trung tâm sẽ xử lý theo ngày giao bạn chọn.
                  </p>
                  <div className="relative mt-3">
                    <input
                      ref={deliveryDateRef}
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      onFocus={openDatePicker}
                      className={cn(
                        'h-11 w-full cursor-pointer rounded-lg border border-amber-200 bg-white px-3 pr-11 text-sm text-amber-950',
                        'placeholder:text-amber-900/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/25'
                      )}
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-amber-600 transition hover:bg-amber-100 hover:text-orange-600"
                      aria-label="Mở lịch chọn ngày"
                    >
                      <CalendarDays className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-3 py-3 text-xs text-amber-900/70">
                  <div className="flex justify-between">
                    <span className="font-medium">Tổng cộng</span>
                    <span className="font-bold text-orange-600">{formatCurrencyVND(totalAmount)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800/55">
                    {items.length} món · {totalQuantity} đơn vị
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex shrink-0 flex-col space-y-3 border-t border-amber-100 bg-gradient-to-t from-orange-50/30 to-white px-6 pb-6 pt-4 shadow-[0_-6px_16px_-8px_rgba(251,146,60,0.12)]">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-xl border-amber-200 bg-white text-sm font-semibold text-amber-900 hover:bg-amber-50"
                onClick={() => setStep('REVIEW')}
                disabled={submitting}
              >
                Quay lại
              </Button>
              <Button
                type="button"
                onClick={submitOrder}
                disabled={submitting || items.length === 0}
                className={cn(
                  'h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white shadow-md shadow-orange-200/50',
                  'hover:from-amber-600 hover:to-orange-600 disabled:opacity-50'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {submitting ? null : <ShoppingCart className="size-5" />}
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </span>
              </Button>
            </div>
          </div>
        )}
      </CartDrawer>
    </>
  );
}
