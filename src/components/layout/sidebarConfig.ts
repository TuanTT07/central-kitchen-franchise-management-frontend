import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  ShoppingCart,
  Boxes,
  UtensilsCrossed,
  BookOpen,
  BarChart3,
  ReceiptText,
  Info,
} from 'lucide-react';

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Chi nhánh', href: '/admin/stores', icon: Package },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Cấu hình', href: '/admin/configs', icon: Settings },
] as const;

export const MANAGER_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Danh mục', href: '/manager/categories', icon: BookOpen },
  { label: 'Sản phẩm', href: '/manager/products', icon: UtensilsCrossed },
  { label: 'Biên lai nhập kho', href: '/manager/receipts', icon: BookOpen },
  { label: 'Tổng quan kho', href: '/manager/inventory-overview', icon: Boxes },
  { label: 'Báo cáo', href: '/manager/reports', icon: BarChart3 },
] as const;

export const SUPPLY_COORDINATOR_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Lịch giao hàng', href: '/supply-coordinator/delivery-schedule', icon: ShoppingCart },
  { label: 'Kế hoạch phân phối', href: '/supply-coordinator/distribution-plan', icon: Boxes },
  { label: 'Xử lý sự cố', href: '/supply-coordinator/issues', icon: UtensilsCrossed },
  { label: 'Tổng hợp đơn', href: '/supply-coordinator/summary-orders', icon: BookOpen },
] as const;

export const CENTRAL_KITCHEN_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Đơn hàng', href: '/central-kitchen/orders', icon: ShoppingCart },
  { label: 'Biên lai', href: '/central-kitchen/receipts', icon: Users },
  { label: 'Lô sản phẩm', href: '/central-kitchen/product-batches', icon: Users },
  { label: 'Tồn kho', href: '/central-kitchen/inventory', icon: Boxes },
  { label: 'Giao dịch hàng tồn kho', href: '/central-kitchen/inventory-transactions', icon: Users },
  { label: 'Sản phẩm', href: '/central-kitchen/products', icon: UtensilsCrossed },
] as const;

export const FRANCHISEE_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Đơn đặt hàng', href: '/franchise-store/create-order', icon: ShoppingCart },
  { label: 'Đơn hàng', href: '/franchise-store/order-tracking', icon: ReceiptText },
  { label: 'Sản phẩm', href: '/franchise-store/products', icon: Package },
  { label: 'Thông tin cửa hàng', href: '/franchise-store/store-profile', icon: Info },
] as const;
