import { Bell, ChevronDown, LogOut, Search, Settings } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface HeaderLayoutProps {
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  handleLogout: () => void;
  userName: string;
  roleName: string;
}

export default function HeaderLayout({
  profileOpen,
  setProfileOpen,
  handleLogout,
  userName,
  roleName,
}: HeaderLayoutProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white px-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Xin chào <span className="font-medium text-foreground">{userName}</span>, chào mừng trở lại!
      </p>
      <div className="flex flex-1 max-w-md items-center gap-2 px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input placeholder="Tìm kiếm..." className="h-9 border-0 bg-muted/50 focus-visible:ring-0" />
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
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{roleName}</span>
            <ChevronDown className="size-4" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
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
  );
}
