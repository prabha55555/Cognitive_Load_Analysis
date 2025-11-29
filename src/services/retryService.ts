/**
 * Unified Retry Service
 * 
 * TODO: Implement centralized retry logic
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Configurable retry strategies
 * 
 * Related Flaw: Module 2 - Unreliable API Retry Logic (MEDIUM)
 * @see docs/FLAWS_AND_ISSUES.md
 */

import { isRetryableError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

class RetryService {
  private config: RetryConfig;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly CIRCUIT_THRESHOLD = 5;
  private readonly CIRCUIT_TIMEOUT = 60000; // 1 minute

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, attempt);
    delay = Math.min(delay, this.config.maxDelayMs);
    
    if (this.config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += Math.random() * jitterRange * 2 - jitterRange;
    }
    
    return Math.floor(delay);
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(key: string): boolean {
    const state = this.circuitBreakers.get(key);
    if (!state) return false;
    
    if (state.isOpen) {
      // Check if timeout has passed
      if (Date.now() - state.lastFailure > this.CIRCUIT_TIMEOUT) {
        state.isOpen = false;
        state.failures = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Record failure for circuit breaker
   */
  private recordFailure(key: string): void {
    let state = this.circuitBreakers.get(key);
    
    if (!state) {
      state = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakers.set(key, state);
    }
    
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= this.CIRCUIT_THRESHOLD) {
      state.isOpen = true;
      logger.warn(`Circuit breaker opened for: ${key}`);
    }
  }

  /**
   * Reset circuit breaker
   */
  private resetCircuit(key: string): void {
    this.circuitBreakers.delete(key);
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    key: string = 'default',
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    
    // Check circuit breaker
    if (this.isCircuitOpen(key)) {
      throw new Error(`Circuit breaker is open for: ${key}`);
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await fn();
        this.resetCircuit(key);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logger.warn(`Attempt ${attempt + 1}/${config.maxRetries + 1} failed: ${lastError.message}`);
        
        // Check if error is retryable
        if (!isRetryableError(error) || attempt === config.maxRetries) {
          this.recordFailure(key);
          throw lastError;
        }
        
        // Wait before retry
        const delay = this.calculateDelay(attempt);
        logger.debug(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Retry failed');
  }
}

// Default retry service instance
export const retryService = new RetryService();

export { RetryService };
export type { RetryConfig };
export default RetryService;
