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
    max: 10,
    min: 1,
    idleTimeoutMillis: 60000,
  },
  // 서버리스 환경(Vercel 30s 제한) 대응:
  // 연결 5s + 재시도 1회(2s 대기 + 5s) = 최대 12s
  connectionTimeout: 5000,
  requestTimeout: 10000,
};

let pool = null;

/**
 * 최대 재시도 횟수
 * 서버리스 환경에서는 2회로 제한 (8s × 2 + 2s 대기 = 18s)
 */
const MAX_RETRIES = 2;

/**
 * DB 커넥션 풀 획득 (재시도 로직 포함)
 * - 풀이 없거나 연결이 끊긴 경우 자동 재연결
 * - 최대 3회 재시도 (exponential backoff)
 */
export async function getPool() {
  if (pool?.connected || pool?._connected) {
    return pool;
  }

  if (pool) {
    try {
      await pool.close();
    } catch {
      /* already closed */
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
