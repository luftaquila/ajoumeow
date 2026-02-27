/**
 * Migration script: MariaDB → SQLite (Drizzle ORM)
 *
 * Usage: npx tsx scripts/migrate.ts [--dry-run]
 *
 * Flags:
 *   --dry-run  Validate without writing to SQLite (read-only)
 *
 * Environment variables:
 *   MARIA_HOST (default: localhost)
 *   MARIA_PORT (default: 3306)
 *   MARIA_USER (default: root)
 *   MARIA_PASSWORD (default: empty)
 *   MARIA_DATABASE (default: ajoumeow)
 *   DB_PATH (default: server/data/ajoumeow.db)
 */

import * as mariadb from 'mariadb';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../server/src/db/schema.js';

// ── Dry-run mode ──────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) {
  console.log('🔍 DRY-RUN MODE: No writes will be performed to SQLite\n');
}

// ── Migration summary tracker ─────────────────────────────────────
interface MigrationSummary {
  table: string;
  source: number;
  inserted: number;
  skipped: number;
  status: 'success' | 'skipped' | 'failed';
}

const migrationSummaries: MigrationSummary[] = [];

// ── MariaDB connection ─────────────────────────────────────────────
const mariaConn = await mariadb.createConnection({
  host: process.env.MARIA_HOST || 'localhost',
  port: Number(process.env.MARIA_PORT || 3306),
  user: process.env.MARIA_USER || 'root',
  password: process.env.MARIA_PASSWORD || '',
  database: process.env.MARIA_DATABASE || 'ajoumeow',
});

// ── SQLite connection ──────────────────────────────────────────────
const dbPath = process.env.DB_PATH || 'server/data/ajoumeow.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite, { schema });

// ── Helpers ────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[migrate] ${msg}`);
}

function logCount(table: string, before: number, after: number) {
  console.log(`  ${table}: ${before} source rows → ${after} inserted`);
}

// ── Types for MariaDB rows ─────────────────────────────────────────
interface NamelistRow {
  college: string;
  department: string;
  ID: number;
  name: string;
  phone: string;
  birthday: string | null;
  '1365ID': string | null;
  register: string | null;
  role: string;
}

interface RegisterRow {
  timestamp: string;
  ID: number;
  name: string;
  college: string;
  department: string;
  phone: string;
}

interface RecordRow {
  ID: number;
  name: string;
  date: string;
  course: string;
  timestamp: string;
}

interface VerifyRow {
  ID: number;
  name: string;
  date: string;
  course: string;
  score: number;
  timestamp?: string;
}

interface SettingsRow {
  name: string;
  value: string | null;
}

interface LogRow {
  id?: number;
  level: string;
  IP: string;
  endpoint: string;
  description: string;
  method: string;
  status: number;
  query: string;
  result: string;
  timestamp?: string;
}

interface GalleryPhotoRow {
  photo_id: string;
  size: number;
  uploader_id: number;
  uploader_name: string;
  likes: number;
  timestamp: string;
}

interface GalleryTagRow {
  tag_name: string;
  photo_count: number;
  likes: number;
  newest_photo_id: string;
}

interface GalleryPhotoTagRow {
  photo_id: string;
  tag_name: string;
}

interface GalleryLikeRow {
  ip: string;
  photo_id: string;
  user_id: number | null;
  timestamp: string;
}

interface TableNameRow {
  [key: string]: string;
}

