import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Loader2 } from 'lucide-react';

/**
 * 인증 보호 라우트 래퍼
 * - 초기 로딩 중: 스피너 표시
 * - 미인증 시 /admin/login으로 리다이렉트
 * - 인증 시 children 렌더링
 */
export default function AdminRoute({ children }) {
  const { authed, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            인증 확인 중...
          </p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
