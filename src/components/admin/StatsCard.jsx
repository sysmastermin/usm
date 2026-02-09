import { cn } from '../../lib/utils';

/**
 * 대시보드 통계 카드
 * @param {object} props
 * @param {React.ReactNode} props.icon - lucide-react 아이콘
 * @param {string} props.label - 통계 라벨
 * @param {string|number} props.value - 통계 값
 * @param {string} [props.suffix] - 값 뒤 접미사
 * @param {string} [props.color] - 아이콘 배경색 테마
 * @param {boolean} [props.loading] - 로딩 스켈레톤
 * @param {string} [props.className] - 추가 클래스
 */
export default function StatsCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  color = 'blue',
  loading = false,
  className,
}) {
  const colorMap = {
    blue:
      'bg-blue-100 text-blue-600 ' +
      'dark:bg-blue-900/30 dark:text-blue-400',
    green:
      'bg-green-100 text-green-600 ' +
      'dark:bg-green-900/30 dark:text-green-400',
    purple:
      'bg-purple-100 text-purple-600 ' +
      'dark:bg-purple-900/30 dark:text-purple-400',
    amber:
      'bg-amber-100 text-amber-600 ' +
      'dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl',
        'p-4 sm:p-6',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* 아이콘 */}
        <div
          className={cn(
            'flex items-center justify-center',
            'w-10 h-10 sm:w-12 sm:h-12 rounded-lg',
            loading
              ? 'bg-gray-200 dark:bg-gray-700 animate-pulse'
              : colorMap[color] || colorMap.blue
          )}
        >
          {!loading && Icon && (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <div
                className={cn(
                  'h-3 w-16 rounded',
                  'bg-gray-200 dark:bg-gray-700',
                  'animate-pulse mb-2'
                )}
              />
              <div
                className={cn(
                  'h-7 w-24 rounded',
                  'bg-gray-200 dark:bg-gray-700',
                  'animate-pulse'
                )}
              />
            </>
          ) : (
            <>
              <p
                className={cn(
                  'text-xs sm:text-sm truncate',
                  'text-gray-500 dark:text-gray-400'
                )}
              >
                {label}
              </p>
              <p
                className={cn(
                  'text-xl sm:text-2xl font-bold',
                  'text-gray-900 dark:text-white'
                )}
              >
                {value}
                {suffix && (
                  <span
                    className={cn(
                      'text-sm sm:text-base',
                      'font-normal ml-1',
                      'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {suffix}
                  </span>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
