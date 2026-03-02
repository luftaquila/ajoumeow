/**
 * MariaDB dump.sql → SQLite ajoumeow.db 마이그레이션 스크립트
 *
 * Usage: node server/scripts/migrate.js [dump.sql 경로]
 *        기본값: 프로젝트 루트의 dump.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpPath = process.argv[2] || path.join(__dirname, '..', '..', 'dump.sql');
const dbPath = path.join(__dirname, '..', 'data', 'ajoumeow.db');

// ═══════════════════════════════════════════════════════════════════
// 1. dump.sql 파싱
// ═══════════════════════════════════════════════════════════════════

console.log(`\n📂 Reading dump file: ${dumpPath}`);
if (!fs.existsSync(dumpPath)) {
  console.error(`❌ File not found: ${dumpPath}`);
  process.exit(1);
}

const dumpContent = fs.readFileSync(dumpPath, 'utf-8');
const lines = dumpContent.split('\n');
console.log(`   ${lines.length} lines`);

/** VALUES 튜플 파서: '...' / NULL / 숫자를 파싱 */
function parseTuples(valuesStr) {
  const tuples = [];
  let i = 0;
  const len = valuesStr.length;

  while (i < len) {
    // find start of tuple
    while (i < len && valuesStr[i] !== '(') i++;
    if (i >= len) break;
    i++; // skip '('

    const values = [];
    while (i < len && valuesStr[i] !== ')') {
      // skip whitespace
      while (i < len && valuesStr[i] === ' ') i++;

      if (valuesStr[i] === '\'') {
        // quoted string
        i++; // skip opening quote
        let str = '';
        while (i < len) {
          if (valuesStr[i] === '\\') {
            i++;
            if (i < len) {
              const esc = valuesStr[i];
              if (esc === '\'') str += '\'';
              else if (esc === '\\') str += '\\';
              else if (esc === 'n') str += '\n';
              else if (esc === 'r') str += '\r';
              else if (esc === 't') str += '\t';
              else if (esc === '0') str += '\0';
              else str += esc;
              i++;
            }
            continue;
          }
          if (valuesStr[i] === '\'') {
            i++; // skip closing quote
            break;
          }
          str += valuesStr[i];
          i++;
        }
        values.push(str);
      } else if (valuesStr.slice(i, i + 4) === 'NULL') {
        values.push(null);
        i += 4;
      } else {
        // number or other literal
        let num = '';
        while (i < len && valuesStr[i] !== ',' && valuesStr[i] !== ')') {
          num += valuesStr[i];
          i++;
        }
        values.push(num.trim());
      }

      // skip comma between values
      if (i < len && valuesStr[i] === ',') i++;
    }
    if (i < len) i++; // skip ')'

    tuples.push(values);

    // skip comma/semicolon between tuples
    while (i < len && (valuesStr[i] === ',' || valuesStr[i] === ';' || valuesStr[i] === '\n' || valuesStr[i] === '\r')) i++;
  }
  return tuples;
}

/** 테이블별 INSERT INTO 데이터 추출 */
function extractInserts(tableName) {
  const rows = [];
  const prefix = `INSERT INTO \`${tableName}\` VALUES`;
  let collecting = false;
  let buffer = '';

  for (const line of lines) {
    if (line.startsWith(prefix)) {
      collecting = true;
      buffer = line.slice(prefix.length);
      continue;
    }
    if (collecting) {
      // END markers
      if (line.startsWith('/*!') || line.startsWith('UNLOCK') || line.startsWith('LOCK') || line.startsWith('--') || line.startsWith('DROP')) {
        collecting = false;
        if (buffer.length > 0) {
          rows.push(...parseTuples(buffer));
          buffer = '';
        }
        continue;
      }
      buffer += '\n' + line;
    }
  }
  if (buffer.length > 0) {
    rows.push(...parseTuples(buffer));
  }
  return rows;
}

