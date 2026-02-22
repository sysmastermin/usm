import express from 'express';
import {
  handleLogin,
  authMiddleware,
  loginRateLimiter,
} from '../middleware/auth.js';
import {
  getDashboardStats,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminCategories,
  updateCategory,
  deleteCategory,
  getUntranslated,
  getItemsForTranslation,
  saveProductTranslation,
  saveCategoryTranslation,
} from '../services/dbService.js';
import {
  getAdminOrders,
  getAdminOrderDetail,
  updateOrderStatus,
} from '../services/shopService.js';
import {
  translateJaToKo,
} from '../utils/translator.js';
import { clearCache } from '../utils/cache.js';
import {
  getAdminScenes,
  getSceneById,
  updateScene,
  deleteScene,
  linkProductToScene,
  unlinkProductFromScene,
  updateSceneProductOrder,
  migrateFromJson,
} from '../services/sceneService.js';
import {
  crawlSceneProducts,
} from '../services/sceneCrawler.js';

const router = express.Router();

/* ----------------------------------------
 * POST /api/admin/login
 * 인증 미들웨어 없이 접근 가능
 * ---------------------------------------- */
router.post('/login', loginRateLimiter, handleLogin);

/* ----------------------------------------
 * GET /api/admin/verify
 * JWT 토큰 유효성 검증 (인증 필요)
 * ---------------------------------------- */
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: { role: req.admin?.role || 'admin' },
  });
});

/* ----------------------------------------
 * 이하 모든 라우트에 인증 미들웨어 적용
 * ---------------------------------------- */
router.use(authMiddleware);

/* ----------------------------------------
 * GET /api/admin/dashboard
 * 대시보드 통계
 * ---------------------------------------- */
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('대시보드 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 통계를 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * POST /api/admin/products
 * 상품 등록 (수동)
 * ---------------------------------------- */
router.post('/products', async (req, res) => {
  try {
    if (
      !req.body
      || !req.body.name_ja
      || req.body.name_ja.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: '상품명(일본어)은 필수 입력입니다',
      });
    }

    const product = await createProduct(req.body);

    clearCache('products:*');

    res.status(201).json({
      success: true,
      data: product,
      message: '상품이 등록되었습니다',
    });
  } catch (error) {
    console.error('상품 등록 실패:', error);
    res.status(500).json({
      success: false,
      message:
        error.message || '상품 등록에 실패했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/admin/products
 * 상품 목록 (페이지네이션, 검색, 필터)
 * ---------------------------------------- */
router.get('/products', async (req, res) => {
  try {
    const result = await getAdminProducts({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      categoryId: req.query.categoryId,
      untranslated: req.query.untranslated,
    });
    res.json({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    console.error('관리자 상품 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 목록을 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/admin/products/:id
 * 상품 상세 조회
 * ---------------------------------------- */
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

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('상품 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 정보를 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * PUT /api/admin/products/:id
 * 상품 수정
 * ---------------------------------------- */
router.put('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 없습니다',
      });
    }

    const updated = await updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다',
      });
    }

    // 상품 캐시 무효화
    clearCache('products:*');

    res.json({
      success: true,
      data: updated,
      message: '상품이 수정되었습니다',
    });
  } catch (error) {
    console.error('상품 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '상품 수정에 실패했습니다',
    });
  }
});

/* ----------------------------------------
 * DELETE /api/admin/products/:id
 * 상품 삭제
 * ---------------------------------------- */
router.delete('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID',
      });
    }

    await deleteProduct(id);

    // 상품 캐시 무효화
    clearCache('products:*');

    res.json({
      success: true,
      message: '상품이 삭제되었습니다',
    });
  } catch (error) {
    console.error('상품 삭제 실패:', error);
    res.status(
      error.message.includes('찾을 수 없습니다')
        ? 404
        : 500
    ).json({
      success: false,
      message: error.message || '상품 삭제에 실패했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/admin/categories
 * 카테고리 목록 (소속 상품 수 포함)
 * ---------------------------------------- */
router.get('/categories', async (req, res) => {
  try {
    const categories = await getAdminCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '카테고리 목록을 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * PUT /api/admin/categories/:id
 * 카테고리 수정
 * ---------------------------------------- */
router.put('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 카테고리 ID',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 없습니다',
      });
    }

    const updated = await updateCategory(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: '카테고리를 찾을 수 없습니다',
      });
    }

    // 카테고리 캐시 무효화
    clearCache('categories');

    res.json({
      success: true,
      data: updated,
      message: '카테고리가 수정되었습니다',
    });
  } catch (error) {
    console.error('카테고리 수정 실패:', error);
    res.status(500).json({
      success: false,
      message:
        error.message || '카테고리 수정에 실패했습니다',
    });
  }
});

