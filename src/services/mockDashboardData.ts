/**
 * Mock data cho dashboard - map với schema KitchenDB_Prod
 * PurchaseOrder, TransferOrder, Item, ItemType, Location, Users...
 */

export type OrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface RecentOrder {
  orderId: string;
  itemName: string;
  itemType: string;
  quantity: number;
  amount: number;
  customer: string;
  status: OrderStatus;
  orderType: 'PO' | 'TRANSFER';
}

export interface TrendingItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  price: number;
}

export interface ActivityLog {
  id: string;
  userName: string;
  roleName: string;
  action: string;
  time: string;
}

export interface CategoryStat {
  name: string;
  percent: number;
  color: string;
}

export interface OrderTypeStat {
  name: string;
  percent: number;
  count: number;
  icon: string;
}

export interface RevenuePoint {
  month: string;
  income: number;
  expense: number;
}

export interface OrdersByDay {
  day: string;
  count: number;
}

// KPIs
export const mockKpis = {
  totalOrders: { value: 48652, trend: 1.58, isUp: true },
  totalLocations: { value: 24, trend: 0, isUp: true }, // Location count thay cho Customer
  totalRevenue: { value: 215860, trend: 2.36, isUp: true },
};

// Revenue chart - 8 tháng (Income/Expense)
export const mockRevenueData: RevenuePoint[] = [
  { month: 'Th3', income: 18500, expense: 12000 },
  { month: 'Th4', income: 22000, expense: 14500 },
  { month: 'Th5', income: 19800, expense: 13200 },
  { month: 'Th6', income: 24500, expense: 15800 },
  { month: 'Th7', income: 26500, expense: 16500 },
  { month: 'Th8', income: 28000, expense: 17200 },
  { month: 'Th9', income: 25200, expense: 16100 },
  { month: 'Th10', income: 29800, expense: 18900 },
];

// Orders by day
export const mockOrdersByDay: OrdersByDay[] = [
  { day: 'T2', count: 142 },
  { day: 'T3', count: 168 },
  { day: 'T4', count: 175 },
  { day: 'T5', count: 185 },
  { day: 'T6', count: 198 },
  { day: 'T7', count: 165 },
  { day: 'CN', count: 120 },
];

// Top categories (ItemType)
export const mockCategories: CategoryStat[] = [
  { name: 'Nguyên liệu tươi', percent: 30, color: 'bg-amber-500' },
  { name: 'Đồ khô', percent: 25, color: 'bg-amber-200' },
  { name: 'Gia vị', percent: 25, color: 'bg-stone-300' },
  { name: 'Đồ đông lạnh', percent: 20, color: 'bg-stone-500' },
];

// Order types: PurchaseOrder vs TransferOrder
export const mockOrderTypes: OrderTypeStat[] = [
  { name: 'Đơn mua (PO)', percent: 45, count: 900, icon: 'shopping-cart' },
  { name: 'Chuyển kho (Transfer)', percent: 30, count: 600, icon: 'truck' },
  { name: 'Đơn nội bộ', percent: 25, count: 500, icon: 'package' },
];

// Recent orders (PurchaseOrder + TransferOrder)
export const mockRecentOrders: RecentOrder[] = [
  { orderId: 'PO-1025', itemName: 'Gạo Jasmine 5kg', itemType: 'Đồ khô', quantity: 30, amount: 2400000, customer: 'Chi nhánh Q1', status: 'IN_PROGRESS', orderType: 'PO' },
  { orderId: 'TRF-1026', itemName: 'Thịt gà tươi', itemType: 'Nguyên liệu', quantity: 50, amount: 3500000, customer: 'Chi nhánh Q7', status: 'CANCELLED', orderType: 'TRANSFER' },
  { orderId: 'PO-1027', itemName: 'Dầu ăn 5L', itemType: 'Gia vị', quantity: 20, amount: 1200000, customer: 'Chi nhánh Bình Thạnh', status: 'COMPLETED', orderType: 'PO' },
  { orderId: 'TRF-1028', itemName: 'Hành tỏi khô', itemType: 'Đồ khô', quantity: 100, amount: 800000, customer: 'Chi nhánh Phú Nhuận', status: 'PENDING', orderType: 'TRANSFER' },
];

// Trending items (Item - sản phẩm bán chạy / sử dụng nhiều)
export const mockTrendingItems: TrendingItem[] = [
  { id: '1', name: 'Cơm chiên dương châu', category: 'Món chính', rating: 4.9, reviewCount: 350, price: 45000 },
  { id: '2', name: 'Phở bò đặc biệt', category: 'Món nước', rating: 4.8, reviewCount: 420, price: 55000 },
  { id: '3', name: 'Bún bò Huế', category: 'Món nước', rating: 4.7, reviewCount: 280, price: 48000 },
  { id: '4', name: 'Gà xối mỡ', category: 'Món chính', rating: 4.6, reviewCount: 195, price: 52000 },
];

// Recent activity (audit từ các bảng)
export const mockActivity: ActivityLog[] = [
  { id: '1', userName: 'Nguyễn Văn A', roleName: 'Quản lý kho', action: 'cập nhật tồn kho - 50 đơn vị "Gạo Jasmine 5kg"', time: '11:20' },
  { id: '2', userName: 'Trần Thị B', roleName: 'Admin', action: 'đánh dấu đơn #PO-1028 đã hoàn thành', time: '11:00' },
  { id: '3', userName: 'Lê Văn C', roleName: 'Nhân viên giao hàng', action: 'thêm đơn chuyển kho mới cho chi nhánh Q3', time: '10:30' },
  { id: '4', userName: 'Phạm Thị D', roleName: 'Bếp trung tâm', action: 'cập nhật trạng thái sản xuất đơn #PROD-045', time: '10:15' },
];
