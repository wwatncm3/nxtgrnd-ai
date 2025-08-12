// src/utils/analytics.js - Updated for API Gateway endpoint
class Analytics {
  constructor() {
    this.isInitialized = false;
    this.debug = process.env.NODE_ENV === 'development';
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.apiEndpoint = process.env.REACT_APP_ANALYTICS_ENDPOINT;
    
    // Batch events for efficiency
    this.eventQueue = [];
    this.batchTimer = null;
  }

  init() {
    if (this.isInitialized) return;
    
    if (!this.apiEndpoint) {
      console.warn('Analytics API endpoint not configured');
      return;
    }
    
    this.startBatchProcessing();
    this.trackSessionStart();
    this.isInitialized = true;
    
    this.log('Analytics initialized with endpoint:', this.apiEndpoint);
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  setUser(userId, properties = {}) {
    this.userId = userId;
    this.trackEvent('user_login', { userId, ...properties });
  }

  async trackEvent(eventType, eventData = {}) {
    const event = {
      eventType,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      eventData
    };

    // Add to queue for batch processing
    this.eventQueue.push(event);
    
    if (this.debug) {
      console.log('Event queued:', event);
    }
  }

  startBatchProcessing() {
    // Send events every 10 seconds
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.sendEventBatch();
      }
    }, 10000);
  }

  async sendEventBatch() {
    if (!this.apiEndpoint || this.eventQueue.length === 0) return;
    
    const events = this.eventQueue.splice(0, 10); // Send up to 10 events at a time
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'batch_events',
          events: events,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Events sent successfully:', result);
      
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events for retry (with limit to prevent infinite growth)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  // Convenience methods for specific events
  trackPageView(pagePath, pageTitle) {
    this.trackEvent('page_view', { pagePath, pageTitle });
  }

  trackUserSignup(method = 'email') {
    this.trackEvent('user_signup', { method });
  }

  trackCareerPathSelected(careerPath) {
    this.trackEvent('career_path_selected', { 
      careerPath: careerPath.title || careerPath,
      careerPathId: careerPath.id 
    });
  }

  trackResumeUploaded(fileType, fileSize) {
    this.trackEvent('resume_uploaded', { fileType, fileSize });
  }

  trackResumeAnalyzed(score, analysisTime) {
    this.trackEvent('resume_analyzed', { score, analysisTime });
  }

  trackLearningPathStarted(pathTitle) {
    this.trackEvent('learning_path_started', { pathTitle });
  }

  trackTaskCompleted(pathTitle, taskType) {
    this.trackEvent('task_completed', { pathTitle, taskType });
  }

  trackSearchPerformed(searchQuery, resultsCount) {
    this.trackEvent('search_performed', { 
      searchQuery: searchQuery.substring(0, 100), // Limit length
      resultsCount 
    });
  }

  trackJobApplicationClick(jobTitle, platform) {
    this.trackEvent('job_application_click', { jobTitle, platform });
  }

  trackError(errorType, errorMessage, componentName) {
    this.trackEvent('error_occurred', {
      errorType,
      errorMessage: errorMessage.substring(0, 200), // Limit length
      componentName
    });
  }

  trackSessionStart() {
    this.trackEvent('session_started', {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer
    });
  }

  // Send any remaining events before page unload
  flush() {
    if (this.eventQueue.length > 0) {
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon && this.apiEndpoint) {
        const data = JSON.stringify({
          eventType: 'batch_events',
          events: this.eventQueue,
          timestamp: new Date().toISOString()
        });
        
        navigator.sendBeacon(this.apiEndpoint, data);
        this.eventQueue = [];
      }
    }
  }

  cleanup() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flush();
  }

  log(message, data) {
    if (this.debug) {
      console.log(`[Analytics] ${message}`, data || '');
    }
  }
}

// Create singleton instance
const analytics = new Analytics();

// Auto-flush on page unload
window.addEventListener('beforeunload', () => {
  analytics.flush();
});

export default analytics;

// Usage in your App.js:
/*
import analytics from './utils/analytics';

function App() {
  useEffect(() => {
    analytics.init();
    return () => analytics.cleanup();
  }, []);
  
  // ... rest of your app
}
*/

// Usage in components:
/*
import analytics from './utils/analytics';

function SomeComponent() {
  const handleResumeUpload = (file) => {
    analytics.trackResumeUploaded(file.type, file.size);
  };
  
  return <button onClick={handleResumeUpload}>Upload</button>;
}
*/