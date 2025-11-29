/**
 * Logging Utility
 * 
 * TODO: Implement proper logging service
 * - Environment-based log levels
 * - Structured logging format
 * - Remote logging integration (Sentry, LogRocket)
 * - Remove console.log from production
 * 
 * Related Flaw: Module 6 - Excessive Console Logging (MEDIUM)
 * @see docs/FLAWS_AND_ISSUES.md
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// TODO: Use LogEntry type when remote logging is implemented
// interface LogEntry {
//   level: LogLevel;
//   message: string;
//   timestamp: string;
//   data?: unknown;
// }

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  // TODO: Implement formatEntry when remote logging is added

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment && this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, data ?? '');
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data ?? '');
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error ?? '');
      // TODO: Send to remote error tracking service
    }
  }

  // TODO: Implement sendToRemote for integration with Sentry, LogRocket, etc.
}

export const logger = new Logger();
export default logger;
