import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, Tag, ShoppingCart, Image as ImageIcon } from 'lucide-react';

/**
 * Đồng bộ DB (public schema):
 *
 * categories: category_id (PK), category_name, status CHECK (ACTIVE|INACTIVE)
 * products: product_id (PK), product_name, unit, description, image_url, status, category_id (FK)
 * product_batches: batch_id (PK), batch_code (UNIQUE), product_id (FK), current_quantity,
 *   status CHECK (WAITING_FOR_STOCK|AVAILABLE|OUT_OF_STOCK|EXPIRED)
 *   → Tồn khả dụng = tổng current_quantity của các lô status = AVAILABLE
 */

type ProductStatus = 'ACTIVE' | 'INACTIVE' | null;
type BatchStatus = 'WAITING_FOR_STOCK' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'EXPIRED';

interface Category {
  category_id: number;
  category_name: string;
  status: ProductStatus;
}

interface Product {
  product_id: number;
  product_name: string;
  unit: string;
  description: string | null;
  image_url: string | null;
  status: ProductStatus;
  category_id: number | null;
}

interface ProductBatch {
  batch_id: number;
  batch_code: string;
  product_id: number;
  current_quantity: number;
  status: BatchStatus;
}

const MOCK_CATEGORIES: Category[] = [
  { category_id: 1, category_name: 'Món chính', status: 'ACTIVE' },
  { category_id: 2, category_name: 'Món nước', status: 'ACTIVE' },
  { category_id: 3, category_name: 'Khai vị', status: 'ACTIVE' },
  { category_id: 4, category_name: 'Đồ uống', status: 'ACTIVE' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    unit: 'phần',
    description: 'Suất cơm gà bán tại cửa hàng',
    image_url: null,
    status: 'ACTIVE',
    category_id: 1,
  },
  {
    product_id: 2,
    product_name: 'Phở bò tái',
    unit: 'tô',
    description: 'Món nước bán chạy',
    image_url: null,
    status: 'ACTIVE',
    category_id: 2,
  },
  {
    product_id: 3,
    product_name: 'Trà chanh sả',
    unit: 'ly',
    description: 'Đồ uống giải khát',
    image_url: null,
    status: 'ACTIVE',
    category_id: 4,
  },
  {
    product_id: 4,
    product_name: 'Thịt bò phi lê',
    unit: 'kg',
    description: 'Nguyên liệu kho lạnh',
    image_url: null,
    status: 'ACTIVE',
    category_id: 1,
  },
  {
    product_id: 5,
    product_name: 'Chả giò',
    unit: 'phần',
    description: 'Khai vị',
    image_url: null,
    status: 'INACTIVE',
    category_id: 3,
  },
];

const MOCK_PRODUCT_BATCHES: ProductBatch[] = [
  { batch_id: 1, batch_code: 'LOT-COMGA-001', product_id: 1, current_quantity: 120, status: 'AVAILABLE' },
  { batch_id: 2, batch_code: 'LOT-PHO-001', product_id: 2, current_quantity: 70, status: 'AVAILABLE' },
  { batch_id: 3, batch_code: 'LOT-TRACHANH-001', product_id: 3, current_quantity: 260, status: 'AVAILABLE' },
  { batch_id: 4, batch_code: 'LOT-THITBO-001', product_id: 4, current_quantity: 25, status: 'AVAILABLE' },
  { batch_id: 5, batch_code: 'LOT-CHA-001', product_id: 5, current_quantity: 0, status: 'OUT_OF_STOCK' },
];

function ProductsFranchise() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');

  const productsWithStock = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => p.status === 'ACTIVE').map((p) => {
      const available = MOCK_PRODUCT_BATCHES.filter(
        (b) => b.product_id === p.product_id && b.status === 'AVAILABLE'
      ).reduce((sum, b) => sum + b.current_quantity, 0);
      const categoryName =
        p.category_id != null
          ? MOCK_CATEGORIES.find((c) => c.category_id === p.category_id)?.category_name ?? 'N/A'
          : 'N/A';
      return {
        ...p,
        available_quantity: available,
        category_name: categoryName,
      };
    });
  }, []);

  const filteredProducts = useMemo(() => {
    let data = productsWithStock;
    if (categoryFilter !== 'ALL') {
      data = data.filter((p) => p.category_id === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q) ||
          p.unit.toLowerCase().includes(q)
      );
    }
    return data;
  }, [productsWithStock, search, categoryFilter]);

  const totalActive = productsWithStock.length;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Danh mục sản phẩm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Sản phẩm từ bảng products, tồn khả dụng từ product_batches (lô AVAILABLE). Chỉ hiển thị
              sản phẩm ACTIVE.
            </CardDescription>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Sản phẩm đang bán
              </span>
              <span className="text-lg font-semibold text-amber-900">{totalActive}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Danh mục
              </span>
              <span className="text-lg font-semibold text-amber-900">
                {MOCK_CATEGORIES.filter((c) => c.status === 'ACTIVE').length}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên sản phẩm, danh mục, đơn vị..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-800">
                <Tag className="size-3" />
                <span>Danh mục:</span>
              </div>
              <select
                className="h-9 rounded-full border border-amber-200 bg-amber-50 px-3 text-xs text-amber-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
              >
                <option value="ALL">Tất cả</option>
                {MOCK_CATEGORIES.filter((c) => c.status === 'ACTIVE').map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-amber-200/60 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3 text-right">Tồn khả dụng</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60">
                {filteredProducts.map((p) => (
                  <tr key={p.product_id} className="transition hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-700">#{p.product_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-100 bg-amber-50/60">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.product_name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-5 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900">{p.product_name}</p>
                          {p.description && (
                            <p className="line-clamp-1 text-[11px] text-stone-500">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-semibold text-amber-800">
                        <Tag className="size-3" />
                        {p.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{p.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">
                      {p.available_quantity.toLocaleString()} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        asChild
                        size="sm"
                        className="h-8 gap-1.5 bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        <Link to="/franchise-store/create-order" className="no-underline">
                          <ShoppingCart className="size-4" />
                          Đặt hàng
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-xs text-stone-500">
                Không có sản phẩm nào phù hợp với bộ lọc.
              </div>
            )}
          </div>

          <p className="text-[11px] text-amber-700/80">
            Tồn khả dụng = tổng current_quantity của các lô product_batches có status = AVAILABLE.
            Chuyển đến &quot;Tạo đơn đặt hàng&quot; để thêm sản phẩm vào đơn.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductsFranchise;