/* ----------------------------------------
 * DELETE /api/admin/categories/:id
 * 카테고리 삭제 (소속 상품 확인)
 * ---------------------------------------- */
router.delete('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 카테고리 ID',
      });
    }

    await deleteCategory(id);

    // 카테고리 캐시 무효화
    clearCache('categories');

    res.json({
      success: true,
      message: '카테고리가 삭제되었습니다',
    });
  } catch (error) {
    console.error('카테고리 삭제 실패:', error);
    const status =
      error.message.includes('상품이 있습니다')
        ? 400
        : 500;
    res.status(status).json({
      success: false,
      message:
        error.message || '카테고리 삭제에 실패했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/admin/untranslated
 * 미번역 항목 조회
 * ---------------------------------------- */
router.get('/untranslated', async (req, res) => {
  try {
    const result = await getUntranslated({
      type: req.query.type,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    console.error('미번역 항목 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '미번역 항목을 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * POST /api/admin/translate
 * 선택 항목 일괄 번역 요청
 * body: { ids: number[], type: 'product'|'category' }
 * ---------------------------------------- */
router.post('/translate', async (req, res) => {
  try {
    const { ids, type = 'product' } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '번역할 항목을 선택해주세요',
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: '한 번에 최대 50개까지 번역 가능합니다',
      });
    }

    const items = await getItemsForTranslation(ids, type);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '번역할 항목을 찾을 수 없습니다',
      });
    }

    let translated = 0;
    let failed = 0;

    for (const item of items) {
      try {
        if (type === 'category') {
          if (!item.name_ko || item.name_ko.length === 0) {
            const result =
              await translateJaToKo(item.name_ja);
            if (result) {
              await saveCategoryTranslation(
                item.id,
                result
              );
              translated++;
            } else {
              failed++;
            }
          }
        } else {
          const translations = {};

          if (!item.name_ko || item.name_ko.length === 0) {
            const r =
              await translateJaToKo(item.name_ja);
            if (r) translations.name_ko = r;
          }

          if (
            item.description_ja
            && (!item.description_ko
              || item.description_ko.length === 0)
          ) {
            const r = await translateJaToKo(
              item.description_ja
            );
            if (r) translations.description_ko = r;
          }

          if (
            item.material_ja
            && (!item.material_ko
              || item.material_ko.length === 0)
          ) {
            const r = await translateJaToKo(
              item.material_ja
            );
            if (r) translations.material_ko = r;
          }

          if (Object.keys(translations).length > 0) {
            await saveProductTranslation(
              item.id,
              translations
            );
            translated++;
          }
        }
      } catch (err) {
        console.error(
          `번역 실패 (${type} #${item.id}):`,
          err.message
        );
        failed++;
      }
    }

    // 번역 후 캐시 무효화
    if (translated > 0) {
      if (type === 'category') {
        clearCache('categories');
      } else {
        clearCache('products:*');
      }
    }

    res.json({
      success: true,
      data: { translated, failed, total: items.length },
      message:
        `${translated}개 번역 완료`
        + (failed > 0 ? `, ${failed}개 실패` : ''),
    });
  } catch (error) {
    console.error('일괄 번역 실패:', error);
    res.status(500).json({
      success: false,
      message: '번역 처리 중 오류가 발생했습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/admin/orders
 * 주문 목록 (페이지네이션, 필터, 검색)
 * ---------------------------------------- */
router.get('/orders', async (req, res) => {
  try {
    const result = await getAdminOrders({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    console.error('관리자 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * GET /api/admin/orders/:id
 * 주문 상세 조회
 * ---------------------------------------- */
router.get('/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID',
      });
    }

    const order = await getAdminOrderDetail(id);
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
      message: '주문 정보를 불러올 수 없습니다',
    });
  }
});

/* ----------------------------------------
 * PUT /api/admin/orders/:id/status
 * 주문 상태 변경
 * body: { status, memo? }
 * ---------------------------------------- */
router.put('/orders/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID',
      });
    }

    const { status, memo } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '변경할 상태를 입력해주세요',
      });
    }

    const result = await updateOrderStatus(
      id,
      status,
      memo
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: '주문 상태가 변경되었습니다',
    });
  } catch (error) {
    console.error('주문 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 변경에 실패했습니다',
    });
  }
});

