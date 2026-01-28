import sql from 'mssql';
import dotenv from 'dotenv';
import { getPool } from '../config/db.js';

dotenv.config();

async function verifyMigration() {
  try {
    const pool = await getPool();
    
    // 필요한 모든 컬럼 목록
    const requiredColumns = [
      'model_number',
      'regular_price',
      'sale_price',
      'image_gallery',
      'specs',
      'color_options',
      'scene_images',
      'special_notes'
    ];
    
    // 현재 컬럼 확인
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'products'
    `);
    
    const existingColumns = columnsResult.recordset.map(row => row.COLUMN_NAME);
    
    console.log('\n📋 필수 컬럼 확인:');
    let allPresent = true;
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) allPresent = false;
    });
    
    if (allPresent) {
      console.log('\n✅ 모든 필수 컬럼이 존재합니다!');
    } else {
      console.log('\n❌ 일부 컬럼이 누락되었습니다. 마이그레이션을 실행하세요.');
    }
    
    await pool.close();
    process.exit(allPresent ? 0 : 1);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

verifyMigration();
