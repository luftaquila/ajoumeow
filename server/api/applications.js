import { OAuth2Client } from 'google-auth-library';
import { eq, and } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
import { members, semesters, semesterMembers, applications } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  // Submit application
  fastify.post('/', async (request, reply) => {
    try {
      const { credential, studentId, name, college, department, phone, birthday, volunteerId, isNew } = request.body;
      if (!credential) {
        return reply.code(400).send(error('ERR_NO_CREDENTIAL', 'Google credential이 필요합니다.'));
      }

      // Verify Google credential
      const clientId = util.getSettings('googleClientId');
      if (!clientId) {
        return reply.code(500).send(error('ERR_CONFIG', 'Google OAuth가 설정되지 않았습니다.'));
      }

      const client = new OAuth2Client(clientId);
      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      } catch (e) {
        return reply.code(401).send(error('ERR_INVALID_CREDENTIAL', 'Google 인증에 실패했습니다.'));
      }

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const googleEmail = payload.email;
      const googleName = payload.name;

      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기 설정이 없습니다.'));
      }

      // Check duplicate pending application
      const existing = db.select().from(applications)
        .where(and(eq(applications.googleId, googleId), eq(applications.semesterId, semester.id), eq(applications.status, 'pending')))
        .get();
      if (existing) {
        return reply.code(400).send(error('ERR_ALREADY_APPLIED', '이미 신청이 접수되어 승인 대기 중입니다.'));
      }

      // Check if already a semester member
      const member = db.select().from(members).where(eq(members.googleId, googleId)).get();
      if (member) {
        const sm = db.select().from(semesterMembers)
          .where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id)))
          .get();
        if (sm) {
          return reply.code(400).send(error('ERR_ALREADY_REGISTERED', '이미 이번 학기 회원으로 등록되어 있습니다.'));
        }
      }

      // Validate required fields
      if (!studentId || !name || !college || !department || !phone) {
        return reply.code(400).send(error('ERR_MISSING_FIELDS', '필수 정보를 모두 입력해 주세요.'));
      }

      const isNewBool = isNew === true || isNew === 'true';

      // Auto-approve for admin emails
      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (adminEmails.includes(googleEmail)) {
        const tx = sqlite.transaction(() => {
          if (isNewBool) {
            const result = sqlite.prepare(`
              INSERT INTO members (student_id, name, college, department, phone, birthday, volunteer_id, google_id, google_email)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(String(studentId), name, college, department, phone, birthday || null, volunteerId || null, googleId, googleEmail);
            sqlite.prepare(`INSERT INTO semester_members (semester_id, member_id, role) VALUES (?, ?, '관리자')`)
              .run(semester.id, result.lastInsertRowid);
          } else {
            const existingMember = sqlite.prepare(`SELECT id FROM members WHERE student_id = ?`).get(String(studentId));
            if (!existingMember) throw new Error('기존 회원을 찾을 수 없습니다.');
            sqlite.prepare(`UPDATE members SET phone = ?, birthday = ?, volunteer_id = ?, google_id = ?, google_email = ? WHERE id = ?`)
              .run(phone, birthday || null, volunteerId || null, googleId, googleEmail, existingMember.id);
            sqlite.prepare(`INSERT INTO semester_members (semester_id, member_id, role) VALUES (?, ?, '관리자')`)
              .run(semester.id, existingMember.id);
          }

          sqlite.prepare(`
            INSERT INTO applications (google_id, google_email, google_name, student_id, name, college, department, phone, birthday, volunteer_id, is_new, semester_id, status, reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', datetime('now'))
          `).run(googleId, googleEmail, googleName, String(studentId), name, college, department, phone, birthday || null, volunteerId || null, isNewBool ? 1 : 0, semester.id);
        });
        tx();

        util.logger(new Log('info', request.remoteIP, request.originalPath, '관리자 자동 승인', request.method, 201, { googleEmail, studentId, name }, 'auto-approved'));
        return reply.code(201).send(success({ submitted: true, autoApproved: true }));
      }

      db.insert(applications).values({
        googleId,
        googleEmail,
        googleName,
        studentId: String(studentId),
        name,
        college,
        department,
        phone,
        birthday: birthday || null,
        volunteerId: volunteerId || null,
        isNew: isNewBool,
        semesterId: semester.id,
      }).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 201, { googleId, studentId, name }, 'success'));
      return reply.code(201).send(success({ submitted: true }));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // List applications (admin)
  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const { semester, status } = request.query;

      let semesterId;
      if (semester) {
        const sem = db.select().from(semesters).where(eq(semesters.name, semester)).get();
        if (!sem) {
          return reply.code(400).send(error('ERR_SEMESTER_NOT_FOUND', '해당 학기를 찾을 수 없습니다.'));
        }
        semesterId = sem.id;
      } else {
        const current = util.getCurrentSemester();
        if (!current) {
          return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기 설정이 없습니다.'));
        }
        semesterId = current.id;
      }

      let query = `SELECT a.*, s.name AS semesterName FROM applications a JOIN semesters s ON a.semester_id = s.id WHERE a.semester_id = ?`;
      const params = [semesterId];

      if (status && status !== 'all') {
        query += ` AND a.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY a.created_at DESC`;

      const rows = sqlite.prepare(query).all(...params);

      const result = rows.map(r => ({
        id: r.id,
        googleId: r.google_id,
        googleEmail: r.google_email,
        googleName: r.google_name,
        studentId: r.student_id,
        name: r.name,
        college: r.college,
        department: r.department,
        phone: r.phone,
        birthday: r.birthday,
        volunteerId: r.volunteer_id,
        isNew: !!r.is_new,
        status: r.status,
        semesterName: r.semesterName,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
      }));

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청 목록', request.method, 200, request.query, `${result.length}건`));
      return reply.code(200).send(success(result));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청 목록 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Get semesters that have applications
  fastify.get('/semesters', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const rows = sqlite.prepare(`
        SELECT DISTINCT s.name FROM applications a
        JOIN semesters s ON a.semester_id = s.id
        ORDER BY s.id DESC
      `).all();
      return reply.code(200).send(success(rows.map(r => r.name)));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '신청 학기 목록 오류', request.method, 500, null, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Approve application (admin)
  fastify.put('/:id/approve', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const app = db.select().from(applications).where(eq(applications.id, Number(request.params.id))).get();
      if (!app) {
        return reply.code(400).send(error('ERR_NOT_FOUND', '신청을 찾을 수 없습니다.'));
      }
      if (app.status !== 'pending') {
        return reply.code(400).send(error('ERR_ALREADY_REVIEWED', '이미 처리된 신청입니다.'));
      }

      const tx = sqlite.transaction(() => {
        if (app.isNew) {
          // New member: insert into members
          const result = sqlite.prepare(`
            INSERT INTO members (student_id, name, college, department, phone, birthday, volunteer_id, google_id, google_email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(app.studentId, app.name, app.college, app.department, app.phone, app.birthday, app.volunteerId, app.googleId, app.googleEmail);

          // Add semester membership
          sqlite.prepare(`INSERT INTO semester_members (semester_id, member_id, role) VALUES (?, ?, '회원')`)
            .run(app.semesterId, result.lastInsertRowid);
        } else {
          // Existing member: find by studentId and update
          const member = sqlite.prepare(`SELECT id FROM members WHERE student_id = ?`).get(app.studentId);
          if (!member) {
            throw new Error('기존 회원을 찾을 수 없습니다.');
          }

          sqlite.prepare(`UPDATE members SET phone = ?, birthday = ?, volunteer_id = ?, google_id = ?, google_email = ? WHERE id = ?`)
            .run(app.phone, app.birthday, app.volunteerId, app.googleId, app.googleEmail, member.id);

          // Add semester membership
          sqlite.prepare(`INSERT INTO semester_members (semester_id, member_id, role) VALUES (?, ?, '회원')`)
            .run(app.semesterId, member.id);
        }

        // Update application status
        sqlite.prepare(`UPDATE applications SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?`)
          .run(app.id);
      });
      tx();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 승인', request.method, 200, { id: app.id, studentId: app.studentId }, 'approved'));
      return reply.code(200).send(success({ approved: true }));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 승인 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', e.message || '알 수 없는 오류입니다.'));
    }
  });

  // Reject application (admin)
  fastify.put('/:id/reject', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const app = db.select().from(applications).where(eq(applications.id, Number(request.params.id))).get();
      if (!app) {
        return reply.code(400).send(error('ERR_NOT_FOUND', '신청을 찾을 수 없습니다.'));
      }
      if (app.status !== 'pending') {
        return reply.code(400).send(error('ERR_ALREADY_REVIEWED', '이미 처리된 신청입니다.'));
      }

      db.update(applications).set({
        status: 'rejected',
        reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }).where(eq(applications.id, app.id)).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 거절', request.method, 200, { id: app.id, studentId: app.studentId }, 'rejected'));
      return reply.code(200).send(success({ rejected: true }));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 거절 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
