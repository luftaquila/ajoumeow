# CLAUDE.md

## 프로젝트 개요

아주대학교 고양이 동아리 미유미유의 급식 관리 웹 서비스. 급식 신청/인증, 회원 관리, 갤러리, 날씨 정보 등을 제공한다.

## 아키텍처

- **백엔드**: Fastify 5 (Node.js, native ESM)
- **프론트엔드**: Vite MPA — Vue 3 SPA (timetable, console, apply, register) + 레거시 페이지 (gallery)
- **DB**: SQLite (better-sqlite3 + Drizzle ORM)
- **배포**: Docker multi-stage build, Traefik 리버스 프록시

## 디렉터리 구조

```
frontend/                   # 통합 Vite MPA 프로젝트
  package.json              # Vue + jQuery/Bootstrap 등 통합 의존성
  vite.config.js            # MPA 설정 (13개 HTML entry)
  uno.config.js             # UnoCSS (Vue SPA들 공용)
  shared/                   # 앱 간 공유 코드
    api.js                  # fetch wrapper (request, get, post, put, del, authHeader)
    composables/useTheme.js # 다크/라이트 모드
    utils/dateFormat.js     # 한국어 날짜 포맷
  timetable/                # Vue 3 SPA (급식 캘린더)
    index.html
    src/                    # main.js, App.vue, components/, composables/, api/, utils/
  console/                  # Vue 3 SPA + vue-router (관리자 콘솔)
    index.html              # 단일 진입점
    src/                    # main.js, App.vue, router.js
      api/                  # auth, settings, members, verifications, records, semesters, registrations, logs
      composables/          # useAuth, useSemesters
      components/layout/    # AppLayout, AppSidebar, AppTopbar, SidebarItem
      pages/                # Dashboard, Verify, Settings, Members, Export1365, Recruit, ServerLog
      utils/                # scoreCalculator, contactExport
  apply/                    # Vue 3 SPA (회원 등록)
    index.html
    src/                    # main.js, App.vue, components/, composables/
  register/                 # Vue 3 SPA (신입 모집)
    index.html
    src/                    # main.js, App.vue, components/, composables/
  gallery/                  # 레거시 MPA — 갤러리 (9 HTML)
    entry-base.js           # 공통 vendor (jQuery, Bootstrap, owl.carousel 등)
    entry-{page}.js         # 페이지별 진입점
    cat/, photo/, photographer/  # 서브 페이지 (각 entry.js)
  lib/                      # npm에 없는 레거시 벤더 (alertify v0.x, btn.css)
  public/                   # 정적 파일 (빌드 시 그대로 복사)
    index.html              # 홈페이지
    goods/, guide/, open/, welcome/  # 테마 페이지
    assets/                 # 테마 공유 CSS/JS
    res/                    # 공유 리소스 (fontawesome, 이미지, JSON 등)

server/                     # Fastify 백엔드
  index.js                  # 서버 진입점 (포트 5710), dist/ 서빙
  api/                      # 라우트 핸들러 (Fastify 플러그인)
  controllers/              # 비즈니스 로직 (weatherClient, dbClient, util)
  db/                       # DB 레이어
    schema.js               # Drizzle ORM 스키마 (12개 테이블)
    index.js                # DB 초기화 (WAL, foreign_keys)
  data/                     # SQLite DB 파일 (gitignored)
  dist/                     # 프론트엔드 빌드 출력 (gitignored)

package.json                # 루트: concurrently로 server + frontend 동시 실행
Dockerfile                  # 멀티스테이지 빌드 (frontend build → server)
docker-compose.yml          # 앱 서비스 (Traefik 연동)
```

## 개발 환경 실행

```bash
# 전체 (루트에서 server + frontend 동시 실행)
npm install                 # 루트 concurrently 설치
npm run dev                 # server(:5710) + Vite dev server(:5173) 동시 실행

# 개별 실행
cd server && npm install && npm run dev      # nodemon, :5710
cd frontend && npm install && npm run dev    # Vite dev server, /api·/res → :5710 프록시

# Docker
docker compose up --build
```

SQLite DB 파일(`server/data/ajoumeow.db`)이 필요하다. 마이그레이션된 DB를 복사하여 사용.

## 빌드

```bash
npm run build              # = cd frontend && vite build → server/dist/
```

