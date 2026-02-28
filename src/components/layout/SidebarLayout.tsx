import { Link } from 'react-router';
import { UtensilsCrossed } from 'lucide-react';
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
}

export default function SideBarLayout({ items, activeItem }: SideBarLayoutProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-svh w-64 flex-col border-r border-border bg-white shadow-sm">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex size-9 items-center justify-center rounded-full bg-amber-500">
          <UtensilsCrossed className="size-5 text-white" />
        </div>
        <span className="text-lg font-bold text-foreground">Kitchen Hub</span>
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
    </aside>
  );
}
