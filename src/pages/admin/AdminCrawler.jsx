import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { publicApi } from '../../lib/adminApi';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

/**
 * 크롤러 관리 페이지
 * - 크롤링 실행 버튼
 * - 실시간 진행률 바 (3초 폴링)
 * - 결과 요약
 */
export default function AdminCrawler() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await publicApi.get('/ingest/status');
      if (res.data.success) {
        setStatus(res.data.data);

        // 진행 중이면 폴링 시작
        if (res.data.data.status === 'running') {
          startPolling();
        }
      }
    } catch {
      // 무시
    }
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await publicApi.get('/ingest/status');
        if (res.data.success) {
          setStatus(res.data.data);

          // 완료 또는 에러 시 폴링 중지
          if (
            res.data.data.status !== 'running'
          ) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await publicApi.post('/ingest');
      if (res.data.success) {
        toast.success('크롤링이 시작되었습니다');
        // 상태 업데이트 + 폴링 시작
        setStatus({
          status: 'running',
          progress: 0,
          message: '크롤링 시작...',
          result: null,
        });
        startPolling();
      } else {
        toast.error(
          res.data.message || '크롤링을 시작할 수 없습니다'
        );
      }
    } catch (err) {
      toast.error('크롤링 시작에 실패했습니다');
    } finally {
      setStarting(false);
    }
  };

  const isRunning = status?.status === 'running';
  const isCompleted = status?.status === 'completed';
  const isError = status?.status === 'error';

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        크롤러 관리
      </h1>

      {/* 실행 카드 */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6',
          'border border-gray-200 dark:border-gray-700'
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            웹 크롤링
          </h2>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          jp.shop.usm.com에서 카테고리와 상품 데이터를
          크롤링하고, 일본어 {'->'} 한국어 자동 번역을
          실행합니다.
        </p>

        <button
          onClick={handleStart}
          disabled={isRunning || starting}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg',
            'text-sm font-medium transition-colors',
            'min-h-[48px]',
            isRunning || starting
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          )}
        >
          {isRunning || starting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {isRunning
            ? '크롤링 진행 중...'
            : starting
              ? '시작 중...'
              : '크롤링 시작'}
        </button>
      </div>

      {/* 진행 상태 */}
      {status && status.status !== 'idle' && (
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            진행 상태
          </h3>

          {/* 상태 표시 */}
          <div className="flex items-center gap-3 mb-3">
            {isRunning && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {isCompleted && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {isError && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isRunning && 'text-blue-600 dark:text-blue-400',
                isCompleted && 'text-green-600 dark:text-green-400',
                isError && 'text-red-600 dark:text-red-400'
              )}
            >
              {status.message || '-'}
            </span>
          </div>

          {/* 프로그레스 바 */}
          {isRunning && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500 relative"
                style={{
                  width: `${status.progress || 0}%`,
                }}
              >
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white font-medium">
                  {status.progress}%
                </span>
              </div>
            </div>
          )}

          {/* 결과 요약 */}
          {status.result &&
            !status.result.error && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {status.result.categories && (
                  <ResultCard
                    label="카테고리"
                    value={`${status.result.categories.saved || status.result.categories.crawled || 0}개`}
                  />
                )}
                {status.result.products && (
                  <ResultCard
                    label="상품"
                    value={`${status.result.products.saved || status.result.products.crawled || 0}개`}
                  />
                )}
                {status.result.errors !== undefined && (
                  <ResultCard
                    label="오류"
                    value={`${status.result.errors}개`}
                    error={status.result.errors > 0}
                  />
                )}
                {status.result.duration && (
                  <ResultCard
                    label="소요시간"
                    value={status.result.duration}
                    icon={Clock}
                  />
                )}
              </div>
            )}

          {/* 에러 메시지 */}
          {status.result?.error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {status.result.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  label,
  value,
  error = false,
  icon: Icon,
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg text-center',
        'bg-gray-50 dark:bg-gray-700/50'
      )}
    >
      {Icon && (
        <Icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
      )}
      <p
        className={cn(
          'text-lg font-bold',
          error
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-900 dark:text-white'
        )}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
  );
}
