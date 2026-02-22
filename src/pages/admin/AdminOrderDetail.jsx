import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  CheckCircle,
  Truck,
  XCircle,
  ClipboardCheck,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

const STATUS_MAP = {
  pending: { label: '주문접수', color: 'amber' },
  confirmed: { label: '주문확인', color: 'blue' },
  shipping: { label: '배송중', color: 'purple' },
  delivered: { label: '배송완료', color: 'green' },
  cancelled: { label: '취소', color: 'red' },
};

const STATUS_COLORS = {
  amber:
    'bg-amber-100 text-amber-700'
    + ' dark:bg-amber-900/30 dark:text-amber-400',
  blue:
    'bg-blue-100 text-blue-700'
    + ' dark:bg-blue-900/30 dark:text-blue-400',
  purple:
    'bg-purple-100 text-purple-700'
    + ' dark:bg-purple-900/30 dark:text-purple-400',
  green:
    'bg-green-100 text-green-700'
    + ' dark:bg-green-900/30 dark:text-green-400',
  red:
    'bg-red-100 text-red-700'
    + ' dark:bg-red-900/30 dark:text-red-400',
};

const NEXT_ACTIONS = {
  pending: [
    {
      status: 'confirmed',
      label: '주문 확인',
      icon: ClipboardCheck,
      style: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      status: 'cancelled',
      label: '주문 취소',
      icon: XCircle,
      style:
        'bg-white dark:bg-gray-800'
        + ' border border-red-300 dark:border-red-700'
        + ' text-red-600 dark:text-red-400'
        + ' hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ],
  confirmed: [
    {
      status: 'shipping',
      label: '배송 시작',
      icon: Truck,
      style:
        'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      status: 'cancelled',
      label: '주문 취소',
      icon: XCircle,
      style:
        'bg-white dark:bg-gray-800'
        + ' border border-red-300 dark:border-red-700'
        + ' text-red-600 dark:text-red-400'
        + ' hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ],
  shipping: [
    {
      status: 'delivered',
      label: '배송 완료',
      icon: CheckCircle,
      style:
        'bg-green-600 hover:bg-green-700 text-white',
    },
  ],
  delivered: [],
  cancelled: [],
};

const STATUS_STEPS = [
  'pending',
  'confirmed',
  'shipping',
  'delivered',
];

const STEP_LABELS = {
  pending: '주문접수',
  confirmed: '주문확인',
  shipping: '배송중',
  delivered: '배송완료',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || {
    label: status,
    color: 'amber',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1',
        'rounded-md text-sm font-medium',
        STATUS_COLORS[info.color]
      )}
    >
      {info.label}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 sm:w-24 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white">
        {children}
      </span>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await adminApi.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch {
      toast.error('주문 정보를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async () => {
    if (!confirm) return;
    setUpdating(true);
    try {
      const res = await adminApi.put(
        `/orders/${id}/status`,
        { status: confirm.status }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setConfirm(null);
        fetchOrder();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message
          || '상태 변경에 실패했습니다'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          주문을 찾을 수 없습니다
        </p>
        <button
          onClick={() => navigate('/admin/orders')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          주문 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const actions = NEXT_ACTIONS[order.status] || [];
  const isCancelled = order.status === 'cancelled';
  const currentStepIdx = STATUS_STEPS.indexOf(
    order.status
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/orders')}
          className={cn(
            'p-2 rounded-lg',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'text-gray-500 hover:text-gray-700',
            'dark:hover:text-gray-300',
            'min-w-[44px] min-h-[44px]',
            'flex items-center justify-center'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {order.order_number}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* 상태 프로그레스 (취소가 아닌 경우) */}
      {!isCancelled && (
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-5',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={step}
                  className="flex-1 flex flex-col items-center relative"
                >
                  {idx > 0 && (
                    <div
                      className={cn(
                        'absolute top-3 right-1/2 w-full h-0.5',
                        isActive
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center',
                      'justify-center text-xs font-bold',
                      'relative z-10',
                      isCurrent
                        ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/30'
                        : isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    )}
                  >
                    {isActive ? '✓' : idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 hidden sm:block',
                      isActive
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : 'text-gray-400'
                    )}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 상태 변경 버튼 */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => setConfirm(action)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5',
                'rounded-lg text-sm font-medium',
                'transition-colors min-h-[44px]',
                action.style
              )}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주문자 정보 */}
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-5',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              주문자 정보
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <InfoRow label="이름">
              {order.user_name}
            </InfoRow>
            <InfoRow label="이메일">
              {order.user_email}
            </InfoRow>
            {order.user_phone && (
              <InfoRow label="연락처">
                {order.user_phone}
              </InfoRow>
            )}
          </div>
        </div>

        {/* 배송지 정보 */}
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-5',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              배송지 정보
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <InfoRow label="수령인">
              {order.recipient_name}
            </InfoRow>
            <InfoRow label="연락처">
              {order.recipient_phone}
            </InfoRow>
            <InfoRow label="주소">
              [{order.zipcode}] {order.address}
              {order.address_detail
                && ` ${order.address_detail}`}
            </InfoRow>
            {order.memo && (
              <InfoRow label="배송메모">
                {order.memo}
              </InfoRow>
            )}
          </div>
        </div>
      </div>

      {/* 주문 상품 */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-5',
          'border border-gray-200 dark:border-gray-700'
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            주문 상품
          </h2>
          <span className="text-sm text-gray-400">
            ({order.items?.length || 0}개)
          </span>
        </div>

        <div className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                'bg-gray-50 dark:bg-gray-700/30'
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Number(item.price).toLocaleString()}원
                  {' x '}
                  {item.quantity}개
                </p>
              </div>

              <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {(
                  Number(item.price) * item.quantity
                ).toLocaleString()}
                원
              </span>
            </div>
          ))}
        </div>

        {/* 합계 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <div className="text-right">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">
              총 결제금액
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {Number(
                order.total_amount
              ).toLocaleString()}
              원
            </span>
          </div>
        </div>
      </div>

      {/* 상태 변경 확인 */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleStatusChange}
        loading={updating}
        title="주문 상태 변경"
        message={
          confirm
            ? `이 주문을 "${STATUS_MAP[confirm.status]?.label || confirm.status}" 상태로 변경하시겠습니까?`
            : ''
        }
      />
    </div>
  );
}
