import axios from 'axios';

const TOKEN_KEY = 'usm_user_token';

/**
 * 사용자 API axios 인스턴스
 * - baseURL: /api (Vite proxy로 백엔드 연결)
 * - 요청 인터셉터: JWT 토큰 자동 첨부
 * - 응답 인터셉터: 401 시 자동 로그아웃
 */
const userApi = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 시 토큰 제거 + 리다이렉트
userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // 이미 로그인 페이지면 리다이렉트 안 함
      const path = window.location.pathname;
      if (
        !path.includes('/login') &&
        !path.includes('/register') &&
        !path.includes('/admin')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* ============================================================
 * 토큰 관리 유틸 함수
 * ============================================================ */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 토큰 유효성 확인 (만료 시간 체크)
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(
      atob(token.split('.')[1])
    );
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export default userApi;