// ── Member/Semester migration ──────────────────────────────────────
async function migrateMembers(): Promise<Map<string, number>> {
  log('=== Starting member/semester migration ===');

  // 1. Discover namelist_* and register_* tables
  const tables: TableNameRow[] = await mariaConn.query('SHOW TABLES');
  const tableKey = Object.keys(tables[0] || {})[0];
  const tableNames: string[] = tables.map((t) => t[tableKey]).filter(Boolean);

  const namelistTables = tableNames.filter((t) => t.startsWith('namelist_'));
  const registerTables = tableNames.filter((t) => t.startsWith('register_'));

  log(`Found ${namelistTables.length} namelist tables: ${namelistTables.join(', ')}`);
  log(`Found ${registerTables.length} register tables: ${registerTables.join(', ')}`);

  // ── 2. Insert semesters ──────────────────────────────────────
  log('Migrating semesters...');
  const semesterNames = namelistTables.map((t) => t.replace('namelist_', ''));
  const semesterMap = new Map<string, number>();

  if (DRY_RUN) {
    // Assign fake IDs for dry-run
    semesterNames.forEach((name, i) => semesterMap.set(name, i + 1));
  } else {
    const migrateTx = sqlite.transaction(() => {
      for (const name of semesterNames) {
        const existing = db
          .select()
          .from(schema.semesters)
          .where(eq(schema.semesters.name, name))
          .get();

        if (existing) {
          semesterMap.set(name, existing.id);
        } else {
          const result = db.insert(schema.semesters).values({ name }).run();
          semesterMap.set(name, Number(result.lastInsertRowid));
        }
      }
    });
    migrateTx();
  }
  logCount('semesters', semesterNames.length, semesterMap.size);
  migrationSummaries.push({
    table: 'semesters',
    source: semesterNames.length,
    inserted: semesterMap.size,
    skipped: 0,
    status: 'success',
  });

  // ── 3. Migrate namelist members ────────────────────────────────
  log('Migrating members from namelist tables...');

  // Track member student_id → id mapping
  const memberMap = new Map<string, number>();
  let totalSourceRows = 0;
  let totalInserted = 0;
  let totalSemesterMembers = 0;

  // Fetch all namelist data from MariaDB first
  const namelistData: { semester: string; rows: NamelistRow[] }[] = [];

  for (const table of namelistTables) {
    const semester = table.replace('namelist_', '');
    const rows: NamelistRow[] = await mariaConn.query(`SELECT * FROM \`${table}\``);
    log(`  ${table}: ${rows.length} rows`);
    namelistData.push({ semester, rows });
  }

  if (DRY_RUN) {
    // Count and build memberMap with fake IDs for dry-run
    let fakeId = 1;
    for (const { rows } of namelistData) {
      totalSourceRows += rows.length;
      for (const row of rows) {
        const studentId = String(row.ID);
        if (!memberMap.has(studentId)) {
          memberMap.set(studentId, fakeId++);
          totalInserted++;
        }
        totalSemesterMembers++;
      }
    }
  } else {
    // Use a transaction for all member inserts
    const memberTx = sqlite.transaction(
      (data: { semester: string; rows: NamelistRow[] }[]) => {
        for (const { semester, rows } of data) {
          const semesterId = semesterMap.get(semester);
          if (!semesterId) {
            log(`  WARNING: No semester ID for ${semester}, skipping`);
            continue;
          }

          totalSourceRows += rows.length;

          for (const row of rows) {
            const studentId = String(row.ID);

            // UPSERT: insert if not exists, otherwise get existing ID
            let memberId: number;
            const cachedId = memberMap.get(studentId);

            if (cachedId !== undefined) {
              memberId = cachedId;
            } else {
              const existing = db
                .select()
                .from(schema.members)
                .where(eq(schema.members.studentId, studentId))
                .get();

              if (existing) {
                memberId = existing.id;
              } else {
                const result = db
                  .insert(schema.members)
                  .values({
                    studentId,
                    name: row.name,
                    college: row.college,
                    department: row.department,
                    phone: row.phone,
                    birthday: row.birthday || undefined,
                    volunteerId: row['1365ID'] || undefined,
                  })
                  .run();
                memberId = Number(result.lastInsertRowid);
                totalInserted++;
              }
              memberMap.set(studentId, memberId);
            }

            // Insert semester_members relationship
            db.insert(schema.semesterMembers)
              .values({
                semesterId,
                memberId,
                role: row.role || '회원',
              })
              .run();
            totalSemesterMembers++;
          }
        }
      },
    );

    memberTx(namelistData);
  }

  logCount('members (unique by student_id)', totalSourceRows, totalInserted);
  log(`  semester_members: ${totalSemesterMembers} relationships created`);
  migrationSummaries.push({
    table: 'members',
    source: totalSourceRows,
    inserted: totalInserted,
    skipped: 0,
    status: 'success',
  });
  migrationSummaries.push({
    table: 'semester_members',
    source: totalSemesterMembers,
    inserted: totalSemesterMembers,
    skipped: 0,
    status: 'success',
  });

  // ── 4. Migrate register tables → registrations ─────────────────
  log('Migrating registration applications...');
  let totalRegSource = 0;
  let totalRegInserted = 0;

  const registerData: { semester: string; rows: RegisterRow[] }[] = [];

  for (const table of registerTables) {
    const semester = table.replace('register_', '');
    const rows: RegisterRow[] = await mariaConn.query(`SELECT * FROM \`${table}\``);
    log(`  ${table}: ${rows.length} rows`);
    registerData.push({ semester, rows });
  }

  if (DRY_RUN) {
    for (const { rows } of registerData) {
      totalRegSource += rows.length;
      totalRegInserted += rows.length;
    }
  } else {
    const registerTx = sqlite.transaction(
      (data: { semester: string; rows: RegisterRow[] }[]) => {
        for (const { semester, rows } of data) {
          let semesterId = semesterMap.get(semester);

          if (!semesterId) {
            const result = db.insert(schema.semesters).values({ name: semester }).run();
            semesterId = Number(result.lastInsertRowid);
            semesterMap.set(semester, semesterId);
            log(`  Created semester "${semester}" from register table`);
          }

          totalRegSource += rows.length;

          for (const row of rows) {
            db.insert(schema.registrations)
              .values({
                studentId: String(row.ID),
                name: row.name,
                college: row.college,
                department: row.department,
                phone: row.phone,
                semesterId,
              })
              .run();
            totalRegInserted++;
          }
        }
      },
    );

    registerTx(registerData);
  }

  logCount('registrations', totalRegSource, totalRegInserted);
  migrationSummaries.push({
    table: 'registrations',
    source: totalRegSource,
    inserted: totalRegInserted,
    skipped: 0,
    status: 'success',
  });

  // ── 5. Summary ─────────────────────────────────────────────────
  log('=== Member/semester migration complete ===');
  log(`  Semesters: ${semesterMap.size}`);
  log(`  Members (unique): ${memberMap.size}`);
  log(`  Semester-Member relationships: ${totalSemesterMembers}`);
  log(`  Registrations: ${totalRegInserted}`);

  return memberMap;
}

