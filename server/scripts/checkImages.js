import { getPool } from '../config/db.js';

async function checkImages() {
  try {
    console.log('🔍 DB 연결 중...');
    const pool = await getPool();
    console.log('✅ DB 연결 성공!\n');
    
    // 상품 이미지 URL 샘플 확인
    console.log('📸 상품 이미지 URL 샘플 (최대 10개):');
    const productsResult = await pool.request().query(`
      SELECT TOP 10 
        id, 
        legacy_id,
        name_ja,
        name_ko,
        product_code,
        image_url,
        CASE 
          WHEN image_url IS NULL THEN 'NULL'
          WHEN image_url = '' THEN '빈 문자열'
          WHEN image_url LIKE 'http%' THEN '절대 URL'
          WHEN image_url LIKE '/images%' THEN '상대 경로 (/images)'
          ELSE '기타'
        END AS url_type
      FROM [dbo].[products]
      ORDER BY id
    `);
    
    console.log('\n상품 이미지 URL:');
    productsResult.recordset.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ID: ${p.id}, Legacy ID: ${p.legacy_id || 'NULL'}`);
      console.log(`   이름: ${p.name_ko || p.name_ja}`);
      console.log(`   코드: ${p.product_code || 'NULL'}`);
      console.log(`   이미지 URL: ${p.image_url || 'NULL'}`);
      console.log(`   URL 타입: ${p.url_type}`);
    });
    
    // 이미지 URL이 없는 상품 수 확인
    const nullCountResult = await pool.request().query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 ELSE 0 END) AS null_or_empty
      FROM [dbo].[products]
    `);
    
    const stats = nullCountResult.recordset[0];
    console.log(`\n📊 통계:`);
    console.log(`   전체 상품 수: ${stats.total}`);
    console.log(`   이미지 URL 없음: ${stats.null_or_empty || 0}`);
    console.log(`   이미지 URL 있음: ${stats.total - (stats.null_or_empty || 0)}`);
    
    // 중복된 이미지 URL 확인
    console.log('\n\n🔍 중복된 이미지 URL 확인:');
    const duplicateResult = await pool.request().query(`
      SELECT 
        image_url, 
        COUNT(*) as count,
        STRING_AGG(CAST(id AS VARCHAR), ', ') as ids,
        STRING_AGG(CAST(legacy_id AS VARCHAR), ', ') as legacy_ids,
        STRING_AGG(COALESCE(name_ko, name_ja), ' | ') as names,
        STRING_AGG(COALESCE(product_code, 'NULL'), ', ') as product_codes
      FROM [dbo].[products]
      WHERE image_url IS NOT NULL AND image_url != ''
      GROUP BY image_url
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicateResult.recordset.length === 0) {
      console.log('✅ 중복된 이미지 URL이 없습니다.');
    } else {
      console.log(`⚠️ 중복된 이미지 URL 발견: ${duplicateResult.recordset.length}개\n`);
      duplicateResult.recordset.forEach((r, idx) => {
        console.log(`\n${idx + 1}. 이미지 URL: ${r.image_url}`);
        console.log(`   중복 개수: ${r.count}`);
        console.log(`   상품 ID: ${r.ids}`);
        console.log(`   Legacy ID: ${r.legacy_ids}`);
        console.log(`   상품 코드: ${r.product_codes}`);
        console.log(`   상품명: ${r.names}`);
      });
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkImages();
