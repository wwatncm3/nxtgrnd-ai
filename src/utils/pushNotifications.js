// Push Notification Service
// Handles browser push notification permissions and delivery

const PUSH_PERMISSION_KEY = 'pushNotificationPermission';

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Get current permission status
export const getPermissionStatus = () => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
};

// Request permission for push notifications
export const requestPermission = async () => {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported in this browser');
    return { success: false, permission: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(PUSH_PERMISSION_KEY, permission);

    return {
      success: permission === 'granted',
      permission
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, permission: 'error', error };
  }
};

// Send a push notification (when permission is granted)
export const sendPushNotification = (title, options = {}) => {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const defaultOptions = {
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options.onClick) {
        options.onClick(event);
      }
      notification.close();
    };

    // Auto-close after timeout if specified
    if (options.autoClose) {
      setTimeout(() => notification.close(), options.autoClose);
    }

    return notification;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
};

// Notification types with predefined styling
export const NotificationTypes = {
  JOB_ALERT: {
    icon: '/logo192.png',
    tag: 'job-alert',
    requireInteraction: true
  },
  LEARNING_REMINDER: {
    icon: '/logo192.png',
    tag: 'learning-reminder',
    autoClose: 10000
  },
  CAREER_UPDATE: {
    icon: '/logo192.png',
    tag: 'career-update',
    autoClose: 8000
  },
  RESUME_REMINDER: {
    icon: '/logo192.png',
    tag: 'resume-reminder',
    requireInteraction: true
  },
  WEEKLY_DIGEST: {
    icon: '/logo192.png',
    tag: 'weekly-digest',
    requireInteraction: true
  }
};

// Send typed notifications
export const sendJobAlert = (job) => {
  return sendPushNotification(
    `New Job Match: ${job.role}`,
    {
      body: `${job.company} - ${job.location}\nMatch Score: ${job.matchScore}%`,
      ...NotificationTypes.JOB_ALERT,
      data: { type: 'job', job }
    }
  );
};

export const sendLearningReminder = (course) => {
  return sendPushNotification(
    'Continue Your Learning',
    {
      body: `Ready to continue "${course.title}"? Your progress: ${course.progress}%`,
      ...NotificationTypes.LEARNING_REMINDER,
      data: { type: 'learning', course }
    }
  );
};

export const sendCareerUpdate = (message) => {
  return sendPushNotification(
    'Career Update',
    {
      body: message,
      ...NotificationTypes.CAREER_UPDATE
    }
  );
};

export const sendResumeReminder = () => {
  return sendPushNotification(
    'Update Your Resume',
    {
      body: 'Keep your resume fresh! It\'s been a while since your last update.',
      ...NotificationTypes.RESUME_REMINDER
    }
  );
};

export const sendWeeklyDigest = (stats) => {
  return sendPushNotification(
    'Your Weekly Career Summary',
    {
      body: `${stats.newJobs} new job matches, ${stats.coursesCompleted} courses progressed`,
      ...NotificationTypes.WEEKLY_DIGEST,
      data: { type: 'digest', stats }
    }
  );
};

// Schedule notification (uses setTimeout, for more robust scheduling consider service worker)
export const scheduleNotification = (title, options, delayMs) => {
  return setTimeout(() => {
    sendPushNotification(title, options);
  }, delayMs);
};

// Cancel scheduled notification
export const cancelScheduledNotification = (timeoutId) => {
  clearTimeout(timeoutId);
};

// Notification manager class for more complex scenarios
export class NotificationManager {
  constructor(userId) {
    this.userId = userId;
    this.scheduledNotifications = new Map();
  }

  // Check and request permission
  async initialize() {
    if (getPermissionStatus() === 'default') {
      return await requestPermission();
    }
    return { success: getPermissionStatus() === 'granted', permission: getPermissionStatus() };
  }

  // Schedule daily learning reminder
  scheduleDailyReminder(course, hour = 10) {
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, 0, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime - now;
    const id = `daily-${course.id}`;

    this.scheduledNotifications.set(id, scheduleNotification(
      'Daily Learning Reminder',
      { body: `Time to continue "${course.title}"!` },
      delay
    ));

    return id;
  }

  // Cancel all scheduled notifications
  cancelAll() {
    this.scheduledNotifications.forEach((timeoutId) => {
      cancelScheduledNotification(timeoutId);
    });
    this.scheduledNotifications.clear();
  }
}

const pushNotifications = {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  sendPushNotification,
  sendJobAlert,
  sendLearningReminder,
  sendCareerUpdate,
  sendResumeReminder,
  sendWeeklyDigest,
  NotificationManager
};

export default pushNotifications;
