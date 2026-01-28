# USM 크롤링 서버

## 환경 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
# MSSQL Database Configuration
DB_HOST=59.23.231.197,14103
DB_USER=1stplatfor_sql
DB_PASS=@allin#am1071
DB_NAME=usm

# DeepL Translation API
DEEPL_API_KEY=507236b4-4da6-46e2-b3cf-183194b4e602:fx

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 서버 실행

```bash
npm run dev:server
```

서버는 `http://localhost:3001`에서 실행됩니다.

## 크롤러 실행 방법

### 1. 서버 실행

먼저 서버를 실행해야 합니다:

```bash
npm run dev:server
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 2. 크롤링 시작

**PowerShell에서:**
```powershell
# 크롤링 시작
Invoke-WebRequest -Uri http://localhost:3001/api/ingest -Method POST

# 진행 상황 확인
Invoke-WebRequest -Uri http://localhost:3001/api/ingest/status
```

**또는 브라우저에서:**
- 크롤링 시작: `http://localhost:3001/api/ingest` (POST 요청 필요)
- 진행 상황: `http://localhost:3001/api/ingest/status`

### 3. 크롤링 상태 확인

크롤링은 백그라운드에서 실행되며, `/api/ingest/status` 엔드포인트로 진행 상황을 확인할 수 있습니다:

```json
{
  "success": true,
  "data": {
    "status": "running",  // idle, running, completed, error
    "progress": 50,       // 0-100
    "message": "카테고리 크롤링 중...",
    "result": null
  }
}
```

### 4. 번역 중복 방지

크롤러는 자동으로 번역 중복을 방지합니다:
- 이미 DB에 번역된 데이터가 있으면 번역 API를 호출하지 않습니다
- 일본어 텍스트가 변경된 경우에만 번역을 수행합니다
- 번역 API 비용을 절감할 수 있습니다

## API 엔드포인트

### POST /api/ingest
크롤링 실행 및 DB 저장 (비동기 처리)

### GET /api/ingest/status
크롤링 진행 상황 조회

### GET /api/categories
카테고리 목록 조회

### GET /api/products
상품 목록 조회
- Query params: `categoryId`, `categorySlug`, `search`, `limit`

### GET /api/products/:id
상품 상세 조회 (내부 DB id)

### GET /api/products/legacy/:id
상품 상세 조회 (legacy_id)

## 데이터베이스 스키마

### categories 테이블
- id (PK)
- name_ja (일본어 이름)
- name_ko (한국어 이름)
- slug
- url
- image_url
- created_at
- updated_at

### products 테이블
- id (PK)
- category_id (FK)
- name_ja (일본어 이름)
- name_ko (한국어 이름)
- description_ja (일본어 설명)
- description_ko (한국어 설명)
- product_code
- price
- image_url
- detail_url
- dimensions
- weight
- material
- rank
- badges (JSON)
- raw_data (JSON)
- created_at
- updated_at
