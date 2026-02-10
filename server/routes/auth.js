import express from 'express';
import bcrypt from 'bcryptjs';
import { loginRateLimiter } from '../middleware/auth.js';
import {
  handleUserRegister,
  handleUserLogin,
  userAuthMiddleware,
} from '../middleware/userAuth.js';
import {
  getUserById,
  updateUserProfile,
  updateUserPassword,
  getUserByEmail,
} from '../services/shopService.js';

const router = express.Router();

const BCRYPT_ROUNDS = 12;

/* ----------------------------------------
 * POST /api/auth/register
 * 회원가입 (공개)
 * ---------------------------------------- */
router.post('/register', loginRateLimiter, handleUserRegister);

/* ----------------------------------------
 * POST /api/auth/login
 * 로그인 (공개)
 * ---------------------------------------- */
router.post('/login', loginRateLimiter, handleUserLogin);

/* ----------------------------------------
 * GET /api/auth/verify
 * JWT 토큰 유효성 검증 (인증 필요)
 * ---------------------------------------- */
router.get('/verify', userAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

/* ----------------------------------------
 * GET /api/auth/profile
 * 내 정보 전체 조회 (인증 필요)
 * ---------------------------------------- */
router.get(
  '/profile',
  userAuthMiddleware,
  async (req, res) => {
    try {
      const user = await getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로필 조회 중 오류가 발생했습니다',
      });
    }
  }
);

/* ----------------------------------------
 * PUT /api/auth/profile
 * 내 정보 수정 (인증 필요)
 * ---------------------------------------- */
router.put(
  '/profile',
  userAuthMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        phone,
        zipcode,
        address,
        addressDetail,
        birthDate,
      } = req.body;

      if (name !== undefined) {
        if (name.length < 2 || name.length > 50) {
          return res.status(400).json({
            success: false,
            message: '이름은 2~50자로 입력해주세요',
          });
        }
      }

      await updateUserProfile(req.user.id, {
        name,
        phone,
        zipcode,
        address,
        addressDetail,
        birthDate,
      });

      const updated = await getUserById(req.user.id);
      res.json({
        success: true,
        data: updated,
        message: '프로필이 수정되었습니다',
      });
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      res.status(500).json({
        success: false,
        message: '프로필 수정 중 오류가 발생했습니다',
      });
    }
  }
);

/* ----------------------------------------
 * PUT /api/auth/password
 * 비밀번호 변경 (인증 필요, 현재 비번 확인)
 * ---------------------------------------- */
router.put(
  '/password',
  userAuthMiddleware,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message:
            '현재 비밀번호와 새 비밀번호를 입력해주세요',
        });
      }

      if (
        newPassword.length < 8 ||
        !/[a-zA-Z]/.test(newPassword) ||
        !/\d/.test(newPassword)
      ) {
        return res.status(400).json({
          success: false,
          message:
            '새 비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다',
        });
      }

      // 현재 비밀번호 확인
      const user = await getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다',
        });
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: '현재 비밀번호가 올바르지 않습니다',
        });
      }

      const newHash = await bcrypt.hash(
        newPassword,
        BCRYPT_ROUNDS
      );
      await updateUserPassword(req.user.id, newHash);

      res.json({
        success: true,
        message: '비밀번호가 변경되었습니다',
      });
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      res.status(500).json({
        success: false,
        message: '비밀번호 변경 중 오류가 발생했습니다',
      });
    }
  }
);

export default router;
