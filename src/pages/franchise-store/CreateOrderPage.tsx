import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, Tag, Minus, Plus, Loader2, UtensilsCrossed } from 'lucide-react';
import { managerServices, type ProductsResponse } from '@/services/managerServices';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

const formatCurrencyVND = (value?: number) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CreateOrderPage = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  const { addItem } = useCart();

  const [products, setProducts] = useState<ProductsResponse[]>([]);
  const [draftQty, setDraftQty] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const getAllProducts = async () => {
    setIsLoading(true);
    try {
      const response = await managerServices.getAllProducts();
      if (response && response.success) {
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
    } catch {
      toast.error('Lỗi khi lấy danh sách sản phẩm');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  const productsAvailable = useMemo(() => products.filter((p) => p.status === 'ACTIVE'), [products]);

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          products
            .filter((p) => p.categoryId && p.categoryName)
            .map((p) => [p.categoryId, p.categoryName] as const)
        )
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let data = productsAvailable;
    if (categoryFilter !== 'ALL') data = data.filter((p) => p.categoryId === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [productsAvailable, categoryFilter, search]);

  const getDraftQty = (productId: number) => draftQty[productId] ?? 1;
  const changeDraftQty = (productId: number, delta: number) =>
    setDraftQty((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] ?? 1) + delta),
    }));

  return (
    <div className="flex min-h-full flex-col gap-0">

      {/* ── PAGE HEADER ── */}
      <div className="sticky top-0 z-10 border-b border-amber-100 bg-white/95 backdrop-blur-sm px-6 py-4">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
          <input
            type="text"
            placeholder="Tìm theo tên món, danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-amber-200 bg-amber-50/60 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              categoryFilter === 'ALL'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-200'
                : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50'
            )}
          >
            Tất cả
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setCategoryFilter(id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                categoryFilter === id
                  ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-200'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="size-10 animate-spin text-amber-400" />
            <p className="text-sm font-medium text-amber-600">Đang tải thực đơn...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-400">
            <UtensilsCrossed className="size-12 opacity-30" />
            <p className="text-sm">Không có sản phẩm nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => {
              const qty = getDraftQty(p.productId);
              return (
                <ProductCard
                  key={p.productId}
                  product={p}
                  qty={qty}
                  onChangeQty={(delta) => changeDraftQty(p.productId, delta)}
                  onAddToCart={() => {
                    addItem({
                      productId: p.productId,
                      name: p.productName,
                      unitName: p.unitName,
                      unitPrice: p.price,
                      imageUrl: p.imageUrl,
                      quantity: qty,
                    });
                    setDraftQty((prev) => ({ ...prev, [p.productId]: 1 }));
                    toast.success(`Đã thêm ${qty} ${p.unitName} "${p.productName}" vào giỏ`);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Product Card ── */
function ProductCard({
  product: p,
  qty,
  onChangeQty,
  onAddToCart,
}: {
  product: ProductsResponse;
  qty: number;
  onChangeQty: (delta: number) => void;
  onAddToCart: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-100/60">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.productName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-amber-300">
            <UtensilsCrossed className="size-10 opacity-40" />
            <span className="text-[10px] text-amber-400">Chưa có hình</span>
          </div>
        )}

        {/* Category badge */}
        {p.categoryName && (
          <div className="absolute left-2.5 top-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm backdrop-blur-sm">
              <Tag className="size-2.5" />
              {p.categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-stone-900">{p.productName}</p>
        <p className="mt-1 text-[11px] text-stone-500">
          Đơn vị: <span className="font-semibold text-stone-700">{p.unitName}</span>
        </p>

        {/* Price */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">
            {formatCurrencyVND(p.price)}
          </span>
        </div>

        {/* Qty control + add button */}
        <div className="mt-4 flex items-center gap-2">
          {/* - qty + */}
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-1 py-1">
            <button
              type="button"
              onClick={() => onChangeQty(-1)}
              className="flex size-7 items-center justify-center rounded-lg text-stone-500 transition hover:bg-amber-100 hover:text-amber-700"
              aria-label="Giảm"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-[1.6rem] text-center text-sm font-bold text-stone-800">{qty}</span>
            <button
              type="button"
              onClick={() => onChangeQty(1)}
              className="flex size-7 items-center justify-center rounded-lg text-stone-500 transition hover:bg-amber-100 hover:text-amber-700"
              aria-label="Tăng"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            onClick={onAddToCart}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white shadow-sm shadow-amber-200 transition hover:from-amber-600 hover:to-orange-600 hover:shadow-md active:scale-[0.97]"
          >
            <ShoppingCart className="size-3.5" />
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateOrderPage;
