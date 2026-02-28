import { Outlet } from 'react-router';
import { DashboardLayout } from '@/components/layout';
import { ADMIN_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';

const AdminShell = () => {
  return (
    <DashboardLayout navItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN">
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminShell;

