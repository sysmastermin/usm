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
    SELECT id, name_ja, name_ko, slug, url, image_url, created_at, updated_at
    FROM [dbo].[categories]
    ORDER BY name_ja
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
  
  let query = `
    SELECT 
      p.id, p.category_id, p.legacy_id, p.name_ja, p.name_ko, p.description_ja, p.description_ko,
      p.product_code, p.price, p.image_url, p.detail_url, p.dimensions, p.weight, p.material,
      p.rank, p.badges, p.created_at, p.updated_at,
      c.name_ja AS category_name_ja, c.name_ko AS category_name_ko, c.slug AS category_slug
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

  if (filters.limit) {
    request.input('limit', sql.Int, filters.limit);
    query += ' OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY';
  }

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
