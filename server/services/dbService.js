import { getPool, sql } from '../config/db.js';

/**
 * 카테고리 테이블 생성 (없는 경우)
 */
export async function createCategoriesTable() {
  const pool = await getPool();
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[categories]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[categories] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name_ja] NVARCHAR(255) NOT NULL,
        [name_ko] NVARCHAR(255) NULL,
        [slug] NVARCHAR(100) NOT NULL UNIQUE,
        [url] NVARCHAR(500) NULL,
        [image_url] NVARCHAR(500) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
      );
      CREATE INDEX IX_categories_slug ON [dbo].[categories]([slug]);
    END
  `;
  await pool.request().query(query);
}

/**
 * 상품 테이블 생성 (없는 경우) + legacy_id 보정
 */
export async function createProductsTable() {
  const pool = await getPool();

  // 1. 테이블이 없으면 생성 (legacy_id 포함)
  const createTableQuery = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[products] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [category_id] INT NULL,
        [name_ja] NVARCHAR(500) NOT NULL,
        [name_ko] NVARCHAR(500) NULL,
        [description_ja] NVARCHAR(MAX) NULL,
        [description_ko] NVARCHAR(MAX) NULL,
        [product_code] NVARCHAR(50) NULL,
        [model_number] NVARCHAR(50) NULL,
        [price] DECIMAL(18,2) NULL,
        [regular_price] DECIMAL(18,2) NULL,
        [sale_price] DECIMAL(18,2) NULL,
        [image_url] NVARCHAR(500) NULL,
        [image_gallery] NVARCHAR(MAX) NULL,
        [detail_url] NVARCHAR(500) NOT NULL,
        [dimensions] NVARCHAR(100) NULL,
        [weight] NVARCHAR(50) NULL,
        [material] NVARCHAR(255) NULL,
        [material_ja] NVARCHAR(255) NULL,
        [material_ko] NVARCHAR(255) NULL,
        [specs] NVARCHAR(MAX) NULL,
        [specs_ja] NVARCHAR(MAX) NULL,
        [specs_ko] NVARCHAR(MAX) NULL,
        [color_options] NVARCHAR(MAX) NULL,
        [scene_images] NVARCHAR(MAX) NULL,
        [special_notes] NVARCHAR(MAX) NULL,
        [rank] INT NULL,
        [badges] NVARCHAR(MAX) NULL,
        [raw_data] NVARCHAR(MAX) NULL,
        [legacy_id] INT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([category_id]) REFERENCES [dbo].[categories]([id]) ON DELETE SET NULL
      );
    END
  `;
  await pool.request().query(createTableQuery);

  // 2. 기본 인덱스 생성 (legacy_id 제외)
  const createIndexesQuery = `
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
    BEGIN
      IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_products_category_id' AND object_id = OBJECT_ID('dbo.products'))
      BEGIN
        CREATE INDEX IX_products_category_id ON [dbo].[products]([category_id]);
      END;

      IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_products_product_code' AND object_id = OBJECT_ID('dbo.products'))
      BEGIN
        CREATE INDEX IX_products_product_code ON [dbo].[products]([product_code]);
      END;

      IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_products_detail_url' AND object_id = OBJECT_ID('dbo.products'))
      BEGIN
        CREATE INDEX IX_products_detail_url ON [dbo].[products]([detail_url]);
      END;
    END
  `;
  await pool.request().query(createIndexesQuery);

  // 3. legacy_id 컬럼 추가 (테이블이 존재하고 컬럼이 없는 경우)
  const addLegacyIdColumnQuery = `
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
    BEGIN
      IF COL_LENGTH('dbo.products', 'legacy_id') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [legacy_id] INT NULL;
      END;
    END
  `;
  await pool.request().query(addLegacyIdColumnQuery);

  // 4. legacy_id 인덱스 생성 (컬럼이 존재하는 경우에만)
  const createLegacyIdIndexQuery = `
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
    BEGIN
      IF COL_LENGTH('dbo.products', 'legacy_id') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_products_legacy_id' AND object_id = OBJECT_ID('dbo.products'))
        BEGIN
          CREATE INDEX IX_products_legacy_id ON [dbo].[products]([legacy_id]);
        END;
      END;
    END
  `;
  await pool.request().query(createLegacyIdIndexQuery);

  // 5. 초기 매핑: legacy_id가 비어있는 경우 id 값으로 매핑
  const updateLegacyIdQuery = `
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
    BEGIN
      IF COL_LENGTH('dbo.products', 'legacy_id') IS NOT NULL
      BEGIN
        UPDATE [dbo].[products]
        SET legacy_id = id
        WHERE legacy_id IS NULL;
      END;
    END
  `;
  await pool.request().query(updateLegacyIdQuery);

  // 6. 새로운 컬럼 추가 (기존 테이블에)
  const addNewColumnsQuery = `
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
    BEGIN
      IF COL_LENGTH('dbo.products', 'model_number') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [model_number] NVARCHAR(50) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'regular_price') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [regular_price] DECIMAL(18,2) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'sale_price') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [sale_price] DECIMAL(18,2) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'image_gallery') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [image_gallery] NVARCHAR(MAX) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'specs') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [specs] NVARCHAR(MAX) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'color_options') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [color_options] NVARCHAR(MAX) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'scene_images') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [scene_images] NVARCHAR(MAX) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'special_notes') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [special_notes] NVARCHAR(MAX) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'material_ja') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [material_ja] NVARCHAR(255) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'material_ko') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [material_ko] NVARCHAR(255) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'specs_ja') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [specs_ja] NVARCHAR(MAX) NULL;
      END;

      IF COL_LENGTH('dbo.products', 'specs_ko') IS NULL
      BEGIN
        ALTER TABLE [dbo].[products] ADD [specs_ko] NVARCHAR(MAX) NULL;
      END;
    END
  `;
  await pool.request().query(addNewColumnsQuery);
}

