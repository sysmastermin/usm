import { getPool, sql } from '../config/db.js';

/* ============================================================
 * 테이블 마이그레이션
 * ============================================================ */

/**
 * 쇼핑몰 테이블 5개 생성 (없는 경우)
 * users, cart_items, orders, order_items, wishlist
 */
export async function createShopTables() {
  const pool = await getPool();

  // 1. users
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[users]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[users] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [email] NVARCHAR(255) NOT NULL UNIQUE,
        [password_hash] NVARCHAR(255) NOT NULL,
        [name] NVARCHAR(100) NOT NULL,
        [phone] NVARCHAR(20) NULL,
        [zipcode] NVARCHAR(10) NULL,
        [address] NVARCHAR(500) NULL,
        [address_detail] NVARCHAR(200) NULL,
        [birth_date] DATE NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
      );
      CREATE INDEX IX_users_email
        ON [dbo].[users]([email]);
    END
  `);

  // 2. cart_items
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[cart_items]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[cart_items] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [quantity] INT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_cart_user
          FOREIGN KEY ([user_id])
          REFERENCES [dbo].[users]([id]),
        CONSTRAINT FK_cart_product
          FOREIGN KEY ([product_id])
          REFERENCES [dbo].[products]([id])
          ON DELETE CASCADE,
        CONSTRAINT UQ_cart_user_product
          UNIQUE ([user_id], [product_id]),
        CONSTRAINT CK_cart_quantity
          CHECK ([quantity] > 0 AND [quantity] <= 99)
      );
      CREATE INDEX IX_cart_user
        ON [dbo].[cart_items]([user_id]);
    END
  `);

  // 3. orders
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[orders]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[orders] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [order_number] NVARCHAR(30) NOT NULL UNIQUE,
        [total_amount] DECIMAL(18,2) NOT NULL,
        [status] NVARCHAR(20) NOT NULL
          DEFAULT 'pending',
        [recipient_name] NVARCHAR(100) NOT NULL,
        [recipient_phone] NVARCHAR(20) NOT NULL,
        [zipcode] NVARCHAR(10) NOT NULL,
        [address] NVARCHAR(500) NOT NULL,
        [address_detail] NVARCHAR(200) NULL,
        [memo] NVARCHAR(500) NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_orders_user
          FOREIGN KEY ([user_id])
          REFERENCES [dbo].[users]([id])
      );
      CREATE INDEX IX_orders_user
        ON [dbo].[orders]([user_id]);
      CREATE INDEX IX_orders_number
        ON [dbo].[orders]([order_number]);
    END
  `);

  // 4. order_items
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[order_items]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[order_items] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [order_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [product_name] NVARCHAR(500) NOT NULL,
        [product_image] NVARCHAR(500) NULL,
        [price] DECIMAL(18,2) NOT NULL,
        [quantity] INT NOT NULL,
        CONSTRAINT FK_order_items_order
          FOREIGN KEY ([order_id])
          REFERENCES [dbo].[orders]([id])
          ON DELETE CASCADE
      );
      CREATE INDEX IX_order_items_order
        ON [dbo].[order_items]([order_id]);
    END
  `);

  // 5. wishlist
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[wishlist]')
        AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[wishlist] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_wishlist_user
          FOREIGN KEY ([user_id])
          REFERENCES [dbo].[users]([id]),
        CONSTRAINT FK_wishlist_product
          FOREIGN KEY ([product_id])
          REFERENCES [dbo].[products]([id])
          ON DELETE CASCADE,
        CONSTRAINT UQ_wishlist_user_product
          UNIQUE ([user_id], [product_id])
      );
      CREATE INDEX IX_wishlist_user
        ON [dbo].[wishlist]([user_id]);
    END
  `);
}

/* ============================================================
 * Users CRUD
 * ============================================================ */

/**
 * 회원 생성
 * @returns {object} 생성된 사용자 (password_hash 제외)
 */
export async function createUser({
  email,
  passwordHash,
  name,
  phone,
  zipcode,
  address,
  addressDetail,
  birthDate,
}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), email)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('name', sql.NVarChar(100), name)
    .input('phone', sql.NVarChar(20), phone || null)
    .input('zipcode', sql.NVarChar(10), zipcode || null)
    .input('address', sql.NVarChar(500), address || null)
    .input(
      'addressDetail',
      sql.NVarChar(200),
      addressDetail || null
    )
    .input('birthDate', sql.Date, birthDate || null)
    .query(`
      INSERT INTO users
        (email, password_hash, name, phone,
         zipcode, address, address_detail, birth_date)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.name,
             INSERTED.phone, INSERTED.created_at
      VALUES
        (@email, @passwordHash, @name, @phone,
         @zipcode, @address, @addressDetail, @birthDate)
    `);
  return result.recordset[0];
}

/**
 * 이메일로 사용자 조회 (로그인용, password_hash 포함)
 */
export async function getUserByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), email)
    .query(`
      SELECT id, email, password_hash, name, phone,
             zipcode, address, address_detail, birth_date,
             created_at, updated_at
      FROM users
      WHERE email = @email
    `);
  return result.recordset[0] || null;
}

/**
 * ID로 사용자 조회 (프로필용, password_hash 제외)
 */
export async function getUserById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id, email, name, phone,
             zipcode, address, address_detail, birth_date,
             created_at, updated_at
      FROM users
      WHERE id = @id
    `);
  return result.recordset[0] || null;
}

