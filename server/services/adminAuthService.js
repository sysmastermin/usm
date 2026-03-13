import bcrypt from 'bcryptjs';
import process from 'node:process';
import crypto from 'node:crypto';
import { getPool, sql } from '../config/db.js';

const BCRYPT_ROUNDS = 12;
const ENV_ADMIN_PASSWORD = (
  process.env.ADMIN_PASSWORD || ''
).trim();
const GENERATED_ADMIN_PASSWORD = crypto
  .randomBytes(9)
  .toString('base64url');
const INITIAL_ADMIN_PASSWORD =
  ENV_ADMIN_PASSWORD || GENERATED_ADMIN_PASSWORD;

/**
 * 관리자 인증 정보 테이블 생성
 */
export async function createAdminCredentialsTable() {
  const pool = await getPool();
  const query = `
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[admin_credentials]')
      AND type in (N'U')
    )
    BEGIN
      CREATE TABLE [dbo].[admin_credentials] (
        [id] INT PRIMARY KEY,
        [password_hash] NVARCHAR(255) NOT NULL,
        [updated_at] DATETIME2 DEFAULT GETDATE()
      );
    END
  `;

  await pool.request().query(query);
  await ensureDefaultAdminCredential();
}

/**
 * 기본 관리자 인증 정보 생성 (최초 1회)
 */
async function ensureDefaultAdminCredential() {
  const pool = await getPool();
  const existing = await pool.request().query(`
    SELECT TOP 1 id, password_hash
    FROM [dbo].[admin_credentials]
    WHERE id = 1
  `);

  if (existing.recordset.length > 0) {
    const currentHash = existing.recordset[0].password_hash;
    if (ENV_ADMIN_PASSWORD && currentHash) {
      const isSameAsEnv = await bcrypt.compare(
        ENV_ADMIN_PASSWORD,
        currentHash
      );
      if (!isSameAsEnv) {
        console.warn(
          '[admin-auth] ADMIN_PASSWORD와 DB 비밀번호가 다릅니다. DB 값이 우선 적용됩니다.'
        );
      }
    }
    return;
  }

  const hash = await bcrypt.hash(
    INITIAL_ADMIN_PASSWORD,
    BCRYPT_ROUNDS
  );

  const request = pool.request();
  request.input('id', sql.Int, 1);
  request.input('password_hash', sql.NVarChar, hash);
  await request.query(`
    INSERT INTO [dbo].[admin_credentials] (
      id,
      password_hash
    )
    VALUES (
      @id,
      @password_hash
    )
  `);

  if (!ENV_ADMIN_PASSWORD) {
    console.warn(
      `[admin-auth] ADMIN_PASSWORD 미설정으로 초기 관리자 비밀번호를 자동 생성했습니다: ${INITIAL_ADMIN_PASSWORD}`
    );
  }
}

/**
 * 관리자 비밀번호 검증
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function verifyAdminPassword(password) {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 password_hash
    FROM [dbo].[admin_credentials]
    WHERE id = 1
  `);

  const credential = result.recordset[0];
  if (!credential?.password_hash) {
    return false;
  }

  return bcrypt.compare(
    password,
    credential.password_hash
  );
}

/**
 * 관리자 비밀번호 변경
 * @param {string} newPassword
 */
export async function updateAdminPassword(newPassword) {
  const pool = await getPool();
  const passwordHash = await bcrypt.hash(
    newPassword,
    BCRYPT_ROUNDS
  );

  const request = pool.request();
  request.input('id', sql.Int, 1);
  request.input('password_hash', sql.NVarChar, passwordHash);
  await request.query(`
    UPDATE [dbo].[admin_credentials]
    SET
      password_hash = @password_hash,
      updated_at = GETDATE()
    WHERE id = @id
  `);
}
