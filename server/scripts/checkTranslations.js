import sql from 'mssql';
import dotenv from 'dotenv';
import { getPool } from '../config/db.js';

dotenv.config();

async function checkTranslations() {
  try {
    const pool = await getPool();
    
    console.log('\n📊 번역 결과 확인\n');
    
    // Material 번역 확인
    const materialQuery = `
      SELECT TOP 5
        product_code,
        material,
        material_ja,
        material_ko
      FROM [dbo].[products]
      WHERE material_ja IS NOT NULL OR material_ko IS NOT NULL
      ORDER BY updated_at DESC
    `;
    
    const materialResult = await pool.request().query(materialQuery);
    console.log('=== Material 번역 ===');
    materialResult.recordset.forEach(row => {
      console.log(`\n제품 코드: ${row.product_code}`);
      console.log(`  Material (원본): ${row.material || 'N/A'}`);
      console.log(`  Material (일본어): ${row.material_ja || 'N/A'}`);
      console.log(`  Material (한국어): ${row.material_ko || 'N/A'}`);
    });
    
    // Specs 번역 확인
    const specsQuery = `
      SELECT TOP 3
        product_code,
        specs,
        specs_ja,
        specs_ko
      FROM [dbo].[products]
      WHERE specs_ja IS NOT NULL OR specs_ko IS NOT NULL
      ORDER BY updated_at DESC
    `;
    
    const specsResult = await pool.request().query(specsQuery);
    console.log('\n\n=== Specs 번역 ===');
    specsResult.recordset.forEach(row => {
      console.log(`\n제품 코드: ${row.product_code}`);
      try {
        const specs = row.specs ? JSON.parse(row.specs) : {};
        const specsJa = row.specs_ja ? JSON.parse(row.specs_ja) : {};
        const specsKo = row.specs_ko ? JSON.parse(row.specs_ko) : {};
        
        console.log(`  Specs (원본): ${JSON.stringify(specs, null, 2)}`);
        console.log(`  Specs (일본어): ${JSON.stringify(specsJa, null, 2)}`);
        console.log(`  Specs (한국어): ${JSON.stringify(specsKo, null, 2)}`);
      } catch (e) {
        console.log(`  Specs 파싱 오류: ${e.message}`);
      }
    });
    
    // Color Options 번역 확인
    const colorQuery = `
      SELECT TOP 3
        product_code,
        color_options
      FROM [dbo].[products]
      WHERE color_options IS NOT NULL
      ORDER BY updated_at DESC
    `;
    
    const colorResult = await pool.request().query(colorQuery);
    console.log('\n\n=== Color Options 번역 ===');
    colorResult.recordset.forEach(row => {
      console.log(`\n제품 코드: ${row.product_code}`);
      try {
        const colors = row.color_options ? JSON.parse(row.color_options) : [];
        if (Array.isArray(colors)) {
          colors.forEach((color, index) => {
            if (typeof color === 'object' && color.name_ja) {
              console.log(`  색상 ${index + 1}: ${color.name_ja} → ${color.name_ko || 'N/A'}`);
            } else {
              console.log(`  색상 ${index + 1}: ${color}`);
            }
          });
        }
      } catch (e) {
        console.log(`  Color Options 파싱 오류: ${e.message}`);
      }
    });
    
    // 통계
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_products,
        SUM(CASE WHEN material_ja IS NOT NULL THEN 1 ELSE 0 END) AS products_with_material_ja,
        SUM(CASE WHEN material_ko IS NOT NULL THEN 1 ELSE 0 END) AS products_with_material_ko,
        SUM(CASE WHEN specs_ja IS NOT NULL THEN 1 ELSE 0 END) AS products_with_specs_ja,
        SUM(CASE WHEN specs_ko IS NOT NULL THEN 1 ELSE 0 END) AS products_with_specs_ko,
        SUM(CASE WHEN color_options IS NOT NULL THEN 1 ELSE 0 END) AS products_with_colors
      FROM [dbo].[products]
    `;
    
    const statsResult = await pool.request().query(statsQuery);
    const stats = statsResult.recordset[0];
    console.log('\n\n=== 번역 통계 ===');
    console.log(`전체 상품 수: ${stats.total_products}`);
    console.log(`Material (일본어): ${stats.products_with_material_ja}개`);
    console.log(`Material (한국어): ${stats.products_with_material_ko}개`);
    console.log(`Specs (일본어): ${stats.products_with_specs_ja}개`);
    console.log(`Specs (한국어): ${stats.products_with_specs_ko}개`);
    console.log(`Color Options: ${stats.products_with_colors}개`);
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkTranslations();
