import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  FolderTree,
  Languages,
  ImageIcon,
  Activity,
  Clock,
} from 'lucide-react';
import adminApi, { publicApi } from '../../lib/adminApi';
import StatsCard from '../../components/admin/StatsCard';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

/**
 * 관리자 대시보드
 * - 통계 카드 4개
 * - 크롤링 상태
 * - 서버 Health
 * - 최근 상품 5개
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [crawlStatus, setCrawlStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, crawlRes, healthRes] =
        await Promise.allSettled([
          adminApi.get('/dashboard'),
          publicApi.get('/ingest/status'),
          fetch('/health').then((r) => r.json()),
        ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }
      if (crawlRes.status === 'fulfilled') {
        setCrawlStatus(crawlRes.value.data.data);
      }
      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value);
      }
    } catch (err) {
      toast.error('대시보드 데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          대시보드
        </h1>
        <LoadingSkeleton variant="stats" count={4} />
        <LoadingSkeleton variant="card" count={5} />
      </div>
    );
  }

  const statusColorMap = {
    idle: 'text-gray-500',
    running: 'text-blue-500',
    completed: 'text-green-500',
    error: 'text-red-500',
  };

  const statusLabelMap = {
    idle: '대기 중',
    running: '진행 중',
    completed: '완료',
    error: '오류',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          대시보드
        </h1>
        <button
          onClick={fetchAll}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Package}
          label="전체 상품"
          value={stats?.totalProducts ?? 0}
          suffix="개"
          color="blue"
        />
        <StatsCard
          icon={FolderTree}
          label="카테고리"
          value={stats?.totalCategories ?? 0}
          suffix="개"
          color="green"
        />
        <StatsCard
          icon={Languages}
          label="번역 완료율"
          value={stats?.translationRate ?? 0}
          suffix="%"
          color="purple"
        />
        <StatsCard
          icon={ImageIcon}
          label="이미지 보유율"
          value={stats?.imageRate ?? 0}
          suffix="%"
          color="amber"
        />
      </div>

      {/* 상태 카드 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 크롤링 상태 */}
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-5',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              크롤링 상태
            </h2>
          </div>
          {crawlStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-block w-2 h-2 rounded-full',
                    crawlStatus.status === 'running'
                      ? 'bg-blue-500 animate-pulse'
                      : crawlStatus.status === 'completed'
                        ? 'bg-green-500'
                        : crawlStatus.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    statusColorMap[crawlStatus.status]
                  )}
                >
                  {statusLabelMap[crawlStatus.status] ||
                    crawlStatus.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {crawlStatus.message || '-'}
              </p>
              {crawlStatus.status === 'running' && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${crawlStatus.progress || 0}%`,
                    }}
                  />
                </div>
              )}
              {crawlStatus.result && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                  {crawlStatus.result.categories && (
                    <p>
                      카테고리:{' '}
                      {crawlStatus.result.categories.saved}개
                    </p>
                  )}
                  {crawlStatus.result.products && (
                    <p>
                      상품:{' '}
                      {crawlStatus.result.products.saved}개
                    </p>
                  )}
                  {crawlStatus.result.duration && (
                    <p>
                      소요시간: {crawlStatus.result.duration}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              상태 정보 없음
            </p>
          )}
        </div>

        {/* 서버 상태 */}
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-5',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              서버 상태
            </h2>
          </div>
          {health ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                정상 동작 중
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-red-500 font-medium">
                연결 실패
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 최근 상품 */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-5',
          'border border-gray-200 dark:border-gray-700'
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            최근 업데이트 상품
          </h2>
        </div>

        {stats?.recentProducts?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentProducts.map((product) => (
              <div
                key={product.id}
                onClick={() =>
                  navigate(
                    `/admin/products/${product.id}`
                  )
                }
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  'cursor-pointer transition-colors'
                )}
              >
                {/* 썸네일 */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
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
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {product.name_ko || product.name_ja}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.category_name_ko ||
                      product.category_name_ja ||
                      '-'}
                  </p>
                </div>

                {/* 가격 */}
                {product.price && (
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                    {Number(product.price).toLocaleString()}원
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            상품 데이터가 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
