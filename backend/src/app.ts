import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { getOnlineCount } from './socket/presence';
import cardRoutes from './routes/cardRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', onlineUsers: getOnlineCount() });
  });

  app.use('/api', cardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
