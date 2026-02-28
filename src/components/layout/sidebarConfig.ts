// thêm icon vào đây
import { LayoutDashboard, ShoppingCart, Boxes, UtensilsCrossed, Users, Settings } from 'lucide-react';

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Đơn hàng', href: '#', icon: ShoppingCart },
  { label: 'Tồn kho', href: '#', icon: Boxes },
  { label: 'Sản phẩm', href: '#', icon: UtensilsCrossed },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Cấu hình', href: '/admin/configs', icon: Settings },
] as const;
