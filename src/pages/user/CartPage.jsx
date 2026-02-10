import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Minus, Plus, ShoppingCart, Loader2,
} from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import userApi from '../../lib/userApi';

export default function CartPage() {
  const navigate = useNavigate();
  const { updateCartCount } = useUserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await userApi.get('/cart');
      setItems(res.data.data || []);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (id, qty) => {
    if (qty < 1 || qty > 99) return;
    try {
      await userApi.put(`/cart/${id}`, { quantity: qty });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: qty }
            : item
        )
      );
      updateCartCount();
    } catch {
      // 에러 무시
    }
  };

  const removeItem = async (id) => {
    try {
      await userApi.delete(`/cart/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      updateCartCount();
    } catch {
      // 에러 무시
    }
  };

  const clearAll = async () => {
    try {
      await userApi.delete('/cart');
      setItems([]);
      updateCartCount();
    } catch {
      // 에러 무시
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        장바구니
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            장바구니가 비어있습니다
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        <>
          {/* 전체 삭제 */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-red-500"
            >
              전체 비우기
            </button>
          </div>

          {/* 상품 목록 */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800 border-t border-b border-gray-200 dark:border-gray-800">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 py-5"
              >
                {/* 이미지 */}
                <Link
                  to={`/product/${item.product_id}`}
                  className="shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden"
                >
                  <img
                    src={item.image_url || '/placeholder.png'}
                    alt={item.name_ko || item.name_ja}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:underline line-clamp-2"
                  >
                    {item.name_ko || item.name_ja}
                  </Link>
                  {item.product_code && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.product_code}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                    {Number(item.price || 0).toLocaleString()}원
                  </p>
                </div>

                {/* 수량/삭제 */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-sm">
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="p-2 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.quantity + 1
                        )
                      }
                      disabled={item.quantity >= 99}
                      className="p-2 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {(
                      (item.price || 0) * item.quantity
                    ).toLocaleString()}
                    원
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 합계 */}
          <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400">
                총 {items.length}개 상품
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              주문하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
