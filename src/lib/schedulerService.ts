/**
 * Scheduler Service
 * Handles periodic execution of background tasks like auto-reply scheduling
 */

import { autoReplyScheduler } from './auto-reply/scheduler';

// Track last execution time to prevent multiple simultaneous runs
let lastExecution: number | null = null;
const EXECUTION_INTERVAL = 60000; // 1 minute in milliseconds

interface SchedulerStats {
  lastRun: Date | null;
  runsCount: number;
  lastRunDuration: number | null;
  errorsCount: number;
}

let schedulerStats: SchedulerStats = {
  lastRun: null,
  runsCount: 0,
  lastRunDuration: null,
  errorsCount: 0,
};

/**
 * Execute scheduled tasks
 */
export async function executeScheduledTasks(): Promise<boolean> {
  const now = Date.now();

  // Prevent multiple executions within the interval
  if (lastExecution && (now - lastExecution) < EXECUTION_INTERVAL) {
    console.log(`[Scheduler Service] Skipping execution - last run was ${Math.floor((now - lastExecution) / 1000)}s ago`);
    return false;
  }

  lastExecution = now;

  try {
    console.log('[Scheduler Service] Starting scheduled tasks execution...');
    const startTime = Date.now();

    // Run the auto-reply scheduler
    await autoReplyScheduler.runScheduler();

    const duration = Date.now() - startTime;
    schedulerStats.lastRun = new Date();
    schedulerStats.runsCount += 1;
    schedulerStats.lastRunDuration = duration;

    console.log(`[Scheduler Service] Execution completed in ${duration}ms`);

    return true;
  } catch (error) {
    console.error('[Scheduler Service] Error executing scheduled tasks:', error);
    schedulerStats.errorsCount += 1;
    return false;
  }
}

/**
 * Get scheduler statistics
 */
export function getSchedulerStats(): SchedulerStats {
  return { ...schedulerStats };
}

/**
 * Initialize the scheduler service
 * This could be called on application startup in a production environment
 */
export function initializeSchedulerService() {
  console.log('[Scheduler Service] Initializing...');

  // In a real production environment, you could use setInterval here
  // but in Next.js serverless functions, this would only run during the initialization of a serverless instance
  // For true cron-like behavior, you'd need an external service or use a platform like Vercel Cron Jobs

  // Example of how it would work with setInterval (only in environments that support long-running processes):
  // setInterval(async () => {
  //   await executeScheduledTasks();
  // }, EXECUTION_INTERVAL);

  console.log('[Scheduler Service] Initialized with interval:', EXECUTION_INTERVAL, 'ms');
}

/**
 * Check if scheduler should run based on time interval
 */
export function shouldRunScheduler(): boolean {
  const now = Date.now();
  return !lastExecution || (now - lastExecution) >= EXECUTION_INTERVAL;
}

export const schedulerService = {
  executeScheduledTasks,
  getSchedulerStats,
  initializeSchedulerService,
  shouldRunScheduler,
};