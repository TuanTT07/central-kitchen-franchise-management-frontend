import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockRecentOrders } from '@/services/mockDashboardData';
import { LayoutGrid, MapPin, Search } from 'lucide-react';

type PlanStatus = 'READY' | 'SHIPPED' | 'CANCEL';

const STATUS_LABEL: Record<PlanStatus, string> = {
  READY: 'Sẵn sàng giao',
  SHIPPED: 'Đã giao',
  CANCEL: 'Đã hủy',
};

const STATUS_CLASS: Record<PlanStatus, string> = {
  READY: 'bg-amber-100 text-amber-800 border-amber-200',
  SHIPPED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCEL: 'bg-stone-100 text-stone-600 border-stone-200',
};

// Giả lập đợt phân phối theo chi nhánh (sau map sang export_notes + store_orders)
const buildPlansFromOrders = () => {
  const byBranch = new Map<string, typeof mockRecentOrders>();
  mockRecentOrders.forEach((o) => {
    const list = byBranch.get(o.customer) ?? [];
    list.push(o);
    byBranch.set(o.customer, list);
  });
  return Array.from(byBranch.entries()).map(([branch, orders], idx) => ({
    planId: `PLAN-${idx + 1}`,
    branch,
    orderCount: orders.length,
    totalQty: orders.reduce((s, x) => s + x.quantity, 0),
    totalAmount: orders.reduce((s, x) => s + x.amount, 0),
    status: (idx % 3 === 0 ? 'SHIPPED' : idx % 3 === 1 ? 'READY' : 'READY') as PlanStatus,
    mainProduct: orders[0]?.itemName ?? '—',
  }));
};

const MOCK_PLANS = buildPlansFromOrders();

const DistributionPlanPage = () => {
  const [search, setSearch] = useState('');

  const filteredPlans = useMemo(() => {
    if (!search.trim()) return MOCK_PLANS;
    const q = search.toLowerCase();
    return MOCK_PLANS.filter(
      (p) =>
        p.planId.toLowerCase().includes(q) ||
        p.branch.toLowerCase().includes(q) ||
        p.mainProduct.toLowerCase().includes(q)
    );
  }, [search]);

  const readyCount = MOCK_PLANS.filter((p) => p.status === 'READY').length;
  const shippedCount = MOCK_PLANS.filter((p) => p.status === 'SHIPPED').length;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <LayoutGrid className="size-6 text-amber-500" />
              Kế hoạch phân phối
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Lập và theo dõi các đợt phân phối từ bếp trung tâm tới chi nhánh (map export_notes, store_orders).
            </CardDescription>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng đợt
              </span>
              <span className="text-lg font-semibold text-amber-900">{MOCK_PLANS.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Sẵn sàng giao
              </span>
              <span className="text-lg font-semibold text-amber-900">{readyCount}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Đã giao
              </span>
              <span className="text-lg font-semibold text-amber-900">{shippedCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã đợt, chi nhánh hoặc sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <Button className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600">
              Tạo đợt phân phối
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">
                  Danh sách đợt phân phối (giả lập)
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Mapping sau sang export_notes + store_orders theo store
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã đợt</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold">Sản phẩm chính</th>
                        <th className="px-2 py-2 font-semibold text-center">Số đơn</th>
                        <th className="px-2 py-2 font-semibold text-right">Tổng SL</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filteredPlans.map((p) => (
                        <tr key={p.planId} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 font-semibold text-stone-900">{p.planId}</td>
                          <td className="px-4 py-2 text-stone-800">{p.branch}</td>
                          <td className="px-4 py-2 text-stone-800">{p.mainProduct}</td>
                          <td className="px-2 py-2 text-center text-stone-800">{p.orderCount}</td>
                          <td className="px-2 py-2 text-right text-stone-800">{p.totalQty}</td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[p.status]}`}
                            >
                              {STATUS_LABEL[p.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPlans.length === 0 && (
                  <div className="py-10 text-center text-xs text-stone-500">
                    Không có đợt phân phối nào phù hợp.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">
                  Theo chi nhánh
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Số đợt phân phối theo điểm đến (stores)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {MOCK_PLANS.map((p) => (
                  <div
                    key={p.planId}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-900">{p.branch}</p>
                        <p className="text-[10px] text-stone-500">{p.orderCount} đơn · {p.totalQty} SL</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistributionPlanPage;
