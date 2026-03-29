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
  History,
} from 'lucide-react';

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Chi nhánh', href: '/admin/stores', icon: Package },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Phân trang', href: '/admin/settings', icon: Settings },
] as const;

export const MANAGER_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Danh mục', href: '/manager/categories', icon: BookOpen },
  { label: 'Sản phẩm', href: '/manager/products', icon: UtensilsCrossed },
  { label: 'Biên Lai kho', href: '/manager/receipts', icon: ReceiptText },
  { label: 'Tổng quan kho', href: '/manager/inventory-overview', icon: Boxes },
  { label: 'Biến động kho', href: '/manager/inventory-movements', icon: History },
  { label: 'Báo cáo', href: '/manager/reports', icon: BarChart3 },
] as const;

export const SUPPLY_COORDINATOR_SIDEBAR_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: LayoutDashboard },
  { label: 'Lịch giao hàng', href: '/supply-coordinator/delivery-schedule', icon: ShoppingCart },
  { label: 'Kế hoạch phân phối', href: '/supply-coordinator/distribution-plan', icon: Boxes },
  { label: 'Xử lý sự cố', href: '/supply-coordinator/issues', icon: UtensilsCrossed },
  { label: 'Đơn hàng', href: '/supply-coordinator/summary-orders', icon: BookOpen },
  { label: 'Tồn kho', href: '/supply-coordinator/inventory', icon: Boxes },
] as const;

export const CENTRAL_KITCHEN_SIDEBAR_ITEMS = [
  // Ẩn Dashboard riêng, chỉ giữ Đơn hàng + Lô + Phiếu nhập kho theo yêu cầu UX mới
  { label: 'Đơn hàng', href: '/central-kitchen/orders', icon: ShoppingCart },
  { label: 'Phiếu nhập kho', href: '/central-kitchen/receipts', icon: Users },
  { label: 'Lô sản phẩm', href: '/central-kitchen/product-batches', icon: Users },
] as const;

export const FRANCHISEE_SIDEBAR_ITEMS = [
  { label: 'Thực đơn', href: '/franchise-store/create-order', icon: ShoppingCart },
  { label: 'Đơn hàng', href: '/franchise-store/order-tracking', icon: ReceiptText },
  { label: 'Thông tin cửa hàng', href: '/franchise-store/store-profile', icon: Info },
] as const;
