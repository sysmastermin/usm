import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Pencil,
  Trash2,
  Languages,
  Plus,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import SearchInput from '../../components/admin/SearchInput';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

/**
 * 상품 관리 페이지
 * - 검색 + 카테고리 필터 + 미번역 필터
 * - 서버사이드 페이지네이션
 * - 모바일 카드 뷰 자동 전환
 */
export default function AdminProducts() {
  const navigate = useNavigate();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({
    page: 1, limit: 20, total: 0,
  });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [untranslated, setUntranslated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 카테고리 목록 로드
  useEffect(() => {
    adminApi
      .get('/categories')
      .then((res) => {
        if (res.data.success) {
          setCategories(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // 상품 목록 로드
  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        if (categoryId) params.categoryId = categoryId;
        if (untranslated) params.untranslated = 'true';

        const res = await adminApi.get('/products', {
          params,
        });
        if (res.data.success) {
          setProducts(res.data.data);
          setMeta(res.data.meta);
        }
      } catch (err) {
        toast.error('상품 목록을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    },
    [search, categoryId, untranslated]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // 삭제 처리
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.delete(
        `/products/${deleteTarget.id}`
      );
      toast.success('상품이 삭제되었습니다');
      setDeleteTarget(null);
      fetchProducts(meta.page);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          '삭제에 실패했습니다'
      );
    } finally {
      setDeleting(false);
    }
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      key: 'image_url',
      label: '이미지',
      className: 'w-16',
      render: (val) => (
        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {val ? (
            <img
              src={val}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name_ko',
      label: '상품명',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
            {val || row.name_ja}
          </p>
          {val && row.name_ja && (
            <p className="text-xs text-gray-400 truncate max-w-[200px]">
              {row.name_ja}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category_name_ko',
      label: '카테고리',
      render: (val, row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {val || row.category_name_ja || '-'}
        </span>
      ),
    },
    {
      key: 'price',
      label: '가격',
      render: (val) =>
        val ? (
          <span className="text-sm">
            {Number(val).toLocaleString()}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'is_translated',
      label: '번역',
      className: 'w-16',
      render: (val) => (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            val
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {val ? '완료' : '미완'}
        </span>
      ),
    },
    {
      key: '_actions',
      label: '',
      className: 'w-24',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/products/${row.id}`);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="편집"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 dark:hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // 모바일 카드 렌더러
  const renderMobileCard = (row, idx) => (
    <div
      key={row.id || idx}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        {/* 썸네일 */}
        <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
          {row.image_url ? (
            <img
              src={row.image_url}
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

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {row.name_ko || row.name_ja}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {row.category_name_ko ||
              row.category_name_ja ||
              '-'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {row.price && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Number(row.price).toLocaleString()}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
                row.is_translated
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {row.is_translated ? '번역완료' : '미번역'}
            </span>
          </div>
        </div>

        {/* 액션 */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() =>
              navigate(`/admin/products/${row.id}`)
            }
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          상품 관리
        </h1>
        <button
          onClick={() => navigate('/admin/products/new')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg',
            'text-sm font-medium',
            'bg-gray-900 dark:bg-white',
            'text-white dark:text-gray-900',
            'hover:bg-gray-800 dark:hover:bg-gray-100',
            'transition-colors min-h-[44px]'
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            상품 등록
          </span>
        </button>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="상품명, 상품코드 검색..."
          className="flex-1"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={cn(
            'px-3 py-2.5 text-sm rounded-lg',
            'bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2',
            'focus:ring-gray-900/20 dark:focus:ring-white/20',
            'min-h-[44px]'
          )}
        >
          <option value="">전체 카테고리</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_ko || cat.name_ja}
            </option>
          ))}
        </select>
        <button
          onClick={() => setUntranslated(!untranslated)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'border transition-colors min-h-[44px] whitespace-nowrap',
            untranslated
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
          )}
        >
          <Languages className="w-4 h-4" />
          미번역만
        </button>
      </div>

      {/* 데이터 테이블 */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="조건에 맞는 상품이 없습니다"
        onRowClick={(row) =>
          navigate(`/admin/products/${row.id}`)
        }
        renderMobileCard={renderMobileCard}
      />

      {/* 페이지네이션 */}
      <Pagination
        page={meta.page}
        limit={meta.limit}
        total={meta.total}
        onPageChange={(p) => fetchProducts(p)}
      />

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="상품 삭제"
        message={`"${deleteTarget?.name_ko || deleteTarget?.name_ja || ''}" 상품을 삭제하시겠습니까?`}
      />
    </div>
  );
}
