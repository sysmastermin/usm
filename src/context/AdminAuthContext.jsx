import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import adminApi, {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
} from '../lib/adminApi';

const AdminAuthContext = createContext(null);

/**
 * 관리자 인증 상태 프로바이더
 * - localStorage JWT 토큰 기반
 * - 마운트 시 서버 verify 호출로 실제 유효성 확인
 * - 로그인/로그아웃/만료 자동 처리
 */
export function AdminAuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  // 마운트 시 토큰이 있으면 서버 verify 호출
  useEffect(() => {
    mounted.current = true;

    const verifyToken = async () => {
      const token = getToken();
      if (!token || !isAuthenticated()) {
        setAuthed(false);
        setIsLoading(false);
        return;
      }

      try {
        await adminApi.get('/verify');
        if (mounted.current) {
          setAuthed(true);
        }
      } catch {
        if (mounted.current) {
          removeToken();
          setAuthed(false);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    verifyToken();
    return () => { mounted.current = false; };
  }, []);

  // 토큰 만료 자동 감지 (1분마다 체크)
  useEffect(() => {
    const interval = setInterval(() => {
      if (authed && !isAuthenticated()) {
        setAuthed(false);
        removeToken();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [authed]);

  /**
   * 로그인 시도
   * @param {string} password 관리자 비밀번호
   * @returns {boolean} 로그인 성공 여부
   */
  const login = useCallback(async (password) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.post('/login', {
        password,
      });
      if (res.data.success && res.data.data?.token) {
        setToken(res.data.data.token);
        setAuthed(true);
        return true;
      }
      setError('로그인에 실패했습니다');
      return false;
    } catch (err) {
      const msg =
        err.response?.data?.message
        || '로그인 중 오류가 발생했습니다';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 로그아웃
   */
  const logout = useCallback(() => {
    removeToken();
    setAuthed(false);
    setError('');
  }, []);

  const value = {
    authed,
    isLoading,
    loading,
    error,
    login,
    logout,
    clearError: () => setError(''),
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

/**
 * 관리자 인증 컨텍스트 훅
 */
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error(
      'useAdminAuth must be used inside AdminAuthProvider'
    );
  }
  return ctx;
}
