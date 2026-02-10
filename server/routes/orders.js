import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
} from '../services/shopService.js';

const router = express.Router();

/* ----------------------------------------
 * POST /api/orders
 * 주문 생성 (장바구니 → 주문 변환, 트랜잭션)
 * body: { shipping: { recipientName, recipientPhone,
 *          zipcode, address, addressDetail }, memo }
 * ---------------------------------------- */
router.post('/', async (req, res) => {
  try {
    const { shipping, memo } = req.body;

    if (!shipping) {
      return res.status(400).json({
        success: false,
        message: '배송지 정보를 입력해주세요',
      });
    }

    const {
      recipientName,
      recipientPhone,
      zipcode,
      address,
    } = shipping;

    if (
      !recipientName ||
      !recipientPhone ||
      !zipcode ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message:
          '수령인 이름, 연락처, 우편번호, 주소는 필수입니다',
      });
    }

    const result = await createOrder(
      req.user.id,
      shipping,
      memo
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result.order,
      message: '주문이 완료되었습니다',
    });
  } catch (error) {
    console.error('주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 처리 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/orders
 * 내 주문 목록 (페이지네이션)
 * query: page, limit
 * ---------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || 10,
      50
    );

    const result = await getOrders(
      req.user.id,
      page,
      limit
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/orders/:id
 * 주문 상세 조회 (order_items JOIN)
 * ---------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID',
      });
    }

    const order = await getOrderDetail(
      orderId,
      req.user.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다',
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('주문 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 상세 조회 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * PUT /api/orders/:id/cancel
 * 주문 취소 (status=pending만 가능)
 * ---------------------------------------- */
router.put('/:id/cancel', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID',
      });
    }

    const cancelled = await cancelOrder(
      orderId,
      req.user.id
    );

    if (!cancelled) {
      return res.status(400).json({
        success: false,
        message:
          '취소할 수 없는 주문입니다. ' +
          '대기 중(pending) 상태의 주문만 취소할 수 있습니다.',
      });
    }

    res.json({
      success: true,
      message: '주문이 취소되었습니다',
    });
  } catch (error) {
    console.error('주문 취소 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다',
    });
  }
});

export default router;