/* ============================================================
 * 씬 관리 API
 * ============================================================ */

/**
 * GET /api/admin/scenes
 * 씬 목록 (필터: category, search)
 */
router.get('/scenes', async (req, res) => {
  try {
    const scenes = await getAdminScenes({
      category: req.query.category,
      search: req.query.search,
    });
    res.json({ success: true, data: scenes });
  } catch (error) {
    console.error('관리자 씬 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '씬 목록을 불러올 수 없습니다',
    });
  }
});

/**
 * GET /api/admin/scenes/:id
 * 씬 상세 + 연결 상품
 */
router.get('/scenes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 씬 ID',
      });
    }

    const scene = await getSceneById(id);
    if (!scene) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다',
      });
    }

    res.json({ success: true, data: scene });
  } catch (error) {
    console.error('씬 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '씬 정보를 불러올 수 없습니다',
    });
  }
});

/**
 * PUT /api/admin/scenes/:id
 * 씬 수정 (title, description 등)
 */
router.put('/scenes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 씬 ID',
      });
    }

    const updated = await updateScene(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다',
      });
    }

    clearCache('scenes:*');
    clearCache('scene:*');

    res.json({
      success: true,
      data: updated,
      message: '씬이 수정되었습니다',
    });
  } catch (error) {
    console.error('씬 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message || '씬 수정에 실패했습니다',
    });
  }
});

/**
 * DELETE /api/admin/scenes/:id
 * 씬 삭제
 */
router.delete('/scenes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 씬 ID',
      });
    }

    await deleteScene(id);
    clearCache('scenes:*');
    clearCache('scene:*');

    res.json({
      success: true,
      message: '씬이 삭제되었습니다',
    });
  } catch (error) {
    console.error('씬 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message:
        error.message || '씬 삭제에 실패했습니다',
    });
  }
});

/**
 * POST /api/admin/scenes/:id/products
 * 씬에 상품 연결
 * body: { productId, sortOrder? }
 */
router.post(
  '/scenes/:id/products',
  async (req, res) => {
    try {
      const sceneId = parseInt(req.params.id);
      const { productId, sortOrder } = req.body;

      if (isNaN(sceneId) || !productId) {
        return res.status(400).json({
          success: false,
          message: '씬 ID와 상품 ID가 필요합니다',
        });
      }

      const link = await linkProductToScene(
        sceneId,
        parseInt(productId),
        sortOrder || 0
      );

      clearCache('scenes:*');
      clearCache('scene:*');

      res.json({
        success: true,
        data: link,
        message: '상품이 연결되었습니다',
      });
    } catch (error) {
      console.error('상품 연결 실패:', error);
      res.status(500).json({
        success: false,
        message:
          error.message
          || '상품 연결에 실패했습니다',
      });
    }
  }
);

