import { useState } from 'react';
import { Bell, ChevronDown, LogOut, Package, Search, Settings } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface HeaderLayoutProps {
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  handleLogout: () => void;
  userName: string;
  roleName: string;
}

/** Mock: danh sách thông báo (sau có thể thay bằng API) */
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'order' | 'inventory' | 'system';
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Đơn hàng mới',
    message: 'Đơn #ORD-001 đã được tạo, cần xử lý.',
    time: '5 phút trước',
    read: false,
    type: 'order',
  },
  {
    id: '2',
    title: 'Cảnh báo tồn kho',
    message: 'Lô PB-20260301 sắp hết hạn trong 3 ngày.',
    time: '1 giờ trước',
    read: false,
    type: 'inventory',
  },
  {
    id: '3',
    title: 'Biên lai đã hoàn thành',
    message: 'Biên lai IR-20260304-001 đã được xác nhận.',
    time: '2 giờ trước',
    read: true,
    type: 'system',
  },
];

export default function HeaderLayout({
  profileOpen,
  setProfileOpen,
  handleLogout,
  userName,
  roleName,
}: HeaderLayoutProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

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
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9"
            onClick={() => {
              setNotifOpen((o) => !o);
              if (profileOpen) setProfileOpen(false);
            }}
            aria-label="Thông báo"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
              <div
                className="absolute right-0 top-full z-50 mt-1 w-[360px] overflow-hidden rounded-xl border border-border bg-white shadow-lg"
                role="dialog"
                aria-label="Danh sách thông báo"
              >
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-muted-foreground">{unreadCount} chưa đọc</span>
                    )}
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <Bell className="size-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={cn(
                            'flex gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                            !n.read && 'bg-amber-50/50'
                          )}
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <Package className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-sm font-medium', !n.read && 'text-foreground')}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                          </div>
                          {!n.read && (
                            <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-border bg-muted/20 px-4 py-2 text-center">
                    <button
                      type="button"
                      className="text-xs font-medium text-amber-600 hover:underline"
                      onClick={() => setNotifOpen(false)}
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="size-9">
          <Settings className="size-5" />
        </Button>
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              if (notifOpen) setNotifOpen(false);
            }}
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
