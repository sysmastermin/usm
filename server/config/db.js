import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// 환경변수 디버깅 (비밀번호는 마스킹)
console.log('환경변수 확인:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '***설정됨***' : '❌ 없음');
console.log('DB_NAME:', process.env.DB_NAME);

// 비밀번호에서 따옴표 제거 (dotenv가 따옴표를 포함해서 읽을 수 있음)
const cleanPassword = (process.env.DB_PASS || '@allin#am1071').replace(/^["']|["']$/g, '');

const config = {
  server: process.env.DB_HOST?.split(',')[0] || '59.23.231.197',
  port: parseInt(process.env.DB_HOST?.split(',')[1] || '14103'),
  database: process.env.DB_NAME || 'usm',
  user: process.env.DB_USER || '1stplatfor_sql',
  password: cleanPassword,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

export async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log('✅ MSSQL 연결 성공');
    } catch (error) {
      console.error('❌ MSSQL 연결 실패:', error);
      throw error;
    }
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('MSSQL 연결 종료');
  }
}

export { sql };
