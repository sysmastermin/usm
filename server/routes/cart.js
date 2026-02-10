import express from 'express';
import {
  getCartItems,
  getCartCount,
  addToCart,
  updateCartQuantity,
  removeCartItem,
  clearCart,
} from '../services/shopService.js';

const router = express.Router();

/* ----------------------------------------
 * GET /api/cart
 * 장바구니 조회 (상품정보 JOIN)
 * ---------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const items = await getCartItems(req.user.id);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('장바구니 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/cart/count
 * 장바구니 총 수량 (Header 배지용)
 * ---------------------------------------- */
router.get('/count', async (req, res) => {
  try {
    const count = await getCartCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('장바구니 수량 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 수량 조회 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * POST /api/cart
 * 장바구니 추가 (UPSERT: 이미 있으면 수량 누적)
 * body: { productId, quantity? }
 * ---------------------------------------- */
router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID를 입력해주세요',
      });
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1 || qty > 99) {
      return res.status(400).json({
        success: false,
        message: '수량은 1~99 사이로 입력해주세요',
      });
    }

    const result = await addToCart(
      req.user.id,
      parseInt(productId),
      qty
    );
    const count = await getCartCount(req.user.id);

    res.json({
      success: true,
      data: { ...result, cartCount: count },
      message: '장바구니에 추가되었습니다',
    });
  } catch (error) {
    console.error('장바구니 추가 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 추가 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * PUT /api/cart/:id
 * 수량 변경
 * body: { quantity }
 * ---------------------------------------- */
router.put('/:id', async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const { quantity } = req.body;
    const qty = parseInt(quantity);

    if (isNaN(cartItemId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 항목 ID',
      });
    }

    if (!qty || qty < 1 || qty > 99) {
      return res.status(400).json({
        success: false,
        message: '수량은 1~99 사이로 입력해주세요',
      });
    }

    const updated = await updateCartQuantity(
      cartItemId,
      req.user.id,
      qty
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '수량이 변경되었습니다',
    });
  } catch (error) {
    console.error('장바구니 수량 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '수량 변경 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * DELETE /api/cart/:id
 * 단일 삭제
 * ---------------------------------------- */
router.delete('/:id', async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);

    if (isNaN(cartItemId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 항목 ID',
      });
    }

    const removed = await removeCartItem(
      cartItemId,
      req.user.id
    );

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다',
      });
    }

    const count = await getCartCount(req.user.id);
    res.json({
      success: true,
      data: { cartCount: count },
      message: '항목이 삭제되었습니다',
    });
  } catch (error) {
    console.error('장바구니 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '삭제 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * DELETE /api/cart
 * 전체 비우기
 * ---------------------------------------- */
router.delete('/', async (req, res) => {
  try {
    await clearCart(req.user.id);
    res.json({
      success: true,
      data: { cartCount: 0 },
      message: '장바구니가 비워졌습니다',
    });
  } catch (error) {
    console.error('장바구니 비우기 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다',
    });
  }
});

export default router;
