import { Outlet } from 'react-router';
type Props = {
  roleProtect: string;
};

export default function ProtectRoleRoute({ roleProtect }: Props) {
  const currentRole = localStorage.getItem('userRole');
  if (roleProtect === currentRole) return <Outlet />;
  return <div>Không có quyền truy cập. Role: {currentRole ?? '(chưa đăng nhập)'}</div>; // mốt sẽ có trang lỗi riêng, tạm thời để thế này cho dễ test thôi
}
