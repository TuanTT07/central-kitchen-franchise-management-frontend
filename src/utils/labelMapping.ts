export const STATUS_LABEL_MAP: Record<string, string> = {
  // Đơn hàng chi nhánh
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CONSOLIDATED: 'Đã gộp',
  CANCELLED: 'Đã hủy',
  AWAITING_DELIVERY: 'Chờ giao hàng',

  // Phiếu xuất / giao nhận (theo yêu cầu mapping chuẩn)
  READY: 'Sẵn sàng',
  IN_TRANSIT: 'Đang giao',
  SHIPPED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  PLANNED: 'Chờ thực hiện',

  // Trạng thái phiếu / chứng từ khác
  DRAFT: 'Nháp',

  // Lô sản phẩm / tồn kho
  AVAILABLE: 'Khả dụng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRED: 'Hết hạn',
  WAITING_FOR_STOCK: 'Chờ nhập kho',

  // Trạng thái chung bật/tắt
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
};

export const ROLE_LABEL_MAP: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  FRANCHISE_STORE_STAFF: 'Nhân viên cửa hàng',
  MANAGER: 'Quản lý',
  SUPPLY_COORDINATOR: 'Điều phối viên',
  CENTRAL_KITCHEN_STAFF: 'Bếp trung tâm',
};

export const translateStatus = (status?: string | null) => {
  if (!status) return '';
  return STATUS_LABEL_MAP[status] ?? status;
};

export const translateRole = (role?: string | null) => {
  if (!role) return '';
  return ROLE_LABEL_MAP[role] ?? role;
};

