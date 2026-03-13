import { getPool, sql } from '../config/db.js';
import process from 'node:process';
import {
  createPasswordHash,
  verifyPasswordHash,
} from '../utils/passwordHash.js';

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin1234';

/**
 * 관리자 인증 정보를 저장할 테이블을 생성합니다.
 */
export async function createAdminCredentialsTable() {
  const pool = await getPool();
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[admin_credentials]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[admin_credentials] (
        [id] INT PRIMARY KEY,
        [password_hash] NVARCHAR(255) NOT NULL,
        [password_salt] NVARCHAR(255) NOT NULL,
        [updated_at] DATETIME2 DEFAULT GETDATE()
      );
    END
  `;

  await pool.request().query(query);
  await ensureDefaultAdminCredential();
}

async function ensureDefaultAdminCredential() {
  const pool = await getPool();
  const checkResult = await pool.request().query(`
    SELECT TOP 1 id
    FROM [dbo].[admin_credentials]
    WHERE id = 1
  `);

  if (checkResult.recordset.length > 0) {
    return;
  }

  const { hash, salt } = createPasswordHash(DEFAULT_ADMIN_PASSWORD);
  const request = pool.request();
  request.input('id', sql.Int, 1);
  request.input('password_hash', sql.NVarChar, hash);
  request.input('password_salt', sql.NVarChar, salt);
  await request.query(`
    INSERT INTO [dbo].[admin_credentials] (id, password_hash, password_salt)
    VALUES (@id, @password_hash, @password_salt)
  `);
}

/**
 * 현재 관리자 비밀번호를 검증합니다.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function verifyAdminPassword(password) {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 password_hash, password_salt
    FROM [dbo].[admin_credentials]
    WHERE id = 1
  `);

  const credential = result.recordset[0];
  if (!credential) {
    return false;
  }

  return verifyPasswordHash(
    password,
    credential.password_salt,
    credential.password_hash
  );
}

/**
 * 관리자 비밀번호를 변경합니다.
 * @param {string} newPassword
 */
export async function updateAdminPassword(newPassword) {
  const pool = await getPool();
  const { hash, salt } = createPasswordHash(newPassword);
  const request = pool.request();
  request.input('id', sql.Int, 1);
  request.input('password_hash', sql.NVarChar, hash);
  request.input('password_salt', sql.NVarChar, salt);

  await request.query(`
    UPDATE [dbo].[admin_credentials]
    SET
      password_hash = @password_hash,
      password_salt = @password_salt,
      updated_at = GETDATE()
    WHERE id = @id
  `);
}
