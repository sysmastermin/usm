import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * 페이지네이션 컴포넌트
 * @param {object} props
 * @param {number} props.page - 현재 페이지 (1-based)
 * @param {number} props.limit - 페이지당 항목 수
 * @param {number} props.total - 전체 항목 수
 * @param {function} props.onPageChange - 페이지 변경 콜백
 */
export default function Pagination({
  page,
  limit,
  total,
  onPageChange,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / limit)
  );
  const currentPage = Math.min(
    Math.max(1, page),
    totalPages
  );

  if (totalPages <= 1) return null;

  const btnClass = cn(
    'flex items-center justify-center',
    'w-9 h-9 sm:w-10 sm:h-10 rounded-lg',
    'text-sm font-medium transition-colors',
    'min-w-[44px] min-h-[44px]'
  );

  // 표시할 페이지 번호 범위 계산
  const getVisiblePages = () => {
    const maxVisible = 5;
    let start = Math.max(
      1,
      currentPage - Math.floor(maxVisible / 2)
    );
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
        전체 {total.toLocaleString()}개 중{' '}
        {((currentPage - 1) * limit + 1).toLocaleString()}
        -{Math.min(currentPage * limit, total).toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
        {currentPage}/{totalPages}
      </p>

      <div className="flex items-center gap-1">
        {/* 첫 페이지 */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            btnClass,
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'hidden sm:flex'
          )}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* 이전 페이지 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            btnClass,
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 페이지 번호 */}
        {getVisiblePages().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              btnClass,
              p === currentPage
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {p}
          </button>
        ))}

        {/* 다음 페이지 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            btnClass,
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 마지막 페이지 */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            btnClass,
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'hidden sm:flex'
          )}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
