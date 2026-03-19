import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

type Props = {
  onClick?: () => void;
  className?: string;
};

const formatCompact = (value: number) => {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace('.0', '')}tr`;
  if (value >= 1_000)
    return `${Math.round(value / 1_000)}k`;
  return `${value}`;
};

export default function FloatingCart({ onClick, className }: Props) {
  const { totalQuantity, items } = useCart();
  const totalAmount = items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0);

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2', className)}>

      {/* Mini price tag — chỉ hiện khi có hàng */}
      {totalQuantity > 0 && totalAmount > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 shadow-lg shadow-amber-100/60">
          <span className="text-[10px] font-semibold text-stone-500">{totalQuantity} món</span>
          <span className="h-3 w-px bg-stone-200" />
          <span className="text-xs font-extrabold text-amber-600">
            {formatCompact(totalAmount)}đ
          </span>
        </div>
      )}

      {/* FAB button */}
      <button
        type="button"
        onClick={onClick}
        aria-label="Mở giỏ hàng"
        className={cn(
          'relative inline-flex size-16 items-center justify-center rounded-full',
          'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white',
          'shadow-[0_8px_24px_rgba(249,115,22,0.40)] ring-4 ring-white',
          'transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(249,115,22,0.48)] active:scale-[0.96]',
          totalQuantity > 0 && 'after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-orange-400/30'
        )}
      >
        {/* Gloss highlight */}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30" />
        <ShoppingCart className="relative size-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.20)]" />

        {/* Quantity badge */}
        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ring-2 ring-white shadow-md animate-in zoom-in-95">
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </span>
        )}
      </button>
    </div>
  );
}