/**
 * 프로필 수정
 */
export async function updateUserProfile(id, fields) {
  const pool = await getPool();
  const req = pool.request().input('id', sql.Int, id);

  const sets = ['updated_at = GETDATE()'];
  if (fields.name !== undefined) {
    req.input('name', sql.NVarChar(100), fields.name);
    sets.push('name = @name');
  }
  if (fields.phone !== undefined) {
    req.input('phone', sql.NVarChar(20), fields.phone);
    sets.push('phone = @phone');
  }
  if (fields.zipcode !== undefined) {
    req.input('zipcode', sql.NVarChar(10), fields.zipcode);
    sets.push('zipcode = @zipcode');
  }
  if (fields.address !== undefined) {
    req.input(
      'address', sql.NVarChar(500), fields.address
    );
    sets.push('address = @address');
  }
  if (fields.addressDetail !== undefined) {
    req.input(
      'addressDetail',
      sql.NVarChar(200),
      fields.addressDetail
    );
    sets.push('address_detail = @addressDetail');
  }
  if (fields.birthDate !== undefined) {
    req.input('birthDate', sql.Date, fields.birthDate);
    sets.push('birth_date = @birthDate');
  }

  await req.query(`
    UPDATE users SET ${sets.join(', ')} WHERE id = @id
  `);
}

/**
 * 비밀번호 변경
 */
export async function updateUserPassword(id, newHash) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('hash', sql.NVarChar(255), newHash)
    .query(`
      UPDATE users
      SET password_hash = @hash, updated_at = GETDATE()
      WHERE id = @id
    `);
}

/* ============================================================
 * Cart CRUD
 * ============================================================ */

/**
 * 장바구니 조회 (상품 정보 JOIN)
 */
export async function getCartItems(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        c.id, c.product_id, c.quantity, c.created_at,
        p.name_ko, p.name_ja, p.price, p.image_url,
        p.product_code
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = @userId
      ORDER BY c.created_at DESC
    `);
  return result.recordset;
}

/**
 * 장바구니 총 수량
 */
export async function getCartCount(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT ISNULL(SUM(quantity), 0) AS count
      FROM cart_items
      WHERE user_id = @userId
    `);
  return result.recordset[0].count;
}

/**
 * 장바구니 추가 (UPSERT: 이미 있으면 수량 증가)
 */
