import { getPool } from '../config/db.js';

async function checkDuplicateImages() {
  try {
    console.log('🔍 DB 연결 중...');
    const pool = await getPool();
    console.log('✅ DB 연결 성공!\n');
    
    // 중복된 이미지 URL 확인
    const result = await pool.request().query(`
      SELECT 
        image_url, 
        COUNT(*) as count,
        STRING_AGG(CAST(id AS VARCHAR), ', ') as ids,
        STRING_AGG(CAST(legacy_id AS VARCHAR), ', ') as legacy_ids,
        STRING_AGG(COALESCE(name_ko, name_ja), ' | ') as names
      FROM [dbo].[products]
      WHERE image_url IS NOT NULL
      GROUP BY image_url
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (result.recordset.length === 0) {
      console.log('✅ 중복된 이미지 URL이 없습니다.');
    } else {
      console.log(`⚠️ 중복된 이미지 URL 발견: ${result.recordset.length}개\n`);
      result.recordset.forEach((r, idx) => {
        console.log(`\n${idx + 1}. 이미지 URL: ${r.image_url}`);
        console.log(`   중복 개수: ${r.count}`);
        console.log(`   상품 ID: ${r.ids}`);
        console.log(`   Legacy ID: ${r.legacy_ids}`);
        console.log(`   상품명: ${r.names}`);
      });
    }
    
    // 각 상품의 이미지 URL과 product_code 확인
    console.log('\n\n📋 모든 상품의 이미지 URL과 product_code 확인:');
    const allProducts = await pool.request().query(`
      SELECT TOP 20
        id,
        legacy_id,
        product_code,
        name_ko,
        name_ja,
        image_url
      FROM [dbo].[products]
      ORDER BY id
    `);
    
    allProducts.recordset.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ID: ${p.id}, Legacy: ${p.legacy_id || 'NULL'}`);
      console.log(`   코드: ${p.product_code || 'NULL'}`);
      console.log(`   이름: ${p.name_ko || p.name_ja}`);
      console.log(`   이미지: ${p.image_url || 'NULL'}`);
    });
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkDuplicateImages();
