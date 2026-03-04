import { Outlet } from 'react-router';
import { DashboardLayout } from '@/components/layout';

type Props = {
  sidebarItems: readonly { label: string; href: string; icon: any }[];
  roleLabel: string;
};

const RoleShell = ({ sidebarItems, roleLabel }: Props) => {
  return (
    <DashboardLayout navItems={sidebarItems} roleLabel={roleLabel}>
      <Outlet />
    </DashboardLayout>
  );
};

export default RoleShell;
