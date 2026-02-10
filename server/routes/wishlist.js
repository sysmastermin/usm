import express from 'express';
import {
  getWishlist,
  toggleWishlist,
  removeWishlistItem,
  isInWishlist,
} from '../services/shopService.js';

const router = express.Router();

/* ----------------------------------------
 * GET /api/wishlist
 * 위시리스트 조회 (상품정보 JOIN)
 * ---------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const items = await getWishlist(req.user.id);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('위시리스트 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 조회 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * POST /api/wishlist
 * 위시리스트 토글 (있으면 제거, 없으면 추가)
 * body: { productId }
 * ---------------------------------------- */
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID를 입력해주세요',
      });
    }

    const result = await toggleWishlist(
      req.user.id,
      parseInt(productId)
    );

    res.json({
      success: true,
      data: result,
      message: result.added
        ? '위시리스트에 추가되었습니다'
        : '위시리스트에서 제거되었습니다',
    });
  } catch (error) {
    console.error('위시리스트 토글 실패:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 처리 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * DELETE /api/wishlist/:productId
 * 위시리스트 단일 제거
 * ---------------------------------------- */
router.delete('/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID',
      });
    }

    const removed = await removeWishlistItem(
      req.user.id,
      productId
    );

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: '위시리스트 항목을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '위시리스트에서 제거되었습니다',
    });
  } catch (error) {
    console.error('위시리스트 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 삭제 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/wishlist/check/:productId
 * 특정 상품 위시리스트 여부 확인
 * ---------------------------------------- */
router.get('/check/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID',
      });
    }

    const inWishlist = await isInWishlist(
      req.user.id,
      productId
    );

    res.json({
      success: true,
      data: { inWishlist },
    });
  } catch (error) {
    console.error('위시리스트 확인 실패:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 확인 중 오류가 발생했습니다',
    });
  }
});

export default router;
