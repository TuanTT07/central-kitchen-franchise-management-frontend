export const STATUS_LABEL_MAP: Record<string, string> = {
  // Đơn hàng chi nhánh
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CONSOLIDATED: 'Đã gộp',
  CANCELLED: 'Đã hủy',
  AWAITING_DELIVERY: 'Chờ giao hàng',
  DELIVERY_ISSUE_PENDING: 'Chờ xử lí sự cố',
  DELIVERY_FAILED: 'Giao hàng thất bại',

  // Phiếu xuất / giao nhận (theo yêu cầu mapping chuẩn)
  READY: 'Sẵn sàng',
  IN_TRANSIT: 'Đang giao',
  SHIPPING: 'Đang giao',
  SHIPPED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  PLANNED: 'Chờ thực hiện',
  COOKING: 'Đang nấu',
  CANCEL: 'Đã hủy',
  DONE: 'Đã nhận',

  // Trạng thái phiếu / chứng từ khác
  DRAFT: 'Nháp',

  // Lô sản phẩm / tồn kho
  AVAILABLE: 'Khả dụng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRED: 'Hết hạn',
  WAITING_FOR_STOCK: 'Chờ nhập kho',

  // Vấn đề giao nhận (Delivery Issue)
  PENDING_REVIEW: 'Chờ xử lý',
  REJECTED: 'Đã từ chối',
  DAMAGED: 'Hàng vỡ / hỏng',
  MISSING_ITEMS: 'Thiếu hàng',
  WRONG_ITEMS: 'Sai hàng',
  QUALITY_FAILED: 'Chất lượng kém',
  LATE_DELIVERY: 'Giao hàng trễ',
  REFUSED_DELIVERY: 'Từ chối nhận',
  CREATE_REPLACEMENT_ORDER: 'Tạo đơn mới',
  RESCHEDULE_CURRENT_ORDER: 'Dời lịch đơn hiện tại',
  REFUND: 'Hoàn tiền',

  // Hướng xử lý sự cố giao (đề xuất / lựa chọn — API giữ key tiếng Anh)
  REPLACE_FULL: 'Giao lại toàn bộ',
  REPLACE_PARTIAL: 'Giao lại phần bị ảnh hưởng',
  BACKORDER: 'Giao bù phần thiếu',
  REDELIVER_CORRECT_ITEMS: 'Giao lại đúng hàng',
  REJECT_DELIVERY: 'Từ chối đơn giao hiện tại',
  DESTROY_AT_STORE: 'Huỷ hàng tại cửa hàng',

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

export const normalizeStatusKey = (status?: string | null): string => {
  if (!status) return '';
  return status
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
};

export const translateStatus = (status?: string | null) => {
  if (!status) return '';
  const key = normalizeStatusKey(status);
  return STATUS_LABEL_MAP[key] ?? status;
};

export const translateRole = (role?: string | null) => {
  if (!role) return '';
  return ROLE_LABEL_MAP[role] ?? role;
};
