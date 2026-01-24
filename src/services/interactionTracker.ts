/**
 * Interaction Tracker Service
 * 
 * Captures and batches user interaction events for behavioral cognitive load analysis.
 * Implements event listeners for clicks, mouse movements, scrolls, and keystrokes.
 * 
 * @see .kiro/specs/behavioral-cognitive-load/design.md
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2, 6.3, 6.4, 6.5, 9.3
 */

import { logger } from '../utils/logger';
import { authService } from './authService';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type Platform = 'chatgpt' | 'google';
export type InteractionEventType = 'click' | 'mousemove' | 'scroll' | 'keystroke' | 'navigation';

export interface ClickData {
  targetElement: string;
  x: number;
  y: number;
}

export interface MouseData {
  x: number;
  y: number;
  velocity: number;
}

export interface ScrollData {
  direction: 'up' | 'down';
  velocity: number;
  position: number;
}

export interface KeystrokeData {
  keyDownTime: number;
  keyUpTime: number;
  interKeyInterval: number;
}

export interface NavigationData {
  fromSection: string;
  toSection: string;
  dwellTime: number;
}

export type InteractionEventData = ClickData | MouseData | ScrollData | KeystrokeData | NavigationData;

export interface InteractionEvent {
  type: InteractionEventType;
  timestamp: number;
  session_id: string;  // snake_case for backend compatibility
  platform: Platform;
  data: InteractionEventData;
}

export interface InteractionTrackerConfig {
  batchSize: number;           // Max events before auto-flush (default: 50)
  flushInterval: number;       // Max time before auto-flush in ms (default: 5000)
  mouseSampleRate: number;     // Mouse sampling interval in ms (default: 100)
  throttleHighFrequency: boolean;
  apiUrl: string;              // Backend API URL for behavioral service
  maxRetries: number;          // Max retry attempts (default: 4)
  maxQueueSize: number;        // Max queue size before dropping old events (default: 1000)
}

