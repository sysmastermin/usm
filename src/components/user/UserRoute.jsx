import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';

/**
 * 사용자 전용 보호 라우트
 * - 로딩 중: 스피너 표시
 * - 비로그인: /login으로 리다이렉트 (원래 경로 state.from 저장)
 * - 로그인: Outlet 렌더링
 */
export default function UserRoute() {
  const { isLoggedIn, isLoading } = useUserAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}
