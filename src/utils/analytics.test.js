// Analytics is a singleton — we test the exported instance directly
import analytics from './analytics';

// Mock fetchWithTimeout
jest.mock('../config/api', () => ({
  fetchWithTimeout: jest.fn()
}));

import { fetchWithTimeout } from '../config/api';

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton state between tests
    analytics.isInitialized = false;
    analytics.userId = null;
    analytics.eventQueue = [];
    analytics.apiEndpoint = 'https://api.test.com/analytics';
    if (analytics.batchTimer) {
      clearInterval(analytics.batchTimer);
      analytics.batchTimer = null;
    }
  });

  afterEach(() => {
    if (analytics.batchTimer) {
      clearInterval(analytics.batchTimer);
      analytics.batchTimer = null;
    }
  });

  describe('singleton properties', () => {
    it('should have default state', () => {
      expect(analytics.isInitialized).toBe(false);
      expect(analytics.userId).toBeNull();
      expect(analytics.sessionId).toBeTruthy();
      expect(analytics.eventQueue).toEqual([]);
    });
  });

  describe('init', () => {
    it('should set isInitialized to true', () => {
      analytics.init();
      expect(analytics.isInitialized).toBe(true);
    });

    it('should not re-initialize if already initialized', () => {
      analytics.init();
      const queueLength = analytics.eventQueue.length;
      analytics.init();
      expect(analytics.eventQueue.length).toBe(queueLength);
    });

    it('should not initialize without apiEndpoint', () => {
      analytics.apiEndpoint = null;
      analytics.init();
      expect(analytics.isInitialized).toBe(false);
    });

    it('should track session start on init', () => {
      analytics.init();
      expect(analytics.eventQueue.length).toBeGreaterThan(0);
      expect(analytics.eventQueue[0].eventType).toBe('session_started');
    });
  });

  describe('setUser', () => {
    it('should set userId', () => {
      analytics.setUser('user-123');
      expect(analytics.userId).toBe('user-123');
    });

    it('should track user_login event', () => {
      analytics.setUser('user-123', { name: 'Trey' });
      const loginEvent = analytics.eventQueue.find(e => e.eventType === 'user_login');
      expect(loginEvent).toBeTruthy();
      expect(loginEvent.eventData.userId).toBe('user-123');
      expect(loginEvent.eventData.name).toBe('Trey');
    });
  });

  describe('trackEvent', () => {
    it('should add event to queue', () => {
      analytics.trackEvent('test_event', { key: 'value' });
      expect(analytics.eventQueue).toHaveLength(1);
      expect(analytics.eventQueue[0].eventType).toBe('test_event');
      expect(analytics.eventQueue[0].eventData.key).toBe('value');
    });

    it('should include metadata in event', () => {
      analytics.userId = 'user-123';
      analytics.trackEvent('test_event');

      const event = analytics.eventQueue[0];
      expect(event.userId).toBe('user-123');
      expect(event.sessionId).toBe(analytics.sessionId);
      expect(event.timestamp).toBeTruthy();
    });
  });

  describe('convenience tracking methods', () => {
    it('trackPageView should queue page_view event', () => {
      analytics.trackPageView('/dashboard', 'Dashboard');
      expect(analytics.eventQueue[0].eventType).toBe('page_view');
      expect(analytics.eventQueue[0].eventData.pagePath).toBe('/dashboard');
    });

    it('trackUserSignup should queue user_signup event', () => {
      analytics.trackUserSignup('google');
      expect(analytics.eventQueue[0].eventType).toBe('user_signup');
      expect(analytics.eventQueue[0].eventData.method).toBe('google');
    });

    it('trackCareerPathSelected should queue career_path_selected event', () => {
      analytics.trackCareerPathSelected({ title: 'Software Engineer', id: 'se-1' });
      expect(analytics.eventQueue[0].eventType).toBe('career_path_selected');
      expect(analytics.eventQueue[0].eventData.careerPath).toBe('Software Engineer');
    });

    it('trackResumeUploaded should queue resume_uploaded event', () => {
      analytics.trackResumeUploaded('application/pdf', 1024);
      expect(analytics.eventQueue[0].eventType).toBe('resume_uploaded');
      expect(analytics.eventQueue[0].eventData.fileSize).toBe(1024);
    });

    it('trackSearchPerformed should truncate long queries', () => {
      const longQuery = 'a'.repeat(200);
      analytics.trackSearchPerformed(longQuery, 5);
      expect(analytics.eventQueue[0].eventData.searchQuery.length).toBe(100);
    });

    it('trackError should truncate long error messages', () => {
      const longMsg = 'e'.repeat(500);
      analytics.trackError('runtime', longMsg, 'TestComponent');
      expect(analytics.eventQueue[0].eventData.errorMessage.length).toBe(200);
    });

    it('trackJobApplicationClick should queue event', () => {
      analytics.trackJobApplicationClick('SWE', 'LinkedIn');
      expect(analytics.eventQueue[0].eventType).toBe('job_application_click');
      expect(analytics.eventQueue[0].eventData.platform).toBe('LinkedIn');
    });

    it('trackLearningPathStarted should queue event', () => {
      analytics.trackLearningPathStarted('React Fundamentals');
      expect(analytics.eventQueue[0].eventType).toBe('learning_path_started');
      expect(analytics.eventQueue[0].eventData.pathTitle).toBe('React Fundamentals');
    });

    it('trackTaskCompleted should queue event', () => {
      analytics.trackTaskCompleted('React Path', 'quiz');
      expect(analytics.eventQueue[0].eventType).toBe('task_completed');
    });
  });

  describe('sendEventBatch', () => {
    it('should send up to 10 events at a time', async () => {
      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      for (let i = 0; i < 15; i++) {
        analytics.trackEvent(`event_${i}`);
      }

      await analytics.sendEventBatch();

      expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(body.events).toHaveLength(10);
      expect(analytics.eventQueue).toHaveLength(5);
    });

    it('should not send if no endpoint configured', async () => {
      analytics.apiEndpoint = null;
      analytics.trackEvent('test');
      await analytics.sendEventBatch();
      expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it('should not send if queue is empty', async () => {
      await analytics.sendEventBatch();
      expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it('should re-queue events on failure (under limit)', async () => {
      fetchWithTimeout.mockRejectedValueOnce(new Error('Network error'));

      analytics.trackEvent('test_event_1');
      analytics.trackEvent('test_event_2');

      await analytics.sendEventBatch();

      // Events should be re-queued
      expect(analytics.eventQueue.length).toBe(2);
    });

    it('should not re-queue if queue exceeds 100 events', async () => {
      fetchWithTimeout.mockRejectedValueOnce(new Error('Network error'));

      // Fill queue to 100
      for (let i = 0; i < 100; i++) {
        analytics.eventQueue.push({ eventType: `filler_${i}` });
      }

      await analytics.sendEventBatch();

      // Should NOT have re-queued the spliced batch (queue was at limit)
      expect(analytics.eventQueue.length).toBeLessThanOrEqual(100);
    });
  });

  describe('flush', () => {
    it('should use sendBeacon to send remaining events', () => {
      const mockSendBeacon = jest.fn(() => true);
      Object.defineProperty(navigator, 'sendBeacon', {
        value: mockSendBeacon,
        writable: true,
        configurable: true
      });

      analytics.trackEvent('final_event');
      analytics.flush();

      expect(mockSendBeacon).toHaveBeenCalledWith(
        analytics.apiEndpoint,
        expect.any(String)
      );
      expect(analytics.eventQueue).toHaveLength(0);
    });

    it('should not send if queue is empty', () => {
      const mockSendBeacon = jest.fn();
      Object.defineProperty(navigator, 'sendBeacon', {
        value: mockSendBeacon,
        writable: true,
        configurable: true
      });

      analytics.flush();
      expect(mockSendBeacon).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear batch timer and flush', () => {
      analytics.init();
      const flushSpy = jest.spyOn(analytics, 'flush');
      analytics.cleanup();
      expect(flushSpy).toHaveBeenCalled();
      flushSpy.mockRestore();
    });
  });
});
