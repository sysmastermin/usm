import axios from 'axios';

const TOKEN_KEY = 'usm_admin_token';

/**
 * 관리자 API axios 인스턴스
 * - baseURL: /api/admin (Vite proxy로 백엔드 연결)
 * - 요청 인터셉터: JWT 토큰 자동 첨부
 * - 응답 인터셉터: 401 시 자동 로그아웃
 */
const adminApi = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
adminApi.interceptors.request.use(
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
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // 현재 로그인 페이지가 아니면 리다이렉트
      if (
        !window.location.pathname.includes('/admin/login')
      ) {
        window.location.href = '/admin/login';
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

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    // JWT payload 디코딩 (만료 시간 확인)
    const payload = JSON.parse(
      atob(token.split('.')[1])
    );
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

/* ============================================================
 * 공개 API (Vite proxy 경유, 인증 불필요)
 * ============================================================ */

export const publicApi = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export default adminApi;
