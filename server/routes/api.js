import express from 'express';
import { crawlAll } from '../services/crawler.js';
import { saveCrawlResult, getCategories, getProducts, getProductById, getProductByLegacyId } from '../services/dbService.js';
import {
  verifyAdminPassword,
  updateAdminPassword,
} from '../services/adminAuthService.js';

const router = express.Router();

// 크롤링 상태 관리
let isCrawling = false;
let crawlStatus = {
  status: 'idle',
  progress: 0,
  message: '',
  result: null,
};

/**
 * POST /api/ingest
 * 크롤링 실행 및 DB 저장 (비동기 처리)
 */
router.post('/ingest', async (req, res) => {
  if (isCrawling) {
    return res.json({
      success: false,
      message: '크롤링이 이미 진행 중입니다',
      status: crawlStatus,
    });
  }

  // 즉시 응답 (비동기 처리)
  res.json({
    success: true,
    message: '크롤링이 시작되었습니다. 진행 상황은 GET /api/ingest/status로 확인하세요.',
  });

  // 백그라운드에서 크롤링 실행
  (async () => {
    try {
      isCrawling = true;
      crawlStatus = {
        status: 'running',
        progress: 0,
        message: '크롤링 시작...',
        result: null,
      };

      console.log('크롤링 시작...');
      const startTime = Date.now();

      crawlStatus.message = '카테고리 크롤링 중...';
      crawlStatus.progress = 10;
      const crawlResult = await crawlAll();

      crawlStatus.message = '데이터베이스에 저장 중...';
      crawlStatus.progress = 90;
      const saveResult = await saveCrawlResult(crawlResult);

      const duration = Date.now() - startTime;

      crawlStatus = {
        status: 'completed',
        progress: 100,
        message: '크롤링 및 저장 완료',
        result: {
          categories: {
            crawled: crawlResult.categories.length,
            saved: saveResult.categoriesSaved,
          },
          products: {
            crawled: crawlResult.products.length,
            saved: saveResult.productsSaved,
          },
          errors: crawlResult.errors.length,
          duration: `${(duration / 1000).toFixed(2)}초`,
        },
      };

      console.log('✅ 크롤링 완료:', crawlStatus.result);
    } catch (error) {
      console.error('❌ 크롤링 실패:', error);
      crawlStatus = {
        status: 'error',
        progress: 0,
        message: '크롤링 실패',
        result: {
          error: error.message,
        },
      };
    } finally {
      isCrawling = false;
    }
  })();
});

/**
 * GET /api/ingest/status
 * 크롤링 진행 상황 조회
 */
router.get('/ingest/status', (req, res) => {
  res.json({
    success: true,
    data: crawlStatus,
  });
});

/**
 * GET /api/categories
 * 카테고리 목록 조회
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '카테고리 조회 실패',
      error: error.message,
    });
  }
});

/**
 * GET /api/products
 * 상품 목록 조회 (필터링 지원)
 * Query params: categoryId, categorySlug, search, limit
 */
router.get('/products', async (req, res) => {
  try {
    const filters = {
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null,
      categorySlug: req.query.categorySlug || null,
      search: req.query.search || null,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
    };

    const products = await getProducts(filters);
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('상품 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 조회 실패',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/:id
 * 내부 DB id 기반 상품 상세 조회
 */
router.get('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID',
      });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('상품 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 상세 조회 실패',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/legacy/:id
 * legacy_id (프론트에서 사용하는 id) 기반 상품 상세 조회
 */
router.get('/products/legacy/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID',
      });
    }

    const product = await getProductByLegacyId(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('상품 상세 조회 실패 (legacy):', error);
    res.status(500).json({
      success: false,
      message: '상품 상세 조회 실패',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/password/change
 * 관리자 비밀번호 변경
 */
router.post('/admin/password/change', async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '모든 비밀번호 입력값이 필요합니다',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호 확인이 일치하지 않습니다',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 8자 이상이어야 합니다',
      });
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 영문과 숫자를 모두 포함해야 합니다',
      });
    }

    const isCurrentPasswordValid = await verifyAdminPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다',
      });
    }

    await updateAdminPassword(newPassword);
    return res.json({
      success: true,
      message: '관리자 비밀번호가 변경되었습니다',
    });
  } catch (error) {
    console.error('관리자 비밀번호 변경 실패:', error);
    return res.status(500).json({
      success: false,
      message: '관리자 비밀번호 변경 실패',
      error: error.message,
    });
  }
});

export default router;
