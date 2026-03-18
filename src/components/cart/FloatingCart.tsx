import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

type Props = {
  onClick?: () => void;
  className?: string;
};

export default function FloatingCart({ onClick, className }: Props) {
  const { totalQuantity } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Keep away from screen edge/sidebar footer and align with modern FAB spacing.
        'fixed bottom-5 right-5 z-50 inline-flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full',
        'border border-amber-300/50 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white',
        'shadow-[0_12px_30px_rgba(249,115,22,0.35)] ring-4 ring-amber-100/70',
        'transition duration-200 hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-600 hover:shadow-[0_16px_34px_rgba(249,115,22,0.42)] active:scale-[0.97]',
        className
      )}
      aria-label="Mở giỏ hàng"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30" />
      <ShoppingCart className="relative h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
      {totalQuantity > 0 && (
        <span
          className={cn(
            'absolute -right-1.5 -top-1.5 inline-flex min-w-6 items-center justify-center rounded-full',
            'bg-rose-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white',
            'ring-2 ring-white shadow-md shadow-rose-200 animate-in zoom-in-95'
          )}
        >
          {totalQuantity > 99 ? '99+' : totalQuantity}
        </span>
      )}
    </button>
  );
}

