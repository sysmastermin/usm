import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import userApi from '../../lib/userApi';

const STATUS_MAP = {
  pending: { label: '주문접수', color: 'text-yellow-600' },
  paid: { label: '결제완료', color: 'text-blue-600' },
  shipping: { label: '배송중', color: 'text-purple-600' },
  delivered: { label: '배송완료', color: 'text-green-600' },
  cancelled: { label: '취소됨', color: 'text-gray-500' },
};

const STATUSES = [
  'pending',
  'paid',
  'shipping',
  'delivered',
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await userApi.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch {
      // 에러
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('정말 주문을 취소하시겠습니까?')) return;
    setCancelling(true);
    try {
      await userApi.put(`/orders/${id}/cancel`);
      loadOrder();
    } catch {
      alert('취소할 수 없는 주문입니다');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">
          주문을 찾을 수 없습니다
        </p>
        <Link to="/orders" className="text-blue-600 hover:underline">
          주문내역으로 돌아가기
        </Link>
      </div>
    );
  }

  const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const currentIdx = STATUSES.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link
        to="/orders"
        className="inline-flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        주문내역으로 돌아가기
      </Link>

      {/* 주문 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {order.order_number}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(order.created_at).toLocaleDateString(
              'ko-KR',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </p>
        </div>
        <span className={`text-lg font-semibold ${s.color}`}>
          {s.label}
        </span>
      </div>

      {/* 상태 타임라인 */}
      {order.status !== 'cancelled' && (
        <div className="flex items-center gap-0 mb-8 overflow-x-auto">
          {STATUSES.map((st, i) => {
            const active = i <= currentIdx;
            return (
              <div
                key={st}
                className="flex items-center"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      active
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      active
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {STATUS_MAP[st].label}
                  </span>
                </div>
                {i < STATUSES.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 mt-[-16px] ${
                      i < currentIdx
                        ? 'bg-black dark:bg-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 주문 상품 */}
        <section className="border border-gray-200 dark:border-gray-800 rounded-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            주문 상품
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(order.items || []).map((item) => (
              <div
                key={item.id}
                className="flex gap-3 py-3"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden shrink-0">
                  <img
                    src={
                      item.product_image ||
                      '/placeholder.png'
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Number(
                      item.price
                    ).toLocaleString()}
                    원 x {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                  {(
                    item.price * item.quantity
                  ).toLocaleString()}
                  원
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2 flex justify-between">
            <span className="font-medium text-gray-900 dark:text-white">
              합계
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {Number(
                order.total_amount
              ).toLocaleString()}
              원
            </span>
          </div>
        </section>

        {/* 배송 정보 */}
        <section className="border border-gray-200 dark:border-gray-800 rounded-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            배송 정보
          </h2>
          <dl className="space-y-3 text-sm">
            <Row
              label="수령인"
              value={order.recipient_name}
            />
            <Row
              label="연락처"
              value={order.recipient_phone}
            />
            <Row
              label="주소"
              value={`${order.zipcode || ''} ${order.address} ${order.address_detail || ''}`}
            />
            {order.memo && (
              <Row label="메모" value={order.memo} />
            )}
          </dl>

          {/* 취소 버튼 */}
          {order.status === 'pending' && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-6 w-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 py-3 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
            >
              {cancelling ? '취소 처리 중...' : '주문 취소'}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex">
      <dt className="w-20 text-gray-400 dark:text-gray-500 shrink-0">
        {label}
      </dt>
      <dd className="text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
