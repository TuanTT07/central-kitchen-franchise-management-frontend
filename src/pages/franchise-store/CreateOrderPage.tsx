/**
 * File: CreateOrderPage.tsx
 * Description: Giao diện chọn món phân loại theo danh mục và thẻ sản phẩm nằm ngang
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Loader2, UtensilsCrossed } from 'lucide-react';
import { managerServices, type ProductsResponse } from '@/services/managerServices';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

/**
 * Helper: Định dạng tiền tệ VND
 */
const formatCurrencyVND = (value?: number) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * CreateOrderPage Component
 * - Lấy danh sách sản phẩm từ API
 * - Tìm kiếm và lọc theo danh mục
 * - Hiển thị sản phẩm theo nhóm danh mục
 */
const CreateOrderPage = () => {

  // ================= STATE =================

  // Từ khóa tìm kiếm
  const [search, setSearch] = useState('');
  
  // Lọc theo danh mục đã chọn
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  
  // Toàn bộ sản phẩm ACTIVE từ API
  const [products, setProducts] = useState<ProductsResponse[]>([]);
  
  // Trạng thái loading
  const [isLoading, setIsLoading] = useState(false);

  // Context giỏ hàng
  const { addItem } = useCart();

  // ================= EFFECT =================

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= API =================

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await managerServices.getAllProducts();
      if (response && response.success) {
        const data = response.data;
        let pList: ProductsResponse[] = [];
        if (Array.isArray(data)) {
          pList = data;
        } else if (data && typeof data === 'object' && 'content' in data) {
          pList = (data as any).content || [];
        } else if (data && typeof data === 'object' && 'items' in data) {
          pList = (data as any).items || [];
        }
        setProducts(pList.filter((p) => p.status === 'ACTIVE'));
      }
    } catch {
      toast.error('Lỗi khi lấy danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= HANDLER =================

  /**
   * Xử lý thêm sản phẩm vào giỏ hàng
   */
  const handleAddToCart = (p: ProductsResponse) => {
    addItem({
      productId: p.productId,
      name: p.productName,
      unitName: p.unitName,
      unitPrice: p.price,
      imageUrl: p.imageUrl,
      orderMultiplier: p.orderMultiplier,
    });
    toast.success(`Đã thêm "${p.productName}" vào giỏ hàng`);
  };

  // ================= UTILS =================

  // Danh sách các ID/Tên danh mục duy nhất để hiển thị bộ lọc
  const categoryOptions = useMemo(
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

  // Sản phẩm sau khi search & filter
  const filteredProducts = useMemo(() => {
    let data = products;
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
  }, [products, categoryFilter, search]);

  // Nhóm sản phẩm theo danh mục để render Section
  const groupedProducts = useMemo(() => {
    const groups: Record<string, { name: string; items: ProductsResponse[] }> = {};
    filteredProducts.forEach((p) => {
      const catName = p.categoryName || 'Khác';
      if (!groups[catName]) groups[catName] = { name: catName, items: [] };
      groups[catName].items.push(p);
    });
    return Object.values(groups);
  }, [filteredProducts]);

  // ================= RENDER =================

  return (
    <div className="flex min-h-full flex-col bg-stone-50/40">

      {/* ── BỘ LỌC VÀ TÌM KIẾM ── */}
      <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-6 py-4 shadow-sm">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm món ngon của bạn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/50 transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={cn(
              'rounded-full border cursor-pointer px-4 py-1.5 text-xs font-bold transition-all',
              categoryFilter === 'ALL'
                ? 'border-amber-800 bg-amber-400 text-white shadow-md'
                : 'border-amber-200 bg-white text-stone-500 hover:border-amber-400 hover:text-stone-700'
            )}
          >
            Tất cả
          </button>
          {categoryOptions.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setCategoryFilter(id)}
              className={cn(
                'rounded-full border cursor-pointer px-4 py-1.5 text-xs font-bold transition-all',
                categoryFilter === id
                  ? 'border-amber-800 bg-amber-400 text-white shadow-md'
                  : 'border-amber-200 bg-white text-stone-500 hover:border-amber-400 hover:text-stone-700'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── DANH SÁCH MÓN ĂN ── */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32">
            <Loader2 className="size-10 animate-spin text-stone-300" />
            <p className="text-sm font-semibold text-stone-400">Đang chuẩn bị thực đơn...</p>
          </div>
        ) : groupedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32 text-stone-400">
            <UtensilsCrossed className="size-12 opacity-20" />
            <p className="text-sm font-medium">Rất tiếc, không tìm thấy món bạn cần.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedProducts.map((group) => (
              <div key={group.name} className="space-y-6">
                <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3">
                  {group.name}
                  <div className="h-1 flex-1 bg-stone-100 rounded-full" />
                </h2>
                
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((p) => (
                    <ProductCard
                      key={p.productId}
                      product={p}
                      onAdd={() => handleAddToCart(p)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ProductCard Component
 * - Thiết kế nằm ngang (Horizontal)
 * - Thông tin bên trái, hình ảnh bên phải
 * - Nút thêm nhanh màu tối ở góc hình ảnh
 */
function ProductCard({
  product: p,
  onAdd,
}: {
  product: ProductsResponse;
  onAdd: () => void;
}) {
  return (
    <div className="group relative flex h-44 overflow-hidden rounded-3xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/50 hover:border-stone-200 active:scale-[0.98]">
      
      {/* ── Thông tin món (Bên trái) ── */}
      <div className="flex flex-1 flex-col justify-between py-1 pr-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-stone-900 group-hover:text-amber-600 transition-colors">
            {p.productName}
          </h3>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-stone-500 font-medium italic">
            {p.description || `Đơn vị: ${p.unitName} - Sản phẩm chất lượng cao cho nhà hàng.`}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-stone-900">
            {formatCurrencyVND(p.price)}
          </span>
        </div>
      </div>

      {/* ── Hình ảnh (Bên phải) ── */}
      <div className="relative aspect-square w-32 overflow-hidden rounded-2xl bg-stone-100">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.productName}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-stone-300">
            <UtensilsCrossed className="size-8 opacity-40" />
          </div>
        )}

        {/* Cắt góc cho nút Add */}
        <div className="absolute -bottom-1 -right-1 flex items-end justify-end">
          <div className="relative flex h-14 w-14 items-end justify-end rounded-tl-[2rem] bg-white p-1.5 shadow-[-4px_-4px_10px_rgba(0,0,0,0.02)]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-600 hover:scale-105 active:scale-95"
              aria-label="Thêm vào giỏ"
            >
              <Plus className="size-5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOrderPage;