/**
 * DELETE /api/admin/scenes/:id/products/:productId
 * 씬에서 상품 연결 해제
 */
router.delete(
  '/scenes/:id/products/:productId',
  async (req, res) => {
    try {
      const sceneId = parseInt(req.params.id);
      const productId = parseInt(req.params.productId);

      if (isNaN(sceneId) || isNaN(productId)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 ID',
        });
      }

      await unlinkProductFromScene(sceneId, productId);
      clearCache('scenes:*');
      clearCache('scene:*');

      res.json({
        success: true,
        message: '상품 연결이 해제되었습니다',
      });
    } catch (error) {
      console.error('상품 연결 해제 실패:', error);
      res.status(500).json({
        success: false,
        message: '상품 연결 해제에 실패했습니다',
      });
    }
  }
);

/**
 * PUT /api/admin/scenes/:id/products/order
 * 씬 내 상품 순서 변경
 * body: { productIds: number[] }
 */
router.put(
  '/scenes/:id/products/order',
  async (req, res) => {
    try {
      const sceneId = parseInt(req.params.id);
      const { productIds } = req.body;

      if (
        isNaN(sceneId)
        || !Array.isArray(productIds)
      ) {
        return res.status(400).json({
          success: false,
          message:
            '씬 ID와 상품 ID 배열이 필요합니다',
        });
      }

      await updateSceneProductOrder(
        sceneId,
        productIds
      );

      clearCache('scenes:*');
      clearCache('scene:*');

      res.json({
        success: true,
        message: '상품 순서가 변경되었습니다',
      });
    } catch (error) {
      console.error('상품 순서 변경 실패:', error);
      res.status(500).json({
        success: false,
        message: '상품 순서 변경에 실패했습니다',
      });
    }
  }
);

/**
 * POST /api/admin/scenes/crawl
 * 씬 페이지 크롤링 (USM Japan에서 연결 상품 수집)
 * body: { sceneIds?: number[] }
 */
router.post('/scenes/crawl', async (req, res) => {
  try {
    const { sceneIds } = req.body;

    let scenes;
    if (sceneIds && Array.isArray(sceneIds)) {
      const all = await getAdminScenes();
      scenes = all.filter((s) =>
        sceneIds.includes(s.id)
      );
    } else {
      scenes = await getAdminScenes();
    }

    if (scenes.length === 0) {
      return res.status(400).json({
        success: false,
        message: '크롤링할 씬이 없습니다',
      });
    }

    const result = await crawlSceneProducts(scenes);

    clearCache('scenes:*');
    clearCache('scene:*');

    res.json({
      success: true,
      data: result,
      message:
        `${result.totalLinked}개 상품이 `
        + `${result.totalScenes}개 씬에 연결되었습니다`,
    });
  } catch (error) {
    console.error('씬 크롤링 실패:', error);
    res.status(500).json({
      success: false,
      message: '씬 크롤링에 실패했습니다',
    });
  }
});

/**
 * POST /api/admin/scenes/migrate
 * sceneImages.json에서 DB로 마이그레이션
 */
router.post('/scenes/migrate', async (req, res) => {
  try {
    const { readFileSync } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');

    const __dirname = dirname(
      fileURLToPath(import.meta.url)
    );
    const jsonPath = resolve(
      __dirname,
      '../../src/data/sceneImages.json'
    );
    const sceneImagesData = JSON.parse(
      readFileSync(jsonPath, 'utf-8')
    );

    const result = await migrateFromJson(
      sceneImagesData
    );

    clearCache('scenes:*');

    res.json({
      success: true,
      data: result,
      message:
        `마이그레이션 완료: ${result.migrated}개 `
        + `생성, ${result.skipped}개 스킵`,
    });
  } catch (error) {
    console.error('씬 마이그레이션 실패:', error);
    res.status(500).json({
      success: false,
      message:
        error.message
        || '마이그레이션에 실패했습니다',
    });
  }
});

export default router;
