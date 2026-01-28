import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { translateJaToKo, translateBatch } from '../utils/translator.js';
import { downloadAndSaveImage, downloadImagesBatch, ensureImageDirectories } from '../utils/imageDownloader.js';
import { getCategoryBySlug, getProductByDetailUrl } from './dbService.js';

const BASE_URL = 'https://jp.shop.usm.com';
const CRAWL_TIMEOUT = 30000;
const BATCH_SIZE = 5; // 동시 크롤링할 상품 수

/**
 * 이미지 URL 정규화 함수
 * @param {string|null|undefined} url - 정규화할 이미지 URL
 * @param {string} baseUrl - 기본 URL (상대 경로 변환용)
 * @returns {string|null} 정규화된 이미지 URL 또는 null
 */
function normalizeImageUrl(url, baseUrl = BASE_URL) {
  if (!url) return null;
  
  url = url.trim();
  if (!url || url === 'null' || url === 'undefined' || url === '') return null;
  
  // 플레이스홀더 이미지 필터링
  const placeholderPatterns = [
    'placeholder',
    'no-image',
    'default',
    'spacer',
    'blank',
    '1x1',
    'pixel',
  ];
  const lowerUrl = url.toLowerCase();
  if (placeholderPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return null;
  }
  
  // 프로토콜 없는 URL 처리
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }
  
  // 상대 경로 처리
  if (url.startsWith('/')) {
    url = `${baseUrl}${url}`;
  }
  
  // 상대 경로 (슬래시 없음)
  if (!url.startsWith('http')) {
    url = `${baseUrl}/${url}`;
  }
  
  // Shopify CDN URL 정규화: 크기 변형 제거하여 원본 이미지 우선
  // 예: https://cdn.shopify.com/.../image_100x100.jpg?v=123 -> 원본 URL
  if (url.includes('cdn.shopify.com') || url.includes('shopifycdn.com')) {
    // 크기 변형 제거 (예: _100x100, _300x300 등)
    url = url.replace(/_[0-9]+x[0-9]+\.(jpg|jpeg|png|webp|gif)/gi, '.$1');
    
    // 쿼리 파라미터 정리 (v 파라미터는 유지, width/height는 제거)
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      // width, height 파라미터 제거 (원본 이미지 우선)
      params.delete('width');
      params.delete('height');
      
      // crop, scale 등 크기 관련 파라미터 제거
      params.delete('crop');
      params.delete('scale');
      
      url = urlObj.toString();
    } catch (e) {
      // URL 파싱 실패 시 원본 URL 사용
    }
  }
  
  // 일반적인 이미지 크기 변형 제거 (다른 CDN도 처리)
  url = url.replace(/_[0-9]+x[0-9]+\.(jpg|jpeg|png|webp|gif)/gi, '.$1');
  url = url.replace(/\?width=\d+/gi, '');
  url = url.replace(/&width=\d+/gi, '');
  url = url.replace(/\?height=\d+/gi, '');
  url = url.replace(/&height=\d+/gi, '');
  
  return url;
}

/**
 * 다양한 방법으로 이미지 URL 추출
 * @param {cheerio.CheerioAPI} $ - cheerio 인스턴스
 * @param {string} baseUrl - 기본 URL
 * @param {cheerio.Element|null} context - 검색할 컨텍스트 요소 (선택사항)
 * @returns {string|null} 추출된 이미지 URL 또는 null
 */
