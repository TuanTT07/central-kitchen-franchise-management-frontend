type Props = {
  admin: React.ReactNode;
  franchise: React.ReactNode;
  manager: React.ReactNode;
  supplier: React.ReactNode;
  centralKitchen: React.ReactNode;
};

export default function RoleRoute({ admin, franchise, manager, supplier, centralKitchen }: Props) {
  const role = localStorage.getItem('userRole');

  if (role === 'ADMIN') return admin;
  if (role === 'FRANCHISE') return franchise;
  if (role === 'MANAGER') return manager;
  if (role === 'SUPPLIER') return supplier;
  if (role === 'CENTRAL_KITCHEN') return centralKitchen;
  return <div>Không có quyền truy cập. Role: {role ?? '(chưa đăng nhập)'}</div>;
}
