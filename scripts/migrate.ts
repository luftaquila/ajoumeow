/**
 * Migration script: MariaDB → SQLite (Drizzle ORM)
 *
 * Usage: npx tsx scripts/migrate.ts
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

interface TableNameRow {
  [key: string]: string;
}

// ── Main migration ─────────────────────────────────────────────────
async function migrateMembers() {
  log('=== Starting member/semester migration ===');

  // 1. Discover namelist_* and register_* tables
  const tables: TableNameRow[] = await mariaConn.query('SHOW TABLES');
  const tableKey = Object.keys(tables[0] || {})[0];
  const tableNames: string[] = tables.map((t) => t[tableKey]).filter(Boolean);

  const namelistTables = tableNames.filter((t) => t.startsWith('namelist_'));
  const registerTables = tableNames.filter((t) => t.startsWith('register_'));

  log(`Found ${namelistTables.length} namelist tables: ${namelistTables.join(', ')}`);
  log(`Found ${registerTables.length} register tables: ${registerTables.join(', ')}`);

  // Use a single SQLite transaction for atomicity
  const migrateTx = sqlite.transaction(() => {
    // ── 2. Insert semesters ──────────────────────────────────────
    log('Migrating semesters...');
    const semesterNames = namelistTables.map((t) => t.replace('namelist_', ''));
    const semesterMap = new Map<string, number>();

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
    logCount('semesters', semesterNames.length, semesterMap.size);

    return semesterMap;
  });

  const semesterMap = migrateTx();

  // ── 3. Migrate namelist members ────────────────────────────────
  log('Migrating members from namelist tables...');

  // Track member student_id → id mapping
  const memberMap = new Map<string, number>();
  let totalSourceRows = 0;
  let totalInserted = 0;
  let totalSemesterMembers = 0;

  // Use a transaction for all member inserts
  const memberTx = sqlite.transaction(
    (namelistData: { semester: string; rows: NamelistRow[] }[]) => {
      for (const { semester, rows } of namelistData) {
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

  // Fetch all namelist data from MariaDB first, then process in SQLite transaction
  const namelistData: { semester: string; rows: NamelistRow[] }[] = [];

  for (const table of namelistTables) {
    const semester = table.replace('namelist_', '');
    const rows: NamelistRow[] = await mariaConn.query(`SELECT * FROM \`${table}\``);
    log(`  ${table}: ${rows.length} rows`);
    namelistData.push({ semester, rows });
  }

  memberTx(namelistData);

  logCount('members (unique by student_id)', totalSourceRows, totalInserted);
  log(`  semester_members: ${totalSemesterMembers} relationships created`);

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

  const registerTx = sqlite.transaction(
    (data: { semester: string; rows: RegisterRow[] }[]) => {
      for (const { semester, rows } of data) {
        // The register table semester name must match a known semester
        let semesterId = semesterMap.get(semester);

        if (!semesterId) {
          // Create semester if it doesn't exist (register table might reference a semester
          // that has no namelist table yet)
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

  logCount('registrations', totalRegSource, totalRegInserted);

  // ── 5. Summary ─────────────────────────────────────────────────
  log('=== Member/semester migration complete ===');
  log(`  Semesters: ${semesterMap.size}`);
  log(`  Members (unique): ${memberMap.size}`);
  log(`  Semester-Member relationships: ${totalSemesterMembers}`);
  log(`  Registrations: ${totalRegInserted}`);
}

// ── Run ────────────────────────────────────────────────────────────
try {
  await migrateMembers();
} catch (err) {
  console.error('[migrate] Migration failed:', err);
  process.exit(1);
} finally {
  await mariaConn.end();
  sqlite.close();
}
