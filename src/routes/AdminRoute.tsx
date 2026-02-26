import { Navigate, Outlet } from 'react-router';

export default function AdminRoute() {
  const role = localStorage.getItem('userRole');
  if (role === 'ADMIN') return <Outlet />;
  return <div>Không có quyền truy cập. Role: {role ?? '(chưa đăng nhập)'}</div>; // mốt sẽ có trang lỗi riêng, tạm thời để thế này cho dễ test thôi
}
