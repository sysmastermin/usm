/**
 * 간단한 TTL 기반 인메모리 캐시
 * 서버리스 환경에서 웜 인스턴스 간 DB 쿼리를 줄이기 위해 사용
 */
const cache = new Map();

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {*|null} 캐시된 데이터 또는 null (만료/미존재)
 */
export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {*} data - 저장할 데이터
 * @param {number} ttlMs - TTL (밀리초, 기본 60초)
 */
export function setCache(key, data, ttlMs = 60000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * 캐시 무효화
 * @param {string} [key] - 특정 키 삭제. 미지정 시 전체 삭제
 */
export function clearCache(key) {
  if (key) {
    // 패턴 매칭: 'products:' 접두사로 시작하는 키 모두 삭제
    if (key.endsWith(':*')) {
      const prefix = key.slice(0, -1);
      for (const k of cache.keys()) {
        if (k.startsWith(prefix)) cache.delete(k);
      }
    } else {
      cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