// Parse all relevant tables
console.log('\n🔍 Parsing tables...');

// namelist tables (학기별 회원 목록)
const namelistSemesters = [];
const namelistPattern = /^CREATE TABLE `namelist_(\d{2}-\d)`/;
for (const line of lines) {
  const m = line.match(namelistPattern);
  if (m) namelistSemesters.push(m[1]);
}
namelistSemesters.sort((a, b) => {
  const [ay, as] = a.split('-').map(Number);
  const [by, bs] = b.split('-').map(Number);
  return ay !== by ? ay - by : as - bs;
});
console.log(`   namelist semesters: ${namelistSemesters.join(', ')}`);

const namelistData = new Map(); // semester -> rows
for (const sem of namelistSemesters) {
  const rows = extractInserts(`namelist_${sem}`);
  namelistData.set(sem, rows);
  console.log(`   namelist_${sem}: ${rows.length} rows`);
}

// register tables
const registerSemesters = [];
const registerPattern = /^CREATE TABLE `register_(\d{2}-\d)`/;
for (const line of lines) {
  const m = line.match(registerPattern);
  if (m) registerSemesters.push(m[1]);
}
registerSemesters.sort((a, b) => {
  const [ay, as] = a.split('-').map(Number);
  const [by, bs] = b.split('-').map(Number);
  return ay !== by ? ay - by : as - bs;
});

const registerData = new Map();
for (const sem of registerSemesters) {
  const rows = extractInserts(`register_${sem}`);
  registerData.set(sem, rows);
  console.log(`   register_${sem}: ${rows.length} rows`);
}

// Other tables
const recordRows = extractInserts('record');
console.log(`   record: ${recordRows.length} rows`);

const verifyRows = extractInserts('verify');
console.log(`   verify: ${verifyRows.length} rows`);

const galleryPhotoRows = extractInserts('gallery_photo');
console.log(`   gallery_photo: ${galleryPhotoRows.length} rows`);

const galleryPhotoTagRows = extractInserts('gallery_photo_tag');
console.log(`   gallery_photo_tag: ${galleryPhotoTagRows.length} rows`);

const galleryLikeRows = extractInserts('gallery_like');
console.log(`   gallery_like: ${galleryLikeRows.length} rows`);

const galleryUploaderRows = extractInserts('gallery_uploader');
console.log(`   gallery_uploader: ${galleryUploaderRows.length} rows`);

const settingsRows = extractInserts('settings');
console.log(`   settings: ${settingsRows.length} rows`);

// ═══════════════════════════════════════════════════════════════════
// 2. SQLite DB 생성 + DDL
// ═══════════════════════════════════════════════════════════════════

