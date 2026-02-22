import dotenv from 'dotenv';
import app from './app.js';
import { getPool, closePool } from './config/db.js';
import {
  createCategoriesTable,
  createProductsTable,
  createScenesTable,
  createSceneProductLinksTable,
} from './services/dbService.js';
import {
  createShopTables,
} from './services/shopService.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// 서버 시작
async function startServer() {
  try {
    // DB 연결 테스트
    await getPool();

    // 테이블 마이그레이션 실행
    console.log('📋 테이블 마이그레이션 실행 중...');
    await createCategoriesTable();
    await createProductsTable();
    await createScenesTable();
    await createSceneProductLinksTable();
    await createShopTables();
    console.log('✅ 테이블 마이그레이션 완료');

    app.listen(PORT, () => {
      console.log(
        `🚀 서버가 포트 ${PORT}에서 실행 중입니다`
      );
      console.log(
        `📍 Health check: http://localhost:${PORT}/health`
      );
      console.log(
        `📍 API: http://localhost:${PORT}/api`
      );
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM 신호 수신, 서버 종료 중...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT 신호 수신, 서버 종료 중...');
  await closePool();
  process.exit(0);
});

startServer();
