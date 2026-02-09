import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// 환경변수에서 따옴표/공백 제거
const cleanPassword = (
  process.env.DB_PASS || '@allin#am1071'
).replace(/^["']|["']$/g, '').trim();

const dbHost = (
  process.env.DB_HOST || '59.23.231.197,14103'
).trim();

const config = {
  server: dbHost.split(',')[0] || '59.23.231.197',
  port: parseInt(dbHost.split(',')[1] || '14103'),
  database: (process.env.DB_NAME || 'usm').trim(),
  user: (process.env.DB_USER || '1stplatfor_sql').trim(),
  password: cleanPassword,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool = null;

/** 최대 재시도 횟수 */
const MAX_RETRIES = 3;

/**
 * DB 커넥션 풀 획득 (재시도 로직 포함)
 * - 풀이 없거나 연결이 끊긴 경우 자동 재연결
 * - 최대 3회 재시도 (exponential backoff)
 */
export async function getPool() {
  if (pool?.connected) {
    return pool;
  }

  // 기존 풀이 있지만 연결이 끊긴 경우 정리
  if (pool) {
    try {
      await pool.close();
    } catch {
      // 이미 닫혔거나 에러 무시
    }
    pool = null;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      pool = await sql.connect(config);

      // 풀 에러 이벤트 핸들링 (연결 끊김 자동 감지)
      pool.on('error', (err) => {
        console.error('DB pool error:', err.message);
        pool = null;
      });

      console.log('MSSQL 연결 성공');
      return pool;
    } catch (error) {
      console.error(
        `MSSQL 연결 실패 (시도 ${attempt}/${MAX_RETRIES}):`,
        error.message
      );
      pool = null;

      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`${delay}ms 후 재시도...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}

/**
 * DB 커넥션 풀 닫기
 */
export async function closePool() {
  if (pool) {
    try {
      await pool.close();
    } catch {
      // 닫기 실패 무시
    }
    pool = null;
    console.log('MSSQL 연결 종료');
  }
}

export { sql };
