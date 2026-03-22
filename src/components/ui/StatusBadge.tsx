import { cn } from '@/lib/utils';
import { translateStatus, normalizeStatusKey } from '@/utils/labelMapping';

/**
 * Bảng màu thống nhất cho từng nhóm trạng thái.
 * Key = giá trị status trả về từ API (tiếng Anh, UPPER_SNAKE_CASE).
 */
const STATUS_COLOR_MAP: Record<string, string> = {
  // ── Chờ xử lý ──────────────────────────── vàng/cam nhạt
  PENDING:           'bg-amber-100 text-amber-800 border-amber-200',
  WAITING_FOR_STOCK: 'bg-amber-100 text-amber-800 border-amber-200',
  PLANNED:           'bg-amber-100 text-amber-800 border-amber-200',
  DRAFT:             'bg-amber-100 text-amber-800 border-amber-200',
  AWAITING_DELIVERY: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING_REVIEW:    'bg-amber-100 text-amber-800 border-amber-200',

  // ── Đang xử lý ─────────────────────────── xanh dương nhạt
  COOKING:    'bg-blue-100 text-blue-800 border-blue-200',
  IN_TRANSIT: 'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPING:   'bg-blue-100 text-blue-800 border-blue-200',
  READY:      'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPED:    'bg-blue-100 text-blue-800 border-blue-200',

  // ── Thành công / Khả dụng ──────────────── xanh lá nhạt
  APPROVED:     'bg-green-100 text-green-800 border-green-200',
  COMPLETED:    'bg-green-100 text-green-800 border-green-200',
  DONE:         'bg-green-100 text-green-800 border-green-200',
  AVAILABLE:    'bg-green-100 text-green-800 border-green-200',
  CONSOLIDATED: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE:       'bg-green-100 text-green-800 border-green-200',

  // ── Đã hủy / Lỗi / Hết ────────────────── đỏ/xám nhạt
  CANCELLED:     'bg-red-100 text-red-800 border-red-200',
  CANCEL:        'bg-red-100 text-red-800 border-red-200',
  REJECTED:      'bg-red-100 text-red-800 border-red-200',
  OUT_OF_STOCK:  'bg-red-100 text-red-800 border-red-200',
  EXPIRED:       'bg-gray-100 text-gray-700 border-gray-200',
  INACTIVE:      'bg-gray-100 text-gray-700 border-gray-200',
};

const DEFAULT_COLOR = 'bg-stone-100 text-stone-600 border-stone-200';

type Props = {
  status?: string | null;
  /** Override label (nếu không truyền thì tự dịch qua translateStatus) */
  label?: string;
  className?: string;
};

/**
 * Badge hiển thị trạng thái — dùng chung toàn hệ thống.
 *
 * @example
 *   <StatusBadge status="PENDING" />
 *   <StatusBadge status="APPROVED" label="Xét duyệt xong" />
 */
export default function StatusBadge({ status, label, className }: Props) {
  const normalized = normalizeStatusKey(status);
  const colorClass = normalized ? (STATUS_COLOR_MAP[normalized] ?? DEFAULT_COLOR) : DEFAULT_COLOR;
  const displayText = label ?? translateStatus(status) ?? status ?? '—';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colorClass,
        className
      )}
    >
      {displayText}
    </span>
  );
}
