import { Outlet } from 'react-router';
import DashboardLayout from './DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from './sidebarConfig';

export default function AdminShell() {
  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <Outlet></Outlet>
    </DashboardLayout>
  );
}
