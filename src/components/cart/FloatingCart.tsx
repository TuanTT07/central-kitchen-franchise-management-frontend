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
        'fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
        'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
        'shadow-xl shadow-orange-200/70 ring-1 ring-white/50',
        'transition hover:from-amber-600 hover:to-orange-600 hover:shadow-orange-200/90 active:scale-[0.98]',
        className
      )}
      aria-label="Mở giỏ hàng"
    >
      <ShoppingCart className="h-7 w-7" />
      {totalQuantity > 0 && (
        <span
          className={cn(
            'absolute -right-2 -top-2 inline-flex min-w-6 items-center justify-center rounded-full',
            'bg-rose-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white',
            'ring-2 ring-white shadow-md'
          )}
        >
          {totalQuantity > 99 ? '99+' : totalQuantity}
        </span>
      )}
    </button>
  );
}

