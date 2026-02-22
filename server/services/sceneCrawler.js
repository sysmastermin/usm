import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import {
  findProductsByCode,
  linkProductToScene,
  getSceneByCategoryAndNumber,
} from './sceneService.js';

const BASE_URL = 'https://jp.shop.usm.com';
const CRAWL_TIMEOUT = 30000;

/**
 * 씬 페이지에서 연결 상품 코드를 추출
 * @param {string} url - 씬 페이지 URL
 * @returns {{ productCodes: string[], productUrls: string[] }}
 */
async function extractSceneProducts(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
          + 'AppleWebKit/537.36 (KHTML, like Gecko) '
          + 'Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });

    const $ = cheerio.load(html);
    const productCodes = new Set();
    const productUrls = new Set();

    // 1. 상품 링크에서 product code 추출
    $('a[href*="/products/"]').each((_, elem) => {
      const href = $(elem).attr('href') || '';
      const match = href.match(
        /\/products\/([a-zA-Z0-9_-]+)/
      );
      if (match) {
        productCodes.add(match[1]);
        const fullUrl = href.startsWith('http')
          ? href
          : `${BASE_URL}${href}`;
        productUrls.add(fullUrl.split('?')[0]);
      }
    });

    // 2. 상품 코드 텍스트 패턴 검색 (jpqs### 형태)
    const bodyText = $('body').text();
    const codeMatches = bodyText.match(
      /\b(jpqs\d{3,})\b/gi
    );
    if (codeMatches) {
      codeMatches.forEach((code) =>
        productCodes.add(code.toLowerCase())
      );
    }

    // 3. 상품 카드/그리드에서 추출
    $(
      '.product-card, .grid-item, '
      + '[class*="product"], [data-product-id]'
    ).each((_, elem) => {
      const $el = $(elem);
      const productId = $el.attr('data-product-id');
      if (productId) productCodes.add(productId);

      const link = $el.find('a[href*="/products/"]').first();
      if (link.length) {
        const href = link.attr('href') || '';
        const match = href.match(
          /\/products\/([a-zA-Z0-9_-]+)/
        );
        if (match) {
          productCodes.add(match[1]);
          const fullUrl = href.startsWith('http')
            ? href
            : `${BASE_URL}${href}`;
          productUrls.add(fullUrl.split('?')[0]);
        }
      }
    });

    return {
      productCodes: [...productCodes],
      productUrls: [...productUrls],
    };
  } catch (error) {
    console.error(
      `씬 페이지 크롤링 실패 (${url}):`,
      error.message
    );
    return { productCodes: [], productUrls: [] };
  }
}

/**
 * 단일 씬의 연결 상품 크롤링 및 DB 저장
 * @param {{ id: number, scene_category: string, scene_number: string, source_url: string }} scene
 * @returns {{ sceneId: number, linked: number, notFound: string[] }}
 */
async function crawlSingleScene(scene) {
  const url =
    scene.source_url
    || `${BASE_URL}/collections/scene_${scene.scene_category}${scene.scene_number}`;

  console.log(`  크롤링: ${url}`);
  const { productCodes, productUrls } =
    await extractSceneProducts(url);

  if (
    productCodes.length === 0
    && productUrls.length === 0
  ) {
    return {
      sceneId: scene.id,
      linked: 0,
      notFound: [],
    };
  }

  // product_code로 DB 매칭
  const matchedProducts =
    productCodes.length > 0
      ? await findProductsByCode(productCodes)
      : [];

  const matchedIds = new Set(
    matchedProducts.map((p) => p.id)
  );
  const notFound = productCodes.filter(
    (code) =>
      !matchedProducts.find(
        (p) =>
          p.product_code?.toLowerCase()
            === code.toLowerCase()
      )
  );

  let linked = 0;
  const idsArray = [...matchedIds];
  for (let i = 0; i < idsArray.length; i++) {
    try {
      await linkProductToScene(scene.id, idsArray[i], i);
      linked++;
    } catch (err) {
      console.error(
        `  상품 연결 실패 (scene=${scene.id}, `
        + `product=${idsArray[i]}):`,
        err.message
      );
    }
  }

  return { sceneId: scene.id, linked, notFound };
}

/**
 * 여러 씬의 연결 상품 일괄 크롤링
 * @param {Array} scenes - 크롤링할 씬 목록
 * @param {number} concurrency - 동시 크롤링 수
 * @returns {Object} 크롤링 결과 요약
 */
export async function crawlSceneProducts(
  scenes,
  concurrency = 3
) {
  const limit = pLimit(concurrency);
  const results = [];
  let totalLinked = 0;
  const allNotFound = [];

  console.log(`\n씬 상품 크롤링 시작 (${scenes.length}개)...`);

  const tasks = scenes.map((scene, index) =>
    limit(async () => {
      console.log(
        `[${index + 1}/${scenes.length}] `
        + `${scene.scene_category}${scene.scene_number}`
      );
      const result = await crawlSingleScene(scene);
      results.push(result);
      totalLinked += result.linked;
      allNotFound.push(...result.notFound);

      // 요청 간 딜레이
      await new Promise((r) =>
        setTimeout(r, 500 + Math.random() * 500)
      );

      return result;
    })
  );

  await Promise.all(tasks);

  const summary = {
    totalScenes: scenes.length,
    totalLinked,
    notFoundCodes: [...new Set(allNotFound)],
    results,
  };

  console.log(`\n씬 상품 크롤링 완료:`);
  console.log(`  처리 씬: ${summary.totalScenes}개`);
  console.log(`  연결 상품: ${summary.totalLinked}개`);
  console.log(
    `  미매칭 코드: ${summary.notFoundCodes.length}개`
  );

  return summary;
}

/**
 * 특정 카테고리의 씬들만 크롤링
 */
export async function crawlScenesByCategory(
  category,
  scenes
) {
  const filtered = scenes.filter(
    (s) => s.scene_category === category
  );
  return crawlSceneProducts(filtered);
}
