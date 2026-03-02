import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">{children}</div>
    </div>
  );
}

interface DialogContentProps extends React.ComponentProps<'div'> {
  onClose?: () => void;
}

export function DialogContent({
  className,
  onClose,
  children,
  ...props
}: DialogContentProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-2xl rounded-2xl border border-amber-200/60 bg-white p-8 shadow-xl',
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-amber-50 p-1.5 text-amber-700 shadow-sm transition hover:bg-amber-100"
        >
          <X className="size-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-xl font-semibold leading-none', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex justify-end gap-3 pt-6', className)}
      {...props}
    />
  );
}

