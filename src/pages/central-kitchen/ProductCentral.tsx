import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, Tag, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Đồng bộ DB (public schema):
 *
 * categories:
 *   category_id (PK), category_name, status CHECK (ACTIVE|INACTIVE)
 *
 * products:
 *   product_id (PK), product_name, unit, description, image_url,
 *   status CHECK (ACTIVE|INACTIVE), category_id (FK categories)
 *
 * product_batches:
 *   batch_id (PK), batch_code (UNIQUE), product_id (FK products),
 *   current_quantity, status CHECK (WAITING_FOR_STOCK|AVAILABLE|OUT_OF_STOCK|EXPIRED)
 *
 * Tồn khả dụng = SUM(current_quantity) của các lô status = AVAILABLE theo từng product_id.
 * Trang này dùng cho Bếp trung tâm · quản lý danh mục món / nguyên liệu sản xuất.
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
  { category_id: 5, category_name: 'Nguyên liệu kho', status: 'ACTIVE' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    product_id: 1,
    product_name: 'Cơm gà xối mỡ',
    unit: 'phần',
    description: 'Món chính do bếp trung tâm chế biến, phân phối cho cửa hàng.',
    image_url: null,
    status: 'ACTIVE',
    category_id: 1,
  },
  {
    product_id: 2,
    product_name: 'Phở bò tái',
    unit: 'tô',
    description: 'Món nước chủ lực, chuẩn bị base nước dùng tại bếp trung tâm.',
    image_url: null,
    status: 'ACTIVE',
    category_id: 2,
  },
  {
    product_id: 3,
    product_name: 'Trà chanh sả',
    unit: 'ly',
    description: 'Đồ uống pha chế từ concentrate sản xuất tại bếp trung tâm.',
    image_url: null,
    status: 'ACTIVE',
    category_id: 4,
  },
  {
    product_id: 4,
    product_name: 'Thịt bò phi lê',
    unit: 'kg',
    description: 'Nguyên liệu chính dùng cho các món bò, lưu kho đông lạnh.',
    image_url: null,
    status: 'ACTIVE',
    category_id: 5,
  },
  {
    product_id: 5,
    product_name: 'Chả giò',
    unit: 'phần',
    description: 'Sản phẩm đã tạm ngưng sản xuất.',
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

function ProductCentral() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');

  const productsWithStock = useMemo(() => {
    return MOCK_PRODUCTS.map((p) => {
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

  const totalActive = productsWithStock.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Package className="size-6 text-amber-500" />
              Danh mục sản phẩm bếp trung tâm
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Sản phẩm / nguyên liệu từ bảng <code className="font-mono">products</code> · tồn khả dụng từ{' '}
              <code className="font-mono">product_batches</code> (lô AVAILABLE).
            </CardDescription>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Sản phẩm ACTIVE
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
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên sản phẩm, danh mục, đơn vị..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-full border border-amber-200 bg-amber-50 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={cn(
                    'px-3 py-1.5 transition',
                    categoryFilter === 'ALL'
                      ? 'bg-amber-500 text-white'
                      : 'text-amber-800 hover:bg-amber-100'
                  )}
                >
                  Tất cả
                </button>
                {MOCK_CATEGORIES.filter((c) => c.status === 'ACTIVE').map((cat) => (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.category_id)}
                    className={cn(
                      'border-l border-amber-200 px-3 py-1.5 transition',
                      categoryFilter === cat.category_id
                        ? 'bg-amber-500 text-white'
                        : 'text-amber-800 hover:bg-amber-100'
                    )}
                  >
                    {cat.category_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => {
              const isInactive = p.status === 'INACTIVE';
              const isOutOfStock = p.available_quantity === 0;

              return (
                <Card
                  key={p.product_id}
                  className={cn(
                    'relative flex flex-col border-amber-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                    isInactive ? 'opacity-80' : ''
                  )}
                >
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.product_name}
                            className="size-10 rounded-lg object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-stone-900">
                            {p.product_name}
                          </p>
                          {isInactive && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-600">
                          {p.description ?? 'Chưa có mô tả chi tiết.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-800">
                        <Tag className="size-3" />
                        <span>{p.category_name}</span>
                      </div>
                      <span className="rounded-full border border-stone-200 px-2 py-0.5 text-stone-700">
                        ĐVT: {p.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-stone-500">Tồn khả dụng (AVAILABLE)</span>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isOutOfStock ? 'text-rose-600' : 'text-emerald-700'
                          )}
                        >
                          {p.available_quantity.toLocaleString('vi-VN')} {p.unit}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-amber-200 bg-white text-[11px] text-amber-900 hover:bg-amber-50"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-10 text-center text-xs text-stone-500">
              Không có sản phẩm nào khớp với bộ lọc.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductCentral;