## 프론트엔드 구조

### Vite MPA 설정
- `vite.config.js`에 13개 HTML entry point 정의 (rollupOptions.input)
- `build.target: 'esnext'` — 레거시 entry 파일의 top-level await 지원
- `rollupOptions.external: /res/` — `/res/` 절대경로는 번들링하지 않음
- `public/` 파일은 빌드 시 그대로 `dist/`로 복사

### Vue 3 SPA 패턴 (timetable, console, apply, register)
- 각 SPA는 `index.html` + `src/main.js` + `src/App.vue` 구조
- `main.js`에서 Vue + PrimeVue(Aura 테마) + UnoCSS + ToastService 부트스트랩
- `shared/api.js`의 `get()/post()/put()/del()` 헬퍼 사용 (JWT 자동 첨부)
- `shared/composables/useTheme.js`로 다크/라이트 모드 관리
- console은 `vue-router`를 사용하는 SPA (7개 라우트)

### 레거시 페이지 패턴 (gallery만 해당)
- 각 페이지 그룹에 `entry-base.js` (공통 vendor) + `entry-{page}.js` (페이지별)
- `entry-base.js`에서 jQuery, Bootstrap 등을 import 후 `window.$`, `window.Cookies` 등 글로벌 설정
- 레거시 JS 파일은 `await import('./js/xxx.js')`로 동적 로딩 (모듈 스코프)
- 글로벌 변수 (`api`, `dateFormat` 등)는 `window.api = '/api'` 패턴으로 노출
- alertify.js v0.x는 npm 버전(v1.x)과 API가 다르므로 `frontend/lib/`에 별도 보관

### 정적 파일 서빙 (프로덕션)
- `server/dist/` 하나로 모든 프론트엔드 서빙
- `globalThis.__distRoot` — 서버 모듈에서 dist 루트 경로 참조 (res/ 내 파일 접근용)
- `/timetable/*`, `/console/*` 404 → 해당 `index.html` SPA 폴백

## 주요 규칙

- **ESM 전용**: 모든 서버 파일이 `import`/`export` 사용. `"type": "module"` 설정됨.
- **import 경로에 `.js` 확장자 필수**: Node.js ESM 해석 규칙 (서버 코드).
- **`__dirname` 사용 금지**: `path.dirname(fileURLToPath(import.meta.url))` 패턴 사용.
- **dotenv 사용 안 함**: 환경 변수는 docker-compose `env_file`로 주입.
- **Fastify 라우트는 플러그인 패턴**: `export default async function(fastify, opts) { ... }`
- **인증 미들웨어는 preHandler**: `{ preHandler: [util.isLogin] }` 옵션으로 전달.
- **preHandler에서 reply 후 `return reply`**: 핸들러 실행을 차단하기 위해 필수.
- **DELETE 응답은 200**: Fastify는 204+body를 지원하지 않음.
- **한국어 문자열**: 로그, 에러 메시지, DB 데이터는 한국어. 변수명/함수명은 영어.
- **API 경로는 상대경로**: 프론트엔드에서 `const api = '/api'` 사용 (절대 URL 금지).

## DB / Drizzle ORM

### 스키마 (`server/db/schema.js`)

12개 테이블:
- `members` — 회원 정보 (student_id, name, college, department, phone, birthday, volunteer_id)
- `semesters` — 학기 목록 (name, is_current)
- `semester_members` — 학기-회원 연결 (semester_id, member_id, role)
- `records` — 급식 신청 (member_id, date, course)
- `verifications` — 급식 인증 (member_id, date, course, score)
- `settings` — 설정 키-값 (key, value)
- `logs` — 로그 (timestamp, level, ip, endpoint, method, status, description, query, result)
- `photos` — 갤러리 사진 (filename, size, uploader_id, likes_count)
- `tags` — 사진 태그 (name)
- `photo_tags` — 사진-태그 연결 (photo_id, tag_id)
- `photo_likes` — 좋아요 (photo_id, ip, user_id)
- `registrations` — 가입 신청 (student_id, name, college, department, phone, semester_id)

### DB 사용 패턴

