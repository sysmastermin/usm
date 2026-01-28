import { getPool } from '../config/db.js';

async function checkDuplicateProducts() {
  try {
    console.log('🔍 DB 연결 중...');
    const pool = await getPool();
    console.log('✅ DB 연결 성공!\n');
    
    // ID 26과 27의 상세 정보 확인
    const result = await pool.request().query(`
      SELECT 
        id, 
        legacy_id, 
        product_code, 
        name_ko, 
        name_ja,
        detail_url, 
        image_url
      FROM [dbo].[products]
      WHERE id IN (26, 27)
      ORDER BY id
    `);
    
    console.log('ID 26과 27의 상세 정보:');
    result.recordset.forEach(p => {
      console.log(`\nID: ${p.id}, Legacy: ${p.legacy_id || 'NULL'}`);
      console.log(`코드: ${p.product_code || 'NULL'}`);
      console.log(`이름: ${p.name_ko || p.name_ja}`);
      console.log(`detail_url: ${p.detail_url}`);
      console.log(`image_url: ${p.image_url}`);
    });
    
    // 같은 detail_url을 가진 상품 확인
    const duplicateDetailUrl = await pool.request().query(`
      SELECT 
        detail_url,
        COUNT(*) as count,
        STRING_AGG(CAST(id AS VARCHAR), ', ') as ids
      FROM [dbo].[products]
      GROUP BY detail_url
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateDetailUrl.recordset.length > 0) {
      console.log('\n\n⚠️ 같은 detail_url을 가진 상품:');
      duplicateDetailUrl.recordset.forEach(r => {
        console.log(`\ndetail_url: ${r.detail_url}`);
        console.log(`중복 개수: ${r.count}`);
        console.log(`상품 ID: ${r.ids}`);
      });
    } else {
      console.log('\n✅ 같은 detail_url을 가진 상품이 없습니다.');
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkDuplicateProducts();
