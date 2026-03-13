import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { getPool, closePool } from './config/db.js';
import { createCategoriesTable, createProductsTable } from './services/dbService.js';
import { createAdminCredentialsTable } from './services/adminAuthService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (이미지)
const publicPath = path.join(__dirname, 'public');
app.use('/images', express.static(path.join(publicPath, 'images')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
  });
});

// 서버 시작
async function startServer() {
  try {
    // DB 연결 테스트
    await getPool();
    
    // 테이블 마이그레이션 실행
    console.log('📋 테이블 마이그레이션 실행 중...');
    await createCategoriesTable();
    await createProductsTable();
    await createAdminCredentialsTable();
    console.log('✅ 테이블 마이그레이션 완료');
    
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
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
