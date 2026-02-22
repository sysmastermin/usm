import { getPool, sql } from '../config/db.js';

const BASE_URL = 'https://jp.shop.usm.com';

/**
 * 씬 목록 조회 (카테고리별 그룹)
 * @returns {Object} { living: [...], dining: [...], ... }
 */
export async function getAllScenes() {
  const pool = await getPool();
  const query = `
    SELECT
      s.id, s.scene_category, s.scene_number,
      s.image_url, s.title, s.description,
      s.source_url, s.sort_order,
      (SELECT COUNT(*) FROM [dbo].[scene_product_links]
        WHERE scene_id = s.id) AS product_count
    FROM [dbo].[scenes] s
    ORDER BY s.scene_category, s.sort_order, s.scene_number DESC
  `;
  const result = await pool.request().query(query);

  const grouped = {};
  for (const row of result.recordset) {
    const cat = row.scene_category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(row);
  }
  return grouped;
}

/**
 * 카테고리별 씬 목록
 */
export async function getScenesByCategory(category) {
  const pool = await getPool();
  const request = pool.request();
  request.input('category', sql.NVarChar, category);

  const query = `
    SELECT
      s.id, s.scene_category, s.scene_number,
      s.image_url, s.title, s.description,
      s.source_url, s.sort_order,
      (SELECT COUNT(*) FROM [dbo].[scene_product_links]
        WHERE scene_id = s.id) AS product_count
    FROM [dbo].[scenes] s
    WHERE s.scene_category = @category
    ORDER BY s.sort_order, s.scene_number DESC
  `;
  const result = await request.query(query);
  return result.recordset;
}

/**
 * 씬 ID로 상세 조회 (연결 상품 포함)
 */
export async function getSceneById(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const sceneQuery = `
    SELECT * FROM [dbo].[scenes] WHERE id = @id
  `;
  const sceneResult = await request.query(sceneQuery);
  const scene = sceneResult.recordset[0];
  if (!scene) return null;

  const productsQuery = `
    SELECT
      p.id, p.name_ja, p.name_ko, p.product_code,
      p.price, p.image_url, p.dimensions,
      c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja,
      spl.sort_order AS link_sort_order
    FROM [dbo].[scene_product_links] spl
    JOIN [dbo].[products] p ON spl.product_id = p.id
    LEFT JOIN [dbo].[categories] c ON p.category_id = c.id
    WHERE spl.scene_id = @id
    ORDER BY spl.sort_order, p.name_ja
  `;
  const productsResult = await pool.request()
    .input('id', sql.Int, id)
    .query(productsQuery);

  return {
    ...scene,
    products: productsResult.recordset,
  };
}

/**
 * category + number로 씬 조회 (공개 API용)
 */
export async function getSceneByCategoryAndNumber(
  category,
  number
) {
  const pool = await getPool();
  const request = pool.request();
  request.input('category', sql.NVarChar, category);
  request.input('number', sql.NVarChar, number);

  const sceneQuery = `
    SELECT * FROM [dbo].[scenes]
    WHERE scene_category = @category
      AND scene_number = @number
  `;
  const sceneResult = await request.query(sceneQuery);
  const scene = sceneResult.recordset[0];
  if (!scene) return null;

  const productsQuery = `
    SELECT
      p.id, p.legacy_id, p.name_ja, p.name_ko,
      p.product_code, p.price, p.image_url,
      p.dimensions,
      c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja,
      c.slug AS category_slug,
      spl.sort_order AS link_sort_order
    FROM [dbo].[scene_product_links] spl
    JOIN [dbo].[products] p ON spl.product_id = p.id
    LEFT JOIN [dbo].[categories] c ON p.category_id = c.id
    WHERE spl.scene_id = @sceneId
    ORDER BY spl.sort_order, p.name_ja
  `;
  const productsResult = await pool.request()
    .input('sceneId', sql.Int, scene.id)
    .query(productsQuery);

  return {
    ...scene,
    products: productsResult.recordset,
  };
}

/**
 * 씬 생성
 */
export async function createScene(data) {
  const pool = await getPool();
  const request = pool.request();

  request.input('scene_category', sql.NVarChar, data.scene_category);
  request.input('scene_number', sql.NVarChar, data.scene_number);
  request.input('image_url', sql.NVarChar, data.image_url || null);
  request.input('title', sql.NVarChar, data.title || null);
  request.input('description', sql.NVarChar(sql.MAX), data.description || null);
  request.input(
    'source_url',
    sql.NVarChar,
    data.source_url
      || `${BASE_URL}/collections/scene_${data.scene_number}`
  );
  request.input('sort_order', sql.Int, data.sort_order || 0);

  const query = `
    INSERT INTO [dbo].[scenes]
      (scene_category, scene_number, image_url, title,
       description, source_url, sort_order)
    VALUES
      (@scene_category, @scene_number, @image_url, @title,
       @description, @source_url, @sort_order);

    SELECT * FROM [dbo].[scenes]
    WHERE id = SCOPE_IDENTITY();
  `;

  const result = await request.query(query);
  return result.recordset[0];
}

