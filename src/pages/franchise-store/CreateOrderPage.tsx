import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Tag, Minus, Plus } from 'lucide-react';
import { managerServices, type ProductsResponse } from '@/services/managerServices';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

const CreateOrderPage = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  const { addItem } = useCart();

  // Quản lí state của products
  const [products, setProducts] = useState<ProductsResponse[]>([]);
  const [draftQty, setDraftQty] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const getAllProducts = async () => {
    setIsLoading(true);
    try {
      const response = await managerServices.getAllProducts();
      if (response && response.success) {
        // Handle both direct array and paginated response
        const data = response.data;
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && typeof data === 'object' && 'content' in data) {
          setProducts((data as any).content || []);
        } else if (data && typeof data === 'object' && 'items' in data) {
          setProducts((data as any).items || []);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách sản phẩm');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  const productsAvaiable = useMemo(() => {
    return products.filter((p) => p.status === 'ACTIVE');
  }, [products]);

  const filteredProducts = useMemo(() => {
    let data = productsAvaiable;
    if (categoryFilter !== 'ALL') {
      data = data.filter((p) => p.categoryId === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [productsAvaiable, categoryFilter, search]);

  const getDraftQty = (productId: number) => draftQty[productId] ?? 1;
  const changeDraftQty = (productId: number, delta: number) => {
    setDraftQty((prev) => {
      const next = Math.max(1, (prev[productId] ?? 1) + delta);
      return { ...prev, [productId]: next };
    });
  };

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <ShoppingCart className="size-6 text-amber-500" />
              Menu đặt hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Chọn món từ menu và thêm vào giỏ hàng. Bạn có thể tiếp tục đặt hàng khi chuyển trang.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 -mt-2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên món, danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-200 bg-amber-50/40 pl-9 text-xs focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-800">
                <Tag className="size-3" />
                <span>Lọc danh mục:</span>
              </div>
              <select
                className="h-9 rounded-full border border-amber-200 bg-amber-50 px-3 text-xs text-amber-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              >
                <option value="ALL">Tất cả</option>
                {Array.from(
                  new Map(
                    products
                      .filter((p) => p.categoryId && p.categoryName)
                      .map((p) => [p.categoryId, p.categoryName] as const)
                  )
                ).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 py-16 text-center text-sm text-amber-800">
              Đang tải menu...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 py-16 text-center text-sm text-amber-800">
              Không có sản phẩm nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => {
                const qty = getDraftQty(p.productId);
                return (
                  <div
                    key={p.productId}
                    className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-amber-50">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.productName}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-amber-700/80">
                          Chưa có hình ảnh
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-amber-800 backdrop-blur">
                          <Tag className="size-3" />
                          {p.categoryName}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="space-y-1">
                        <p className="line-clamp-1 text-sm font-semibold text-stone-900">
                          {p.productName}
                        </p>
                        <p className="text-[11px] text-stone-600">
                          Đơn vị: <span className="font-medium text-stone-800">{p.unitName}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => changeDraftQty(p.productId, -1)}
                            className="flex size-8 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-[2.75rem] text-center text-sm font-semibold text-stone-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeDraftQty(p.productId, 1)}
                            className="flex size-8 items-center justify-center rounded-full border border-amber-400 bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            'h-9 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-xs font-semibold text-white shadow-sm hover:from-amber-600 hover:to-orange-600'
                          )}
                          onClick={() => {
                            addItem({
                              productId: p.productId,
                              name: p.productName,
                              unitName: p.unitName,
                              unitPrice: p.price,
                              imageUrl: p.imageUrl,
                              quantity: qty,
                            });
                            setDraftQty((prev) => ({ ...prev, [p.productId]: 1 }));
                            toast.success(`Đã thêm ${qty} ${p.unitName} vào giỏ hàng`);
                          }}
                        >
                          Thêm vào giỏ
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOrderPage;