export async function addToCart(userId, productId, qty) {
  const pool = await getPool();
  const quantity = qty || 1;

  // MERGE로 UPSERT 구현
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .input('qty', sql.Int, quantity)
    .query(`
      MERGE cart_items AS target
      USING (
        SELECT @userId AS user_id,
               @productId AS product_id
      ) AS source
      ON target.user_id = source.user_id
        AND target.product_id = source.product_id
      WHEN MATCHED THEN
        UPDATE SET
          quantity = CASE
            WHEN target.quantity + @qty > 99 THEN 99
            ELSE target.quantity + @qty
          END
      WHEN NOT MATCHED THEN
        INSERT (user_id, product_id, quantity)
        VALUES (@userId, @productId, @qty)
      OUTPUT INSERTED.id, INSERTED.quantity;
    `);
  return result.recordset[0];
}

/**
 * 장바구니 수량 변경
 */
export async function updateCartQuantity(
  cartItemId,
  userId,
  quantity
) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, cartItemId)
    .input('userId', sql.Int, userId)
    .input('qty', sql.Int, quantity)
    .query(`
      UPDATE cart_items
      SET quantity = @qty
      WHERE id = @id AND user_id = @userId
    `);
  return result.rowsAffected[0] > 0;
}

/**
 * 장바구니 단일 삭제
 */
export async function removeCartItem(cartItemId, userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, cartItemId)
    .input('userId', sql.Int, userId)
    .query(`
      DELETE FROM cart_items
      WHERE id = @id AND user_id = @userId
    `);
  return result.rowsAffected[0] > 0;
}

/**
 * 장바구니 전체 비우기
 */
export async function clearCart(userId) {
  const pool = await getPool();
  await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      DELETE FROM cart_items WHERE user_id = @userId
    `);
}

/* ============================================================
 * Orders CRUD
 * ============================================================ */

/**
 * 주문번호 생성 (USM-YYYYMMDD-XXXX)
 */
function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(
    Math.floor(Math.random() * 10000)
  ).padStart(4, '0');
  return `USM-${y}${m}${d}-${rand}`;
}

/**
 * 주문 생성 (트랜잭션)
 * - 장바구니 항목 조회 → 주문 레코드 생성
 *   → 주문 상품 레코드 생성 → 장바구니 비우기
 */
export async function createOrder(userId, shipping, memo) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. 장바구니 조회
    const cartResult = await transaction
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          c.product_id, c.quantity,
          p.name_ko, p.name_ja, p.price, p.image_url
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = @userId
      `);

    const cartItems = cartResult.recordset;
    if (cartItems.length === 0) {
      await transaction.rollback();
      return { error: '장바구니가 비어있습니다' };
    }

    // 2. 총 금액 계산
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );

    // 3. 주문 생성
    const orderNumber = generateOrderNumber();
    const orderResult = await transaction
      .request()
      .input('userId', sql.Int, userId)
      .input('orderNumber', sql.NVarChar(30), orderNumber)
      .input(
        'totalAmount',
        sql.Decimal(18, 2),
        totalAmount
      )
      .input(
        'recipientName',
        sql.NVarChar(100),
        shipping.recipientName
      )
      .input(
        'recipientPhone',
        sql.NVarChar(20),
        shipping.recipientPhone
      )
      .input(
        'zipcode',
        sql.NVarChar(10),
        shipping.zipcode
      )
      .input(
        'address',
        sql.NVarChar(500),
        shipping.address
      )
      .input(
        'addressDetail',
        sql.NVarChar(200),
        shipping.addressDetail || null
      )
      .input('memo', sql.NVarChar(500), memo || null)
      .query(`
        INSERT INTO orders
          (user_id, order_number, total_amount,
           recipient_name, recipient_phone,
           zipcode, address, address_detail, memo)
        OUTPUT INSERTED.id, INSERTED.order_number,
               INSERTED.total_amount, INSERTED.status,
               INSERTED.created_at
        VALUES
          (@userId, @orderNumber, @totalAmount,
           @recipientName, @recipientPhone,
           @zipcode, @address, @addressDetail, @memo)
      `);

    const order = orderResult.recordset[0];

    // 4. 주문 상품 생성
    for (const item of cartItems) {
      await transaction
        .request()
        .input('orderId', sql.Int, order.id)
        .input('productId', sql.Int, item.product_id)
        .input(
          'productName',
          sql.NVarChar(500),
          item.name_ko || item.name_ja || ''
        )
        .input(
          'productImage',
          sql.NVarChar(500),
          item.image_url || null
        )
        .input(
          'price',
          sql.Decimal(18, 2),
          item.price || 0
        )
        .input('quantity', sql.Int, item.quantity)
        .query(`
          INSERT INTO order_items
            (order_id, product_id, product_name,
             product_image, price, quantity)
          VALUES
            (@orderId, @productId, @productName,
             @productImage, @price, @quantity)
        `);
    }

    // 5. 장바구니 비우기
    await transaction
      .request()
      .input('userId2', sql.Int, userId)
      .query(`
        DELETE FROM cart_items WHERE user_id = @userId2
      `);

    await transaction.commit();
    return { order };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // 이미 롤백된 경우 무시
    }
    throw error;
  }
}

