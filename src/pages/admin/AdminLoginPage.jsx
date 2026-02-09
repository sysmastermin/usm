import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { cn } from '../../lib/utils';

/**
 * 관리자 로그인 페이지
 * - 비밀번호만 입력 (환경변수 기반 단일 관리자)
 * - Enter 키 제출 지원
 * - 이미 로그인된 경우 대시보드로 리다이렉트
 * - 모바일 최적화
 */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { authed, login, loading, error, clearError } =
    useAdminAuth();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (authed) navigate('/admin', { replace: true });
  }, [authed, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    const success = await login(password);
    if (success) {
      navigate('/admin', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl mb-4">
            <span className="text-white dark:text-gray-900 text-2xl font-bold">
              U
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            USM Admin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            관리자 로그인
          </p>
        </div>

        {/* 로그인 폼 */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-6',
            'border border-gray-200 dark:border-gray-700',
            'shadow-sm'
          )}
        >
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* 비밀번호 입력 */}
          <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            비밀번호
          </label>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              placeholder="관리자 비밀번호를 입력하세요"
              autoFocus
              className={cn(
                'w-full pl-10 pr-12 py-3',
                'text-sm rounded-lg',
                'bg-white dark:bg-gray-700',
                'border border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'placeholder-gray-400 dark:placeholder-gray-500',
                'focus:outline-none focus:ring-2',
                'focus:ring-gray-900/20 dark:focus:ring-white/20',
                'focus:border-gray-900 dark:focus:border-white',
                'min-h-[48px]'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px]"
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className={cn(
              'w-full py-3 rounded-lg',
              'text-sm font-medium',
              'bg-gray-900 dark:bg-white',
              'text-white dark:text-gray-900',
              'hover:bg-gray-800 dark:hover:bg-gray-100',
              'transition-colors min-h-[48px]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