function extractImageUrl($, baseUrl = BASE_URL, context = null) {
  let imageUrl = null;
  
  // 방법 1: img 태그의 다양한 속성 확인
  const img = context ? $(context).find('img').first() : $('img').first();
  if (img.length) {
    imageUrl = img.attr('src') || 
               img.attr('data-src') || 
               img.attr('data-lazy-src') || 
               img.attr('data-original') ||
               img.attr('data-image');
    
    // 방법 2: srcset 속성에서 첫 번째 URL 추출
    if (!imageUrl) {
      const srcset = img.attr('srcset');
      if (srcset) {
        const matches = srcset.match(/(https?:\/\/[^\s,]+)/);
        if (matches) {
          imageUrl = matches[1];
        } else {
          // 상대 경로가 srcset에 있는 경우
          const relativeMatch = srcset.match(/(\/[^\s,]+)/);
          if (relativeMatch) {
            imageUrl = relativeMatch[1];
          }
        }
      }
    }
  }
  
  // 방법 3: picture 태그 내 source 요소
  if (!imageUrl) {
    const picture = context ? $(context).find('picture').first() : $('picture').first();
    if (picture.length) {
      const source = picture.find('source').first();
      const srcset = source.attr('srcset');
      if (srcset) {
        const matches = srcset.match(/(https?:\/\/[^\s,]+)/);
        if (matches) {
          imageUrl = matches[1];
        } else {
          const relativeMatch = srcset.match(/(\/[^\s,]+)/);
          if (relativeMatch) {
            imageUrl = relativeMatch[1];
          }
        }
      }
    }
  }
  
  // 방법 4: CSS background-image 속성
  if (!imageUrl && context) {
    const bgImage = $(context).css('background-image');
    if (bgImage && bgImage !== 'none') {
      const match = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
      if (match) {
        imageUrl = match[1];
      }
    }
  }
  
  // 방법 5: JSON-LD에서 이미지 추출
  if (!imageUrl) {
    $('script[type="application/ld+json"]').each((i, elem) => {
      if (imageUrl) return false; // 이미 찾았으면 중단
      
      try {
        const jsonData = JSON.parse($(elem).html());
        
        // Product 타입 확인
        const isProduct = jsonData['@type'] === 'Product' || 
                         jsonData['@type'] === 'http://schema.org/Product' ||
                         (Array.isArray(jsonData) && jsonData.some(item => 
                           item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product'
                         ));
        
        if (isProduct) {
          const productJson = Array.isArray(jsonData) 
            ? jsonData.find(item => item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product')
            : jsonData;
          
          if (productJson?.image) {
            const imageData = Array.isArray(productJson.image) 
              ? productJson.image[0] 
              : productJson.image;
            
            if (typeof imageData === 'string') {
              imageUrl = imageData;
            } else if (imageData?.url) {
              imageUrl = imageData.url;
            } else if (imageData?.['@id']) {
              imageUrl = imageData['@id'];
            }
          }
        }
      } catch (e) {
        // JSON 파싱 실패 무시
      }
    });
  }
  
  // 방법 6: Shopify 특화 셀렉터
  if (!imageUrl) {
    const shopifySelectors = [
      'img[class*="product-image"]',
      'img[class*="featured-image"]',
      'img[class*="main-image"]',
      '[class*="product-image"] img',
      '[class*="featured-image"] img',
      '[class*="main-image"] img',
    ];
    
    for (const selector of shopifySelectors) {
      const elem = context ? $(context).find(selector).first() : $(selector).first();
      if (elem.length) {
        imageUrl = elem.attr('src') || elem.attr('data-src') || elem.attr('data-lazy-src');
        if (imageUrl) break;
      }
    }
  }
  
  return normalizeImageUrl(imageUrl, baseUrl);
}

/**
 * 메인 페이지에서 카테고리 목록 추출
 */
export async function crawlCategories() {
  try {
    const response = await axios.get(BASE_URL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const categories = [];

    // 카테고리 섹션 찾기 (메인 페이지의 Category 섹션)
    const categorySection = $('h2:contains("Category"), h2:contains("カテゴリー")').closest('section, div').first();
    
    if (categorySection.length > 0) {
      categorySection.find('a[href*="/collections/"]').each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const text = $elem.text().trim();
        const img = $elem.find('img').first();

        // 메인 카테고리만 추출 (footer나 다른 섹션 제외)
        if (href && text && !href.includes('scene_') && !href.includes('color_') && !href.includes('quick_delivery') && !href.includes('outlet')) {
          const slug = href.replace('/collections/', '').split('?')[0];
          
          // 중복 제거 및 유효한 카테고리만
          if (slug && !categories.find(c => c.slug === slug)) {
            categories.push({
              name_ja: text,
              slug: slug,
              url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
              image_url: img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || null,
            });
          }
        }
      });
    } else {
      // 카테고리 섹션을 찾지 못한 경우 전체 페이지에서 검색
      $('a[href*="/collections/"]').each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const text = $elem.text().trim();
        const img = $elem.find('img').first();

        // 메인 카테고리만 추출
        if (href && text && !href.includes('scene_') && !href.includes('color_') && !href.includes('quick_delivery') && !href.includes('outlet')) {
          const slug = href.replace('/collections/', '').split('?')[0];
          
          if (slug && !categories.find(c => c.slug === slug)) {
            categories.push({
              name_ja: text,
              slug: slug,
              url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
              image_url: img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || null,
            });
          }
        }
      });
    }

    // 번역 수행 (기존 번역 확인 후 스킵)
    const namesToTranslate = [];
    const translateIndices = [];
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const existing = await getCategoryBySlug(category.slug);
      
      if (existing && existing.name_ko && existing.name_ja === category.name_ja) {
        // 기존 번역이 있고 일본어 텍스트가 변경되지 않은 경우
        category.name_ko = existing.name_ko;
        console.log(`  ⏭️ 카테고리 번역 스킵: ${category.name_ja} → ${category.name_ko}`);
      } else {
        // 번역이 필요함
        namesToTranslate.push(category.name_ja);
        translateIndices.push(i);
      }
    }
    
    // 번역이 필요한 항목만 번역
    if (namesToTranslate.length > 0) {
      const translations = await translateBatch(namesToTranslate);
      translateIndices.forEach((originalIndex, translateIndex) => {
        categories[originalIndex].name_ko = translations[translateIndex]?.translated || null;
      });
    }

    return categories;
  } catch (error) {
    console.error('카테고리 크롤링 실패:', error.message);
    throw error;
  }
}

/**
 * 카테고리 페이지에서 상품 목록 추출
 */