/**
 * 씬 테이블 생성 (없는 경우)
 */
export async function createScenesTable() {
  const pool = await getPool();
  const query = `
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[scenes]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[scenes] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [scene_category] NVARCHAR(50) NOT NULL,
        [scene_number] NVARCHAR(20) NOT NULL,
        [image_url] NVARCHAR(500) NULL,
        [title] NVARCHAR(255) NULL,
        [description] NVARCHAR(MAX) NULL,
        [source_url] NVARCHAR(500) NULL,
        [sort_order] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
      );
      CREATE UNIQUE INDEX UX_scenes_category_number
        ON [dbo].[scenes]([scene_category], [scene_number]);
      CREATE INDEX IX_scenes_category
        ON [dbo].[scenes]([scene_category]);
    END
  `;
  await pool.request().query(query);
}

/**
 * 씬-상품 연결 테이블 생성 (없는 경우)
 */
export async function createSceneProductLinksTable() {
  const pool = await getPool();
  const query = `
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[scene_product_links]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[scene_product_links] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [scene_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [sort_order] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([scene_id])
          REFERENCES [dbo].[scenes]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([product_id])
          REFERENCES [dbo].[products]([id]) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX UX_scene_product
        ON [dbo].[scene_product_links]([scene_id], [product_id]);
      CREATE INDEX IX_spl_scene_id
        ON [dbo].[scene_product_links]([scene_id]);
      CREATE INDEX IX_spl_product_id
        ON [dbo].[scene_product_links]([product_id]);
    END
  `;
  await pool.request().query(query);
}

/**
 * 카테고리 Upsert
 */
export async function upsertCategory(category) {
  const pool = await getPool();
  const request = pool.request();

  request.input('name_ja', sql.NVarChar, category.name_ja);
  request.input('name_ko', sql.NVarChar, category.name_ko);
  request.input('slug', sql.NVarChar, category.slug);
  request.input('url', sql.NVarChar, category.url);
  request.input('image_url', sql.NVarChar, category.image_url);

  const query = `
    MERGE [dbo].[categories] AS target
    USING (SELECT @slug AS slug) AS source
    ON target.slug = source.slug
    WHEN MATCHED THEN
      UPDATE SET
        name_ja = @name_ja,
        name_ko = @name_ko,
        url = @url,
        image_url = @image_url,
        updated_at = GETDATE()
    WHEN NOT MATCHED THEN
      INSERT (name_ja, name_ko, slug, url, image_url)
      VALUES (@name_ja, @name_ko, @slug, @url, @image_url);

    SELECT id FROM [dbo].[categories] WHERE slug = @slug;
  `;

  const result = await request.query(query);
  return result.recordset[0]?.id;
}

