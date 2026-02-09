import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * 관리자 영역 에러 바운더리
 * - 하위 컴포넌트 에러를 캐치하여 UI 크래시 방지
 * - 재시도 / 홈으로 돌아가기 옵션 제공
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(
      '[AdminErrorBoundary]',
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/admin';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div
          className={cn(
            'max-w-md w-full text-center',
            'bg-white dark:bg-gray-900',
            'rounded-xl shadow-lg p-8'
          )}
        >
          <div
            className={cn(
              'mx-auto mb-4 w-14 h-14',
              'rounded-full flex items-center justify-center',
              'bg-red-100 dark:bg-red-900/30'
            )}
          >
            <AlertTriangle
              className="w-7 h-7 text-red-600 dark:text-red-400"
            />
          </div>

          <h2
            className={cn(
              'text-lg font-semibold mb-2',
              'text-gray-900 dark:text-white'
            )}
          >
            문제가 발생했습니다
          </h2>
          <p
            className={cn(
              'text-sm mb-6',
              'text-gray-500 dark:text-gray-400'
            )}
          >
            페이지를 표시하는 중 오류가 발생했습니다.
            다시 시도하거나 대시보드로 돌아가 주세요.
          </p>

          {process.env.NODE_ENV === 'development'
            && this.state.error && (
            <pre
              className={cn(
                'text-xs text-left mb-6 p-3',
                'rounded-lg overflow-auto max-h-32',
                'bg-gray-100 dark:bg-gray-800',
                'text-red-600 dark:text-red-400'
              )}
            >
              {this.state.error.message}
            </pre>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className={cn(
                'inline-flex items-center gap-2',
                'px-4 py-2.5 rounded-lg text-sm font-medium',
                'bg-blue-600 text-white',
                'hover:bg-blue-700 transition-colors',
                'min-h-[44px]'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
            <button
              onClick={this.handleGoHome}
              className={cn(
                'inline-flex items-center gap-2',
                'px-4 py-2.5 rounded-lg text-sm font-medium',
                'bg-gray-100 dark:bg-gray-800',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-200',
                'dark:hover:bg-gray-700',
                'transition-colors min-h-[44px]'
              )}
            >
              <Home className="w-4 h-4" />
              대시보드로
            </button>
          </div>
        </div>
      </div>
    );
  }
}
