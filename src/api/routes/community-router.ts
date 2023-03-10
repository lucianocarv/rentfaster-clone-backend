import { FastifyInstance, RouteOptions } from 'fastify';
import { communityController } from '../controllers/community-controller';

async function communityRoutes(fastify: FastifyInstance) {
  fastify.get('/communities', communityController.index);
}

export { communityRoutes };
