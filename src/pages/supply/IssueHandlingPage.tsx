import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockActivity } from '@/services/mockDashboardData';
import { AlertTriangle, Search, Clock, CheckCircle, SlidersHorizontal, Filter, RefreshCw, Plus } from 'lucide-react';

type IssueType = 'DELIVERY' | 'INVENTORY' | 'QUALITY';
type IssueStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  DELIVERY: 'Giao hàng',
  INVENTORY: 'Tồn kho',
  QUALITY: 'Chất lượng',
};

const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
};

const ISSUE_STATUS_CLASS: Record<IssueStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-200',
  RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

// Mock sự cố từ bối cảnh Supply (sau map sang bảng issues/incidents nếu có trong DB)
const MOCK_ISSUES = [
  {
    id: 'ISS-001',
    type: 'DELIVERY' as IssueType,
    status: 'PENDING' as IssueStatus,
    title: 'Trễ giao đơn TRF-1026',
    description: 'Chuyến giao Chi nhánh Q7 chậm 30 phút do kẹt xe.',
    branch: 'Chi nhánh Q7',
    reportedBy: mockActivity[0]?.userName ?? 'Nguyễn Văn A',
    createdAt: '11:20',
  },
  {
    id: 'ISS-002',
    type: 'INVENTORY' as IssueType,
    status: 'IN_PROGRESS' as IssueStatus,
    title: 'Thiếu hàng so với đơn',
    description: 'Đơn PO-1027 thiếu 5 đơn vị Dầu ăn 5L so với yêu cầu.',
    branch: 'Chi nhánh Bình Thạnh',
    reportedBy: mockActivity[1]?.userName ?? 'Trần Thị B',
    createdAt: '10:45',
  },
  {
    id: 'ISS-003',
    type: 'QUALITY' as IssueType,
    status: 'RESOLVED' as IssueStatus,
    title: 'Bao bì bị ẩm',
    description: 'Lô Hành tỏi khô giao Chi nhánh Phú Nhuận bị ẩm, đã đổi lô mới.',
    branch: 'Chi nhánh Phú Nhuận',
    reportedBy: mockActivity[2]?.userName ?? 'Lê Văn C',
    createdAt: '09:30',
  },
];

const IssueHandlingPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'ALL'>('ALL');

  const filteredIssues = useMemo(() => {
    let data = MOCK_ISSUES;

    if (statusFilter !== 'ALL') {
      data = data.filter((i) => i.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.branch.toLowerCase().includes(q) ||
          i.reportedBy.toLowerCase().includes(q)
      );
    }

    return data;
  }, [search, statusFilter]);

  const pendingCount = MOCK_ISSUES.filter((i) => i.status === 'PENDING').length;
  const resolvedCount = MOCK_ISSUES.filter((i) => i.status === 'RESOLVED').length;

  const inProgressCount = MOCK_ISSUES.filter((i) => i.status === 'IN_PROGRESS').length;

  return (
    <div className="h-full w-full space-y-5">
      {/* ── Header Card ── */}
      <Card className="overflow-hidden border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <AlertTriangle className="size-6 text-amber-500" />
              Xử lý sự cố
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Theo dõi và xử lý các sự cố trong quá trình giao nhận từ bếp trung tâm.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Tổng sự cố</span>
              <span className="mt-0.5 text-2xl font-bold text-amber-900">{MOCK_ISSUES.length}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-yellow-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-600">Chờ xử lý</span>
              <span className="mt-0.5 text-2xl font-bold text-yellow-700">{pendingCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-sky-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">Đang xử lý</span>
              <span className="mt-0.5 text-2xl font-bold text-sky-700">{inProgressCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-white/70 px-5 py-2.5 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Đã xử lý</span>
              <span className="mt-0.5 text-2xl font-bold text-emerald-700">{resolvedCount}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
        {/* Search */}
        <div className="relative w-72 flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <input
            type="text"
            placeholder="Tìm theo mã sự cố, chi nhánh hoặc người báo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-amber-200 bg-amber-50/40 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60"
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex h-9 flex-none items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber-500" />
          <span className="whitespace-nowrap text-[11px] font-medium text-amber-700">Bộ lọc:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'ALL')}
            className="cursor-pointer appearance-none bg-transparent pr-4 text-xs font-semibold text-amber-900 outline-none"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="RESOLVED">Đã xử lý</option>
          </select>
          <Filter className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-amber-400" />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-none gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-6 w-px shrink-0 bg-amber-200" />

        {/* Action */}
        <Button
          size="sm"
          className="h-9 flex-none gap-1.5 rounded-lg bg-amber-500 px-4 text-xs text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95"
        >
          <Plus className="size-3.5" />
          Báo sự cố mới
        </Button>
      </div>

      {/* ── Content ── */}
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardContent className="p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-amber-100 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">
                  Danh sách sự cố (giả lập)
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Mapping sau sang bảng issues/incidents khi backend hỗ trợ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] text-amber-900">
                        <th className="px-4 py-2 font-semibold">Mã</th>
                        <th className="px-4 py-2 font-semibold">Loại</th>
                        <th className="px-4 py-2 font-semibold">Tiêu đề</th>
                        <th className="px-4 py-2 font-semibold">Chi nhánh</th>
                        <th className="px-4 py-2 font-semibold">Người báo</th>
                        <th className="px-4 py-2 font-semibold text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filteredIssues.map((i) => (
                        <tr key={i.id} className="hover:bg-amber-50/40">
                          <td className="px-4 py-2 font-semibold text-stone-900">{i.id}</td>
                          <td className="px-4 py-2 text-stone-700">{ISSUE_TYPE_LABEL[i.type]}</td>
                          <td className="px-4 py-2 text-stone-800">
                            <span className="line-clamp-1" title={i.description}>
                              {i.title}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-stone-800">{i.branch}</td>
                          <td className="px-4 py-2 text-stone-700">{i.reportedBy}</td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${ISSUE_STATUS_CLASS[i.status]}`}
                            >
                              {i.status === 'RESOLVED' && <CheckCircle className="size-3" />}
                              {i.status === 'PENDING' && <Clock className="size-3" />}
                              {ISSUE_STATUS_LABEL[i.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredIssues.length === 0 && (
                  <div className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <AlertTriangle className="size-10 opacity-30" />
                      <p className="text-sm font-medium">Không có sự cố nào</p>
                      <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">Theo loại sự cố</CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Phân loại Giao hàng / Tồn kho / Chất lượng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 text-xs">
                {(['DELIVERY', 'INVENTORY', 'QUALITY'] as IssueType[]).map((type) => {
                  const count = MOCK_ISSUES.filter((i) => i.type === type).length;
                  const percent = Math.round((count / MOCK_ISSUES.length) * 100) || 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-700">{ISSUE_TYPE_LABEL[type]}</span>
                        <span className="text-[11px] font-semibold text-amber-700">{count} sự cố · {percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="h-px bg-amber-100" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Theo trạng thái</p>
                {(['PENDING', 'IN_PROGRESS', 'RESOLVED'] as IssueStatus[]).map((status) => {
                  const count = MOCK_ISSUES.filter((i) => i.status === status).length;
                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {status === 'RESOLVED' && <CheckCircle className="size-3.5 text-emerald-500" />}
                        {status === 'PENDING' && <Clock className="size-3.5 text-yellow-500" />}
                        {status === 'IN_PROGRESS' && <AlertTriangle className="size-3.5 text-sky-500" />}
                        <span className="font-medium text-stone-700">{ISSUE_STATUS_LABEL[status]}</span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${ISSUE_STATUS_CLASS[status]}`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueHandlingPage;
