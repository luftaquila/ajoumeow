import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface UserPayload {
  memberId: number;
  studentId: string;
  role: string;
  semester: string;
}

// Extend Fastify request type with user property
declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = '365d';

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers['x-access-token'] as string | undefined;

  if (!token) {
    return reply.status(401).send({ error: 'Authentication required', statusCode: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token', statusCode: 401 });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);

  // If authenticate already sent a 401, don't continue
  if (reply.sent) return;

  if (request.user.role === '회원') {
    return reply.status(403).send({ error: 'Admin access required', statusCode: 403 });
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  // Decorate request with user property (initial value is needed for type inference)
  app.decorateRequest('user', null as unknown as UserPayload);
});
