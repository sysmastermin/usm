import sql from 'mssql';
import dotenv from 'dotenv';
import { getPool } from '../config/db.js';
import { createCategoriesTable, createProductsTable } from '../services/dbService.js';

dotenv.config();

async function checkDatabase() {
  try {
    console.log('🔍 DB 연결 정보 확인 중...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASS:', process.env.DB_PASS ? '***설정됨***' : '❌ 없음');
    
    const pool = await getPool();
    console.log('\n✅ DB 연결 성공!\n');
    
    // 현재 연결된 DB 확인
    const dbResult = await pool.request().query('SELECT DB_NAME() AS current_db, @@SERVERNAME AS server_name');
    console.log('📊 현재 연결된 DB:', dbResult.recordset[0]);
    
    // products 테이블 컬럼 확인
    console.log('\n📋 products 테이블 컬럼 확인 중...');
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n현재 products 테이블 컬럼:');
    columnsResult.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
    });
    
    // image_gallery 컬럼 존재 여부 확인
    const hasImageGallery = columnsResult.recordset.some(col => col.COLUMN_NAME === 'image_gallery');
    console.log(`\n${hasImageGallery ? '✅' : '❌'} image_gallery 컬럼: ${hasImageGallery ? '존재함' : '없음'}`);
    
    if (!hasImageGallery) {
      console.log('\n🔧 마이그레이션 실행 중...');
      await createProductsTable();
      console.log('✅ 마이그레이션 완료');
      
      // 다시 확인
      const columnsResult2 = await pool.request().query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'image_gallery'
      `);
      
      if (columnsResult2.recordset.length > 0) {
        console.log('✅ image_gallery 컬럼이 성공적으로 추가되었습니다!');
      } else {
        console.log('❌ image_gallery 컬럼 추가 실패');
      }
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkDatabase();
