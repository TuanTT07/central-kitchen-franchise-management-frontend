import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Package, Truck } from 'lucide-react';
import { SUPPLY_COORDINATOR_SIDEBAR_ITEMS } from '@/components/layout/sidebarConfig';
import { Role } from '@/Types';
import { supplyServices, type DeliveryPlanResponse, type ExportNotesResponse } from '@/services/supplyServices';
import { translateStatus } from '@/utils/labelMapping';

const SupplyDashboard = () => {
  const [exportNotes, setExportNotes] = useState<ExportNotesResponse[]>([]);
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function parsePaginatedItems<T>(data: unknown): T[] {
    if (!data || typeof data !== 'object') return [];
    const o = data as Record<string, unknown>;
    const arr = (o.items ?? o.content) as T[] | undefined;
    return Array.isArray(arr) ? arr : [];
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [exportRes, deliveryRes] = await Promise.allSettled([
          supplyServices.getAllExportNote(),
          supplyServices.getDeliveryPlan(),
        ]);

        if (exportRes.status === 'fulfilled' && exportRes.value?.data) {
          const paginated = (exportRes.value as { data?: unknown }).data;
          const list = parsePaginatedItems<ExportNotesResponse>(paginated);
          setExportNotes(Array.isArray(list) ? list : []);
        }

        if (deliveryRes.status === 'fulfilled' && deliveryRes.value?.data) {
          const paginated = (deliveryRes.value as { data?: unknown }).data;
          const list = parsePaginatedItems<DeliveryPlanResponse>(paginated);
          setDeliveryPlans(Array.isArray(list) ? list : []);
        }
      } catch {
        setError('Không tải được dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalTrips = deliveryPlans.length;
  const readyOrInTransitExports = useMemo(
    () => exportNotes.filter((e) => e.status === 'READY' || e.status === 'IN_TRANSIT'),
    [exportNotes]
  );
  const plannedTrips = useMemo(
    () => deliveryPlans.filter((d) => d.status === 'PLANNED').length,
    [deliveryPlans]
  );
  const inTransitTrips = useMemo(
    () => deliveryPlans.filter((d) => d.status === 'IN_TRANSIT').length,
    [deliveryPlans]
  );
  const completedTrips = useMemo(
    () => deliveryPlans.filter((d) => d.status === 'COMPLETED').length,
    [deliveryPlans]
  );

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <DashboardLayout navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR}>
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Điều phối giao nhận
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Tổng quan chuyến giao và phiếu xuất.
            </p>
          </header>

          {/* KPIs – dữ liệu từ API */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tổng chuyến giao
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {totalTrips}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Lịch giao hàng</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Phiếu chờ giao
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {readyOrInTransitExports.length}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Phiếu {translateStatus('READY')} / {translateStatus('IN_TRANSIT')}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Chuyến hoàn thành
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                      {completedTrips}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Đã hoàn thành</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Bảng chuyến giao */}
          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border-0 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Lịch giao hàng
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Danh sách chuyến giao
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {deliveryPlans.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Chưa có lịch giao hàng nào.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs text-slate-600">
                          <th className="px-4 py-3 font-semibold">Mã chuyến</th>
                          <th className="px-3 py-3 font-semibold">Tài xế</th>
                          <th className="px-3 py-3 font-semibold">Biển số</th>
                          <th className="px-3 py-3 text-center font-semibold">Ngày dự kiến</th>
                          <th className="px-4 py-3 text-right font-semibold">Số phiếu xuất</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deliveryPlans.map((d) => (
                          <tr key={d.deliveryId} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium text-slate-900">{d.deliveryCode}</td>
                            <td className="px-3 py-3 text-slate-700">{d.driverName}</td>
                            <td className="px-3 py-3 text-slate-700">{d.vehiclePlate}</td>
                            <td className="px-3 py-3 text-center text-slate-700">
                              {formatDate(d.scheduledDate)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {Array.isArray(d.exportNotes) ? d.exportNotes.length : 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tóm tắt chuyến giao */}
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Tóm tắt chuyến giao
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Phân loại theo trạng thái
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                  <span className="text-slate-600">Chờ thực hiện ({translateStatus('PLANNED')})</span>
                  <span className="font-semibold text-slate-900">{plannedTrips}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                  <span className="text-slate-600">Đang giao ({translateStatus('IN_TRANSIT')})</span>
                  <span className="font-semibold text-slate-900">{inTransitTrips}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                  <span className="text-slate-600">Hoàn thành ({translateStatus('COMPLETED')})</span>
                  <span className="font-semibold text-slate-900">{completedTrips}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-medium text-slate-700">Tổng chuyến</span>
                  <span className="text-lg font-semibold text-slate-900">{totalTrips}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupplyDashboard;
