// ================= IMPORT =================
import http from '@/lib/axios';
import { type OrderResponse, type OrderDetailResponse } from './franchiseServices';
import type { Response, PaginatedResponse } from '@/Types/utils.type';
// ================= TYPES =================
/**
 * Đại diện cho một sản phẩm gộp trong quá trình xử lý đơn hàng chi nhánh.
 */
export interface ConsolidationProduct {
  productId: number;
  productName: string;
  quantity: number;
  orderIds: number[];
}

/**
 * Phản hồi từ API gộp đơn hàng.
 */
export interface ConsolidationResponse {
  consolidatedAt: string;
  consolidatedBy: string;
  totalOrders: number;
  orderIds: number[];
  products: ConsolidationProduct[];
}

/**
 * Đại diện cho một item trong lệnh sản xuất.
 */
export interface ItemsResponse {
  manuOrderId: number;
  orderCode: string;
  productId: number;
  productName: string;
  quantityPlanned: number;
  unitName: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: number;
  createdByName: string;
}

/**
 * Chi tiết sản phẩm trong phiếu xuất kho.
 */
export interface ExportNoteItem {
  productId: number;
  productName: string;
  batchCode: string;
  expiryDate: string;
  quantity: number;
  unitName: string;
}

/**
 * Phản hồi thông tin phiếu xuất kho từ API.
 */
export interface ExportNotesResponse {
  exportId: number;
  exportCode: string;
  storeOrderId: number;
  storeName: string;
  status: string;
  exportDate: string;
  items: ExportNoteItem[];
  /** Có trong snapshot khi chuyến đã hủy (tùy backend). */
  storeOrderCode?: string;
}

/** Phần tử trong JSON `cancelled_notes_snapshot` / `cancelledNotesSnapshot` khi chuyến CANCELLED. */
export interface CancelledExportSnapshotItem {
  batchCode?: string;
  expiryDate?: string;
  productName?: string;
  unit?: string;
  unitName?: string;
  quantity?: number;
}

export interface CancelledExportSnapshotEntry {
  exportCode?: string;
  storeName?: string;
  storeOrderCode?: string;
  items?: CancelledExportSnapshotItem[];
}

/**
 * Thông tin phân bổ lô hàng khi xem trước kế hoạch xuất kho.
 */
export interface BatchAllocation {
  batchId: number;
  batchCode: string;
  expiryDate: string;
  manufacturingDate: string;
  currentStock: number;
  allocatedQuantity: number;
}

/**
 * Chi tiết sản phẩm trong kết quả xem trước xuất kho.
 */
export interface PreviewProduct {
  productId: number;
  productName: string;
  unit: string;
  requiredQuantity: number;
  fulfillableQuantity: number;
  shortfall: number;
  batchAllocations: BatchAllocation[];
}

/**
 * Phản hồi xem trước kế hoạch xuất kho theo order.
 */
export interface PreviewOrderResponse {
  storeOrderId: number;
  orderCode: string;
  storeName: string;
  canFulfill: boolean;
  products: PreviewProduct[];
}

export type statusType = 'PLANNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface DeliveryPlanResponse {
  deliveryId: number;
  deliveryCode: string;
  driverName: string;
  vehiclePlate: string;
  scheduledDate: string;
  actualStartDate: string;
  actualEndDate: string;
  status: statusType;
  createdByUsername: string;
  createdAt: string;
  exportNotes: {
    exportId: number;
    exportCode: string;
    storeName: string;
    status: string;
  }[];
  /** Giống chi tiết chuyến — khi CANCELLED, API có thể trả snapshot thay vì exportNotes đầy đủ. */
  cancelledNotesSnapshot?: string | CancelledExportSnapshotEntry[] | null;
}

/** Đọc raw snapshot từ camelCase hoặc snake_case (backend/Supabase). */
export function pickCancelledNotesSnapshotRaw(source: {
  cancelledNotesSnapshot?: string | CancelledExportSnapshotEntry[] | null;
}): string | CancelledExportSnapshotEntry[] | null | undefined {
  const s = source as { cancelled_notes_snapshot?: string | CancelledExportSnapshotEntry[] | null };
  return source.cancelledNotesSnapshot ?? s.cancelled_notes_snapshot;
}