/**
 * 상품 Upsert
 */
export async function upsertProduct(product, categoryId) {
  const pool = await getPool();
  const request = pool.request();

  request.input('category_id', sql.Int, categoryId);
  request.input('name_ja', sql.NVarChar, product.name_ja);
  request.input('name_ko', sql.NVarChar, product.name_ko);
  request.input('description_ja', sql.NVarChar(sql.MAX), product.description_ja);
  request.input('description_ko', sql.NVarChar(sql.MAX), product.description_ko);
  request.input('product_code', sql.NVarChar, product.product_code);
  request.input('model_number', sql.NVarChar, product.model_number);
  request.input('price', sql.Decimal(18, 2), product.price ? parseFloat(product.price) : null);
  request.input('regular_price', sql.Decimal(18, 2), product.regular_price ? parseFloat(product.regular_price) : null);
  request.input('sale_price', sql.Decimal(18, 2), product.sale_price ? parseFloat(product.sale_price) : null);
  request.input('image_url', sql.NVarChar, product.image_url);
  request.input('image_gallery', sql.NVarChar(sql.MAX), product.image_gallery ? JSON.stringify(product.image_gallery) : null);
  request.input('detail_url', sql.NVarChar, product.detail_url);
  request.input('dimensions', sql.NVarChar, product.dimensions);
  request.input('weight', sql.NVarChar, product.weight);
  request.input('material', sql.NVarChar, product.material);
  request.input('material_ja', sql.NVarChar, product.material_ja);
  request.input('material_ko', sql.NVarChar, product.material_ko);
  request.input('specs', sql.NVarChar(sql.MAX), product.specs ? JSON.stringify(product.specs) : null);
  request.input('specs_ja', sql.NVarChar(sql.MAX), product.specs_ja ? JSON.stringify(product.specs_ja) : null);
  request.input('specs_ko', sql.NVarChar(sql.MAX), product.specs_ko ? JSON.stringify(product.specs_ko) : null);
  request.input('color_options', sql.NVarChar(sql.MAX), product.color_options ? JSON.stringify(product.color_options) : null);
  request.input('scene_images', sql.NVarChar(sql.MAX), product.scene_images ? JSON.stringify(product.scene_images) : null);
  request.input('special_notes', sql.NVarChar(sql.MAX), product.special_notes ? JSON.stringify(product.special_notes) : null);
  request.input('rank', sql.Int, product.rank);
  request.input('badges', sql.NVarChar(sql.MAX), product.badges ? JSON.stringify(product.badges) : null);
  request.input('raw_data', sql.NVarChar(sql.MAX), product.raw_data ? JSON.stringify(product.raw_data) : null);

  const query = `
    MERGE [dbo].[products] AS target
    USING (SELECT @detail_url AS detail_url) AS source
    ON target.detail_url = source.detail_url
    WHEN MATCHED THEN
      UPDATE SET
        category_id = @category_id,
        name_ja = @name_ja,
        name_ko = @name_ko,
        description_ja = @description_ja,
        description_ko = @description_ko,
        product_code = @product_code,
        model_number = @model_number,
        price = @price,
        regular_price = @regular_price,
        sale_price = @sale_price,
        image_url = @image_url,
        image_gallery = @image_gallery,
        dimensions = @dimensions,
        weight = @weight,
        material = @material,
        material_ja = @material_ja,
        material_ko = @material_ko,
        specs = @specs,
        specs_ja = @specs_ja,
        specs_ko = @specs_ko,
        color_options = @color_options,
        scene_images = @scene_images,
        special_notes = @special_notes,
        rank = @rank,
        badges = @badges,
        raw_data = @raw_data,
        updated_at = GETDATE()
    WHEN NOT MATCHED THEN
      INSERT (category_id, name_ja, name_ko, description_ja, description_ko, product_code, model_number, price, regular_price, sale_price, image_url, image_gallery, detail_url, dimensions, weight, material, material_ja, material_ko, specs, specs_ja, specs_ko, color_options, scene_images, special_notes, rank, badges, raw_data)
      VALUES (@category_id, @name_ja, @name_ko, @description_ja, @description_ko, @product_code, @model_number, @price, @regular_price, @sale_price, @image_url, @image_gallery, @detail_url, @dimensions, @weight, @material, @material_ja, @material_ko, @specs, @specs_ja, @specs_ko, @color_options, @scene_images, @special_notes, @rank, @badges, @raw_data);

    SELECT id FROM [dbo].[products] WHERE detail_url = @detail_url;
  `;

  const result = await request.query(query);
  return result.recordset[0]?.id;
}

