import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
};

export default function CartDrawer({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed right-0 top-0 h-[100dvh] w-full max-w-md overflow-hidden rounded-none border-l border-amber-100 bg-white p-0',
          'shadow-2xl sm:max-w-lg'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
            <div className="text-base font-semibold text-amber-900">{title}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