console.log('\n🗄️  Creating SQLite database...');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('   Removed existing database');
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_current INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT NOT NULL,
    birthday TEXT,
    volunteer_id TEXT,
    google_id TEXT UNIQUE,
    google_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT NOT NULL,
    google_email TEXT NOT NULL,
    google_name TEXT,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT NOT NULL,
    birthday TEXT,
    volunteer_id TEXT,
    is_new INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    semester_id INTEGER NOT NULL REFERENCES semesters(id),
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS semester_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semester_id INTEGER NOT NULL REFERENCES semesters(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    role TEXT NOT NULL DEFAULT '회원',
    registered_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    date TEXT NOT NULL,
    course TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    date TEXT NOT NULL,
    course TEXT NOT NULL,
    score REAL NOT NULL,
    verified_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploader_id INTEGER NOT NULL REFERENCES members(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    likes_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS photo_tags (
    photo_id INTEGER NOT NULL REFERENCES photos(id),
    tag_id INTEGER NOT NULL REFERENCES tags(id),
    PRIMARY KEY (photo_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS photo_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL REFERENCES photos(id),
    ip TEXT NOT NULL,
    user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT NOT NULL,
    semester_id INTEGER NOT NULL REFERENCES semesters(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
console.log('   12 tables created');

// ═══════════════════════════════════════════════════════════════════
// 3. 데이터 변환 + 삽입
// ═══════════════════════════════════════════════════════════════════

let warnings = 0;
function warn(msg) {
  warnings++;
  console.log(`   ⚠️  ${msg}`);
}

// ── 3-1. semesters ──────────────────────────────────────────────
console.log('\n📥 Inserting semesters...');

// Collect all semester names from both namelist and register tables
const allSemesterNames = new Set([...namelistSemesters, ...registerSemesters]);
const sortedSemesters = [...allSemesterNames].sort((a, b) => {
  const [ay, as] = a.split('-').map(Number);
  const [by, bs] = b.split('-').map(Number);
  return ay !== by ? ay - by : as - bs;
});

// Find current semester from settings
let currentSemesterName = null;
for (const row of settingsRows) {
  // settings columns: (name, value)
  if (row[0] === 'currentSemister' || row[0] === 'currentSemester') {
    currentSemesterName = row[1];
    break;
  }
}

const insertSemester = sqlite.prepare('INSERT INTO semesters (name, is_current) VALUES (?, ?)');
const semesterNameToId = new Map();
sqlite.transaction(() => {
  for (const sem of sortedSemesters) {
    const isCurrent = sem === currentSemesterName ? 1 : 0;
    const info = insertSemester.run(sem, isCurrent);
    semesterNameToId.set(sem, info.lastInsertRowid);
  }
})();
console.log(`   ${semesterNameToId.size} semesters inserted`);

// ── 3-2. members ────────────────────────────────────────────────
console.log('\n📥 Building members...');

// namelist columns: (college, department, ID, name, phone, birthday, 1365ID, register, role)
// Build unified member map: studentId -> latest data
const memberMap = new Map(); // studentId(string) -> { name, college, department, phone, birthday, volunteerId }

// Process namelists in chronological order (latest overwrites)
for (const sem of namelistSemesters) {
  const rows = namelistData.get(sem);
  for (const row of rows) {
    const studentId = String(row[2]);
    const name = (row[3] || '').trim();
    const birthday = (row[5] === '000000' || !row[5]) ? null : row[5];
    const volunteerId = (row[6] === '-' || !row[6]) ? null : row[6];

    memberMap.set(studentId, {
      name,
      college: row[0],
      department: row[1],
      phone: row[4],
      birthday,
      volunteerId,
    });
  }
}
const namelistMemberCount = memberMap.size;
console.log(`   ${namelistMemberCount} members from namelists`);

// Add members from gallery_uploader that aren't in namelist
// gallery_uploader columns: (uploader_id, uploader_name, photo_count, newest_photo_id, likes)
let uploaderOnlyCount = 0;
for (const row of galleryUploaderRows) {
  const studentId = String(row[0]);
  if (!memberMap.has(studentId)) {
    memberMap.set(studentId, {
      name: (row[1] || '').trim(),
      college: '미상',
      department: '미상',
      phone: '미상',
      birthday: null,
      volunteerId: null,
    });
    uploaderOnlyCount++;
  }
}
console.log(`   ${uploaderOnlyCount} members from gallery_uploader only`);

// Add orphan members from record/verify (non-zero ID not in namelist/uploader)
// record columns: (key, timestamp, ID, name, date, course)
// verify columns: (timestamp, ID, date, name, course, score)
const orphanStudentIds = new Set();
for (const row of recordRows) {
  const id = String(row[2]);
  if (id !== '0' && !memberMap.has(id)) orphanStudentIds.add(id);
}
for (const row of verifyRows) {
  const id = String(row[1]);
  if (id !== '0' && !memberMap.has(id)) orphanStudentIds.add(id);
}

let orphanCount = 0;
for (const studentId of orphanStudentIds) {
  // Try to find name from record/verify rows
  let name = '미상';
  for (const row of recordRows) {
    if (String(row[2]) === studentId) { name = (row[3] || '').trim(); break; }
  }
  if (name === '미상') {
    for (const row of verifyRows) {
      if (String(row[1]) === studentId) { name = (row[3] || '').trim(); break; }
    }
  }
  memberMap.set(studentId, {
    name,
    college: '미상',
    department: '미상',
    phone: '미상',
    birthday: null,
    volunteerId: null,
  });
  orphanCount++;
  warn(`Orphan member created: ${studentId} (${name})`);
}
console.log(`   ${orphanCount} orphan members from record/verify`);

// Handle ID=0 records: create placeholder members for unique names
const unknownNames = new Map(); // name -> Set of sources
for (const row of recordRows) {
  if (String(row[2]) === '0') {
    const name = (row[3] || '').trim();
    if (!unknownNames.has(name)) unknownNames.set(name, new Set());
    unknownNames.get(name).add('record');
  }
}
for (const row of verifyRows) {
  if (String(row[1]) === '0') {
    const name = (row[3] || '').trim();
    if (!unknownNames.has(name)) unknownNames.set(name, new Set());
    unknownNames.get(name).add('verify');
  }
}

// Check if any ID=0 name matches an existing member by name
// If so, map them; otherwise, create placeholder
const unknownNameToStudentId = new Map(); // name -> studentId (either existing or UNKNOWN_N)
let placeholderIdx = 0;

for (const [name] of unknownNames) {
  // Try to find a unique member with this name
  let matchedStudentId = null;
  let matchCount = 0;
  for (const [sid, data] of memberMap) {
    if (data.name === name) {
      matchedStudentId = sid;
      matchCount++;
    }
  }
  if (matchCount === 1) {
    // Exact unique match
    unknownNameToStudentId.set(name, matchedStudentId);
  } else {
    // Create placeholder
    placeholderIdx++;
    const placeholderSid = `UNKNOWN_${placeholderIdx}`;
    memberMap.set(placeholderSid, {
      name,
      college: '미상',
      department: '미상',
      phone: '미상',
      birthday: null,
      volunteerId: null,
    });
    unknownNameToStudentId.set(name, placeholderSid);
    warn(`Placeholder member created: ${placeholderSid} for name "${name}"`);
  }
}
console.log(`   ${placeholderIdx} placeholder members for ID=0 records`);

// Insert all members
const insertMember = sqlite.prepare(
  'INSERT INTO members (student_id, name, college, department, phone, birthday, volunteer_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
const studentIdToMemberId = new Map();

sqlite.transaction(() => {
  for (const [studentId, data] of memberMap) {
    const info = insertMember.run(
      studentId,
      data.name,
      data.college,
      data.department,
      data.phone,
      data.birthday,
      data.volunteerId,
      new Date().toISOString().replace('T', ' ').slice(0, 19),
    );
    studentIdToMemberId.set(studentId, Number(info.lastInsertRowid));
  }
})();
console.log(`   ${studentIdToMemberId.size} total members inserted`);

// Build unknownName -> memberId map
const unknownNameToMemberId = new Map();
for (const [name, studentId] of unknownNameToStudentId) {
  unknownNameToMemberId.set(name, studentIdToMemberId.get(studentId));
}

// ── 3-3. semester_members ───────────────────────────────────────
console.log('\n📥 Inserting semester_members...');
const insertSemesterMember = sqlite.prepare(
  'INSERT INTO semester_members (semester_id, member_id, role) VALUES (?, ?, ?)'
);

let smCount = 0;
sqlite.transaction(() => {
  for (const sem of namelistSemesters) {
    const semId = semesterNameToId.get(sem);
    const rows = namelistData.get(sem);
    for (const row of rows) {
      const studentId = String(row[2]);
      const memberId = studentIdToMemberId.get(studentId);
      const role = row[8] || '회원';
      insertSemesterMember.run(semId, memberId, role);
      smCount++;
    }
  }
})();
console.log(`   ${smCount} semester_members inserted`);

// ── 3-4. records ────────────────────────────────────────────────
console.log('\n📥 Inserting records...');
// record columns: (key, timestamp, ID, name, date, course)
const insertRecord = sqlite.prepare(
  'INSERT INTO records (member_id, date, course, created_at) VALUES (?, ?, ?, ?)'
);

let recordCount = 0;
let recordSkipped = 0;
sqlite.transaction(() => {
  for (const row of recordRows) {
    const studentId = String(row[2]);
    const name = (row[3] || '').trim();
    const timestamp = row[1];
    const date = row[4];
    const course = row[5];

    let memberId;
    if (studentId === '0') {
      memberId = unknownNameToMemberId.get(name);
    } else {
      memberId = studentIdToMemberId.get(studentId);
    }

    if (!memberId) {
      warn(`Record skipped: no member for ID=${studentId}, name="${name}"`);
      recordSkipped++;
      continue;
    }

    insertRecord.run(memberId, date, course, timestamp);
    recordCount++;
  }
})();
console.log(`   ${recordCount} records inserted (${recordSkipped} skipped)`);

// ── 3-5. verifications ──────────────────────────────────────────
console.log('\n📥 Inserting verifications...');
// verify columns: (timestamp, ID, date, name, course, score)
const insertVerification = sqlite.prepare(
  'INSERT INTO verifications (member_id, date, course, score, verified_at) VALUES (?, ?, ?, ?, ?)'
);

let verifyCount = 0;
let verifySkipped = 0;
sqlite.transaction(() => {
  for (const row of verifyRows) {
    const studentId = String(row[1]);
    const name = (row[3] || '').trim();
    const timestamp = row[0];
    const date = row[2];
    const course = row[4];
    const score = parseFloat(row[5]);

    let memberId;
    if (studentId === '0') {
      memberId = unknownNameToMemberId.get(name);
    } else {
      memberId = studentIdToMemberId.get(studentId);
    }

    if (!memberId) {
      warn(`Verification skipped: no member for ID=${studentId}, name="${name}"`);
      verifySkipped++;
      continue;
    }

    insertVerification.run(memberId, date, course, score, timestamp);
    verifyCount++;
  }
})();
console.log(`   ${verifyCount} verifications inserted (${verifySkipped} skipped)`);

// ── 3-6. settings ───────────────────────────────────────────────
console.log('\n📥 Inserting settings...');
// settings columns: (name, value)
const insertSetting = sqlite.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

let settingsCount = 0;
sqlite.transaction(() => {
  for (const row of settingsRows) {
    let key = row[0];
    // Fix typo
    if (key === 'currentSemister') key = 'currentSemester';
    insertSetting.run(key, row[1]);
    settingsCount++;
  }

  // master 브랜치의 정적 JSON 파일을 settings DB로 마이그레이션
  // refactor 브랜치에서는 college/map 데이터를 settings 테이블에 저장
  const staticJsonKeys = ['college', 'map'];
  const resDir = path.join(__dirname, '..', '..', 'web', 'res');

  for (const key of staticJsonKeys) {
    const filePath = path.join(resDir, `${key}.json`);
    let content = null;

    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
      console.log(`   ${key}.json → settings (from ${filePath})`);
    } else {
      // refactor 브랜치에는 web/res/가 없으므로 git에서 master 브랜치 파일 추출
      try {
        content = execSync(`git show master:web/res/${key}.json`, { encoding: 'utf-8' });
        console.log(`   ${key}.json → settings (from git master:web/res/${key}.json)`);
      } catch {
        warn(`${key}.json not found on disk or in git master branch — skipped`);
      }
    }

    if (content) {
      const minified = JSON.stringify(JSON.parse(content));
      insertSetting.run(key, minified);
      settingsCount++;
    }
  }
})();
console.log(`   ${settingsCount} settings inserted`);

// ── 3-7. photos ─────────────────────────────────────────────────
console.log('\n📥 Inserting photos...');
// gallery_photo columns: (photo_id, size, uploader_id, uploader_name, timestamp, likes)
const insertPhoto = sqlite.prepare(
  'INSERT INTO photos (filename, size, uploader_id, created_at, likes_count) VALUES (?, ?, ?, ?, ?)'
);
const filenameToPhotoId = new Map(); // photo_id(filename) -> new integer PK

let photoCount = 0;
sqlite.transaction(() => {
  for (const row of galleryPhotoRows) {
    const filename = row[0];
    const size = parseInt(row[1], 10);
    const uploaderStudentId = String(row[2]);
    const timestamp = row[4];
    const likes = parseInt(row[5], 10) || 0;

    let uploaderId = studentIdToMemberId.get(uploaderStudentId);
    if (!uploaderId) {
      warn(`Photo uploader not found: ${uploaderStudentId} for ${filename}, creating member`);
      const name = (row[3] || '').trim() || '미상';
      insertMember.run(uploaderStudentId, name, '미상', '미상', '미상', null, null,
        new Date().toISOString().replace('T', ' ').slice(0, 19));
      uploaderId = Number(sqlite.prepare('SELECT last_insert_rowid() as id').get().id);
      studentIdToMemberId.set(uploaderStudentId, uploaderId);
    }

    const info = insertPhoto.run(filename, size, uploaderId, timestamp, likes);
    filenameToPhotoId.set(filename, Number(info.lastInsertRowid));
    photoCount++;
  }
})();
console.log(`   ${photoCount} photos inserted`);

// ── 3-8. tags ───────────────────────────────────────────────────
console.log('\n📥 Inserting tags...');
// Collect unique tag names from gallery_photo_tag
// gallery_photo_tag columns: (photo_id, tag_name)
const tagNameSet = new Set();
for (const row of galleryPhotoTagRows) {
  tagNameSet.add(row[1]);
}

const insertTag = sqlite.prepare('INSERT INTO tags (name) VALUES (?)');
const tagNameToId = new Map();

sqlite.transaction(() => {
  for (const name of tagNameSet) {
    const info = insertTag.run(name);
    tagNameToId.set(name, Number(info.lastInsertRowid));
  }
})();
console.log(`   ${tagNameToId.size} tags inserted`);

// ── 3-9. photo_tags ─────────────────────────────────────────────
console.log('\n📥 Inserting photo_tags...');
const insertPhotoTag = sqlite.prepare('INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)');

let photoTagCount = 0;
let photoTagSkipped = 0;
sqlite.transaction(() => {
  for (const row of galleryPhotoTagRows) {
    const filename = row[0];
    const tagName = row[1];

    const photoId = filenameToPhotoId.get(filename);
    const tagId = tagNameToId.get(tagName);

    if (!photoId) {
      warn(`Photo tag skipped: photo not found for ${filename}`);
      photoTagSkipped++;
      continue;
    }
    if (!tagId) {
      warn(`Photo tag skipped: tag not found for "${tagName}"`);
      photoTagSkipped++;
      continue;
    }

    insertPhotoTag.run(photoId, tagId);
    photoTagCount++;
  }
})();
console.log(`   ${photoTagCount} photo_tags inserted (${photoTagSkipped} skipped)`);

// ── 3-10. photo_likes ───────────────────────────────────────────
console.log('\n📥 Inserting photo_likes...');
// gallery_like columns: (timestamp, ip, photo_id, user_id)
const insertPhotoLike = sqlite.prepare(
  'INSERT INTO photo_likes (photo_id, ip, user_id, created_at) VALUES (?, ?, ?, ?)'
);

let likeCount = 0;
let likeSkipped = 0;
sqlite.transaction(() => {
  for (const row of galleryLikeRows) {
    const timestamp = row[0];
    const ip = row[1];
    const filename = row[2];
    const userStudentId = row[3] ? String(row[3]) : null;

    const photoId = filenameToPhotoId.get(filename);
    if (!photoId) {
      warn(`Like skipped: photo not found for ${filename}`);
      likeSkipped++;
      continue;
    }

    // Map user_id (student ID) to member ID
    let userId = null;
    if (userStudentId) {
      userId = studentIdToMemberId.get(userStudentId) || null;
    }

    insertPhotoLike.run(photoId, ip, userId, timestamp);
    likeCount++;
  }
})();
console.log(`   ${likeCount} photo_likes inserted (${likeSkipped} skipped)`);

// ── 3-11. registrations ─────────────────────────────────────────
console.log('\n📥 Inserting registrations...');
// register columns: (timestamp, ID, name, college, department, phone)
const insertRegistration = sqlite.prepare(
  'INSERT INTO registrations (student_id, name, college, department, phone, semester_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

let regCount = 0;
sqlite.transaction(() => {
  for (const sem of registerSemesters) {
    const semId = semesterNameToId.get(sem);
    const rows = registerData.get(sem);
    for (const row of rows) {
      const timestamp = row[0] || new Date().toISOString().replace('T', ' ').slice(0, 19);
      const studentId = String(row[1]);
      const name = (row[2] || '').trim();
      const college = row[3];
      const department = row[4];
      const phone = row[5];

      insertRegistration.run(studentId, name, college, department, phone, semId, timestamp);
      regCount++;
    }
  }
})();
console.log(`   ${regCount} registrations inserted`);

// ═══════════════════════════════════════════════════════════════════
// 4. 검증
// ═══════════════════════════════════════════════════════════════════

console.log('\n🔍 Validating...');

// FK integrity check
const fkCheck = sqlite.prepare('PRAGMA foreign_key_check').all();
if (fkCheck.length === 0) {
  console.log('   FK check: ✅ PASSED');
} else {
  console.log(`   FK check: ❌ FAILED (${fkCheck.length} violations)`);
  for (const v of fkCheck.slice(0, 10)) {
    console.log(`     table=${v.table}, rowid=${v.rowid}, parent=${v.parent}, fkid=${v.fkid}`);
  }
}

// Row counts
const tables = [
  'semesters', 'members', 'semester_members', 'records', 'verifications',
  'settings', 'photos', 'tags', 'photo_tags', 'photo_likes', 'registrations',
];

console.log('\n=== Migration Summary ===');
for (const t of tables) {
  const count = sqlite.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
  console.log(`${t.padEnd(20)} ${count} rows`);
}

// Verify likes_count matches actual photo_likes
const likeMismatch = sqlite.prepare(`
  SELECT p.id, p.filename, p.likes_count, COALESCE(l.cnt, 0) as actual_count
  FROM photos p
  LEFT JOIN (SELECT photo_id, COUNT(*) as cnt FROM photo_likes GROUP BY photo_id) l
    ON p.id = l.photo_id
  WHERE p.likes_count != COALESCE(l.cnt, 0)
`).all();

if (likeMismatch.length === 0) {
  console.log('\nlikes_count check:   ✅ PASSED');
} else {
  console.log(`\nlikes_count check:   ⚠️ ${likeMismatch.length} mismatches (expected — dump may have stale counts)`);
  for (const m of likeMismatch.slice(0, 5)) {
    console.log(`  ${m.filename}: stored=${m.likes_count}, actual=${m.actual_count}`);
  }
}

// Member breakdown
console.log(`\nMembers breakdown:`);
console.log(`  namelist:       ${namelistMemberCount}`);
console.log(`  uploader-only:  ${uploaderOnlyCount}`);
console.log(`  orphan:         ${orphanCount}`);
console.log(`  placeholder:    ${placeholderIdx}`);
console.log(`  total:          ${studentIdToMemberId.size}`);

console.log(`\nWarnings:          ${warnings} total`);
console.log(`\n✅ Migration complete: ${dbPath}\n`);

sqlite.close();
