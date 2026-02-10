import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = (
  process.env.JWT_SECRET ||
  'usm-admin-jwt-secret-key-fallback'
).trim();
const ADMIN_PASSWORD = (
  process.env.ADMIN_PASSWORD || 'usm@admin2026!'
).trim();
const TOKEN_EXPIRY = '24h';

// --- Rate Limiting (IP별 5회/분) ---
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;

// 오래된 기록 자동 정리 (5분마다)
// 서버리스 환경에서는 setInterval이 불필요하므로 가드 추가
if (typeof globalThis.__rateLimitCleaner === 'undefined') {
  globalThis.__rateLimitCleaner = setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of loginAttempts) {
      const recent = times.filter(
        (t) => now - t < WINDOW_MS
      );
      if (recent.length === 0) loginAttempts.delete(ip);
      else loginAttempts.set(ip, recent);
    }
  }, 5 * 60 * 1000);
  // 서버리스 환경에서 함수 종료를 차단하지 않도록 unref 처리
  if (globalThis.__rateLimitCleaner?.unref) {
    globalThis.__rateLimitCleaner.unref();
  }
}

/**
 * 로그인 Rate Limiting 미들웨어
 * - IP별 1분당 최대 5회 시도 허용
 * - 초과 시 429 응답 + 대기시간 안내
 */
export function loginRateLimiter(req, res, next) {
  const ip =
    req.ip ||
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip) || [];
  const recent = record.filter(
    (t) => now - t < WINDOW_MS
  );

  if (recent.length >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil(
      (recent[0] + WINDOW_MS - now) / 1000
    );
    return res.status(429).json({
      success: false,
      message:
        `로그인 시도가 너무 많습니다. ` +
        `${waitSec}초 후 다시 시도하세요.`,
    });
  }

  recent.push(now);
  loginAttempts.set(ip, recent);
  next();
}

/**
 * 관리자 로그인 처리
 * - 환경변수 비밀번호와 대조
 * - 일치 시 JWT 토큰 발급 (24시간 만료)
 */
export function handleLogin(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '비밀번호를 입력해주세요',
      });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: '비밀번호가 올바르지 않습니다',
      });
    }

    const token = jwt.sign(
      { role: 'admin', iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.json({
      success: true,
      data: { token },
      message: '로그인 성공',
    });
  } catch (error) {
    console.error('로그인 처리 실패:', error);
    return res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다',
    });
  }
}

/**
 * JWT 인증 미들웨어
 * - Authorization: Bearer <token> 헤더에서 토큰 추출
 * - 토큰 검증 후 req.admin에 디코딩된 정보 저장
 * - 만료/무효 시 401 응답
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '유효한 토큰이 없습니다',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다',
      });
    }

    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다',
    });
  }
}