export interface InteractionBatch {
  session_id: string;
  participant_id: string;
  platform: Platform;
  events: InteractionEvent[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: InteractionTrackerConfig = {
  batchSize: 10,  // Reduced from 50 - send after 10 interactions for faster predictions
  flushInterval: 10000,  // Send every 10 seconds for real-time classification
  mouseSampleRate: 100,
  throttleHighFrequency: true,
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',  // Backend Express server
  maxRetries: 4,
  maxQueueSize: 1000,
};

// ============================================================================
// InteractionTracker Class
// ============================================================================

export class InteractionTracker {
  private config: InteractionTrackerConfig;
  private eventQueue: InteractionEvent[] = [];
  private sessionId: string;
  private participantId: string;
  private platform: Platform;
  private isTracking: boolean = false;
  private flushIntervalId: ReturnType<typeof setInterval> | null = null;
  
  // Mouse tracking state
  private lastMousePosition: { x: number; y: number; timestamp: number } | null = null;
  private lastMouseSampleTime: number = 0;
  
  // Keystroke tracking state
  private lastKeyDownTime: number = 0;
  private lastKeyUpTime: number = 0;
  
  // Navigation tracking state
  private currentSection: string = '';
  private sectionEntryTime: number = 0;
  
  // Scroll tracking state
  private lastScrollPosition: number = 0;
  private lastScrollTime: number = 0;
  
  // Bound event handlers (for cleanup)
  private boundHandlers: {
    click: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    scroll: (e: Event) => void;
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
  };

  constructor(
    sessionId: string,
    participantId: string,
    platform: Platform,
    config: Partial<InteractionTrackerConfig> = {}
  ) {
    this.sessionId = sessionId;
    this.participantId = participantId;
    this.platform = platform;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Bind event handlers
    this.boundHandlers = {
      click: this.handleClick.bind(this),
      mousemove: this.handleMouseMove.bind(this),
      scroll: this.handleScroll.bind(this),
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Start tracking user interactions
   * Requirements: 6.1
   */
  start(): void {
    if (this.isTracking) {
      logger.warn('InteractionTracker is already running');
      return;
    }

    this.isTracking = true;
    this.initializeEventListeners();
    this.startFlushInterval();
    
    logger.info(`InteractionTracker started for session ${this.sessionId} on ${this.platform}`);
  }

  /**
   * Stop tracking and flush remaining events
   * Requirements: 6.3
   */
  async stop(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this.removeEventListeners();
    this.stopFlushInterval();
    
    // Flush any remaining events
    await this.flush();
    
    logger.info(`InteractionTracker stopped for session ${this.sessionId}`);
  }

  /**
   * Manually flush all queued events to the backend
   * Requirements: 6.3
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    logger.info(`[BEHAVIORAL] Flushing ${eventsToSend.length} events for session ${this.sessionId} (${this.platform})`);

    try {
      await this.sendBatch(eventsToSend);
      logger.info(`[BEHAVIORAL] Successfully sent ${eventsToSend.length} events to backend`);
    } catch (error) {
      // Re-queue events on failure (at the front)
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      logger.error('Failed to flush events, re-queued for retry', error);
      throw error;
    }
  }

  /**
   * Track a navigation event (section transition)
   * Requirements: 1.5
   */
  trackNavigation(toSection: string): void {
    if (!this.isTracking) return;

    const now = Date.now();
    const dwellTime = this.sectionEntryTime > 0 ? now - this.sectionEntryTime : 0;

    if (this.currentSection && this.currentSection !== toSection) {
      const event: InteractionEvent = {
        type: 'navigation',
        timestamp: now,
        session_id: this.sessionId,
        platform: this.platform,
        data: {
          fromSection: this.currentSection,
          toSection,
          dwellTime,
        } as NavigationData,
      };
      this.queueEvent(event);
    }

    this.currentSection = toSection;
    this.sectionEntryTime = now;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Check if tracker is currently active
   */
  isActive(): boolean {
    return this.isTracking;
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handle click events
   * Requirements: 1.1
   */
  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const targetElement = this.getElementIdentifier(target);

    const event: InteractionEvent = {
      type: 'click',
      timestamp: Date.now(),
      session_id: this.sessionId,
      platform: this.platform,
      data: {
        targetElement,
        x: e.clientX,
        y: e.clientY,
      } as ClickData,
    };

    this.queueEvent(event);
  }

  /**
   * Handle mouse movement events with sampling
   * Requirements: 1.2, 6.5
   */
  private handleMouseMove(e: MouseEvent): void {
    const now = Date.now();

    // Throttle high-frequency events
    if (this.config.throttleHighFrequency) {
      if (now - this.lastMouseSampleTime < this.config.mouseSampleRate) {
        return;
      }
    }

    // Calculate velocity
    let velocity = 0;
    if (this.lastMousePosition) {
      const dx = e.clientX - this.lastMousePosition.x;
      const dy = e.clientY - this.lastMousePosition.y;
      const dt = now - this.lastMousePosition.timestamp;
      if (dt > 0) {
        velocity = Math.sqrt(dx * dx + dy * dy) / dt * 1000; // pixels per second
      }
    }

    const event: InteractionEvent = {
      type: 'mousemove',
      timestamp: now,
      session_id: this.sessionId,
      platform: this.platform,
      data: {
        x: e.clientX,
        y: e.clientY,
        velocity,
      } as MouseData,
    };

    this.queueEvent(event);

    // Update tracking state
    this.lastMousePosition = { x: e.clientX, y: e.clientY, timestamp: now };
    this.lastMouseSampleTime = now;
  }

  /**
   * Handle scroll events
   * Requirements: 1.4
   */
  private handleScroll(_e: Event): void {
    const now = Date.now();
    const currentPosition = window.scrollY;

    // Calculate direction and velocity
    const direction: 'up' | 'down' = currentPosition > this.lastScrollPosition ? 'down' : 'up';
    const dt = now - this.lastScrollTime;
    const velocity = dt > 0 ? Math.abs(currentPosition - this.lastScrollPosition) / dt * 1000 : 0;

    const event: InteractionEvent = {
      type: 'scroll',
      timestamp: now,
      session_id: this.sessionId,
      platform: this.platform,
      data: {
        direction,
        velocity,
        position: currentPosition,
      } as ScrollData,
    };

    this.queueEvent(event);

    // Update tracking state
    this.lastScrollPosition = currentPosition;
    this.lastScrollTime = now;
  }

  /**
   * Handle keydown events (privacy-preserving - no key values)
   * Requirements: 1.3
   */
  private handleKeyDown(_e: KeyboardEvent): void {
    this.lastKeyDownTime = Date.now();
  }

  /**
   * Handle keyup events (privacy-preserving - no key values)
   * Requirements: 1.3
   */
  private handleKeyUp(_e: KeyboardEvent): void {
    const now = Date.now();
    const keyUpTime = now;
    const keyDownTime = this.lastKeyDownTime;
    const interKeyInterval = this.lastKeyUpTime > 0 ? keyDownTime - this.lastKeyUpTime : 0;

    const event: InteractionEvent = {
      type: 'keystroke',
      timestamp: now,
      session_id: this.sessionId,
      platform: this.platform,
      data: {
        keyDownTime,
        keyUpTime,
        interKeyInterval,
      } as KeystrokeData,
    };

    this.queueEvent(event);

    this.lastKeyUpTime = keyUpTime;
  }

  // ==========================================================================
  // Event Queue Management
  // ==========================================================================

  /**
   * Add event to queue and trigger flush if needed
   * Requirements: 6.2
   */
  private queueEvent(event: InteractionEvent): void {
    // Check queue overflow
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      logger.warn('Event queue overflow, dropping oldest events');
      this.eventQueue = this.eventQueue.slice(-Math.floor(this.config.maxQueueSize * 0.9));
    }

    this.eventQueue.push(event);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      logger.info(`Auto-flushing batch (size threshold reached: ${this.eventQueue.length} events)`);
      this.flush().catch(err => logger.error('Auto-flush failed', err));
    }
  }

  // ==========================================================================
  // Network Communication
  // ==========================================================================

  /**
   * Send batch of events to backend with retry logic
   * Requirements: 1.6, 6.4, 9.3
   */
  private async sendBatch(events: InteractionEvent[]): Promise<void> {
    const batch: InteractionBatch = {
      session_id: this.sessionId,
      participant_id: this.participantId,
      platform: this.platform,
      events,
    };

    logger.info(`[BEHAVIORAL] Sending batch to backend:`, {
      sessionId: this.sessionId,
      platform: this.platform,
      eventCount: events.length,
      eventTypes: events.map(e => e.type).join(', ')
    });

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Build headers with JWT token for session context sharing (Requirements: 9.3)
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        const token = authService.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.config.apiUrl}/api/behavioral/analyze`, {
          method: 'POST',
          headers,
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error(`[BEHAVIORAL] Backend error:`, { status: response.status, error: errorData });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        logger.info(`[BEHAVIORAL] Backend response:`, result);

        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s (max 30s)
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          logger.warn(`Batch send attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Failed to send batch after retries');
  }

  // ==========================================================================
  // Lifecycle Management
  // ==========================================================================

  /**
   * Initialize all event listeners
   * Requirements: 6.1
   */
  private initializeEventListeners(): void {
    document.addEventListener('click', this.boundHandlers.click, { passive: true });
    document.addEventListener('mousemove', this.boundHandlers.mousemove, { passive: true });
    window.addEventListener('scroll', this.boundHandlers.scroll, { passive: true });
    document.addEventListener('keydown', this.boundHandlers.keydown, { passive: true });
    document.addEventListener('keyup', this.boundHandlers.keyup, { passive: true });
    
    // Initialize scroll position
    this.lastScrollPosition = window.scrollY;
    this.lastScrollTime = Date.now();
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener('click', this.boundHandlers.click);
    document.removeEventListener('mousemove', this.boundHandlers.mousemove);
    window.removeEventListener('scroll', this.boundHandlers.scroll);
    document.removeEventListener('keydown', this.boundHandlers.keydown);
    document.removeEventListener('keyup', this.boundHandlers.keyup);
  }

  /**
   * Start the automatic flush interval
   */
  private startFlushInterval(): void {
    this.flushIntervalId = setInterval(() => {
      if (this.eventQueue.length > 0) {
        logger.info(`Auto-flushing batch (timer interval: ${this.eventQueue.length} events queued)`);
        this.flush().catch(err => logger.error('Interval flush failed', err));
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop the automatic flush interval
   */
  private stopFlushInterval(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get a CSS-like identifier for an element
   */
  private getElementIdentifier(element: HTMLElement): string {
    const parts: string[] = [];
    
    // Tag name
    parts.push(element.tagName.toLowerCase());
    
    // ID if present
    if (element.id) {
      parts.push(`#${element.id}`);
    }
    
    // Classes (first 2)
    if (element.classList.length > 0) {
      const classes = Array.from(element.classList).slice(0, 2);
      parts.push(`.${classes.join('.')}`);
    }
    
    // Data attributes for better identification
    if (element.dataset.testid) {
      parts.push(`[data-testid="${element.dataset.testid}"]`);
    }
    
    return parts.join('');
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance Management
// ============================================================================

let trackerInstance: InteractionTracker | null = null;

/**
 * Get or create the global InteractionTracker instance
 */
export function getInteractionTracker(
  sessionId: string,
  participantId: string,
  platform: Platform,
  config?: Partial<InteractionTrackerConfig>
): InteractionTracker {
  if (!trackerInstance) {
    trackerInstance = new InteractionTracker(sessionId, participantId, platform, config);
  }
  return trackerInstance;
}

/**
 * Stop and clear the global tracker instance
 */
export async function stopInteractionTracker(): Promise<void> {
  if (trackerInstance) {
    await trackerInstance.stop();
    trackerInstance = null;
  }
}

/**
 * Check if a tracker instance exists and is active
 */
export function isTrackerActive(): boolean {
  return trackerInstance?.isActive() ?? false;
}

export default InteractionTracker;
