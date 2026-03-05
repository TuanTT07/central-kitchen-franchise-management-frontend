import { Role } from '../Types/index';
type Props = {
  admin: React.ReactNode;
  franchise: React.ReactNode;
  manager: React.ReactNode;
  supplier: React.ReactNode;
  centralKitchen: React.ReactNode;
};

export default function RoleRoute({ admin, franchise, manager, supplier, centralKitchen }: Props) {
  const role = localStorage.getItem('userRole');

  if (role === Role.ADMIN) return admin;
  if (role === Role.FRANCHISE_STORE_STAFF) return franchise;
  if (role === Role.MANAGER) return manager;
  if (role === Role.SUPPLY_COORDINATOR) return supplier;
  if (role === Role.CENTRAL_KITCHEN_STAFF) return centralKitchen;

  return <div>Không có quyền truy cập. Role: {role ?? '(chưa đăng nhập)'}</div>;
}
