import type React from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
interface item {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface SideBarLayoutProps {
  items: readonly item[];
  activeItem: string;
  /** Nội dung hiển thị ở góc dưới sidebar (vd: avatar + tên cửa hàng + đăng xuất cho Store) */
  footerContent?: React.ReactNode;
}

export default function SideBarLayout({ items, activeItem, footerContent }: SideBarLayoutProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-svh w-64 flex-col border-r border-border bg-white shadow-sm">
      <div className="flex h-20 items-center gap-3 border-b border-border px-5">
        <img src="/logo.png" alt="PIZZA FIVE GUYS logo" className="h-12 w-12 rounded-md object-contain" />
        <span className="text-lg font-bold text-foreground">PIZZA FIVE GUYS</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive = activeItem === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-amber-50 hover:text-foreground'
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {footerContent && (
        <div className="border-t border-border p-3">
          {footerContent}
        </div>
      )}
    </aside>
  );
}
