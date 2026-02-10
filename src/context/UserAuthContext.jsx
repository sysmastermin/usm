import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import userApi, {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
} from '../lib/userApi';

const UserAuthContext = createContext(null);

/**
 * 사용자 인증 상태 프로바이더
 * - localStorage JWT 토큰 기반
 * - 마운트 시 서버 verify 호출로 실제 유효성 확인
 * - 로그인/회원가입/로그아웃/만료 자동 처리
 * - 장바구니 수량 관리
 */
export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const mounted = useRef(true);

  const isLoggedIn = !!user;

  // 장바구니 수량 업데이트
  const updateCartCount = useCallback(async () => {
    try {
      const res = await userApi.get('/cart/count');
      if (mounted.current) {
        setCartCount(res.data.data?.count || 0);
      }
    } catch {
      // 인증 실패 시 무시
    }
  }, []);

  // 마운트 시 토큰 verify + 장바구니 수량 로드
  useEffect(() => {
    mounted.current = true;

    const verifyToken = async () => {
      const token = getToken();
      if (!token || !isAuthenticated()) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await userApi.get('/auth/verify');
        if (mounted.current && res.data.success) {
          setUser(res.data.data);
          // 로그인 확인 후 장바구니 수량 로드
          updateCartCount();
        }
      } catch {
        if (mounted.current) {
          removeToken();
          setUser(null);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    verifyToken();
    return () => {
      mounted.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 토큰 만료 자동 감지 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !isAuthenticated()) {
        setUser(null);
        setCartCount(0);
        removeToken();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  /**
   * 로그인
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await userApi.post('/auth/login', {
        email,
        password,
      });
      if (res.data.success && res.data.data?.token) {
        setToken(res.data.data.token);
        setUser(res.data.data.user);
        // 장바구니 수량 즉시 로드
        setTimeout(() => updateCartCount(), 100);
        return true;
      }
      setError('로그인에 실패했습니다');
      return false;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        '로그인 중 오류가 발생했습니다';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateCartCount]);

  /**
   * 회원가입
   */
  const register = useCallback(
    async (formData) => {
      setLoading(true);
      setError('');
      try {
        const res = await userApi.post(
          '/auth/register',
          formData
        );
        if (res.data.success && res.data.data?.token) {
          setToken(res.data.data.token);
          setUser(res.data.data.user);
          return true;
        }
        setError('회원가입에 실패했습니다');
        return false;
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          '회원가입 중 오류가 발생했습니다';
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 로그아웃
   */
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setCartCount(0);
    setError('');
  }, []);

  const value = {
    user,
    isLoggedIn,
    isLoading,
    loading,
    error,
    cartCount,
    login,
    register,
    logout,
    updateCartCount,
    clearError: () => setError(''),
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

/**
 * 사용자 인증 컨텍스트 훅
 */
export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error(
      'useUserAuth must be used inside UserAuthProvider'
    );
  }
  return ctx;
}
