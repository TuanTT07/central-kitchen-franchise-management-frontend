import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UtensilsCrossed,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  roleLabel: string;
}

export function DashboardLayout({ children, navItems, roleLabel }: DashboardLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const userName = user?.userFullName ?? 'User';
  const roleName = localStorage.getItem('userRole') ?? roleLabel;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-svh bg-[#f8fafc] text-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-svh w-64 flex-col border-r border-border bg-white shadow-sm">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex size-9 items-center justify-center rounded-full bg-amber-500">
            <UtensilsCrossed className="size-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">Kitchen Hub</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-500 text-white'
                    : 'text-muted-foreground hover:bg-amber-50 hover:text-foreground'
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

      {/* Main content */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white px-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Xin chào <span className="font-medium text-foreground">{userName}</span>, chào mừng trở lại!
          </p>
          <div className="flex flex-1 max-w-md items-center gap-2 px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              className="h-9 border-0 bg-muted/50 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-9">
              <Bell className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-9">
              <Settings className="size-5" />
            </Button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted/50"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  {userName.charAt(0)}
                </div>
                <span className="text-sm font-medium">{userName}</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {roleName}
                </span>
                <ChevronDown className="size-4" />
              </button>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-white py-1 shadow-lg">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
