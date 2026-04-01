// Production-safe logging utility
const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production, but with proper error reporting
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || process.env.LOG_ERRORS === 'true') {
      console.error(...args);
    }

    // In production, you might want to send errors to an error tracking service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send to error tracking service (e.g., Sentry, LogRocket, etc.)
      // Example: Sentry.captureException(new Error(args.join(' ')));
    }
  },

  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.debug(...args);
    }
  }
};

export default logger;