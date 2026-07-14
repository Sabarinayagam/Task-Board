import { createServer } from 'http';
import { createApp } from './app';
import { initSocket } from './socket';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  const app = createApp();
  const httpServer = createServer(app);

  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`🚀 Task Board API listening on http://localhost:${env.port}`);
    console.log(`🔌 Socket.IO ready for real-time connections`);
  });

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