/** Parse JSON snapshot phiếu xuất khi hủy chuyến. */
export function parseCancelledExportSnapshotEntries(
  raw: string | CancelledExportSnapshotEntry[] | null | undefined
): CancelledExportSnapshotEntry[] {
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t) as unknown;
      return Array.isArray(parsed) ? (parsed as CancelledExportSnapshotEntry[]) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

/**
 * Tên chi nhánh nhận cho một dòng lịch giao (bảng danh sách): ưu tiên exportNotes, không có thì đọc snapshot hủy.
 */
export function getStoreNamesForDeliveryPlan(plan: DeliveryPlanResponse): string[] {
  const notes = plan.exportNotes ?? [];
  const fromNotes = [...new Set(notes.map((n) => n.storeName?.trim()).filter((s): s is string => Boolean(s)))];
  if (fromNotes.length > 0) return fromNotes;

  const raw = pickCancelledNotesSnapshotRaw(plan);
  const entries = parseCancelledExportSnapshotEntries(raw);
  const fromSnap = entries
    .map((e) => e.storeName?.trim())
    .filter((s): s is string => Boolean(s));
  return [...new Set(fromSnap)];
}

export interface DeliveryDetail {
  deliveryId: number;
  deliveryCode: string;
  driverName: string;
  vehiclePlate: string;
  scheduledDate: string;
  actualStartDate: string;
  actualEndDate: string;
  status: statusType;
  createdByUsername: string;
  createdAt: string;
  exportNotes: ExportNotesResponse[];
  /**
   * Snapshot phiếu xuất tại lúc hủy (chuỗi JSON hoặc mảng). Backend/DB: `cancelled_notes_snapshot`.
   */
  cancelledNotesSnapshot?: string | CancelledExportSnapshotEntry[] | null;
}

/**
 * Danh sách phiếu xuất để hiển thị: ưu tiên `exportNotes`, nếu rỗng thì parse snapshot hủy chuyến.
 */
export function resolveDeliveryExportNotesForDisplay(detail: DeliveryDetail): ExportNotesResponse[] {
  const fromApi = detail.exportNotes;
  if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi;

  const entries = parseCancelledExportSnapshotEntries(pickCancelledNotesSnapshotRaw(detail));
  if (entries.length === 0) return [];

  return entries.map((entry, i) => ({
    exportId: -(i + 1),
    exportCode: entry.exportCode ?? '—',
    storeOrderId: 0,
    storeName: entry.storeName ?? '—',
    status: 'CANCELLED',
    exportDate: '',
    storeOrderCode: entry.storeOrderCode,
    items: (entry.items ?? []).map((it, j) => ({
      productId: j + 1,
      productName: it.productName ?? '—',
      batchCode: it.batchCode ?? '',
      expiryDate: it.expiryDate ?? '',
      quantity: Number(it.quantity) || 0,
      unitName: it.unitName ?? it.unit ?? '',
    })),
  }));
}

/**
 * Phản hồi chi tiết về vấn đề giao hàng (Delivery Issue).
 */
export interface DeliveryIssueResponse {
  issueId: number;
  issueStatus: string;
  issueReason: string;
  issueNote: string;
  originalOrderId: number;
  originalOrderCode: string;
  originalOrderStatus: string;
  storeId: number;
  storeName: string;
  originalDeliveryDate: string;
  reportedBy: {
    userId: number;
    username: string;
    fullName: string;
  };
  reportedAt: string;
  reviewedBy: {
    userId: number;
    username: string;
    fullName: string;
  } | null;
  reviewedAt: string | null;
  reviewDecision: string | null;
  replacementOrderId: number | null;
  replacementOrderCode: string | null;
  reportedOrderStatus: string;
  totalQuantity: number;
  affectedQuantity: number;
  recommendedResolution: string;
  selectedResolution: string;
  imageUrls: string[];
  issueItems?: {
    productId: number;
    productName: string;
    quantity: number;
    imageUrl?: string;
  }[];
}
/**
 * =========================================================
 * API: Supply Service (Quản lý Cung ứng)
 *
 * Endpoints:
 * GET    /orders                      -> Danh sách đơn hàng từ chi nhánh
 * POST   /orders/consolidate/auto     -> Gộp đơn hàng tự động
 * POST   /orders/consolidate/manual   -> Gộp đơn hàng thủ công
 * POST   /orders/consolidate/cancel   -> huỷ gộp đơn hàng
 * POST   /api/v1/manufacturing-orders -> Tạo lệnh sản xuất
 *
 *
 * GET    /export-notes                -> lấy ra danh sách phiếu xuất kho
 * GET    /export-notes/preview        -> xem trước kế hoạch xuất kho
 *
 *
 * GET    /delivery-plan              -> lấy ra danh sách lịch giao hàng
 * GET    /deliveries/{id}            -> lấy ra chi tiết lịch giao hàng
 * PATCH  /deliveries/{id}/start      -> cập nhật tình trạng chuyến hàng (xuất phát)
 * PATCH  /deliveries/{id}/complete   -> cập nhật tình trạng chuyến hàng (hoàn thành)
 * PATCH  /deliveries/{id}/cancel     -> cập nhật tình trạng chuyến hàng (hủy)
 *
 *
 * GET    /delivery-issues            -> Lấy danh sách vấn đề
 * GET    /delivery-issues/{id}       -> Lấy chi tiết vấn đề
 * POST   /delivery-issues/{id}/review -> Phê duyệt/Từ chối vấn đề
 *
 * POST   /api/v1/manufacturing-orders/manual -> Tạo lệnh sản xuất thủ công
 *
 * Authorization:
 * Bearer Token
 * =========================================================
 */

