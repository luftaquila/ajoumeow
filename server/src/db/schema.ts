import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── members ─────────────────────────────────────────────────────────
export const members = sqliteTable('members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: text('student_id').notNull().unique(),
  name: text('name').notNull(),
  college: text('college').notNull(),
  department: text('department').notNull(),
  phone: text('phone').notNull(),
  birthday: text('birthday'),
  volunteerId: text('volunteer_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── semesters ───────────────────────────────────────────────────────
export const semesters = sqliteTable('semesters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(false),
});

// ── semester_members ────────────────────────────────────────────────
export const semesterMembers = sqliteTable('semester_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  semesterId: integer('semester_id')
    .notNull()
    .references(() => semesters.id),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id),
  role: text('role').notNull().default('회원'),
  registeredAt: text('registered_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── records ─────────────────────────────────────────────────────────
export const records = sqliteTable('records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id),
  date: text('date').notNull(),
  course: text('course').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── verifications ───────────────────────────────────────────────────
export const verifications = sqliteTable('verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id),
  date: text('date').notNull(),
  course: text('course').notNull(),
  score: real('score').notNull(),
  verifiedAt: text('verified_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── settings ────────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// ── logs ────────────────────────────────────────────────────────────
export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp')
    .notNull()
    .default(sql`(datetime('now'))`),
  level: text('level').notNull(),
  ip: text('ip'),
  endpoint: text('endpoint'),
  method: text('method'),
  status: integer('status'),
  description: text('description'),
  query: text('query'),
  result: text('result'),
});

// ── photos ──────────────────────────────────────────────────────────
export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  size: integer('size').notNull(),
  uploaderId: integer('uploader_id')
    .notNull()
    .references(() => members.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  likesCount: integer('likes_count').notNull().default(0),
});

// ── tags ────────────────────────────────────────────────────────────
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

// ── photo_tags ──────────────────────────────────────────────────────
export const photoTags = sqliteTable(
  'photo_tags',
  {
    photoId: integer('photo_id')
      .notNull()
      .references(() => photos.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.photoId, table.tagId] })],
);

// ── photo_likes ─────────────────────────────────────────────────────
export const photoLikes = sqliteTable('photo_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  photoId: integer('photo_id')
    .notNull()
    .references(() => photos.id),
  ip: text('ip').notNull(),
  userId: integer('user_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── registrations ───────────────────────────────────────────────────
export const registrations = sqliteTable('registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: text('student_id').notNull(),
  name: text('name').notNull(),
  college: text('college').notNull(),
  department: text('department').notNull(),
  phone: text('phone').notNull(),
  semesterId: integer('semester_id')
    .notNull()
    .references(() => semesters.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
