import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  UtensilsCrossed,
  Users,
  Settings,
  BookOpen,
  BarChart3,
} from 'lucide-react';

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Đơn hàng', href: '#', icon: ShoppingCart },
  { label: 'Tồn kho', href: '#', icon: Boxes },
  { label: 'Sản phẩm', href: '#', icon: UtensilsCrossed },
  { label: 'Chi nhánh', href: '/admin/stores', icon: Package },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Cấu hình', href: '/admin/configs', icon: Settings },
] as const;

export const MANAGER_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Tổng quan kho', href: '#', icon: Boxes },
  { label: 'Sản phẩm', href: '#', icon: UtensilsCrossed },
  { label: 'Công thức', href: '#', icon: BookOpen },
  { label: 'Báo cáo', href: '#', icon: BarChart3 },
] as const;