/**
 * 내 주문 목록 (페이지네이션)
 */
export async function getOrders(userId, page = 1, limit = 10) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT
        id, order_number, total_amount, status,
        recipient_name, created_at,
        COUNT(*) OVER() AS total_count
      FROM orders
      WHERE user_id = @userId
      ORDER BY created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  const rows = result.recordset;
  const totalCount = rows.length > 0
    ? rows[0].total_count
    : 0;

  return {
    orders: rows.map(({ total_count, ...rest }) => rest),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/**
 * 주문 상세 조회 (order_items JOIN)
 */
export async function getOrderDetail(orderId, userId) {
  const pool = await getPool();

  // 주문 기본 정보
  const orderResult = await pool
    .request()
    .input('orderId', sql.Int, orderId)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT *
      FROM orders
      WHERE id = @orderId AND user_id = @userId
    `);

  const order = orderResult.recordset[0];
  if (!order) return null;

  // 주문 상품 목록
  const itemsResult = await pool
    .request()
    .input('orderId2', sql.Int, orderId)
    .query(`
      SELECT *
      FROM order_items
      WHERE order_id = @orderId2
    `);

  return {
    ...order,
    items: itemsResult.recordset,
  };
}

/**
 * 주문 취소 (pending 상태만 가능)
 */
export async function cancelOrder(orderId, userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('orderId', sql.Int, orderId)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE orders
      SET status = 'cancelled', updated_at = GETDATE()
      WHERE id = @orderId
        AND user_id = @userId
        AND status = 'pending'
    `);
  return result.rowsAffected[0] > 0;
}

/* ============================================================
 * Wishlist CRUD
 * ============================================================ */

/**
 * 위시리스트 조회 (상품 정보 JOIN)
 */
export async function getWishlist(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        w.id, w.product_id, w.created_at,
        p.name_ko, p.name_ja, p.price, p.image_url,
        p.product_code
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = @userId
      ORDER BY w.created_at DESC
    `);
  return result.recordset;
}

/**
 * 위시리스트 토글 (있으면 제거, 없으면 추가)
 * @returns {{ added: boolean }}
 */
export async function toggleWishlist(userId, productId) {
  const pool = await getPool();

  // 존재 여부 확인
  const check = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .query(`
      SELECT id FROM wishlist
      WHERE user_id = @userId AND product_id = @productId
    `);

  if (check.recordset.length > 0) {
    // 이미 있으면 제거
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('productId', sql.Int, productId)
      .query(`
        DELETE FROM wishlist
        WHERE user_id = @userId
          AND product_id = @productId
      `);
    return { added: false };
  }

  // 없으면 추가
  await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .query(`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (@userId, @productId)
    `);
  return { added: true };
}

/**
 * 위시리스트 단일 제거
 */
export async function removeWishlistItem(
  userId,
  productId
) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .query(`
      DELETE FROM wishlist
      WHERE user_id = @userId AND product_id = @productId
    `);
  return result.rowsAffected[0] > 0;
}

/**
 * 특정 상품 위시리스트 여부 확인
 */
export async function isInWishlist(userId, productId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .input('productId', sql.Int, productId)
    .query(`
      SELECT COUNT(*) AS cnt FROM wishlist
      WHERE user_id = @userId AND product_id = @productId
    `);
  return result.recordset[0].cnt > 0;
}
