import { cn } from '../../lib/utils';

/**
 * 반응형 데이터 테이블
 * - 768px 이상: 전통적 테이블 레이아웃
 * - 768px 이하: 카드 리스트 자동 전환
 *
 * @param {object} props
 * @param {Array<{key, label, render?, className?}>} props.columns
 * @param {Array<object>} props.data
 * @param {function} [props.onRowClick]
 * @param {boolean} [props.loading]
 * @param {string} [props.emptyMessage]
 * @param {function} [props.renderMobileCard] - 모바일 카드 커스텀 렌더러
 */
export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  loading,
  emptyMessage = '데이터가 없습니다',
  renderMobileCard,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* 데스크톱 테이블 (md 이상) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium',
                    'text-gray-500 dark:text-gray-400',
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-800',
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  'transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-gray-700 dark:text-gray-300',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 리스트 (md 미만) */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIdx) => {
          if (renderMobileCard) {
            return renderMobileCard(row, rowIdx);
          }

          return (
            <div
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg p-4',
                'border border-gray-200 dark:border-gray-700',
                'shadow-sm',
                onRowClick && 'cursor-pointer active:bg-gray-50 dark:active:bg-gray-700'
              )}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between py-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {col.label}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
