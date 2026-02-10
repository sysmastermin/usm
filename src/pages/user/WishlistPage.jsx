import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, ShoppingCart, X, Loader2,
} from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import userApi from '../../lib/userApi';

export default function WishlistPage() {
  const { updateCartCount } = useUserAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const res = await userApi.get('/wishlist');
      setItems(res.data.data || []);
    } catch {
      // 에러
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await userApi.delete(`/wishlist/${productId}`);
      setItems((prev) =>
        prev.filter((i) => i.product_id !== productId)
      );
    } catch {
      // 에러
    }
  };

  const addToCart = async (productId) => {
    try {
      await userApi.post('/cart', { productId });
      updateCartCount();
      alert('장바구니에 추가되었습니다');
    } catch {
      alert('장바구니 추가에 실패했습니다');
    }
  };

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
        위시리스트
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            위시리스트가 비어있습니다
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium"
          >
            상품 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="group border border-gray-200 dark:border-gray-800 rounded-sm overflow-hidden"
            >
              <Link
                to={`/product/${item.product_id}`}
                className="block relative"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={
                      item.image_url ||
                      '/placeholder.png'
                    }
                    alt={item.name_ko || item.name_ja}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    removeItem(item.product_id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-900 rounded-full shadow text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="위시리스트 제거"
                >
                  <X className="w-4 h-4" />
                </button>
              </Link>

              <div className="p-3">
                <Link
                  to={`/product/${item.product_id}`}
                >
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.name_ko || item.name_ja}
                  </p>
                </Link>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {Number(
                    item.price || 0
                  ).toLocaleString()}
                  원
                </p>
                <button
                  type="button"
                  onClick={() =>
                    addToCart(item.product_id)
                  }
                  className="w-full flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black py-2 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  장바구니 담기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