/**
 * 크롤링 결과를 DB에 저장
 */
export async function saveCrawlResult(crawlResult) {
  const pool = await getPool();

  try {
    // 테이블 생성
    await createCategoriesTable();
    await createProductsTable();
    await createScenesTable();
    await createSceneProductLinksTable();

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const categoryMap = new Map();

      // 카테고리 저장
      for (const category of crawlResult.categories) {
        const categoryId = await upsertCategory(category);
        categoryMap.set(category.slug, categoryId);
      }

      // 상품 저장
      for (const product of crawlResult.products) {
        const categoryId = categoryMap.get(product.category_slug);
        await upsertProduct(product, categoryId);
      }

      await transaction.commit();

      return {
        categoriesSaved: crawlResult.categories.length,
        productsSaved: crawlResult.products.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('DB 저장 실패:', error);
    throw error;
  }
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories() {
  const pool = await getPool();
  const query = `
    SELECT
      c.id, c.name_ja, c.name_ko, c.slug, c.url,
      COALESCE(c.image_url, p_first.image_url) AS image_url,
      p_first.image_url AS product_image_url,
      c.created_at, c.updated_at
    FROM [dbo].[categories] c
    OUTER APPLY (
      SELECT TOP 1 p.image_url
      FROM [dbo].[products] p
      WHERE p.category_id = c.id
        AND p.image_url IS NOT NULL
      ORDER BY p.rank DESC, p.id
    ) p_first
    ORDER BY c.name_ja
  `;
  const result = await pool.request().query(query);
  return result.recordset;
}

/**
 * slug로 카테고리 조회 (번역 확인용)
 */
export async function getCategoryBySlug(slug) {
  const pool = await getPool();
  const request = pool.request();
  request.input('slug', sql.NVarChar, slug);

  const query = `
    SELECT name_ja, name_ko, slug
    FROM [dbo].[categories]
    WHERE slug = @slug
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * detail_url로 상품 조회 (번역 확인용)
 */
export async function getProductByDetailUrl(detailUrl) {
  const pool = await getPool();
  const request = pool.request();
  request.input('detailUrl', sql.NVarChar, detailUrl);

  const query = `
    SELECT
      name_ja, name_ko,
      description_ja, description_ko,
      material, material_ja, material_ko,
      specs, specs_ja, specs_ko,
      color_options,
      detail_url
    FROM [dbo].[products]
    WHERE detail_url = @detailUrl
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * 상품 목록 조회 (필터링 지원)
 */
export async function getProducts(filters = {}) {
  const pool = await getPool();
  const request = pool.request();

  // 목록 조회 시 불필요한 대용량 컬럼(description) 제외하여 응답 크기 축소
  let query = `
    SELECT
      p.id, p.category_id, p.legacy_id,
      p.name_ja, p.name_ko,
      p.product_code, p.price, p.image_url,
      p.rank, p.badges,
      c.name_ja AS category_name_ja,
      c.name_ko AS category_name_ko,
      c.slug AS category_slug
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c ON p.category_id = c.id
    WHERE 1=1
  `;

  if (filters.categoryId) {
    request.input('categoryId', sql.Int, filters.categoryId);
    query += ' AND p.category_id = @categoryId';
  }

  if (filters.categorySlug) {
    request.input('categorySlug', sql.NVarChar, filters.categorySlug);
    query += ' AND c.slug = @categorySlug';
  }

  if (filters.search) {
    request.input('search', sql.NVarChar, `%${filters.search}%`);
    query += ' AND (p.name_ja LIKE @search OR p.name_ko LIKE @search OR p.product_code LIKE @search)';
  }

  query += ' ORDER BY p.rank DESC, p.name_ja';

  // 기본 limit 100 적용 (전체 목록 무제한 조회 방지)
  const limit = filters.limit || 100;
  request.input('limit', sql.Int, limit);
  query += ' OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY';

  const result = await request.query(query);
  return result.recordset;
}

/**
 * 상품 상세 조회
 */
export async function getProductById(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const query = `
    SELECT
      p.*,
      c.name_ja AS category_name_ja, c.name_ko AS category_name_ko, c.slug AS category_slug
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c ON p.category_id = c.id
    WHERE p.id = @id
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * legacy_id로 상품 상세 조회
 */
export async function getProductByLegacyId(legacyId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('legacyId', sql.Int, legacyId);

  const query = `
    SELECT
      p.*,
      c.name_ja AS category_name_ja, c.name_ko AS category_name_ko, c.slug AS category_slug
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c ON p.category_id = c.id
    WHERE p.legacy_id = @legacyId
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/* ============================================================
 * 관리자 전용 DB 서비스 함수
 * ============================================================ */

/**
 * 대시보드 통계 조회
 * - 전체 상품 수, 카테고리 수, 번역 완료율, 이미지 보유율
 * - 최근 추가된 상품 5개
 */
export async function getDashboardStats() {
  const pool = await getPool();

  const statsQuery = `
    SELECT
      (SELECT COUNT(*) FROM [dbo].[products])
        AS totalProducts,
      (SELECT COUNT(*) FROM [dbo].[categories])
        AS totalCategories,
      (SELECT COUNT(*) FROM [dbo].[products]
        WHERE name_ko IS NOT NULL
          AND LEN(name_ko) > 0)
        AS translatedProducts,
      (SELECT COUNT(*) FROM [dbo].[products]
        WHERE image_url IS NOT NULL
          AND LEN(image_url) > 0)
        AS productsWithImage,
      (SELECT COUNT(*) FROM [dbo].[orders])
        AS totalOrders,
      (SELECT COUNT(*) FROM [dbo].[orders]
        WHERE status = 'pending')
        AS pendingOrders,
      (SELECT ISNULL(SUM(total_amount), 0)
        FROM [dbo].[orders]
        WHERE status != 'cancelled')
        AS totalRevenue,
      (SELECT COUNT(*) FROM [dbo].[orders]
        WHERE CAST(created_at AS DATE)
          = CAST(GETDATE() AS DATE))
        AS todayOrders
  `;

  const recentProductsQuery = `
    SELECT TOP 5
      p.id, p.name_ja, p.name_ko, p.image_url,
      p.price, p.created_at, p.updated_at,
      c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c
      ON p.category_id = c.id
    ORDER BY p.updated_at DESC
  `;

  const recentOrdersQuery = `
    SELECT TOP 5
      o.id, o.order_number, o.total_amount,
      o.status, o.recipient_name, o.created_at,
      u.name AS user_name
    FROM [dbo].[orders] o
    JOIN [dbo].[users] u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  const [statsResult, recentProductsResult, recentOrdersResult] =
    await Promise.all([
      pool.request().query(statsQuery),
      pool.request().query(recentProductsQuery),
      pool.request().query(recentOrdersQuery),
    ]);

  const stats = statsResult.recordset[0];
  const total = stats.totalProducts || 1;

  return {
    totalProducts: stats.totalProducts,
    totalCategories: stats.totalCategories,
    translationRate: Math.round(
      (stats.translatedProducts / total) * 100
    ),
    imageRate: Math.round(
      (stats.productsWithImage / total) * 100
    ),
    totalOrders: stats.totalOrders,
    pendingOrders: stats.pendingOrders,
    totalRevenue: stats.totalRevenue,
    todayOrders: stats.todayOrders,
    recentProducts: recentProductsResult.recordset,
    recentOrders: recentOrdersResult.recordset,
  };
}

/**
 * 관리자 상품 목록 조회 (서버사이드 페이지네이션)
 * COUNT(*) OVER() 윈도우 함수로 1회 쿼리에 데이터+총수 반환
 */
export async function getAdminProducts(options = {}) {
  const pool = await getPool();
  const request = pool.request();

  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(options.limit) || 20)
  );
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';

  if (options.search) {
    request.input(
      'search',
      sql.NVarChar,
      `%${options.search}%`
    );
    where +=
      ' AND (p.name_ja LIKE @search'
      + ' OR p.name_ko LIKE @search'
      + ' OR p.product_code LIKE @search)';
  }

  if (options.categoryId) {
    request.input(
      'categoryId',
      sql.Int,
      parseInt(options.categoryId)
    );
    where += ' AND p.category_id = @categoryId';
  }

  if (options.untranslated === 'true') {
    where +=
      ' AND (p.name_ko IS NULL OR LEN(p.name_ko) = 0)';
  }

  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  const query = `
    SELECT
      p.id, p.category_id, p.legacy_id,
      p.name_ja, p.name_ko,
      p.product_code, p.price, p.image_url,
      p.created_at, p.updated_at,
      c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja,
      c.slug AS category_slug,
      CASE
        WHEN p.name_ko IS NOT NULL
          AND LEN(p.name_ko) > 0
        THEN 1 ELSE 0
      END AS is_translated,
      COUNT(*) OVER() AS total_count
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c
      ON p.category_id = c.id
    ${where}
    ORDER BY p.updated_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  const result = await request.query(query);
  const total =
    result.recordset[0]?.total_count || 0;

  return {
    items: result.recordset.map(
      ({ total_count, ...rest }) => rest
    ),
    meta: { page, limit, total },
  };
}

/**
 * 관리자 상품 수정
 * - 화이트리스트 방식으로 허용된 필드만 업데이트
 */
const PRODUCT_UPDATABLE_FIELDS = [
  'name_ja', 'name_ko',
  'description_ja', 'description_ko',
  'product_code', 'model_number',
  'price', 'regular_price', 'sale_price',
  'image_url', 'image_gallery',
  'dimensions', 'weight',
  'material', 'material_ja', 'material_ko',
  'specs', 'specs_ja', 'specs_ko',
  'color_options', 'scene_images',
  'special_notes', 'rank', 'badges',
  'category_id',
];

/** 필드 타입 매핑 */
const PRODUCT_FIELD_TYPES = {
  name_ja: sql.NVarChar(500),
  name_ko: sql.NVarChar(500),
  description_ja: sql.NVarChar(sql.MAX),
  description_ko: sql.NVarChar(sql.MAX),
  product_code: sql.NVarChar(50),
  model_number: sql.NVarChar(50),
  price: sql.Decimal(18, 2),
  regular_price: sql.Decimal(18, 2),
  sale_price: sql.Decimal(18, 2),
  image_url: sql.NVarChar(500),
  image_gallery: sql.NVarChar(sql.MAX),
  dimensions: sql.NVarChar(100),
  weight: sql.NVarChar(50),
  material: sql.NVarChar(255),
  material_ja: sql.NVarChar(255),
  material_ko: sql.NVarChar(255),
  specs: sql.NVarChar(sql.MAX),
  specs_ja: sql.NVarChar(sql.MAX),
  specs_ko: sql.NVarChar(sql.MAX),
  color_options: sql.NVarChar(sql.MAX),
  scene_images: sql.NVarChar(sql.MAX),
  special_notes: sql.NVarChar(sql.MAX),
  rank: sql.Int,
  badges: sql.NVarChar(sql.MAX),
  category_id: sql.Int,
};

export async function updateProduct(id, fields) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const setClauses = [];

  for (const key of PRODUCT_UPDATABLE_FIELDS) {
    if (fields[key] !== undefined) {
      let value = fields[key];

      // JSON 필드는 stringify
      if (
        typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
      ) {
        value = JSON.stringify(value);
      }
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      // 숫자 타입 변환
      if (
        ['price', 'regular_price', 'sale_price'].includes(
          key
        )
      ) {
        value =
          value !== null && value !== ''
            ? parseFloat(value)
            : null;
      }
      if (['rank', 'category_id'].includes(key)) {
        value =
          value !== null && value !== ''
            ? parseInt(value)
            : null;
      }

      request.input(
        key,
        PRODUCT_FIELD_TYPES[key] || sql.NVarChar(500),
        value
      );
      setClauses.push(`[${key}] = @${key}`);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('수정할 필드가 없습니다');
  }

  setClauses.push('[updated_at] = GETDATE()');

  const query = `
    UPDATE [dbo].[products]
    SET ${setClauses.join(', ')}
    WHERE id = @id;

    SELECT p.*, c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja,
      c.slug AS category_slug
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c
      ON p.category_id = c.id
    WHERE p.id = @id;
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * 관리자 상품 삭제
 */
export async function deleteProduct(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  // 존재 확인
  const check = await request.query(
    'SELECT id FROM [dbo].[products] WHERE id = @id'
  );
  if (check.recordset.length === 0) {
    throw new Error('상품을 찾을 수 없습니다');
  }

  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM [dbo].[products] WHERE id = @id');

  return true;
}

/**
 * 관리자 상품 등록 (수동)
 * - 화이트리스트 방식으로 허용된 필드만 INSERT
 * - detail_url은 수동 등록용 고유값 자동 생성
 */
export async function createProduct(fields) {
  if (!fields.name_ja || fields.name_ja.trim() === '') {
    throw new Error(
      '상품명(일본어)은 필수 입력입니다'
    );
  }

  const pool = await getPool();
  const request = pool.request();

  const detailUrl =
    `manual://${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  request.input(
    'detail_url', sql.NVarChar(500), detailUrl
  );

  const columns = ['detail_url'];
  const values = ['@detail_url'];

  for (const key of PRODUCT_UPDATABLE_FIELDS) {
    if (fields[key] !== undefined) {
      let value = fields[key];

      if (
        typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
      ) {
        value = JSON.stringify(value);
      }
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      if (
        ['price', 'regular_price', 'sale_price']
          .includes(key)
      ) {
        value =
          value !== null && value !== ''
            ? parseFloat(value)
            : null;
      }
      if (['rank', 'category_id'].includes(key)) {
        value =
          value !== null && value !== ''
            ? parseInt(value)
            : null;
      }

      request.input(
        key,
        PRODUCT_FIELD_TYPES[key] || sql.NVarChar(500),
        value
      );
      columns.push(`[${key}]`);
      values.push(`@${key}`);
    }
  }

  const query = `
    INSERT INTO [dbo].[products]
      (${columns.join(', ')})
    VALUES
      (${values.join(', ')});

    SELECT p.*, c.name_ko AS category_name_ko,
      c.name_ja AS category_name_ja,
      c.slug AS category_slug
    FROM [dbo].[products] p
    LEFT JOIN [dbo].[categories] c
      ON p.category_id = c.id
    WHERE p.id = SCOPE_IDENTITY();
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * 관리자 카테고리 목록 (소속 상품 수 포함)
 */
export async function getAdminCategories() {
  const pool = await getPool();

  const query = `
    SELECT
      c.id, c.name_ja, c.name_ko, c.slug,
      c.url, c.image_url,
      c.created_at, c.updated_at,
      (SELECT COUNT(*) FROM [dbo].[products]
        WHERE category_id = c.id) AS product_count
    FROM [dbo].[categories] c
    ORDER BY c.name_ja
  `;

  const result = await pool.request().query(query);
  return result.recordset;
}

/**
 * 관리자 카테고리 수정
 */
export async function updateCategory(id, fields) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const setClauses = [];
  const allowed = [
    'name_ja', 'name_ko', 'slug', 'image_url',
  ];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      request.input(key, sql.NVarChar(500), fields[key]);
      setClauses.push(`[${key}] = @${key}`);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('수정할 필드가 없습니다');
  }

  setClauses.push('[updated_at] = GETDATE()');

  const query = `
    UPDATE [dbo].[categories]
    SET ${setClauses.join(', ')}
    WHERE id = @id;

    SELECT c.*,
      (SELECT COUNT(*) FROM [dbo].[products]
        WHERE category_id = c.id) AS product_count
    FROM [dbo].[categories] c
    WHERE c.id = @id;
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * 관리자 카테고리 삭제
 * - 소속 상품이 있으면 삭제 불가
 */
export async function deleteCategory(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  // 소속 상품 수 확인
  const countResult = await request.query(
    `SELECT COUNT(*) AS cnt
     FROM [dbo].[products]
     WHERE category_id = @id`
  );

  if (countResult.recordset[0].cnt > 0) {
    throw new Error(
      `이 카테고리에 ${countResult.recordset[0].cnt}개의 상품이 있습니다. 먼저 상품을 삭제하거나 이동해주세요.`
    );
  }

  await pool.request()
    .input('id', sql.Int, id)
    .query(
      'DELETE FROM [dbo].[categories] WHERE id = @id'
    );

  return true;
}

/**
 * 미번역 항목 조회 (서버사이드 페이지네이션)
 * @param {'product'|'category'} type
 */
export async function getUntranslated(options = {}) {
  const pool = await getPool();
  const request = pool.request();

  const type = options.type || 'product';
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(options.limit) || 20)
  );
  const offset = (page - 1) * limit;

  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  let query;

  if (type === 'category') {
    query = `
      SELECT
        id, name_ja, name_ko, slug,
        COUNT(*) OVER() AS total_count
      FROM [dbo].[categories]
      WHERE name_ko IS NULL OR LEN(name_ko) = 0
      ORDER BY name_ja
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
  } else {
    query = `
      SELECT
        p.id, p.name_ja, p.name_ko,
        p.description_ja, p.description_ko,
        p.material_ja, p.material_ko,
        p.image_url,
        c.name_ko AS category_name_ko,
        c.name_ja AS category_name_ja,
        COUNT(*) OVER() AS total_count
      FROM [dbo].[products] p
      LEFT JOIN [dbo].[categories] c
        ON p.category_id = c.id
      WHERE p.name_ko IS NULL
        OR LEN(p.name_ko) = 0
        OR p.description_ko IS NULL
        OR LEN(p.description_ko) = 0
      ORDER BY p.name_ja
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
  }

  const result = await request.query(query);
  const total =
    result.recordset[0]?.total_count || 0;

  return {
    items: result.recordset.map(
      ({ total_count, ...rest }) => rest
    ),
    meta: { page, limit, total, type },
  };
}

/**
 * 번역 대상 상품/카테고리 원문 조회
 * (일괄 번역 시 사용)
 */
export async function getItemsForTranslation(
  ids,
  type = 'product'
) {
  const pool = await getPool();

  if (!ids || ids.length === 0) return [];

  // IN 절에 직접 ID 바인딩 (parameterized)
  const idList = ids
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id));

  if (idList.length === 0) return [];

  // mssql에서 IN절 파라미터 바인딩
  const placeholders = idList
    .map((_, i) => `@id${i}`)
    .join(',');

  const request = pool.request();
  idList.forEach((id, i) => {
    request.input(`id${i}`, sql.Int, id);
  });

  let query;
  if (type === 'category') {
    query = `
      SELECT id, name_ja, name_ko
      FROM [dbo].[categories]
      WHERE id IN (${placeholders})
    `;
  } else {
    query = `
      SELECT id, name_ja, name_ko,
        description_ja, description_ko,
        material_ja, material_ko
      FROM [dbo].[products]
      WHERE id IN (${placeholders})
    `;
  }

  const result = await request.query(query);
  return result.recordset;
}