export const supplyServices = {
  /**
   * Lấy danh sách tất cả các đơn hàng từ chi nhánh (Franchise Orders)
   * Hỗ trợ phân trang và lọc theo mã đơn hoặc trạng thái.
   *
   * @param page Số trang hiện tại (bắt đầu từ 0)
   * @param size Số lượng bản ghi trên mỗi trang (mặc định 10)
   * @param search Từ khóa tìm kiếm (mã đơn, chi nhánh...)
   * @param status Trạng thái đơn hàng
   * @returns Promise<Response<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>>
   */
  getAllOrders: async (page: number = 0, size: number = 10, search?: string, status?: string) => {
    let url = `/orders?page=${page}&size=${size}`;
    if (search) url += `&orderCode=${encodeURIComponent(search)}`;
    if (status && status !== 'ALL') url += `&status=${status}`;

    const response = await http.get<Response<PaginatedResponse<OrderResponse<OrderDetailResponse[]>[]>>>(url);
    return response.data;
  },

  /**
   * Thực hiện gộp các đơn hàng đã được phê duyệt một cách tự động
   *
   * @returns Promise<ConsolidationResponse> Kết quả gộp đơn
   */
  consolidateAuto: async () => {
    const response = await http.post<Response<ConsolidationResponse>>('/orders/consolidate/auto');
    return response.data;
  },

  /**
   * Thực hiện gộp các đơn hàng được chỉ định một cách thủ công
   *
   * @param orderIds Danh sách ID các đơn hàng cần gộp
   *
   * @returns Promise<ConsolidationResponse> Kết quả gộp đơn
   */
  consolidateManual: async (orderIds: number[]) => {
    const response = await http.post<Response<ConsolidationResponse>>('/orders/consolidate/manual', { orderIds });
    return response.data;
  },

  /**
   * Hủy gộp đơn hàng
   * @param orderIds Danh sách ID các đơn hàng cần hủy gộp
   * @returns Promise<ConsolidationResponse> Kết quả hủy gộp đơn
   */
  cancelConsolidate: async (orderIds: number[]) => {
    const response = await http.post<Response<ConsolidationResponse>>('/orders/consolidate/cancel', {
      orderIds,
    });
    return response.data;
  },

  /**
   * Tạo lệnh sản xuất mới dựa trên danh sách sản phẩm và số lượng
   *
   * @param body Đối tượng chứa mảng các items (productId, quantity)
   *
   * @returns Promise<ItemsResponse[]> Danh sách các item trong lệnh sản xuất vừa tạo
   */
  createManufacturingOrder: async (body: {
    products: {
      productId: number;
      quantityPlanned: number;
    }[];
  }) => {
    const response = await http.post<Response<ItemsResponse[]>>('/api/v1/manufacturing-orders', body);
    return response.data;
  },

  createManuProduction: async (body: { productId: number; quantityPlanned: number }) => {
    const response = await http.post<Response<ItemsResponse>>('/api/v1/manufacturing-orders/manual', body);
    return response.data;
  },

  /**
   * Lấy danh sách tất cả các phiếu xuất kho (Export Notes)
   * Hỗ trợ phân trang và lọc dữ liệu.
   *
   * @param page Số trang hiện tại (bắt đầu từ 0)
   * @param size Số lượng bản ghi trên mỗi trang (mặc định 10)
   * @returns Promise<Response<PaginatedResponse<ExportNotesResponse[]>>>
   */
  getAllExportNote: async (page: number = 0, size: number = 10) => {
    return await http.get<Response<PaginatedResponse<ExportNotesResponse[]>>>(
      `/export-notes?page=${page}&size=${size}`
    );
  },
  /**
   * Phê duyệt đơn hàng từ chi nhánh
   *
   * @param id ID của đơn hàng cần duyệt
   * @returns Promise<Response<OrderResponse<OrderDetailResponse[]>>>
   */
  approveOrder: async (id: number) => {
    const response = await http.post<Response<OrderResponse<OrderDetailResponse[]>>>(`/orders/${id}/approve`);
    return response.data;
  },

  /**
   * Tạo phiếu xuất kho từ danh sách các storeOrder đã được phê duyệt
   *
   * @param orderIds Danh sách ID các storeOrder cần tạo phiếu xuất kho
   * @returns Promise<ExportNotesResponse[]> Danh sách các phiếu xuất kho vừa tạo
   */
  createExportNote: async (orderIds: number[]) => {
    const response = await http.post<Response<ExportNotesResponse[]>>('/export-notes/createAutoNote', orderIds);
    return response.data;
  },

  /**
   * Tạo phiếu xuất kho thừa (surplus) theo một lô và số lượng.
   * POST /export-notes/createSurplusNote
   *
   * Body mặc định: `{ productBatchId, quantity }` — nếu BE dùng tên field khác, chỉnh tại một chỗ ở đây.
   */
  createSurplusNote: async (body: { productBatchId: number; quantity: number }) => {
    const response = await http.post<Response<ExportNotesResponse>>('/export-notes/createSurplusNote', body);
    return response.data;
  },

  /**
   * Xem trước kế hoạch xuất kho theo danh sách storeOrderId
   *
   * @param orderIds Danh sách ID các storeOrder cần xem trước
   * @returns Promise<Response<PreviewOrderResponse[]>>
   */
  previewExportNote: async (orderIds: number[]) => {
    const response = await http.post<Response<PreviewOrderResponse[]>>('/export-notes/preview', orderIds);
    return response.data;
  },

  /**
   * Lấy danh sách các storeOrder đủ điều kiện để tạo lệnh sản xuất
   *
   * @returns Promise<Response<OrderResponse<OrderDetailResponse[]>[]>>
   */
  getStoreOrderReadyForManufacturing: async () => {
    const response = await http.get<Response<OrderResponse<OrderDetailResponse[]>[]>>('/export-notes/ready-orders');
    return response.data;
  },

  /*
   * API: Delivery Plan Service (Quản lý Lên lịch giao hàng)
   * @returns Promise<Response<DeliveryPlanResponse[]>>
   */
  getDeliveryPlan: async (page: number = 0, size: number = 10) => {
    const response = await http.get<Response<PaginatedResponse<DeliveryPlanResponse[]>>>(
      `/deliveries?page=${page}&size=${size}`
    );
    return response.data;
  },

  /**
   * Lấy toàn bộ chuyến giao (lặp phân trang server) — dùng khi lọc theo trạng thái trên client,
   * vì trang 1 của API có thể không chứa bản ghi khớp trạng thái.
   */
  getAllDeliveryPlans: async (pageSize: number = 50): Promise<DeliveryPlanResponse[]> => {
    const all: DeliveryPlanResponse[] = [];
    let page = 0;
    let totalPages = 1;
    while (page < totalPages) {
      const ax = await http.get<Response<PaginatedResponse<DeliveryPlanResponse[]>>>(
        `/deliveries?page=${page}&size=${pageSize}`
      );
      const payload = ax.data?.data;
      if (!payload || !Array.isArray(payload.items)) break;
      all.push(...payload.items);
      totalPages = Number(payload.totalPages) || 1;
      page += 1;
    }
    return all;
  },

  /**
   * Lấy ra chi tiết lịch giao hàng
   * @param id ID của lịch giao hàng
   * @returns Promise<Response<DeliveryDetail>>
   */
  getDeliveryPlanDetail: async (id: number) => {
    const response = await http.get<Response<DeliveryDetail>>(`/deliveries/${id}`);
    return response.data;
  },

  /**
   * Tạo lịch giao hàng mới dựa trên danh sách các exportNote
   *
   * @param body Đối tượng chứa thông tin lịch giao hàng
   *
   * @returns Promise<DeliveryPlanResponse[]> Danh sách các item trong lệnh sản xuất vừa tạo
   */
  createDeliveryPlan: async (body: {
    driverName: string;
    vehiclePlate: string;
    scheduledDate: string;
    exportNoteIds: number[];
  }) => {
    const response = await http.post<Response<DeliveryPlanResponse[]>>('/deliveries', body);
    return response.data;
  },

  /**
   * Lấy ra các phiếu suất kho sẵn sàng
   * @returns Promise<Response<ExportNotesResponse[]>>
   */
  getExportNoteReadyForDelivery: async () => {
    const response = await http.get<Response<ExportNotesResponse[]>>('/deliveries/ready-note');
    return response.data;
  },

  /**
   * cập nhật tình trang chuyến hàng (xuất phát)
   * @param id ID của lịch giao hàng cần hủy
   * @returns Promise<Response<DeliveryPlanResponse[]>>
   */
  updateDeliveryStatusStart: async (id: number) => {
    const response = await http.patch<Response<DeliveryPlanResponse[]>>(`/deliveries/${id}/start`);
    return response.data;
  },

  /**
   * cập nhật tình trang chuyến hàng (hoàn thành)
   * @param id ID của lịch giao hàng cần hủy
   * @returns Promise<Response<DeliveryPlanResponse[]>>
   */
  updateDeliveryStatusComplete: async (id: number) => {
    const response = await http.patch<Response<DeliveryDetail>>(`/deliveries/${id}/complete`);
    return response.data;
  },

  /**
   * cập nhật tình trang chuyến hàng (hủy)
   * @param id ID của lịch giao hàng cần hủy
   * @returns Promise<Response<DeliveryPlanResponse[]>>
   */
  updateDeliveryStatusCancel: async (id: number) => {
    const response = await http.patch<Response<DeliveryPlanResponse[]>>(`/deliveries/${id}/cancel`);
    return response.data;
  },

  /**
   * Lấy danh sách các vấn đề giao hàng (Delivery Issues)
   *
   * @param page Số trang hiện tại (bắt đầu từ 0)
   * @param size Số lượng bản ghi trên mỗi trang (mặc định 10)
   * @returns Promise<Response<PaginatedResponse<DeliveryIssueResponse[]>>>
   */
  getAllDeliveryIssues: async (page: number = 0, size: number = 10) => {
    const response = await http.get<Response<PaginatedResponse<DeliveryIssueResponse[]>>>(
      `/delivery-issues?page=${page}&size=${size}`
    );
    return response.data;
  },

  /**
   * Lấy chi tiết vấn đề giao hàng (Delivery Issue)
   *
   * @param id ID của vấn đề giao hàng
   * @returns Promise<Response<DeliveryIssueResponse>>
   */
  getDeliveryIssueById: async (id: number) => {
    const response = await http.get<Response<DeliveryIssueResponse>>(`/delivery-issues/${id}`);
    return response.data;
  },

  /**
   * Phê duyệt/Từ chối vấn đề giao hàng (Delivery Issue)
   *
   * @param id ID của vấn đề giao hàng
   * @param decision Quyết định phê duyệt/từ chối (CREATE_REPLACEMENT_ORDER, RESCHEDULE_CURRENT_ORDER)
   * @param newDeliveryDate Ngày giao hàng mới (chỉ áp dụng khi RESCHEDULE_CURRENT_ORDER)
   * @returns Promise<Response<DeliveryIssueResponse>>
   */
  reviewDeliveryIssue: async (id: number, decision: string, newDeliveryDate?: string) => {
    const payload: any = { decision };
    if (newDeliveryDate) {
      payload.newDeliveryDate = newDeliveryDate;
    }
    const response = await http.post<Response<DeliveryIssueResponse>>(`/delivery-issues/${id}/review`, payload);
    return response.data;
  },
};
