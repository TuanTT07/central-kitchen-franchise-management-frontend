import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SUPPLY_COORDINATOR_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';
import { supplyServices, type DeliveryPlanResponse, type ExportNotesResponse } from '@/services/supplyServices';
import { translateStatus } from '@/utils/labelMapping';
import { DEFAULT_API_PAGE_SIZE, fetchAllPages, getPaginatedItems } from '@/utils/pagination';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_DELIVERY_COLOR: Record<string, string> = {
  PLANNED:    'bg-amber-100 text-amber-700 border-amber-200',
  IN_TRANSIT: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED:  'bg-red-100 text-red-700 border-red-200',
};

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const SupplyDashboard = () => {
  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [allExportNotes, allDeliveryPlans] = await Promise.all([
          fetchAllPages<ExportNotesResponse>({
            fetchPage: async (page, size) => {
              const res = await supplyServices.getAllExportNote(page, size);
              return {
                items: getPaginatedItems<ExportNotesResponse>(res?.data?.data),
                totalPages: Number(res?.data?.data?.totalPages ?? 1),
              };
            },
            pageSize: DEFAULT_API_PAGE_SIZE,
          }),
          fetchAllPages<DeliveryPlanResponse>({
            fetchPage: async (page, size) => {
              const res = await supplyServices.getDeliveryPlan(page, size);
              return {
                items: getPaginatedItems<DeliveryPlanResponse>(res?.data),
                totalPages: Number(res?.data?.totalPages ?? 1),
              };
            },
            pageSize: DEFAULT_API_PAGE_SIZE,
          }),
        ]);
        setExportNotes(allExportNotes);
        setDeliveryPlans(allDeliveryPlans);
      } catch {
        setError('Không tải được dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalTrips    = deliveryPlans.length;
  const readyOrInTransitExports = useMemo(
    () => exportNotes.filter((e) => e.status === 'READY' || e.status === 'IN_TRANSIT'),
    [exportNotes]
  );
  const plannedTrips   = useMemo(() => deliveryPlans.filter((d) => d.status === 'PLANNED').length,   [deliveryPlans]);
  const inTransitTrips = useMemo(() => deliveryPlans.filter((d) => d.status === 'IN_TRANSIT').length, [deliveryPlans]);
  const completedTrips = useMemo(() => deliveryPlans.filter((d) => d.status === 'COMPLETED').length, [deliveryPlans]);

  const recentDeliveries = useMemo(
    () => [...deliveryPlans].slice(0, 8),
    [deliveryPlans]
  );

  if (loading) {
    return (
      <DashboardLayout navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Đang tải dữ liệu...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR}>
      <div className="min-h-screen bg-slate-50/60">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">

          {/* ── TITLE ── */}
          <div>
            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">Điều phối giao nhận</h1>
            <p className="mt-0.5 text-sm text-amber-600">Tổng quan chuyến giao và phiếu xuất</p>
          </div>

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {/* ── KPI CARDS ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={Truck}
              label="Tổng chuyến giao"
              value={String(totalTrips)}
              sub="Lịch giao hàng"
              color="amber"
            />
            <KpiCard
              icon={Package}
              label="Phiếu chờ giao"
              value={String(readyOrInTransitExports.length)}
              sub={`${translateStatus('READY')} / ${translateStatus('IN_TRANSIT')}`}
              color="orange"
            />
            <KpiCard
              icon={CheckCircle2}
              label="Chuyến hoàn thành"
              value={String(completedTrips)}
              sub="Đã hoàn thành"
              color="amber"
            />
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid gap-5 lg:grid-cols-5">

            {/* Bảng lịch giao – 3 cols */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:col-span-3">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Truck className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Lịch giao hàng</p>
                  <p className="text-[11px] text-stone-500">Danh sách chuyến giao gần đây</p>
                </div>
                <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  {totalTrips}
                </span>
              </div>
              {recentDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="mb-2 size-8 text-stone-300" />
                  <p className="text-sm text-stone-400">Chưa có lịch giao hàng nào.</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-100 bg-amber-50/70 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                      <th className="px-5 py-2.5">Mã chuyến</th>
                      <th className="px-4 py-2.5">Tài xế</th>
                      <th className="px-4 py-2.5">Biển số</th>
                      <th className="px-4 py-2.5">Ngày dự kiến</th>
                      <th className="px-4 py-2.5">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recentDeliveries.map((d) => (
                      <tr key={d.deliveryId} className="transition hover:bg-amber-50/40">
                        <td className="px-5 py-2.5 font-mono font-medium text-stone-800">{d.deliveryCode}</td>
                        <td className="px-4 py-2.5 text-stone-700">{d.driverName}</td>
                        <td className="px-4 py-2.5 text-stone-500">{d.vehiclePlate}</td>
                        <td className="px-4 py-2.5 text-stone-500">{formatDate(d.scheduledDate)}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                            STATUS_DELIVERY_COLOR[d.status] ?? 'bg-stone-100 text-stone-600 border-stone-200'
                          )}>
                            {translateStatus(d.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Tóm tắt – 2 cols */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Tóm tắt trạng thái</p>
                  <p className="text-[11px] text-stone-500">Phân loại theo trạng thái chuyến</p>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                <SummaryRow label="Chờ thực hiện" count={plannedTrips}   status="PLANNED"    />
                <SummaryRow label="Đang giao"      count={inTransitTrips} status="IN_TRANSIT" />
                <SummaryRow label="Hoàn thành"     count={completedTrips} status="COMPLETED"  />
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-stone-400" />
                    <span className="text-sm font-medium text-stone-600">Tổng chuyến</span>
                  </div>
                  <span className="text-xl font-extrabold text-amber-700">{totalTrips}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── KPI Card ── */
function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: 'amber' | 'orange';
}) {
  const palette = {
    amber:  { border: 'border-amber-100',  icon: 'bg-amber-100  text-amber-600',  num: 'text-amber-700',  dot: 'bg-amber-500'  },
    orange: { border: 'border-orange-100', icon: 'bg-orange-100 text-orange-600', num: 'text-orange-700', dot: 'bg-orange-500' },
  }[color];

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md', palette.border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className={cn('mt-2 text-3xl font-extrabold', palette.num)}>{value}</p>
          <p className="mt-0.5 text-[11px] text-stone-400">{sub}</p>
        </div>
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl shadow-inner', palette.icon)}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className={cn('pointer-events-none absolute -bottom-3 -right-3 size-16 rounded-full opacity-[0.08]', palette.dot)} />
    </div>
  );
}

/* ── Summary Row ── */
function SummaryRow({ label, count, status }: { label: string; count: number; status: string }) {
  const color = STATUS_DELIVERY_COLOR[status] ?? 'bg-stone-100 text-stone-600 border-stone-200';
  return (
    <div className="flex items-center justify-between px-5 py-3.5 transition hover:bg-amber-50/40">
      <div className="flex items-center gap-3">
        <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', color)}>
          {translateStatus(status)}
        </span>
        <span className="text-sm text-stone-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-stone-900">{count}</span>
    </div>
  );
}

export default SupplyDashboard;
