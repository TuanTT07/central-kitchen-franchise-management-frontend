import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Package, Tag, Minus, Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { managerServices, type ProductsResponse } from '@/services/managerServices';
import { franchiseServices, type OrderResponse, type OrderDetailResponse } from '@/services/franchiseServices';
import { cn } from '@/lib/utils';

/**
 * Mapping với DB:
 * - categories     → category_id, category_name, status (ACTIVE|INACTIVE)
 * - products       → product_id, product_name, unit, description, image_url, status, category_id
 * - product_batches→ batch_id, batch_code, product_id, manu_order_id, initial/current_quantity,
 *                    manufacturing_date, expiry_date, status (WAITING_FOR_STOCK|AVAILABLE|OUT_OF_STOCK|EXPIRED)
 * - store_orders   → order_code, store_store_id (từ auth), order_date, delivery_date, status (PENDING)
 * - order_details → order_id (sau khi tạo store_orders), product_id, quantity
 */

/** Mỗi dòng = 1 bản ghi order_details (product_id, quantity); order_id gán khi tạo store_orders */
interface DraftOrderItem {
  product_id: number;
  quantity: number;
}
const CreateOrderPage = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  const [items, setItems] = useState<DraftOrderItem[]>([]);
  /** store_orders.delivery_date (date) — ngày giao dự kiến */
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Quản lí state của products
  const [products, setProducts] = useState<ProductsResponse[]>([]);
  // Quản lý danh sách toàn bộ đơn hàng (getAllOrders)
  const [orders, setOrders] = useState<OrderResponse<OrderDetailResponse[]>[]>([]);

  const getAllProducts = async () => {
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
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      setProducts([]);
    }
  };

  const getAllOrders = async () => {
    try {
      const response = await franchiseServices.getAllOrders();
      if (response && response.success) {
        const data = response.data;
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && typeof data === 'object' && 'content' in data) {
          setOrders((data as any).content || []);
        } else if (data && typeof data === 'object' && 'items' in data) {
          setOrders((data as any).items || []);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    getAllProducts();
    getAllOrders();
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

  const getItemQuantity = (productId: number) => items.find((i) => i.product_id === productId)?.quantity ?? 0;

  //  tăng số lượng
  const upsertItem = (productId: number, delta: number) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      const currentQty = existing?.quantity ?? 0;
      let nextQty = currentQty + delta;

      if (nextQty <= 0) {
        return prev.filter((i) => i.product_id !== productId);
      }

      if (existing) {
        return prev.map((i) => (i.product_id === productId ? { ...i, quantity: nextQty } : i));
      }

      return [...prev, { product_id: productId, quantity: nextQty }];
    });
  };

  // giảm số lượng
  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const totalLines = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  const draftOrderCode = 'SO-DRAFT-20260304-001';

  return (
    <div className="h-full w-full">
      <Card className="border-amber-200/60 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <ShoppingCart className="size-6 text-amber-500" />
              Tạo đơn đặt hàng
            </CardTitle>
            <CardDescription className="text-xs font-medium text-amber-700/80">
              Nhân viên cửa hàng tạo mới store_orders và các dòng order_details gửi lên bếp trung tâm.
            </CardDescription>
          </div>
          <div className="hidden items-end gap-6 md:flex">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Mã đơn nháp</span>
              <span className="text-sm font-semibold text-amber-900">{draftOrderCode}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Dòng chi tiết</span>
              <span className="text-lg font-semibold text-amber-900">{totalLines}</span>
            </div>
            <div className="h-10 w-px bg-amber-200/70" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/80">Tổng số lượng</span>
              <span className="text-lg font-semibold text-amber-900">{totalQuantity}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Tìm theo tên món, danh mục, đơn vị..."
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
                {products.map((p) => (
                  <option key={p.categoryId} value={p.categoryId}>
                    {p.categoryId} - {p.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <Package className="size-4 text-amber-500" />
                  Danh sách sản phẩm có thể đặt
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Sản phẩm ACTIVE, số lượng dựa trên các lô AVAILABLE (product_batches).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                        <th className="px-4 py-2">Mã</th>
                        <th className="px-4 py-2">Sản phẩm</th>
                        <th className="px-4 py-2">Danh mục</th>
                        <th className="px-2 py-2 text-center">Đơn vị</th>
                        <th className="px-2 py-2 text-center">SL đặt</th>
                        <th className="px-4 py-2 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filteredProducts.map((p) => {
                        const currentQty = getItemQuantity(p.productId);
                        return (
                          <tr key={p.productId} className="hover:bg-amber-50/40">
                            <td className="px-4 py-2 font-mono text-[11px] text-amber-700">#{p.productId}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-stone-900">{p.productName}</span>
                                {p.description && (
                                  <span className="line-clamp-1 text-[11px] text-stone-500">{p.description}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-semibold text-amber-800">
                                <Tag className="size-3" />
                                {p.categoryName}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-[11px] text-stone-800">{p.unitName || p.unit}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => upsertItem(p.productId, -1)}
                                  className="flex size-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-40"
                                  disabled={currentQty === 0}
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span className="min-w-[2.5rem] text-center text-xs font-semibold text-stone-900">
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => upsertItem(p.productId, 1)}
                                  className="flex size-7 items-center justify-center rounded-full border border-amber-400 bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                                >
                                  <Plus className="size-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 border-amber-300 px-3 text-xs text-amber-800 hover:bg-amber-50"
                                onClick={() => (currentQty ? removeItem(p.productId) : upsertItem(p.productId, 1))}
                              >
                                {currentQty ? 'Xóa khỏi đơn' : 'Thêm vào đơn'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* {filteredProducts.length === 0 && (
                  <div className="py-10 text-center text-xs text-amber-700/80">
                    Không có sản phẩm nào phù hợp với bộ lọc.
                  </div>
                )} */}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white shadow-sm">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-bold text-amber-900">
                  <span>Giỏ hàng (order_details nháp)</span>
                  <span className="text-[11px] font-medium text-amber-700">
                    {totalLines} dòng · {totalQuantity} đơn vị
                  </span>
                </CardTitle>
                <CardDescription className="text-[11px] text-amber-700/80">
                  Gửi đơn sẽ tạo store_orders và các dòng order_details tương ứng.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col gap-1.5 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <label
                    htmlFor="delivery-date"
                    className="flex items-center gap-2 text-[11px] font-semibold text-amber-900"
                  >
                    <Calendar className="size-3.5 text-amber-600" />
                    Ngày giao dự kiến (store_orders.delivery_date)
                  </label>
                  <input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="h-9 rounded-md border border-amber-200 bg-white px-3 text-xs text-stone-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <div className="rounded-md border border-dashed border-amber-200 bg-amber-50/40 px-4 py-6 text-center text-xs text-amber-700/80">
                      Chưa có dòng chi tiết nào. Hãy chọn sản phẩm ở bảng bên trái.
                    </div>
                  )}

                  {items.map((i) => {
                    const product = products.find((p) => p.productId === i.product_id);
                    if (!product) return null;

                    return (
                      <div
                        key={i.product_id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-stone-900">{product.productName}</p>
                          <p className="text-[11px] text-stone-600">
                            {product.categoryName} · Đơn vị: {product.unitName || product.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => upsertItem(product.productId, -1)}
                              className="flex size-7 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="min-w-[2.5rem] text-center text-xs font-semibold text-stone-900">
                              {i.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => upsertItem(product.productId, 1)}
                              className="flex size-7 items-center justify-center rounded-full border border-amber-400 bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(product.productId)}
                            className="flex size-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="Xóa dòng"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex flex-col gap-2 border-t border-amber-100 pt-3 text-xs text-stone-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-800">Tổng số dòng</span>
                    <span className="font-semibold text-amber-900">{totalLines}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-800">Tổng số lượng</span>
                    <span className="font-semibold text-amber-900">{totalQuantity}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 border-amber-200 text-xs text-amber-800 hover:bg-white"
                    disabled={items.length === 0}
                  >
                    Lưu nháp
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-xs font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-600 disabled:opacity-60"
                    disabled={items.length === 0}
                  >
                    Gửi yêu cầu lên bếp trung tâm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phần hiển thị danh sách toàn bộ Đơn hàng (getAllOrder) */}
          <Card className="mt-8 border-amber-200/60 bg-white shadow-md">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900">
                <ClipboardList className="size-5 text-amber-500" />
                Danh sách tất cả đơn hàng đã tạo (getAllOrders)
              </CardTitle>
              <CardDescription className="text-[11px] text-amber-700/80">
                Dữ liệu được lấy từ franchiseServices.getAllOrders()
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-50 bg-amber-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                      <th className="px-4 py-3">Mã đơn</th>
                      <th className="px-4 py-3">Ngày đặt</th>
                      <th className="px-4 py-3 text-center">Ngày giao</th>
                      <th className="px-4 py-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {!Array.isArray(orders) || orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-amber-700/60">
                          Chưa có đơn hàng nào được tìm thấy.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-amber-50/30">
                          <td className="px-4 py-3 font-semibold text-stone-900">{order.orderCode}</td>
                          <td className="px-4 py-3 text-stone-600">
                            {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-center text-stone-600">
                            {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                                order.status === 'PENDING'
                                  ? 'border-amber-200 bg-amber-100 text-amber-800'
                                  : order.status === 'APPROVED'
                                    ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                                    : 'border-stone-200 bg-stone-100 text-stone-600'
                              )}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOrderPage;