// ── Records migration ──────────────────────────────────────────────
async function migrateRecords(memberMap: Map<string, number>) {
  log('=== Starting records migration ===');

  const rows: RecordRow[] = await mariaConn.query('SELECT * FROM `record`');
  log(`  record table: ${rows.length} source rows`);

  let inserted = 0;
  let skipped = 0;

  if (DRY_RUN) {
    for (const row of rows) {
      const studentId = String(row.ID);
      if (memberMap.has(studentId)) {
        inserted++;
      } else {
        log(`  WARNING: No member found for student_id=${studentId}, skipping record`);
        skipped++;
      }
    }
  } else {
    const tx = sqlite.transaction((data: RecordRow[]) => {
      for (const row of data) {
        const studentId = String(row.ID);
        const memberId = memberMap.get(studentId);

        if (memberId === undefined) {
          log(`  WARNING: No member found for student_id=${studentId}, skipping record`);
          skipped++;
          continue;
        }

        db.insert(schema.records)
          .values({
            memberId,
            date: row.date,
            course: row.course,
            createdAt: row.timestamp || undefined,
          })
          .run();
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('records', rows.length, inserted);
  if (skipped > 0) log(`  records skipped (no matching member): ${skipped}`);
  migrationSummaries.push({
    table: 'records',
    source: rows.length,
    inserted,
    skipped,
    status: 'success',
  });
  log('=== Records migration complete ===');
}

// ── Verifications migration ────────────────────────────────────────
async function migrateVerifications(memberMap: Map<string, number>) {
  log('=== Starting verifications migration ===');

  const rows: VerifyRow[] = await mariaConn.query('SELECT * FROM `verify`');
  log(`  verify table: ${rows.length} source rows`);

  let inserted = 0;
  let skipped = 0;

  if (DRY_RUN) {
    for (const row of rows) {
      const studentId = String(row.ID);
      if (memberMap.has(studentId)) {
        inserted++;
      } else {
        log(`  WARNING: No member found for student_id=${studentId}, skipping verification`);
        skipped++;
      }
    }
  } else {
    const tx = sqlite.transaction((data: VerifyRow[]) => {
      for (const row of data) {
        const studentId = String(row.ID);
        const memberId = memberMap.get(studentId);

        if (memberId === undefined) {
          log(`  WARNING: No member found for student_id=${studentId}, skipping verification`);
          skipped++;
          continue;
        }

        db.insert(schema.verifications)
          .values({
            memberId,
            date: row.date,
            course: row.course,
            score: row.score,
            verifiedAt: row.timestamp || undefined,
          })
          .run();
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('verifications', rows.length, inserted);
  if (skipped > 0) log(`  verifications skipped (no matching member): ${skipped}`);
  migrationSummaries.push({
    table: 'verifications',
    source: rows.length,
    inserted,
    skipped,
    status: 'success',
  });
  log('=== Verifications migration complete ===');
}

// ── Settings migration ─────────────────────────────────────────────
async function migrateSettings() {
  log('=== Starting settings migration ===');

  const rows: SettingsRow[] = await mariaConn.query('SELECT * FROM `settings`');
  log(`  settings table: ${rows.length} source rows`);

  let inserted = 0;

  if (DRY_RUN) {
    inserted = rows.length;
  } else {
    const tx = sqlite.transaction((data: SettingsRow[]) => {
      for (const row of data) {
        db.insert(schema.settings)
          .values({
            key: row.name,
            value: row.value,
          })
          .onConflictDoUpdate({
            target: schema.settings.key,
            set: { value: row.value },
          })
          .run();
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('settings', rows.length, inserted);
  migrationSummaries.push({
    table: 'settings',
    source: rows.length,
    inserted,
    skipped: 0,
    status: 'success',
  });
  log('=== Settings migration complete ===');
}

// ── Logs migration ─────────────────────────────────────────────────
async function migrateLogs() {
  log('=== Starting logs migration ===');

  const rows: LogRow[] = await mariaConn.query('SELECT * FROM `log`');
  log(`  log table: ${rows.length} source rows`);

  let inserted = 0;

  if (DRY_RUN) {
    inserted = rows.length;
  } else {
    const tx = sqlite.transaction((data: LogRow[]) => {
      for (const row of data) {
        db.insert(schema.logs)
          .values({
            timestamp: row.timestamp || undefined,
            level: row.level,
            ip: row.IP,
            endpoint: row.endpoint,
            method: row.method,
            status: row.status,
            description: row.description,
            query: row.query,
            result: row.result,
          })
          .run();
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('logs', rows.length, inserted);
  migrationSummaries.push({
    table: 'logs',
    source: rows.length,
    inserted,
    skipped: 0,
    status: 'success',
  });
  log('=== Logs migration complete ===');
}

// ── Gallery photos migration ──────────────────────────────────────
async function migratePhotos(
  memberMap: Map<string, number>,
): Promise<Map<string, number>> {
  log('=== Starting gallery photos migration ===');

  const rows: GalleryPhotoRow[] = await mariaConn.query('SELECT * FROM `gallery_photo`');
  log(`  gallery_photo table: ${rows.length} source rows`);

  let inserted = 0;
  let skipped = 0;

  // Map old photo_id (filename) → new photos.id (integer PK)
  const photoMap = new Map<string, number>();

  if (DRY_RUN) {
    let fakeId = 1;
    for (const row of rows) {
      const studentId = String(row.uploader_id);
      if (memberMap.has(studentId)) {
        photoMap.set(row.photo_id, fakeId++);
        inserted++;
      } else {
        log(`  WARNING: No member found for uploader student_id=${studentId}, skipping photo ${row.photo_id}`);
        skipped++;
      }
    }
  } else {
    const tx = sqlite.transaction((data: GalleryPhotoRow[]) => {
      for (const row of data) {
        const studentId = String(row.uploader_id);
        const memberId = memberMap.get(studentId);

        if (memberId === undefined) {
          log(`  WARNING: No member found for uploader student_id=${studentId}, skipping photo ${row.photo_id}`);
          skipped++;
          continue;
        }

        const result = db
          .insert(schema.photos)
          .values({
            filename: row.photo_id,
            size: row.size,
            uploaderId: memberId,
            likesCount: row.likes || 0,
            createdAt: row.timestamp || undefined,
          })
          .run();

        photoMap.set(row.photo_id, Number(result.lastInsertRowid));
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('photos', rows.length, inserted);
  if (skipped > 0) log(`  photos skipped (no matching uploader): ${skipped}`);
  migrationSummaries.push({
    table: 'photos',
    source: rows.length,
    inserted,
    skipped,
    status: 'success',
  });
  log('=== Gallery photos migration complete ===');

  return photoMap;
}

// ── Gallery tags migration ────────────────────────────────────────
async function migrateTags(): Promise<Map<string, number>> {
  log('=== Starting gallery tags migration ===');

  const rows: GalleryTagRow[] = await mariaConn.query('SELECT * FROM `gallery_tag`');
  log(`  gallery_tag table: ${rows.length} source rows`);

  let inserted = 0;

  // Map old tag_name → new tags.id
  const tagMap = new Map<string, number>();

  if (DRY_RUN) {
    let fakeId = 1;
    for (const row of rows) {
      tagMap.set(row.tag_name, fakeId++);
      inserted++;
    }
  } else {
    const tx = sqlite.transaction((data: GalleryTagRow[]) => {
      for (const row of data) {
        const result = db
          .insert(schema.tags)
          .values({ name: row.tag_name })
          .run();

        tagMap.set(row.tag_name, Number(result.lastInsertRowid));
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('tags', rows.length, inserted);
  migrationSummaries.push({
    table: 'tags',
    source: rows.length,
    inserted,
    skipped: 0,
    status: 'success',
  });
  log('=== Gallery tags migration complete ===');

  return tagMap;
}

// ── Gallery photo_tags migration ──────────────────────────────────
async function migratePhotoTags(
  photoMap: Map<string, number>,
  tagMap: Map<string, number>,
) {
  log('=== Starting gallery photo_tags migration ===');

  const rows: GalleryPhotoTagRow[] = await mariaConn.query(
    'SELECT * FROM `gallery_photo_tag`',
  );
  log(`  gallery_photo_tag table: ${rows.length} source rows`);

  let inserted = 0;
  let skipped = 0;

  if (DRY_RUN) {
    for (const row of rows) {
      const photoId = photoMap.get(row.photo_id);
      const tagId = tagMap.get(row.tag_name);
      if (photoId !== undefined && tagId !== undefined) {
        inserted++;
      } else {
        if (photoId === undefined)
          log(`  WARNING: No photo mapping for photo_id=${row.photo_id}, skipping photo_tag`);
        if (tagId === undefined)
          log(`  WARNING: No tag mapping for tag_name=${row.tag_name}, skipping photo_tag`);
        skipped++;
      }
    }
  } else {
    const tx = sqlite.transaction((data: GalleryPhotoTagRow[]) => {
      for (const row of data) {
        const photoId = photoMap.get(row.photo_id);
        const tagId = tagMap.get(row.tag_name);

        if (photoId === undefined) {
          log(`  WARNING: No photo mapping for photo_id=${row.photo_id}, skipping photo_tag`);
          skipped++;
          continue;
        }
        if (tagId === undefined) {
          log(`  WARNING: No tag mapping for tag_name=${row.tag_name}, skipping photo_tag`);
          skipped++;
          continue;
        }

        db.insert(schema.photoTags)
          .values({ photoId, tagId })
          .run();
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('photo_tags', rows.length, inserted);
  if (skipped > 0) log(`  photo_tags skipped (missing photo or tag): ${skipped}`);
  migrationSummaries.push({
    table: 'photo_tags',
    source: rows.length,
    inserted,
    skipped,
    status: 'success',
  });
  log('=== Gallery photo_tags migration complete ===');
}

// ── Gallery likes migration ───────────────────────────────────────
async function migratePhotoLikes(photoMap: Map<string, number>) {
  log('=== Starting gallery likes migration ===');

  const rows: GalleryLikeRow[] = await mariaConn.query('SELECT * FROM `gallery_like`');
  log(`  gallery_like table: ${rows.length} source rows`);

  let inserted = 0;
  let skipped = 0;

  if (DRY_RUN) {
    for (const row of rows) {
      if (photoMap.has(row.photo_id)) {
        inserted++;
      } else {
        log(`  WARNING: No photo mapping for photo_id=${row.photo_id}, skipping like`);
        skipped++;
      }
    }
  } else {
    const tx = sqlite.transaction((data: GalleryLikeRow[]) => {
      for (const row of data) {
        const photoId = photoMap.get(row.photo_id);

        if (photoId === undefined) {
          log(`  WARNING: No photo mapping for photo_id=${row.photo_id}, skipping like`);
          skipped++;
          continue;
        }

        db.insert(schema.photoLikes)
          .values({
            photoId,
            ip: row.ip,
            userId: row.user_id || undefined,
            createdAt: row.timestamp || undefined,
          })
          .run();
        inserted++;
      }
    });

    tx(rows);
  }

  logCount('photo_likes', rows.length, inserted);
  if (skipped > 0) log(`  photo_likes skipped (missing photo): ${skipped}`);
  migrationSummaries.push({
    table: 'photo_likes',
    source: rows.length,
    inserted,
    skipped,
    status: 'success',
  });
  log('=== Gallery likes migration complete ===');
}

// ── Print final summary ───────────────────────────────────────────
function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log(DRY_RUN ? '  MIGRATION DRY-RUN SUMMARY' : '  MIGRATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(
    '  Table'.padEnd(22) +
      'Source'.padStart(10) +
      'Inserted'.padStart(10) +
      'Skipped'.padStart(10),
  );
  console.log('─'.repeat(60));

  let totalSource = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const s of migrationSummaries) {
    console.log(
      `  ${s.table}`.padEnd(22) +
        String(s.source).padStart(10) +
        String(s.inserted).padStart(10) +
        String(s.skipped).padStart(10),
    );
    totalSource += s.source;
    totalInserted += s.inserted;
    totalSkipped += s.skipped;
  }

  console.log('─'.repeat(60));
  console.log(
    '  TOTAL'.padEnd(22) +
      String(totalSource).padStart(10) +
      String(totalInserted).padStart(10) +
      String(totalSkipped).padStart(10),
  );
  console.log('═'.repeat(60));

  if (DRY_RUN) {
    console.log('\n  No changes were written to SQLite (dry-run mode).');
  }
  console.log('');
}

// ── Run ────────────────────────────────────────────────────────────
try {
  log('Starting migration...');
  const startTime = Date.now();

  const memberMap = await migrateMembers();
  await migrateRecords(memberMap);
  await migrateVerifications(memberMap);
  await migrateSettings();
  await migrateLogs();

  // Gallery migrations
  const photoMap = await migratePhotos(memberMap);
  const tagMap = await migrateTags();
  await migratePhotoTags(photoMap, tagMap);
  await migratePhotoLikes(photoMap);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`=== All migrations complete (${elapsed}s) ===`);
  printSummary();
} catch (err) {
  console.error('[migrate] Migration failed:', err);
  process.exit(1);
} finally {
  await mariaConn.end();
  sqlite.close();
}
