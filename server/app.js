import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import {
  userAuthMiddleware,
} from './middleware/userAuth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(compression()); // gzip 응답 압축 (~70% 크기 절감)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (이미지)
const publicPath = path.join(__dirname, 'public');
app.use(
  '/images',
  express.static(path.join(publicPath, 'images'))
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// Admin API Routes
app.use('/api/admin', adminRoutes);

// 사용자 인증 API (공개 + 인증)
app.use('/api/auth', authRoutes);

// 쇼핑몰 API (인증 필요)
app.use('/api/cart', userAuthMiddleware, cartRoutes);
app.use('/api/orders', userAuthMiddleware, orderRoutes);
app.use(
  '/api/wishlist',
  userAuthMiddleware,
  wishlistRoutes
);

// Error handling
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
  });
});

export default app;