/**
 * 씬 수정
 */
export async function updateScene(id, fields) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const allowed = {
    title: sql.NVarChar(255),
    description: sql.NVarChar(sql.MAX),
    image_url: sql.NVarChar(500),
    source_url: sql.NVarChar(500),
    sort_order: sql.Int,
    scene_category: sql.NVarChar(50),
    scene_number: sql.NVarChar(20),
  };

  const setClauses = [];
  for (const [key, type] of Object.entries(allowed)) {
    if (fields[key] !== undefined) {
      request.input(key, type, fields[key]);
      setClauses.push(`[${key}] = @${key}`);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('수정할 필드가 없습니다');
  }

  setClauses.push('[updated_at] = GETDATE()');

  const query = `
    UPDATE [dbo].[scenes]
    SET ${setClauses.join(', ')}
    WHERE id = @id;

    SELECT * FROM [dbo].[scenes] WHERE id = @id;
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * 씬 삭제 (CASCADE로 연결 상품도 삭제됨)
 */
export async function deleteScene(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const check = await request.query(
    'SELECT id FROM [dbo].[scenes] WHERE id = @id'
  );
  if (check.recordset.length === 0) {
    throw new Error('씬을 찾을 수 없습니다');
  }

  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM [dbo].[scenes] WHERE id = @id');

  return true;
}

/**
 * 씬에 상품 연결
 */
export async function linkProductToScene(
  sceneId,
  productId,
  sortOrder = 0
) {
  const pool = await getPool();
  const request = pool.request();
  request.input('scene_id', sql.Int, sceneId);
  request.input('product_id', sql.Int, productId);
  request.input('sort_order', sql.Int, sortOrder);

  const query = `
    IF NOT EXISTS (
      SELECT 1 FROM [dbo].[scene_product_links]
      WHERE scene_id = @scene_id AND product_id = @product_id
    )
    BEGIN
      INSERT INTO [dbo].[scene_product_links]
        (scene_id, product_id, sort_order)
      VALUES (@scene_id, @product_id, @sort_order);
    END
    ELSE
    BEGIN
      UPDATE [dbo].[scene_product_links]
      SET sort_order = @sort_order
      WHERE scene_id = @scene_id AND product_id = @product_id;
    END

    SELECT
      spl.id, spl.scene_id, spl.product_id, spl.sort_order,
      p.name_ja, p.name_ko, p.product_code,
      p.price, p.image_url
    FROM [dbo].[scene_product_links] spl
    JOIN [dbo].[products] p ON spl.product_id = p.id
    WHERE spl.scene_id = @scene_id AND spl.product_id = @product_id;
  `;

  const result = await request.query(query);
  return result.recordset[0];
}

/**
 * 씬에서 상품 연결 해제
 */
export async function unlinkProductFromScene(
  sceneId,
  productId
) {
  const pool = await getPool();
  const request = pool.request();
  request.input('scene_id', sql.Int, sceneId);
  request.input('product_id', sql.Int, productId);

  await request.query(`
    DELETE FROM [dbo].[scene_product_links]
    WHERE scene_id = @scene_id AND product_id = @product_id
  `);

  return true;
}

/**
 * 씬 내 상품 순서 일괄 변경
 * @param {number} sceneId
 * @param {number[]} productIds - 순서대로 정렬된 상품 ID 배열
 */
export async function updateSceneProductOrder(
  sceneId,
  productIds
) {
  const pool = await getPool();

  for (let i = 0; i < productIds.length; i++) {
    await pool.request()
      .input('scene_id', sql.Int, sceneId)
      .input('product_id', sql.Int, productIds[i])
      .input('sort_order', sql.Int, i)
      .query(`
        UPDATE [dbo].[scene_product_links]
        SET sort_order = @sort_order
        WHERE scene_id = @scene_id
          AND product_id = @product_id
      `);
  }

  return true;
}

/**
 * 씬에 연결된 상품 목록 조회
 */
export async function getSceneProducts(sceneId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('scene_id', sql.Int, sceneId);

  const query = `
    SELECT
      p.id, p.legacy_id, p.name_ja, p.name_ko,
      p.product_code, p.price, p.image_url,
      p.dimensions,
      c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja,
      spl.sort_order
    FROM [dbo].[scene_product_links] spl
    JOIN [dbo].[products] p ON spl.product_id = p.id
    LEFT JOIN [dbo].[categories] c ON p.category_id = c.id
    WHERE spl.scene_id = @scene_id
    ORDER BY spl.sort_order, p.name_ja
  `;

  const result = await request.query(query);
  return result.recordset;
}

/**
 * 관리자용 씬 목록 (페이지네이션, 필터)
 */
export async function getAdminScenes(options = {}) {
  const pool = await getPool();
  const request = pool.request();

  let where = 'WHERE 1=1';

  if (options.category) {
    request.input('category', sql.NVarChar, options.category);
    where += ' AND s.scene_category = @category';
  }

  if (options.search) {
    request.input('search', sql.NVarChar, `%${options.search}%`);
    where += ' AND (s.title LIKE @search OR s.scene_number LIKE @search)';
  }

  const query = `
    SELECT
      s.id, s.scene_category, s.scene_number,
      s.image_url, s.title, s.description,
      s.source_url, s.sort_order,
      s.created_at, s.updated_at,
      (SELECT COUNT(*) FROM [dbo].[scene_product_links]
        WHERE scene_id = s.id) AS product_count
    FROM [dbo].[scenes] s
    ${where}
    ORDER BY s.scene_category, s.sort_order, s.scene_number DESC
  `;

  const result = await request.query(query);
  return result.recordset;
}

/**
 * sceneImages.json에서 DB로 마이그레이션
 * @param {Object} sceneImagesData - JSON 데이터
 * @returns {{ migrated: number, skipped: number }}
 */
export async function migrateFromJson(sceneImagesData) {
  const pool = await getPool();
  let migrated = 0;
  let skipped = 0;

  for (const [category, images] of Object.entries(sceneImagesData)) {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const request = pool.request();
      request.input('category', sql.NVarChar, category);
      request.input('number', sql.NVarChar, img.id);

      const existing = await request.query(`
        SELECT id FROM [dbo].[scenes]
        WHERE scene_category = @category
          AND scene_number = @number
      `);

      if (existing.recordset.length > 0) {
        skipped++;
        continue;
      }

      const sourceUrl =
        `${BASE_URL}/collections/scene_${img.id}`;

      const insertReq = pool.request();
      insertReq.input('scene_category', sql.NVarChar, category);
      insertReq.input('scene_number', sql.NVarChar, img.id);
      insertReq.input('image_url', sql.NVarChar, img.image);
      insertReq.input('title', sql.NVarChar, img.title);
      insertReq.input('description', sql.NVarChar(sql.MAX), img.description);
      insertReq.input('source_url', sql.NVarChar, sourceUrl);
      insertReq.input('sort_order', sql.Int, i);

      await insertReq.query(`
        INSERT INTO [dbo].[scenes]
          (scene_category, scene_number, image_url,
           title, description, source_url, sort_order)
        VALUES
          (@scene_category, @scene_number, @image_url,
           @title, @description, @source_url, @sort_order)
      `);
      migrated++;
    }
  }

  return { migrated, skipped };
}

/**
 * 모든 씬의 source_url을 올바른 형식으로 일괄 수정
 * scene_{category}{number} → scene_{number} (기본값)
 * 크롤러의 resolveSceneUrl로 실제 접근 가능한 URL 검증
 */
export async function fixAllSourceUrls() {
  const pool = await getPool();
  const result = await pool.request().query(
    'SELECT id, scene_category, scene_number, source_url FROM [dbo].[scenes]'
  );

  let fixed = 0;
  for (const scene of result.recordset) {
    const wrongPattern =
      `${BASE_URL}/collections/scene_${scene.scene_category}${scene.scene_number}`;
    const correctDefault =
      `${BASE_URL}/collections/scene_${scene.scene_number}`;

    if (scene.source_url === wrongPattern) {
      await pool.request()
        .input('id', sql.Int, scene.id)
        .input('url', sql.NVarChar, correctDefault)
        .query(`
          UPDATE [dbo].[scenes]
          SET source_url = @url, updated_at = GETDATE()
          WHERE id = @id
        `);
      fixed++;
    }
  }

  return { total: result.recordset.length, fixed };
}

/**
 * product_code 목록으로 상품 ID 조회 (크롤러용)
 */
export async function findProductsByCode(codes) {
  if (!codes || codes.length === 0) return [];

  const pool = await getPool();
  const request = pool.request();

  const placeholders = codes
    .map((_, i) => `@code${i}`)
    .join(',');
  codes.forEach((code, i) => {
    request.input(`code${i}`, sql.NVarChar, code);
  });

  const query = `
    SELECT id, product_code, name_ja, name_ko
    FROM [dbo].[products]
    WHERE product_code IN (${placeholders})
  `;

  const result = await request.query(query);
  return result.recordset;
}

/**
 * detail_url 패턴으로 상품 검색 (크롤러용)
 */
export async function findProductsByDetailUrlPattern(
  pattern
) {
  const pool = await getPool();
  const request = pool.request();
  request.input('pattern', sql.NVarChar, `%${pattern}%`);

  const query = `
    SELECT id, product_code, detail_url, name_ja, name_ko
    FROM [dbo].[products]
    WHERE detail_url LIKE @pattern
  `;

  const result = await request.query(query);
  return result.recordset;
}
