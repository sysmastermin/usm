import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import userApi from '../../lib/userApi';

const STATUS_MAP = {
  pending: { label: '주문접수', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid: { label: '결제완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipping: { label: '배송중', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: '배송완료', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await userApi.get(
        `/orders?page=${page}&limit=10`
      );
      const data = res.data.data;
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      // 에러
    } finally {
      setLoading(false);
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
        주문내역
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            주문 내역이 없습니다
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium"
          >
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const s =
                STATUS_MAP[order.status] ||
                STATUS_MAP.pending;
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block border border-gray-200 dark:border-gray-800 rounded-sm p-5 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(
                          order.created_at
                        ).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full ${s.color}`}
                      >
                        {s.label}
                      </span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {Number(
                          order.total_amount
                        ).toLocaleString()}
                        원
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                disabled={page <= 1}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={page >= totalPages}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
