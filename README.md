# USM

React + Vite 기반 프론트엔드. API 백엔드는 Express + MSSQL이며 별도 호스팅이 필요합니다.

## 로컬 실행

```bash
npm install
npm run dev          # 프론트 dev
npm run dev:server   # 백엔드 API 서버만 실행
```

백엔드 설정 및 DB 연동은 `README_SERVER.md` 참고.

---

## Vercel 배포 (프론트엔드)

**Vercel에는 프론트엔드(SPA)만 배포됩니다.** API 서버(Express + MSSQL)는 Railway, Render, Azure 등에 따로 배포한 뒤, 아래 환경 변수로 그 주소를 연결해야 합니다.

### 1. 저장소 연동

1. [vercel.com](https://vercel.com) 로그인 후 **Add New → Project**
2. GitHub/GitLab/Bitbucket 저장소 선택 후 **Import**
3. Framework Preset은 **Vite** 로 두고 **Deploy** (루트에 `vercel.json` 있어 자동 인식)

### 2. 환경 변수 설정

배포된 API 서버의 **기준 URL**을 넣습니다. 경로 `/api` 는 제외하고, 스킴 포함해서 입력하세요.

| 이름 | 설명 | 예시 |
|------|------|------|
| `VITE_API_URL` | API 서버 기준 URL (스킴 + 호스트, 마지막 슬래시 없음) | `https://your-api.railway.app` |

- Vercel 대시보드: **Project → Settings → Environment Variables**
- `VITE_API_URL` 추가 후 값에 `https://your-api.example.com` 형태로 입력
- 미설정 시 프론트는 기본값 `http://localhost:3001` 를 사용해, 배포 환경에서는 API 호출이 실패합니다.

### 3. 배포 후 확인

- 빌드 성공 시 **Visit** 로 배포 URL 접속
- 상품/카테고리 등이 안 보이면 `VITE_API_URL` 이 올바른지, 해당 백엔드가 살아 있는지 확인

### 4. 로컬에서 Vercel CLI로 preview

```bash
npm i -g vercel
vercel
```

프롬프트에 따라 로그인·프로젝트 연결 후, 같은 프로젝트에 환경 변수를 넣어 두면 로컬 프리뷰도 동일 설정으로 동작합니다.
