import { eq } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
import { semesters, semesterMembers, members, settings } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const rows = db.select({ name: semesters.name }).from(semesters).all();
      const map = rows.map(r => r.name);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '학기 목록 요청', request.method, 200, request.query, map));
      return reply.code(200).send(success(map));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '학기 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // 학기 전환 미리보기
  fastify.get('/transition/preview', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const { name } = request.query;
      if (!name) {
        return reply.code(400).send(error('ERR_BAD_REQUEST', '새 학기명(name)을 지정해야 합니다.'));
      }

      const current = util.getCurrentSemester();
      if (!current) {
        return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기가 설정되어 있지 않습니다.'));
      }

      // 대상 학기가 이미 존재하는지 확인
      const targetExists = db.select().from(semesters).where(eq(semesters.name, name)).get();

      // 현재 학기 임원 조회
      const executives = db.select({
        name: members.name,
        studentId: members.studentId,
        role: semesterMembers.role,
      })
        .from(semesterMembers)
        .innerJoin(members, eq(semesterMembers.memberId, members.id))
        .where(eq(semesterMembers.semesterId, current.id))
        .all()
        .filter(r => r.role !== '회원');

      const result = {
        currentSemester: current.name,
        targetSemester: name,
        targetExists: !!targetExists,
        executives,
      };

      util.logger(new Log('info', request.remoteIP, request.originalPath, '학기 전환 미리보기', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '학기 전환 미리보기 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // 학기 전환 실행
  fastify.post('/transition', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const { name } = request.body || {};
      if (!name) {
        return reply.code(400).send(error('ERR_BAD_REQUEST', '새 학기명(name)을 지정해야 합니다.'));
      }

      const previous = util.getCurrentSemester();
      if (!previous) {
        return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기가 설정되어 있지 않습니다.'));
      }

      if (previous.name === name) {
        return reply.code(400).send(error('ERR_SAME_SEMESTER', '현재 학기와 동일한 학기입니다.'));
      }

      const carryOverMembers = [];

      const transition = sqlite.transaction(() => {
        // 1. 새 학기 행 생성 (이미 있으면 기존 행 사용)
        let newSemester = db.select().from(semesters).where(eq(semesters.name, name)).get();
        if (!newSemester) {
          db.insert(semesters).values({ name }).run();
          newSemester = db.select().from(semesters).where(eq(semesters.name, name)).get();
        }

        // 2. 이전 학기 임원 조회
        const executives = db.select({
          memberId: semesterMembers.memberId,
          role: semesterMembers.role,
          name: members.name,
          studentId: members.studentId,
        })
          .from(semesterMembers)
          .innerJoin(members, eq(semesterMembers.memberId, members.id))
          .where(eq(semesterMembers.semesterId, previous.id))
          .all()
          .filter(r => r.role !== '회원');

        // 3. 임원을 새 학기에 복사
        for (const exec of executives) {
          // 이미 등록되어 있지 않은 경우에만 추가
          const exists = db.select()
            .from(semesterMembers)
            .where(eq(semesterMembers.semesterId, newSemester.id))
            .all()
            .find(r => r.memberId === exec.memberId);

          if (!exists) {
            db.insert(semesterMembers).values({
              semesterId: newSemester.id,
              memberId: exec.memberId,
              role: exec.role,
            }).run();
          }

          carryOverMembers.push({
            name: exec.name,
            studentId: exec.studentId,
            role: exec.role,
          });
        }

        // 4. settings.currentSemester 업데이트
        db.update(settings).set({ value: name }).where(eq(settings.key, 'currentSemester')).run();
      });

      transition();

      const result = {
        semester: name,
        previousSemester: previous.name,
        carryOverMembers,
      };

      util.logger(new Log('info', request.remoteIP, request.originalPath, '학기 전환 실행', request.method, 200, request.body, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '학기 전환 실행 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
