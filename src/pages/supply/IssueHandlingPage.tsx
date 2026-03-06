import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockActivity } from '@/services/mockDashboardData';
import { AlertTriangle, Search, Clock, CheckCircle } from 'lucide-react';

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

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
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
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Tổng sự cố
              </span>
              <span className="text-lg font-semibold text-amber-900">{MOCK_ISSUES.length}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Chờ xử lý
              </span>
              <span className="text-lg font-semibold text-amber-900">{pendingCount}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Đã xử lý
              </span>
              <span className="text-lg font-semibold text-amber-900">{resolvedCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo mã sự cố, chi nhánh hoặc người báo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 ${statusFilter === 'ALL' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${statusFilter === 'PENDING' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
                >
                  Chờ xử lý
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${statusFilter === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
                >
                  Đang xử lý
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('RESOLVED')}
                  className={`border-l border-amber-200 px-3 py-1.5 ${statusFilter === 'RESOLVED' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
                >
                  Đã xử lý
                </button>
              </div>
              <Button className="h-9 rounded-full bg-amber-500 px-4 text-xs text-white hover:bg-amber-600">
                Báo sự cố mới
              </Button>
            </div>
          </div>

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
                  <div className="py-10 text-center text-xs text-stone-500">
                    Không có sự cố nào phù hợp với bộ lọc.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="text-sm font-bold text-amber-900">
                  Theo loại sự cố
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Phân loại Giao hàng / Tồn kho / Chất lượng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {(['DELIVERY', 'INVENTORY', 'QUALITY'] as IssueType[]).map((type) => {
                  const count = MOCK_ISSUES.filter((i) => i.type === type).length;
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                          <AlertTriangle className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-stone-900">
                          {ISSUE_TYPE_LABEL[type]}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-900">{count} sự cố</span>
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
