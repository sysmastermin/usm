import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import SearchInput from '../../components/admin/SearchInput';
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

function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || {
    label: status,
    color: 'amber',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5',
        'rounded text-xs font-medium',
        STATUS_COLORS[info.color]
      )}
    >
      {info.label}
    </span>
  );
}

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

export default function AdminOrders() {
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (status) params.status = status;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const res = await adminApi.get('/orders', {
          params,
        });
        if (res.data.success) {
          setOrders(res.data.data);
          setMeta(res.data.meta);
        }
      } catch {
        toast.error('주문 목록을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    },
    [search, status, startDate, endDate]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const columns = [
    {
      key: 'order_number',
      label: '주문번호',
      render: (val) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {val}
        </span>
      ),
    },
    {
      key: 'user_name',
      label: '주문자',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm text-gray-900 dark:text-white truncate">
            {val}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {row.user_email}
          </p>
        </div>
      ),
    },
    {
      key: 'recipient_name',
      label: '수령인',
      render: (val) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {val}
        </span>
      ),
    },
    {
      key: 'total_amount',
      label: '총금액',
      render: (val) => (
        <span className="text-sm font-medium">
          {Number(val).toLocaleString()}원
        </span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      className: 'w-24',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'created_at',
      label: '주문일시',
      render: (val) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(val)}
        </span>
      ),
    },
  ];

  const renderMobileCard = (row, idx) => (
    <div
      key={row.id || idx}
      onClick={() => navigate(`/admin/orders/${row.id}`)}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm cursor-pointer',
        'active:bg-gray-50 dark:active:bg-gray-700'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {row.order_number}
        </span>
        <StatusBadge status={row.status} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {row.user_name} → {row.recipient_name}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">
          {Number(row.total_amount).toLocaleString()}원
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {formatDate(row.created_at)}
      </p>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        주문 관리
      </h1>

      {/* 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="주문번호, 주문자, 수령인 검색..."
          className="flex-1"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={cn(
            'px-3 py-2.5 text-sm rounded-lg',
            'bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2',
            'focus:ring-gray-900/20',
            'dark:focus:ring-white/20',
            'min-h-[44px]'
          )}
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_MAP).map(
            ([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {/* 기간 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            시작일
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={cn(
              'px-3 py-2 text-sm rounded-lg',
              'bg-white dark:bg-gray-800',
              'border border-gray-300',
              'dark:border-gray-600',
              'text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2',
              'focus:ring-gray-900/20',
              'dark:focus:ring-white/20',
              'min-h-[44px]'
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            종료일
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={cn(
              'px-3 py-2 text-sm rounded-lg',
              'bg-white dark:bg-gray-800',
              'border border-gray-300',
              'dark:border-gray-600',
              'text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2',
              'focus:ring-gray-900/20',
              'dark:focus:ring-white/20',
              'min-h-[44px]'
            )}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className={cn(
              'px-4 py-2.5 text-sm rounded-lg',
              'border border-gray-300',
              'dark:border-gray-600',
              'text-gray-600 dark:text-gray-400',
              'hover:bg-gray-100',
              'dark:hover:bg-gray-800',
              'min-h-[44px] whitespace-nowrap'
            )}
          >
            기간 초기화
          </button>
        )}
      </div>

      {/* 데이터 테이블 */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="조건에 맞는 주문이 없습니다"
        onRowClick={(row) =>
          navigate(`/admin/orders/${row.id}`)
        }
        renderMobileCard={renderMobileCard}
      />

      {/* 페이지네이션 */}
      <Pagination
        page={meta.page}
        limit={meta.limit}
        total={meta.total}
        onPageChange={(p) => fetchOrders(p)}
      />
    </div>
  );
}
