const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * 이미지 URL 변환 유틸리티
 * 상대 경로를 API 서버의 절대 URL로 변환
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // 이미 절대 URL
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${apiBase}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
}

/**
 * API 요청 헬퍼
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API 요청 실패');
    }

    return data;
  } catch (error) {
    console.error('API 요청 오류:', error);
    throw error;
  }
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories() {
  const response = await request('/categories');
  return response.data || [];
}

/**
 * 상품 목록 조회
 */
export async function getProducts(filters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
  if (filters.categorySlug) queryParams.append('categorySlug', filters.categorySlug);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const queryString = queryParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
  
  const response = await request(endpoint);
  return response.data || [];
}

/**
 * 상품 상세 조회
 */
export async function getProductById(id) {
  const response = await request(`/products/${id}`);
  return response.data || null;
}

/**
 * legacy_id 기반 상품 상세 조회
 * 프론트 라우트(`/product/:id`)와 매핑
 */
export async function getProductByLegacyId(id) {
  const response = await request(`/products/legacy/${id}`);
  return response.data || null;
}

/**
 * 크롤링 실행
 */
export async function runIngest() {
  const response = await request('/ingest', {
    method: 'POST',
  });
  return response;
}