/**
 * 번역 결과 저장 (상품)
 */
export async function saveProductTranslation(
  id,
  translations
) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);

  const setClauses = [];

  if (translations.name_ko !== undefined) {
    request.input(
      'name_ko',
      sql.NVarChar(500),
      translations.name_ko
    );
    setClauses.push('[name_ko] = @name_ko');
  }
  if (translations.description_ko !== undefined) {
    request.input(
      'description_ko',
      sql.NVarChar(sql.MAX),
      translations.description_ko
    );
    setClauses.push(
      '[description_ko] = @description_ko'
    );
  }
  if (translations.material_ko !== undefined) {
    request.input(
      'material_ko',
      sql.NVarChar(255),
      translations.material_ko
    );
    setClauses.push('[material_ko] = @material_ko');
  }

  if (setClauses.length === 0) return null;

  setClauses.push('[updated_at] = GETDATE()');

  await request.query(`
    UPDATE [dbo].[products]
    SET ${setClauses.join(', ')}
    WHERE id = @id
  `);

  return true;
}

/**
 * 번역 결과 저장 (카테고리)
 */
export async function saveCategoryTranslation(
  id,
  nameKo
) {
  const pool = await getPool();
  const request = pool.request();
  request.input('id', sql.Int, id);
  request.input('name_ko', sql.NVarChar(255), nameKo);

  await request.query(`
    UPDATE [dbo].[categories]
    SET [name_ko] = @name_ko,
        [updated_at] = GETDATE()
    WHERE id = @id
  `);

  return true;
}