export async function crawlProducts(categorySlug) {
  try {
    const url = `${BASE_URL}/collections/${categorySlug}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const products = [];

    // 상품 목록 찾기
    $('a[href*="/products/"]').each((i, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      
      if (!href || href.includes('#')) return;

      const productUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      const productSlug = href.replace('/products/', '').split('?')[0];

      // 상품 정보 추출
      const nameElem = $elem.find('h2, h3, h4, [class*="product"], [class*="title"]').first();
      const name = nameElem.text().trim() || $elem.text().trim();

      // 이미지 URL 추출 (개선된 함수 사용)
      let imageUrl = extractImageUrl($, BASE_URL, elem);
      
      // 이미지를 찾지 못한 경우 경고 로그
      if (!imageUrl) {
        console.warn(`  ⚠️ 이미지를 찾지 못함: ${productUrl}`);
      }

      // 제품 코드 추출 (예: JPQS014)
      const codeMatch = name.match(/[A-Z]{2,}\d+/);
      const productCode = codeMatch ? codeMatch[0] : null;

      // 치수 추출 (W/D/H: 773/373/740mm)
      const dimensionsText = $elem.find('*').text();
      const dimensionsMatch = dimensionsText.match(/W\/D\/H[:\s]*([\d\/xX\s]+(?:mm|cm|m)?)/i);
      const dimensions = dimensionsMatch ? dimensionsMatch[1].trim() : null;

      // 가격 추출
      const priceText = $elem.find('[class*="price"]').text();
      const priceMatch = priceText.match(/¥[\d,]+/);
      const price = priceMatch ? priceMatch[0].replace(/[¥,]/g, '') : null;

      if (name && productUrl) {
        products.push({
          name_ja: name,
          product_code: productCode,
          detail_url: productUrl,
          image_url: imageUrl,
          price: price,
          dimensions: dimensions,
          category_slug: categorySlug,
        });
      }
    });

    // 번역 수행 (기존 번역 확인 후 스킵)
    const namesToTranslate = [];
    const translateIndices = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const existing = await getProductByDetailUrl(product.detail_url);
      
      if (existing && existing.name_ko && existing.name_ja === product.name_ja) {
        // 기존 번역이 있고 일본어 텍스트가 변경되지 않은 경우
        product.name_ko = existing.name_ko;
        console.log(`  ⏭️ 상품명 번역 스킵: ${product.name_ja.substring(0, 30)}...`);
      } else {
        // 번역이 필요함
        namesToTranslate.push(product.name_ja);
        translateIndices.push(i);
      }
    }
    
    // 번역이 필요한 항목만 번역
    if (namesToTranslate.length > 0) {
      const translations = await translateBatch(namesToTranslate);
      translateIndices.forEach((originalIndex, translateIndex) => {
        products[originalIndex].name_ko = translations[translateIndex]?.translated || null;
      });
    }

    return products;
  } catch (error) {
    console.error(`상품 크롤링 실패 (${categorySlug}):`, error.message);
    return [];
  }
}

/**
 * 상품 상세 페이지에서 추가 정보 추출 (완전 개선 버전)
 */
export async function crawlProductDetail(productUrl) {
  try {
    const response = await axios.get(productUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    
    // JSON-LD에서 구조화된 데이터 추출
    let productData = null;
    const jsonLdImages = [];
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const jsonData = JSON.parse($(elem).html());
        // 배열인 경우 처리
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of dataArray) {
          if (item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product') {
            productData = item;
            
            // 이미지 배열 추출
            if (item.image) {
              if (Array.isArray(item.image)) {
                item.image.forEach(img => {
                  if (typeof img === 'string') {
                    jsonLdImages.push(img);
                  } else if (img.url) {
                    jsonLdImages.push(img.url);
                  } else if (img['@id']) {
                    jsonLdImages.push(img['@id']);
                  }
                });
              } else if (typeof item.image === 'string') {
                jsonLdImages.push(item.image);
              } else if (item.image.url) {
                jsonLdImages.push(item.image.url);
              } else if (item.image['@id']) {
                jsonLdImages.push(item.image['@id']);
              }
            }
          }
        }
      } catch (e) {
        // JSON 파싱 실패 무시
      }
    });

    const detail = {
      description_ja: null,
      description_ko: null,
      product_code: null,
      model_number: null,
      dimensions: null,
      weight: null,
      material: null,
      image_url: null,
      image_gallery: [],
      specs: {},
      color_options: [],
      scene_images: [],
      regular_price: null,
      sale_price: null,
      special_notes: [],
    };

    // 1. 모델 번호 추출 (URL에서 variant 또는 페이지 내 모델 번호)
    const urlMatch = productUrl.match(/products\/([^?]+)/);
    if (urlMatch) {
      const productSlug = urlMatch[1];
      const variantMatch = productUrl.match(/variant=(\d+)/);
      if (variantMatch) {
        // 모델 번호는 제품 코드 + 변형 번호 조합
        const modelMatch = $('*').text().match(/([A-Z]{2,}\d+_\d+)/);
        if (modelMatch) {
          detail.model_number = modelMatch[1];
        }
      }
    }

    // 2. 제품 코드 추출
    const codeText = $('*').text();
    const codeMatch = codeText.match(/商品番号[：:]\s*([A-Z0-9_]+)/i);
    if (codeMatch) {
      detail.product_code = codeMatch[1];
    } else {
      // 대체 방법: 모델 번호에서 추출
      const altMatch = codeText.match(/([A-Z]{2,}\d+[_\d]*)/);
      if (altMatch) {
        detail.product_code = altMatch[1].split('_')[0];
      }
    }

    // 3. 이미지 갤러리 추출
    const galleryImages = [];
    
    // 3-1. JSON-LD에서 추출한 이미지 추가
    jsonLdImages.forEach(imgUrl => {
      const normalizedUrl = normalizeImageUrl(imgUrl, BASE_URL);
      if (normalizedUrl && !galleryImages.includes(normalizedUrl)) {
        galleryImages.push(normalizedUrl);
      }
    });
    
    // 3-2. Shopify 특화 셀렉터로 이미지 수집
    const shopifyImageSelectors = [
      '.product-single__media img',
      '.product__media img',
      '[data-product-image] img',
      '.product-gallery img',
      '.product-images img',
      '[class*="product-image"] img',
      '[class*="featured-image"] img',
      '[class*="main-image"] img',
      'ul li img',
      '[class*="gallery"] img',
      '[class*="slider"] img',
      '[class*="carousel"] img',
    ];
    
    shopifyImageSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        const imgUrl = $(elem).attr('src') || 
                      $(elem).attr('data-src') || 
                      $(elem).attr('data-lazy-src') ||
                      $(elem).attr('data-original') ||
                      $(elem).attr('data-image');
        
        // srcset에서도 추출
        if (!imgUrl) {
          const srcset = $(elem).attr('srcset');
          if (srcset) {
            // srcset에서 가장 큰 이미지 URL 추출 (원본 우선)
            const srcsetUrls = srcset.split(',').map(s => {
              const match = s.trim().match(/^([^\s]+)/);
              return match ? match[1] : null;
            }).filter(Boolean);
            
            if (srcsetUrls.length > 0) {
              // 가장 큰 크기의 이미지 URL 사용 (마지막 항목이 보통 가장 큼)
              const largestUrl = srcsetUrls[srcsetUrls.length - 1];
              const normalizedUrl = normalizeImageUrl(largestUrl, BASE_URL);
              if (normalizedUrl && !galleryImages.includes(normalizedUrl)) {
                galleryImages.push(normalizedUrl);
              }
            }
          }
        } else {
          const normalizedUrl = normalizeImageUrl(imgUrl, BASE_URL);
          if (normalizedUrl && !galleryImages.includes(normalizedUrl)) {
            galleryImages.push(normalizedUrl);
          }
        }
      });
    });
    
    // 3-3. 링크에서 이미지 URL 추출 (갤러리 썸네일 클릭 시)
    $('a[href*="cdn/shop/products"], a[href*="cdn/shop/files"], a[href*="products"], a[href*="files"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && (href.includes('.jpg') || href.includes('.jpeg') || href.includes('.png') || href.includes('.webp'))) {
        const normalizedUrl = normalizeImageUrl(href, BASE_URL);
        if (normalizedUrl && !galleryImages.includes(normalizedUrl)) {
          galleryImages.push(normalizedUrl);
        }
      }
    });
    
    // 3-4. picture 태그에서 source 요소 추출
    $('picture source').each((i, elem) => {
      const srcset = $(elem).attr('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',').map(s => {
          const match = s.trim().match(/^([^\s]+)/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        srcsetUrls.forEach(url => {
          const normalizedUrl = normalizeImageUrl(url, BASE_URL);
          if (normalizedUrl && !galleryImages.includes(normalizedUrl)) {
            galleryImages.push(normalizedUrl);
          }
        });
      }
    });
    
    // 3-5. 중복 제거 및 정렬 (원본 이미지 우선)
    // 먼저 원본 이미지와 크기 변형을 그룹화
    const imageGroups = new Map(); // key: 원본 URL (쿼리 파라미터 제외), value: { original: url, variants: [urls] }
    
    galleryImages.forEach(url => {
      // URL에서 쿼리 파라미터 제거하여 비교
      const urlWithoutQuery = url.split('?')[0];
      
      // Shopify 이미지 URL에서 크기 변형 제거하여 원본 URL 추출
      // 예: JPQS011_24-m-01-dl_333x.jpg -> JPQS011_24-m-01-dl.jpg
      // 패턴: _숫자x숫자 또는 _숫자x (예: _333x333.jpg, _333x.jpg)
      const baseUrl = urlWithoutQuery.replace(/_[0-9]+x[0-9]*\.(jpg|jpeg|png|webp|gif)/i, '.$1');
      
      if (!imageGroups.has(baseUrl)) {
        imageGroups.set(baseUrl, { original: null, variants: [] });
      }
      
      const group = imageGroups.get(baseUrl);
      
      // 크기 변형이 없는 경우 원본으로 간주
      // 패턴: _숫자x숫자 또는 _숫자x (예: _333x333.jpg, _333x.jpg)
      const hasSizeVariant = urlWithoutQuery.match(/_[0-9]+x[0-9]*\.(jpg|jpeg|png|webp|gif)/i);
      if (!hasSizeVariant) {
        // 원본 이미지가 여러 개 있으면 첫 번째 것 사용
        if (!group.original) {
          group.original = url;
        }
      } else {
        group.variants.push(url);
      }
    });
    
    // 원본 이미지 우선, 없으면 가장 큰 크기 변형 선택
    const uniqueImages = [];
    imageGroups.forEach((group, baseUrl) => {
      if (group.original) {
        uniqueImages.push(group.original);
      } else if (group.variants.length > 0) {
        // 가장 큰 크기 변형 선택 (파일명에서 크기 추출)
        const sortedVariants = group.variants.sort((a, b) => {
          const urlA = a.split('?')[0];
          const urlB = b.split('?')[0];
          // _숫자x숫자 또는 _숫자x 패턴 매칭
          const sizeA = urlA.match(/_(\d+)x(\d*)\./);
          const sizeB = urlB.match(/_(\d+)x(\d*)\./);
          if (sizeA && sizeB) {
            const widthA = parseInt(sizeA[1]);
            const heightA = sizeA[2] ? parseInt(sizeA[2]) : widthA; // _333x의 경우 정사각형으로 간주
            const widthB = parseInt(sizeB[1]);
            const heightB = sizeB[2] ? parseInt(sizeB[2]) : widthB;
            const areaA = widthA * heightA;
            const areaB = widthB * heightB;
            return areaB - areaA; // 큰 것부터
          }
          // 크기 정보가 없는 경우 URL 길이로 비교 (짧은 것이 보통 원본)
          return urlA.length - urlB.length;
        });
        uniqueImages.push(sortedVariants[0]);
      } else {
        // fallback: baseUrl 사용
        uniqueImages.push(baseUrl);
      }
    });
    
    detail.image_gallery = uniqueImages;
    // 첫 번째 이미지를 메인 이미지로 사용
    detail.image_url = uniqueImages.length > 0 ? uniqueImages[0] : extractImageUrl($, BASE_URL);

    // 4. 상세 설명 추출
    const descriptionText = $('p').first().text().trim() || 
                           $('[class*="description"]').first().text().trim() ||
                           $('h1').next('p').text().trim();
    
    if (descriptionText && descriptionText.length > 20) {
      detail.description_ja = descriptionText;
    } else if (productData?.description) {
      detail.description_ja = productData.description;
    }

    // 5. 상세 스펙 추출 (製品情報 섹션)
    const specsSection = $('strong:contains("製品情報"), h3:contains("製品情報"), h4:contains("製品情報")').closest('div, section').first();
    if (specsSection.length) {
      specsSection.find('li').each((i, elem) => {
        const text = $(elem).text().trim();
        const match = text.match(/^(.+?)[：:]\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          detail.specs[key] = value;
          
          // 기존 필드에도 매핑
          if (key.includes('サイズ') || key.includes('サイズ')) {
            detail.dimensions = value;
          } else if (key.includes('重量')) {
            detail.weight = value;
          } else if (key.includes('素材')) {
            detail.material = value;
          }
        }
      });
    }

    // 6. 색상 옵션 추출
    const colorSection = $('[aria-label*="Color"], [class*="color"]').first();
    if (colorSection.length) {
      colorSection.find('button, [role="button"], [class*="color-option"]').each((i, elem) => {
        const colorName = $(elem).attr('aria-label') || $(elem).attr('title') || $(elem).text().trim();
        if (colorName && colorName.length > 0) {
          detail.color_options.push(colorName);
        }
      });
    }
    
    // 대체 방법: 텍스트에서 색상 추출
    if (detail.color_options.length === 0) {
      const colorText = $('*').text();
      const colorMatches = colorText.match(/カラー[：:]\s*(.+?)(?:\n|$)/);
      if (colorMatches) {
        const colors = colorMatches[1].split(/[、,]/).map(c => c.trim()).filter(c => c.length > 0);
        detail.color_options = colors;
      }
    }

    // 7. 씬 이미지 추출
    const sceneSection = $('h2:contains("Scene"), h4:contains("シーン")').closest('div, section').first();
    if (sceneSection.length) {
      sceneSection.find('a[href*="/collections/scene"], img').each((i, elem) => {
        const $elem = $(elem);
        const sceneUrl = $elem.attr('href');
        const sceneImg = $elem.find('img').first() || $elem;
        const imgUrl = sceneImg.attr('src') || sceneImg.attr('data-src');
        const sceneName = $elem.attr('aria-label') || $elem.attr('alt') || $elem.text().trim();
        
        if (imgUrl || sceneUrl) {
          detail.scene_images.push({
            name: sceneName,
            image_url: imgUrl ? normalizeImageUrl(imgUrl, BASE_URL) : null,
            scene_url: sceneUrl || null,
          });
        }
      });
    }

    // 8. 가격 정보 추출
    const priceText = $('*').text();
    const regularPriceMatch = priceText.match(/通常価格[：:\s]*¥?([\d,]+)/);
    const salePriceMatch = priceText.match(/販売価格[：:\s]*¥?([\d,]+)/);
    
    if (regularPriceMatch) {
      detail.regular_price = parseInt(regularPriceMatch[1].replace(/,/g, ''));
    }
    if (salePriceMatch) {
      detail.sale_price = parseInt(salePriceMatch[1].replace(/,/g, ''));
    } else if (regularPriceMatch) {
      // 판매가가 없으면 정가를 판매가로 사용
      detail.sale_price = detail.regular_price;
    }

    // 9. 특記事항 추출
    const notesSection = $('strong:contains("特記事項"), h3:contains("特記事項"), h4:contains("特記事項")').closest('div, section').first();
    if (notesSection.length) {
      notesSection.find('li').each((i, elem) => {
        const noteText = $(elem).text().trim();
        if (noteText && noteText.length > 0) {
          detail.special_notes.push(noteText);
        }
      });
    }

    // 10. 번역 처리 (기존 번역 확인 후 스킵)
    const existingProduct = await getProductByDetailUrl(productUrl);
    
    // 상세 설명 번역
    if (detail.description_ja) {
      if (existingProduct && existingProduct.description_ko && existingProduct.description_ja === detail.description_ja) {
        // 기존 번역이 있고 일본어 텍스트가 변경되지 않은 경우
        detail.description_ko = existingProduct.description_ko;
        console.log(`  ⏭️ 설명 번역 스킵 (기존 번역 사용)`);
      } else {
        // 번역이 필요함
        detail.description_ko = await translateJaToKo(detail.description_ja);
      }
    }
    
    // Material 번역
    if (detail.material) {
      if (existingProduct && existingProduct.material_ja === detail.material && existingProduct.material_ko) {
        // 기존 번역이 있고 일본어 텍스트가 변경되지 않은 경우
        detail.material_ja = existingProduct.material_ja;
        detail.material_ko = existingProduct.material_ko;
        console.log(`  ⏭️ Material 번역 스킵 (기존 번역 사용)`);
      } else {
        // 번역이 필요함
        detail.material_ja = detail.material;
        detail.material_ko = await translateJaToKo(detail.material);
      }
    }
    
    // Specs 번역
    if (detail.specs && Object.keys(detail.specs).length > 0) {
      let existingSpecsJa = {};
      let existingSpecsKo = {};
      
      // 기존 specs 파싱
      if (existingProduct && existingProduct.specs_ja) {
        try {
          existingSpecsJa = JSON.parse(existingProduct.specs_ja);
        } catch (e) {
          // JSON 파싱 실패 시 빈 객체 유지
        }
      }
      
      if (existingProduct && existingProduct.specs_ko) {
        try {
          existingSpecsKo = JSON.parse(existingProduct.specs_ko);
        } catch (e) {
          // JSON 파싱 실패 시 빈 객체 유지
        }
      }
      
      const specsJa = {};
      const specsKo = {};
      const valuesToTranslate = [];
      const translateKeys = [];
      
      // 각 스펙 항목 처리
      for (const [key, value] of Object.entries(detail.specs)) {
        specsJa[key] = value;
        
        // 재번역 방지 확인
        if (existingSpecsJa[key] === value && existingSpecsKo[key]) {
          // 기존 번역이 있고 일본어 값이 변경되지 않은 경우
          specsKo[key] = existingSpecsKo[key];
        } else {
          // 번역이 필요함
          valuesToTranslate.push(value);
          translateKeys.push(key);
        }
      }
      
      // 번역 필요한 값들만 배치 번역
      if (valuesToTranslate.length > 0) {
        const translations = await translateBatch(valuesToTranslate);
        translateKeys.forEach((key, index) => {
          specsKo[key] = translations[index]?.translated || valuesToTranslate[index];
        });
      }
      
      detail.specs_ja = specsJa;
      detail.specs_ko = specsKo;
      
      if (valuesToTranslate.length === 0) {
        console.log(`  ⏭️ Specs 번역 스킵 (기존 번역 사용)`);
      }
    }
    
    // 색상 옵션 번역
    if (detail.color_options.length > 0 && typeof detail.color_options[0] === 'string') {
      let existingColors = [];
      
      // 기존 색상 옵션이 있는지 확인
      if (existingProduct && existingProduct.color_options) {
        try {
          const parsed = JSON.parse(existingProduct.color_options);
          if (Array.isArray(parsed)) {
            existingColors = parsed;
          }
        } catch (e) {
          // JSON 파싱 실패 시 빈 배열 유지
        }
      }
      
      // 기존 색상 맵 생성 (일본어 이름으로 인덱싱)
      const existingColorMap = new Map();
      existingColors.forEach(color => {
        const key = typeof color === 'string' ? color : color.name_ja;
        if (key) {
          existingColorMap.set(key, color);
        }
      });
      
      // 새 색상 배열 생성
      const newColorOptions = [];
      const colorsToTranslate = [];
      const translateIndices = [];
      
      detail.color_options.forEach((newColor, index) => {
        const existingColor = existingColorMap.get(newColor);
        
        if (existingColor && typeof existingColor === 'object' && existingColor.name_ja === newColor && existingColor.name_ko) {
          // 기존 번역이 있고 일본어 이름이 일치하는 경우
          newColorOptions.push(existingColor);
        } else {
          // 번역이 필요함
          colorsToTranslate.push(newColor);
          translateIndices.push(index);
          newColorOptions.push(null); // 플레이스홀더
        }
      });
      
      // 번역이 필요한 색상만 번역
      if (colorsToTranslate.length > 0) {
        const translations = await translateBatch(colorsToTranslate);
        translateIndices.forEach((originalIndex, translateIndex) => {
          newColorOptions[originalIndex] = {
            name_ja: colorsToTranslate[translateIndex],
            name_ko: translations[translateIndex]?.translated || colorsToTranslate[translateIndex],
          };
        });
      } else if (newColorOptions.length > 0) {
        console.log(`  ⏭️ 색상 옵션 번역 스킵 (기존 번역 사용)`);
      }
      
      detail.color_options = newColorOptions;
    }

    console.log(`  ✅ 상세 정보 추출 완료: ${detail.product_code || 'N/A'}`);
    if (detail.image_gallery.length > 0) {
      console.log(`  📸 이미지 갤러리: ${detail.image_gallery.length}개`);
    }

    return detail;
  } catch (error) {
    console.error(`상품 상세 크롤링 실패 (${productUrl}):`, error.message);
    return null;
  }
}

/**
 * 전체 크롤링 프로세스 실행
 */
export async function crawlAll() {
  const result = {
    categories: [],
    products: [],
    errors: [],
    stats: {
      totalProducts: 0,
      productsWithImages: 0,
      productsWithoutImages: 0,
      detailCrawlSuccess: 0,
      detailCrawlFailed: 0,
    },
  };

  // 동시 요청 수 제한 (p-limit 사용)
  const limit = pLimit(BATCH_SIZE);

  try {
    // 0. 이미지 디렉토리 초기화
    console.log('📁 이미지 디렉토리 초기화...');
    await ensureImageDirectories();
    
    // 1. 카테고리 크롤링
    console.log('📦 카테고리 크롤링 시작...');
    result.categories = await crawlCategories();
    console.log(`✅ 카테고리 ${result.categories.length}개 발견`);
    
    // 카테고리 이미지 다운로드
    console.log('🖼️ 카테고리 이미지 다운로드 중...');
    for (const category of result.categories) {
      if (category.image_url) {
        const localPath = await downloadAndSaveImage(category.image_url, 'category');
        if (localPath) {
          category.image_url = localPath;
        }
      }
    }

    // 2. 각 카테고리의 상품 크롤링
    for (let catIndex = 0; catIndex < result.categories.length; catIndex++) {
      const category = result.categories[catIndex];
      try {
        console.log(`\n📂 [${catIndex + 1}/${result.categories.length}] 카테고리 "${category.name_ja}" 상품 크롤링 중...`);
        const products = await crawlProducts(category.slug);
        console.log(`  📋 목록 페이지에서 ${products.length}개 상품 발견`);
        
        if (products.length === 0) {
          console.log(`  ⚠️ 상품이 없습니다.`);
          continue;
        }

        // 3. 각 상품의 상세 페이지 크롤링 (배치 처리)
        console.log(`  🔍 상세 페이지 크롤링 시작 (배치 크기: ${BATCH_SIZE})...`);
        
        const productsWithDetails = [];
        const batchPromises = [];
        
        for (let i = 0; i < products.length; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE);
          const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(products.length / BATCH_SIZE);
          
          console.log(`  📦 배치 ${batchIndex}/${totalBatches} 처리 중... (${batch.length}개 상품)`);
          
          const batchResults = await Promise.all(
            batch.map((product, productIndexInBatch) =>
              limit(async () => {
                try {
                  // 임시 고유 ID 생성 (카테고리 인덱스 * 100000 + 전체 상품 인덱스)
                  // i는 배치 시작 인덱스, productIndexInBatch는 배치 내 인덱스
                  const globalProductIndex = i + productIndexInBatch;
                  const tempProductId = (catIndex + 1) * 100000 + globalProductIndex + 1;
                  
                  // 이미 목록 페이지에서 이미지를 찾았으면 상세 페이지는 선택적으로 크롤링
                  const needsDetailCrawl = !product.image_url || !product.description_ja || !product.product_code;
                  
                  if (needsDetailCrawl) {
                    const detail = await crawlProductDetail(product.detail_url);
                    
                    if (detail) {
                      // 이미지 갤러리 다운로드
                      let imageLocalPath = null;
                      let galleryLocalPaths = [];
                      
                      const imageUrl = detail.image_url || product.image_url;
                      if (imageUrl) {
                        imageLocalPath = await downloadAndSaveImage(
                          imageUrl, 
                          'product', 
                          detail.product_code || product.product_code,
                          tempProductId
                        );
                      }
                      
                      // 갤러리 이미지들 다운로드
                      if (detail.image_gallery && detail.image_gallery.length > 0) {
                        const galleryImages = detail.image_gallery.map((url, imgIndex) => ({
                          url: url,
                          type: 'product',
                          productCode: detail.product_code || product.product_code,
                          productId: tempProductId * 1000 + imgIndex, // 갤러리 이미지도 고유하게
                        }));
                        
                        const galleryResults = await downloadImagesBatch(galleryImages, 3);
                        galleryLocalPaths = galleryResults
                          .map(r => r.localPath)
                          .filter(path => path !== null);
                        
                        // 첫 번째 다운로드된 이미지를 메인 이미지로 사용
                        if (!imageLocalPath && galleryLocalPaths.length > 0) {
                          imageLocalPath = galleryLocalPaths[0];
                        }
                      }
                      
                      // 씬 이미지 다운로드
                      let sceneImagesWithPaths = [];
                      if (detail.scene_images && detail.scene_images.length > 0) {
                        const sceneImageUrls = detail.scene_images
                          .map(s => s.image_url)
                          .filter(url => url !== null);
                        
                        if (sceneImageUrls.length > 0) {
                          const sceneImages = sceneImageUrls.map((url, sceneIndex) => ({
                            url: url,
                            type: 'product',
                            productCode: detail.product_code || product.product_code,
                            productId: tempProductId * 10000 + sceneIndex, // 씬 이미지도 고유하게
                          }));
                          
                          const sceneResults = await downloadImagesBatch(sceneImages, 2);
                          const sceneLocalPaths = sceneResults
                            .map(r => r.localPath)
                            .filter(path => path !== null);
                          
                          // 씬 이미지 정보와 로컬 경로 매핑
                          sceneImagesWithPaths = detail.scene_images.map((scene, index) => ({
                            ...scene,
                            local_image_url: sceneLocalPaths[index] || scene.image_url,
                          }));
                        } else {
                          sceneImagesWithPaths = detail.scene_images;
                        }
                      }
                      
                      // 상세 페이지에서 추출한 정보로 병합 (상세 페이지 우선)
                      return {
                        ...product,
                        image_url: imageLocalPath || imageUrl || null,
                        image_gallery: galleryLocalPaths.length > 0 ? galleryLocalPaths : (detail.image_gallery || []),
                        description_ja: detail.description_ja || product.description_ja,
                        description_ko: detail.description_ko || product.description_ko,
                        product_code: detail.product_code || product.product_code,
                        model_number: detail.model_number || null,
                        dimensions: detail.dimensions || product.dimensions,
                        weight: detail.weight || product.weight,
                        material: detail.material || product.material,
                        material_ja: detail.material_ja || null,
                        material_ko: detail.material_ko || null,
                        specs: detail.specs && Object.keys(detail.specs).length > 0 ? detail.specs : null,
                        specs_ja: detail.specs_ja && Object.keys(detail.specs_ja).length > 0 ? detail.specs_ja : null,
                        specs_ko: detail.specs_ko && Object.keys(detail.specs_ko).length > 0 ? detail.specs_ko : null,
                        color_options: detail.color_options && detail.color_options.length > 0 ? detail.color_options : null,
                        scene_images: sceneImagesWithPaths.length > 0 ? sceneImagesWithPaths : null,
                        regular_price: detail.regular_price || null,
                        sale_price: detail.sale_price || product.price || null,
                        special_notes: detail.special_notes && detail.special_notes.length > 0 ? detail.special_notes : null,
                      };
                    }
                  }
                  
                  // 상세 크롤링이 필요 없거나 실패한 경우 목록 페이지 데이터 반환
                  // 목록 페이지 이미지가 있으면 다운로드 시도
                  let imageLocalPath = null;
                  if (product.image_url) {
                    const globalProductIndex = i + productIndexInBatch;
                    const tempProductId = (catIndex + 1) * 100000 + globalProductIndex + 1;
                    imageLocalPath = await downloadAndSaveImage(
                      product.image_url, 
                      'product', 
                      product.product_code,
                      tempProductId
                    );
                    if (imageLocalPath) {
                      product.image_url = imageLocalPath;
                    }
                  }
                  return product;
                } catch (error) {
                  console.warn(`    ⚠️ 상세 크롤링 실패: ${product.detail_url} - ${error.message}`);
                  result.stats.detailCrawlFailed++;
                  // 실패해도 목록 페이지 데이터는 유지
                  // 목록 페이지 이미지가 있으면 다운로드 시도
                  let imageLocalPath = null;
                  if (product.image_url) {
                    const globalProductIndex = i + productIndexInBatch;
                    const tempProductId = (catIndex + 1) * 100000 + globalProductIndex + 1;
                    imageLocalPath = await downloadAndSaveImage(
                      product.image_url, 
                      'product', 
                      product.product_code,
                      tempProductId
                    );
                  }
                  
                  return {
                    ...product,
                    image_url: imageLocalPath || product.image_url || null,
                    // 기본값 설정
                    image_gallery: [],
                    specs: null,
                    specs_ja: null,
                    specs_ko: null,
                    material_ja: null,
                    material_ko: null,
                    color_options: null,
                    scene_images: null,
                    special_notes: null,
                  };
                }
              })
            )
          );
          
          productsWithDetails.push(...batchResults);
          result.stats.detailCrawlSuccess += batchResults.filter(p => p.image_url || p.description_ja).length;
        }

        // 이미지 통계 업데이트
        productsWithDetails.forEach(product => {
          if (product.image_url) {
            result.stats.productsWithImages++;
          } else {
            result.stats.productsWithoutImages++;
          }
        });

        result.products.push(...productsWithDetails);
        console.log(`  ✅ 완료: ${productsWithDetails.length}개 상품 (이미지: ${productsWithDetails.filter(p => p.image_url).length}개)`);
      } catch (error) {
        result.errors.push({
          type: 'category',
          slug: category.slug,
          error: error.message,
        });
        console.error(`  ❌ 카테고리 "${category.name_ja}" 크롤링 실패:`, error.message);
      }
    }

    // 최종 통계 출력
    result.stats.totalProducts = result.products.length;
    console.log(`\n📊 크롤링 완료 통계:`);
    console.log(`  - 총 상품 수: ${result.stats.totalProducts}개`);
    console.log(`  - 이미지 있는 상품: ${result.stats.productsWithImages}개 (${((result.stats.productsWithImages / result.stats.totalProducts) * 100).toFixed(1)}%)`);
    console.log(`  - 이미지 없는 상품: ${result.stats.productsWithoutImages}개`);
    console.log(`  - 상세 크롤링 성공: ${result.stats.detailCrawlSuccess}개`);
    console.log(`  - 상세 크롤링 실패: ${result.stats.detailCrawlFailed}개`);
    console.log(`  - 오류 수: ${result.errors.length}개`);

    return result;
  } catch (error) {
    console.error('❌ 전체 크롤링 실패:', error.message);
    throw error;
  }
}