```js
import { db, sqlite } from '../db/index.js';
import { members, settings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Drizzle 쿼리 (동기, .get() / .all() / .run())
const row = db.select().from(members).where(eq(members.studentId, '201900000')).get();
db.insert(members).values({ ... }).run();
db.update(members).set({ name: '홍길동' }).where(eq(members.id, 1)).run();
db.delete(members).where(eq(members.id, 1)).run();

// 복잡한 쿼리는 sqlite prepared statement 직접 사용
const rows = sqlite.prepare('SELECT * FROM logs WHERE timestamp > ?').all(date);

// 트랜잭션
const tx = sqlite.transaction(() => {
  sqlite.prepare('INSERT INTO ...').run(...);
  sqlite.prepare('UPDATE ...').run(...);
});
tx();
```

### 유틸리티 함수 (`server/controllers/util/util.js`)

- `util.getSettings(name)` — settings 테이블에서 값 조회 (동기)
- `util.getCurrentSemester()` — 현재 학기 semesters 행 반환 (동기)
- `util.getMemberByStudentId(studentId)` — 학번으로 members 행 조회 (동기)
- `util.logger(log)` — logs 테이블에 prepared statement로 삽입 (동기)
- `util.extractToken(request)` — `Authorization: Bearer` 헤더에서 토큰 추출
- `util.resolveMemberId(decoded)` — 디코드된 토큰에서 memberId 추출 (없으면 학번으로 조회)
- `util.isLogin` / `util.isAdmin` — JWT 인증 preHandler (비동기)
- `util.optionalAuth` — 선택적 인증 (토큰 있으면 디코드, 없으면 `request.decoded = null`)

## 환경 변수 (server/.env)

```
JWT_SECRET=...
PORT=5710
ADMIN_STUDENT_IDS=...
```

## API 라우트

| Prefix | 파일 | 설명 |
|--------|------|------|
| /api/auth | auth.js | 로그인 (`POST /login`), 토큰 갱신 (`POST /refresh`) |
| /api/settings | settings.js | 설정값 조회/수정 (`GET/PUT /:key`) |
| /api/records | records.js | 급식 신청 CRUD, 통계, 지도 |
| /api/verifications | verifications.js | 급식 인증 CRUD, 1365 내보내기 |
| /api/members | members.js | 회원 조회/등록/수정/삭제, 학번 조회 |
| /api/semesters | semesters.js | 학기 목록 조회 |
| /api/registrations | registrations.js | 가입 신청 CRUD, 학기 목록 |
| /api/logs | logs.js | 서버 로그 조회 |
| /api/gallery | gallery.js | 갤러리 (사진/태그/작가/좋아요/랭킹, multipart 업로드) |

### 응답 포맷

```js
// 성공 (200, 201)
{ "data": ... }
// 메타 포함
{ "data": [...], "meta": { "lastUpdatedAt": "..." } }
// 에러 (4xx, 5xx)
{ "error": { "code": "ERR_NOT_FOUND", "message": "..." } }
```

헬퍼: `success(data, meta)`, `error(code, message)` — `server/controllers/util/interface.js`

## JWT 인증

- **헤더**: `Authorization: Bearer <token>` (모든 인증 요청)
- 토큰 페이로드: `{ id: 학번, memberId: N, role: '회원'|'회장'|... }` (구 토큰은 `memberId` 없음 — 폴백으로 학번 조회)
- 토큰 유효기간: 365일
- 쿠키 이름: `jwt` (프론트엔드에서 js-cookie로 관리)
- 미들웨어: `util.isLogin` (필수 인증), `util.isAdmin` (관리자), `util.optionalAuth` (선택적 인증)

## gallery.js 특이사항

- `@fastify/multipart`를 gallery 플러그인 스코프 내에서만 등록 (@fastify/formbody와 충돌 방지)
- 파일 업로드: `request.parts()` 스트림 API + `pipeline()` 사용
- 에러 시 업로드된 파일 cleanup 수행
- 비정규화 카운터 없음 — tag/uploader 통계는 집계 쿼리로 계산
- `photoId` 응답 필드는 `photos.filename` (타임스탬프 기반 파일명)
- 트랜잭션: `sqlite.transaction()` 사용 (업로드, 삭제, 좋아요)
- RESTful 엔드포인트: `/photos`, `/uploaders`, `/cats`, `/tags/:name/photos`, `/photos/:photoId/likes` 등
