import { crawlProductDetail } from '../services/crawler.js';

async function testImageExtraction() {
  const testUrl = 'https://jp.shop.usm.com/products/jpqs011_24';
  
  console.log('🧪 이미지 추출 테스트 시작...');
  console.log(`테스트 URL: ${testUrl}\n`);
  
  try {
    const detail = await crawlProductDetail(testUrl);
    
    console.log('✅ 크롤링 완료!\n');
    console.log('📋 추출된 정보:');
    console.log(`제품 코드: ${detail.product_code || 'NULL'}`);
    console.log(`모델 번호: ${detail.model_number || 'NULL'}`);
    console.log(`메인 이미지: ${detail.image_url || 'NULL'}`);
    console.log(`\n🖼️ 이미지 갤러리 (${detail.image_gallery?.length || 0}개):`);
    
    if (detail.image_gallery && detail.image_gallery.length > 0) {
      // 원본 이미지만 필터링하여 표시
      const originalImages = detail.image_gallery.filter(url => {
        const urlWithoutQuery = url.split('?')[0];
        return !urlWithoutQuery.match(/_[0-9]+x[0-9]+\.(jpg|jpeg|png|webp|gif)/i);
      });
      
      console.log(`  원본 이미지: ${originalImages.length}개`);
      originalImages.slice(0, 10).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
      if (originalImages.length > 10) {
        console.log(`  ... 외 ${originalImages.length - 10}개`);
      }
      
      console.log(`\n  전체 이미지 (크기 변형 포함):`);
      detail.image_gallery.slice(0, 20).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
      if (detail.image_gallery.length > 20) {
        console.log(`  ... 외 ${detail.image_gallery.length - 20}개`);
      }
    } else {
      console.log('  이미지가 추출되지 않았습니다.');
    }
    
    console.log(`\n📝 설명: ${detail.description_ja ? detail.description_ja.substring(0, 100) + '...' : 'NULL'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

testImageExtraction();
