import type { FastifyInstance } from 'fastify';
import { getWeatherData } from '../services/weather.js';

export default async function weatherRoutes(app: FastifyInstance) {
  app.get('/api/weather', async (_request, reply) => {
    const data = getWeatherData();
    if (!data) {
      return reply.status(503).send({
        error: 'Weather data not available yet',
        statusCode: 503,
      });
    }
    return data;
  });
}
