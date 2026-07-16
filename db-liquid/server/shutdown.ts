import type { Server } from 'node:http';
import { closeMongo } from './db';

type ShutdownOptions = {
  server: Server;
  stopBackgroundJobs?: () => void;
};

/**
 * INFRA-006 — drain HTTP + Mongo on SIGTERM/SIGINT (Hostinger / Nixpacks restarts).
 */
export function registerGracefulShutdown(options: ShutdownOptions) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} received — closing...`);

    try {
      options.stopBackgroundJobs?.();
    } catch (error) {
      console.error('[shutdown] failed to stop background jobs', error);
    }

    await new Promise<void>((resolve) => {
      options.server.close(() => resolve());
      // Force exit path if hang
      setTimeout(() => resolve(), 10_000).unref?.();
    });

    try {
      await closeMongo();
    } catch (error) {
      console.error('[shutdown] Mongo close failed', error);
    }

    console.log('[shutdown] done');
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}
