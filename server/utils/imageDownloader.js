import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'server', 'public', 'images');
const PRODUCTS_IMAGES_DIR = path.join(IMAGES_DIR, 'products');
const CATEGORIES_IMAGES_DIR = path.join(IMAGES_DIR, 'categories');

/**
 * 이미지 디렉토리 초기화
 * Vercel 서버리스 환경은 읽기 전용이므로 스킵
 */
export async function ensureImageDirectories() {
  if (IS_SERVERLESS) {
    console.log('⚡ 서버리스 환경 감지 - 이미지 로컬 저장 비활성화 (CDN URL 사용)');
    return;
  }
  try {
    await fs.mkdir(PRODUCTS_IMAGES_DIR, { recursive: true });
    await fs.mkdir(CATEGORIES_IMAGES_DIR, { recursive: true });
    console.log('✅ 이미지 디렉토리 확인 완료');
  } catch (error) {
    console.error('이미지 디렉토리 생성 실패:', error);
    throw error;
  }
}

/**
 * URL에서 파일 확장자 추출
 */
function getFileExtension(url) {
  try {
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath).toLowerCase();
    // 확장자가 없거나 유효하지 않은 경우 기본값
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (validExtensions.includes(ext)) {
      return ext;
    }
    // URL에 확장자가 없는 경우 Content-Type 확인 필요하지만, 기본값으로 jpg 사용
    return '.jpg';
  } catch (e) {
    return '.jpg';
  }
}

/**
 * 안전한 파일명 생성 (URL 기반 해시 또는 제품 코드, 제품 ID 사용)
 */
function generateSafeFileName(url, productCode = null, productId = null) {
  const ext = getFileExtension(url);
  const safeProductCode = productCode ? productCode.replace(/[^a-zA-Z0-9_]/g, '_') : null;
  
  // 제품 코드와 ID가 모두 있으면 조합하여 사용 (고유성 보장)
  if (safeProductCode && productId) {
    return `${safeProductCode}_${productId}${ext}`;
  }
  
  // 제품 코드만 있으면 사용
  if (safeProductCode) {
    return `${safeProductCode}${ext}`;
  }
  
  // 제품 ID만 있으면 사용
  if (productId) {
    return `product_${productId}${ext}`;
  }
  
  // URL에서 파일명 추출 시도
  try {
    const urlPath = new URL(url).pathname;
    const fileName = path.basename(urlPath);
    if (fileName && fileName.includes('.')) {
      return fileName;
    }
  } catch (e) {
    // URL 파싱 실패
  }
  
  // 해시 기반 파일명 생성
  const hash = url.split('').reduce((acc, char) => {
    const hash = ((acc << 5) - acc) + char.charCodeAt(0);
    return hash & hash;
  }, 0);
  
  return `img_${Math.abs(hash)}${ext}`;
}

/**
 * 이미지 다운로드 및 로컬 저장
 * @param {string} imageUrl - 다운로드할 이미지 URL
 * @param {string} type - 'product' 또는 'category'
 * @param {string|null} productCode - 제품 코드 (파일명 생성용)
 * @param {number|null} productId - 제품 ID (파일명 생성용, 고유성 보장)
 * @returns {Promise<string|null>} 저장된 로컬 경로 또는 null
 */
export async function downloadAndSaveImage(imageUrl, type = 'product', productCode = null, productId = null) {
  if (!imageUrl) {
    return null;
  }

  if (IS_SERVERLESS) {
    return imageUrl;
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`⚠️ 이미지가 아닌 파일: ${imageUrl} (Content-Type: ${contentType})`);
      return null;
    }

    const saveDir = type === 'product' ? PRODUCTS_IMAGES_DIR : CATEGORIES_IMAGES_DIR;
    const fileName = generateSafeFileName(imageUrl, productCode, productId);
    const filePath = path.join(saveDir, fileName);

    await fs.writeFile(filePath, response.data);

    const webPath = `/images/${type === 'product' ? 'products' : 'categories'}/${fileName}`;
    console.log(`  💾 이미지 저장 완료: ${webPath}`);
    return webPath;
  } catch (error) {
    console.error(`  ❌ 이미지 다운로드 실패: ${imageUrl} - ${error.message}`);
    return null;
  }
}

/**
 * 여러 이미지 병렬 다운로드
 * @param {Array<{url: string, type: string, productCode?: string, productId?: number}>} images - 다운로드할 이미지 정보 배열
 * @param {number} concurrency - 동시 다운로드 수
 * @returns {Promise<Array<{originalUrl: string, localPath: string|null}>>}
 */
export async function downloadImagesBatch(images, concurrency = 3) {
  const limit = pLimit(concurrency);
  
  const results = await Promise.all(
    images.map(({ url, type, productCode, productId }) =>
      limit(async () => {
        const localPath = await downloadAndSaveImage(url, type, productCode, productId);
        return {
          originalUrl: url,
          localPath: localPath,
        };
      })
    )
  );
  
  return results;
}
