# CLAUDE.md

## 프로젝트 개요

아주대학교 고양이 동아리 미유미유의 급식 관리 웹 서비스. 급식 신청/인증, 회원 관리, 갤러리, 날씨 정보 등을 제공한다.

## 아키텍처

- **백엔드**: Fastify 5 (Node.js, native ESM)
- **프론트엔드**: Vue 3 + Vite (timetable SPA) + 레거시 정적 페이지 (web/)
- **DB**: SQLite (better-sqlite3 + Drizzle ORM)
- **배포**: Docker multi-stage build, Traefik 리버스 프록시

## 디렉터리 구조

```
server/                 # Fastify 백엔드
  index.js              # 서버 진입점 (포트 5710)
  api/                  # 라우트 핸들러 (Fastify 플러그인)
  controllers/          # 비즈니스 로직 (weatherClient, dbClient, util)
  db/                   # DB 레이어
    schema.js           # Drizzle ORM 스키마 (12개 테이블)
    index.js            # DB 초기화 (WAL, foreign_keys)
  data/                 # SQLite DB 파일 (gitignored)
  drizzle.config.js     # Drizzle Kit 설정
  timetable-dist/       # Vue 빌드 결과물 (gitignored)
timetable/              # Vue 3 SPA (급식 캘린더)
  src/api/              # fetch 기반 API 클라이언트
  src/composables/      # Vue 컴포지션 함수
  src/components/       # Vue 컴포넌트
  src/utils/            # 유틸리티 (dateFormat, svgGenerator)
web/                    # 레거시 정적 페이지 (console, gallery, apply 등)
Dockerfile              # 멀티스테이지 빌드
docker-compose.yml      # 앱 서비스 (Traefik 연동)
```

## 개발 환경 실행

```bash
# 백엔드 (server/)
cd server && npm install && npm run dev    # nodemon, :5710

# 프론트엔드 (timetable/)
cd timetable && npm install && npm run dev  # Vite dev server, /api, /res → :5710 프록시

# Docker
docker compose up --build
```

SQLite DB 파일(`server/data/ajoumeow.db`)이 필요하다. 마이그레이션된 DB를 복사하여 사용.

## 빌드

```bash
cd timetable && npm run build   # → server/timetable-dist/
```

Docker 빌드 시 Vite outDir를 `dist`로 오버라이드하여 컨테이너 내 경로 충돌을 방지한다.

## 주요 규칙

- **ESM 전용**: 모든 파일이 `import`/`export` 사용. `"type": "module"` 설정됨.
- **import 경로에 `.js` 확장자 필수**: Node.js ESM 해석 규칙.
- **`__dirname` 사용 금지**: `path.dirname(fileURLToPath(import.meta.url))` 패턴 사용.
- **dotenv 사용 안 함**: 환경 변수는 docker-compose `env_file`로 주입.
- **Fastify 라우트는 플러그인 패턴**: `export default async function(fastify, opts) { ... }`
- **인증 미들웨어는 preHandler**: `{ preHandler: [util.isLogin] }` 옵션으로 전달.
- **preHandler에서 reply 후 `return reply`**: 핸들러 실행을 차단하기 위해 필수.
- **DELETE 응답은 200**: Fastify는 204+body를 지원하지 않음.
- **한국어 문자열**: 로그, 에러 메시지, DB 데이터는 한국어. 변수명/함수명은 영어.

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
- `util.isLogin` / `util.isAdmin` — JWT 인증 preHandler (비동기)

## 환경 변수 (server/.env)

```
JWT_SECRET=...
PORT=5710
ADMIN_STUDENT_IDS=...
```

## API 라우트

| Prefix | 파일 | 설명 |
|--------|------|------|
| /api/auth | auth.js | 로그인, 자동로그인 |
| /api/settings | settings.js | 설정값 조회/수정 (와일드카드 `/*`) |
| /api/record | record.js | 급식 신청 CRUD, 통계, 로그, 지도 |
| /api/verify | verify.js | 급식 인증 CRUD, 1365 연동 |
| /api/users | users.js | 회원 관리, 가입 신청 |
| /api/gallery | gallery.js | 갤러리 (multipart 업로드, 좋아요, 랭킹) |

## 정적 파일 서빙

- `/timetable/*` → `server/timetable-dist/` (Vue SPA, 404 → index.html 폴백)
- `/*` → `server/web/` (레거시 정적 페이지)

## JWT 인증

- 헤더명 `x-access-token`: POST/DELETE/PUT 요청
- 헤더명 `jwt`: GET /api/record (읽기 전용, 이름 마스킹 여부 판단)
- 토큰 페이로드: `{ id: 학번, memberId: N, role: '회원'|'회장'|... }` (구 토큰은 `memberId` 없음 — 폴백으로 학번 조회)
- 토큰 유효기간: 365일
- 쿠키 이름: `jwt` (프론트엔드에서 js-cookie로 관리)

## gallery.js 특이사항

- `@fastify/multipart`를 gallery 플러그인 스코프 내에서만 등록 (@fastify/formbody와 충돌 방지)
- 파일 업로드: `request.parts()` 스트림 API + `pipeline()` 사용
- 에러 시 업로드된 파일 cleanup 수행
- 비정규화 카운터 없음 — tag/uploader 통계는 집계 쿼리로 계산
- `photo_id` 응답 필드는 `photos.filename` (타임스탬프 기반 파일명)
- 트랜잭션: `sqlite.transaction()` 사용 (업로드, 삭제, 좋아요)
