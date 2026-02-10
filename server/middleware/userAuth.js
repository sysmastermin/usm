import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  createUser,
  getUserByEmail,
} from '../services/shopService.js';

dotenv.config();

const JWT_SECRET = (
  process.env.JWT_SECRET ||
  'usm-admin-jwt-secret-key-fallback'
).trim();
const USER_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 12;

/* ============================================================
 * 입력 검증 유틸
 * ============================================================ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX =
  /^01[016789]-?\d{3,4}-?\d{4}$/;

function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

function validatePassword(pw) {
  // 최소 8자, 영문+숫자 포함
  return (
    pw.length >= 8 &&
    /[a-zA-Z]/.test(pw) &&
    /\d/.test(pw)
  );
}

/* ============================================================
 * JWT 인증 미들웨어
 * ============================================================ */

/**
 * 사용자 JWT 인증 미들웨어
 * - Bearer 토큰 추출 → 검증 → req.user 저장
 * - role: 'user' 확인
 */
export function userAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다',
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

    if (decoded.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '로그인이 만료되었습니다. 다시 로그인해주세요',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다',
      });
    }
    console.error('사용자 인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다',
    });
  }
}

/* ============================================================
 * 회원가입 핸들러
 * ============================================================ */

/**
 * 회원가입 처리
 * - 입력 검증 → 이메일 중복 체크 → bcrypt 해싱 → DB 저장 → JWT 발급
 */
export async function handleUserRegister(req, res) {
  try {
    const {
      email,
      password,
      name,
      phone,
      zipcode,
      address,
      addressDetail,
      birthDate,
    } = req.body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름은 필수입니다',
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '올바른 이메일 형식이 아닙니다',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다',
      });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: '이름은 2~50자로 입력해주세요',
      });
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '올바른 전화번호 형식이 아닙니다',
      });
    }

    // 이메일 중복 체크
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: '이미 가입된 이메일입니다',
      });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(
      password,
      BCRYPT_ROUNDS
    );

    // 사용자 생성
    const user = await createUser({
      email,
      passwordHash,
      name,
      phone: phone || null,
      zipcode: zipcode || null,
      address: address || null,
      addressDetail: addressDetail || null,
      birthDate: birthDate || null,
    });

    // JWT 발급
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: USER_TOKEN_EXPIRY }
    );

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      message: '회원가입이 완료되었습니다',
    });
  } catch (error) {
    console.error('회원가입 처리 실패:', error);
    return res.status(500).json({
      success: false,
      message: '회원가입 처리 중 오류가 발생했습니다',
    });
  }
}

/* ============================================================
 * 로그인 핸들러
 * ============================================================ */

/**
 * 로그인 처리
 * - 이메일로 사용자 조회 → bcrypt 비교 → JWT 발급 (7일)
 */
export async function handleUserLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요',
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: USER_TOKEN_EXPIRY }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
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
