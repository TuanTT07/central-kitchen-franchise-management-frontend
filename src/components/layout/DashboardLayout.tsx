import type React from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
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

export default function DashboardLayout({ children, navItems, roleLabel }: DashboardLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { userName, roleName: contextRoleName, logout } = useAuth();
  const roleName = contextRoleName ?? roleLabel;

  return (
    <div className="flex min-h-svh bg-[#f8fafc] text-foreground">
      {/* Sidebar */}
      <SideBarLayout items={navItems} activeItem={location.pathname} />
      {/* Main content */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Header */}
        <HeaderLayout
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          handleLogout={logout}
          userName={userName}
          roleName={roleName}
        />
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
