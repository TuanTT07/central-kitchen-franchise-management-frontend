import type React from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Role } from '@/Types';
import { translateRole } from '@/utils/labelMapping';
import SideBarLayout from './SidebarLayout';
import HeaderLayout from './HeaderLayout';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: readonly NavItem[];
  roleLabel: string;
}

/** Tên cửa hàng mock cho Store (sau có thể lấy từ user/store API) */
const getStoreDisplayName = (userName: string, user: any) => {
  if (user?.storeName) return user.storeName;
  return userName ? `Cửa hàng ${userName}` : 'Cửa hàng';
};

const buildSidebarFooter = (params: {
  roleLabel: string;
  userName: string;
  user: any;
  logout: () => void;
  contextRoleName: string | null;
}) => {
  const { roleLabel, userName, user, logout, contextRoleName } = params;
  const effectiveRole = contextRoleName ?? roleLabel;
  const isFranchiseStore = roleLabel === Role.FRANCHISE_STORE_STAFF;

  const mainLabel = isFranchiseStore ? getStoreDisplayName(userName, user) : userName || 'Người dùng';
  const roleText = translateRole(effectiveRole);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-medium text-white">
          {userName?.charAt(0) ?? 'C'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={mainLabel}>
            {mainLabel}
          </p>
          {roleText && (
            <p className="truncate text-xs text-muted-foreground" title={roleText}>
              {roleText}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-amber-50 hover:text-amber-700"
      >
        <LogOut className="size-4 shrink-0" />
        Đăng xuất
      </button>
    </div>
  );
};

export default function DashboardLayout({ children, navItems, roleLabel }: DashboardLayoutProps) {
  const location = useLocation();
  const { userName, user, roleName: contextRoleName, logout } = useAuth();
  const sidebarFooter = buildSidebarFooter({ roleLabel, userName, user, logout, contextRoleName });

  return (
    <div className="flex min-h-svh bg-[#f8fafc] text-foreground">
      {/* Sidebar */}
      <SideBarLayout items={navItems} activeItem={location.pathname} footerContent={sidebarFooter} />
      {/* Main content */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Header */}
        <HeaderLayout userName={userName} />
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
