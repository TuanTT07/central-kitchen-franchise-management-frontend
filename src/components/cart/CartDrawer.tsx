import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
        className="flex h-[min(92dvh,calc(100dvh-2rem))] max-h-[92dvh] w-[min(96vw,560px)] max-w-none flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white p-0"
      >
        <div className="shrink-0 border-b border-amber-100 bg-white px-5 py-4">
          <div className="text-base font-semibold text-amber-950">{title}</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

