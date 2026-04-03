import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Bell, X, CheckCheck, Trash2, BookOpen, Award, Briefcase,
  Target, Calendar, TrendingUp, AlertCircle, Info, Star, Zap
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';

const NOTIFICATIONS_KEY = 'userNotifications';

// Generate initial notifications based on user's career path and activity
const generateInitialNotifications = (user, careerPath) => {
  const careerTitle = careerPath?.title || 'your career';
  const now = new Date();

  return [
    {
      id: `notif-${Date.now()}-1`,
      type: 'welcome',
      icon: 'star',
      title: 'Welcome to NxtGrnd AI!',
      message: `Your personalized ${careerTitle} dashboard is ready. Start exploring your learning paths and opportunities.`,
      timestamp: new Date(now - 1000 * 60 * 5).toISOString(), // 5 mins ago
      read: false,
      actionLabel: 'Explore Dashboard',
      actionStage: 5
    },
    {
      id: `notif-${Date.now()}-2`,
      type: 'learning',
      icon: 'book',
      title: 'New Learning Paths Available',
      message: `We've curated personalized learning resources for ${careerTitle}. Check them out!`,
      timestamp: new Date(now - 1000 * 60 * 30).toISOString(), // 30 mins ago
      read: false,
      actionLabel: 'View Paths',
      actionStage: 9
    },
    {
      id: `notif-${Date.now()}-3`,
      type: 'opportunity',
      icon: 'briefcase',
      title: 'Job Matches Found',
      message: `We found opportunities matching your ${careerTitle} profile with 85%+ match scores.`,
      timestamp: new Date(now - 1000 * 60 * 60).toISOString(), // 1 hour ago
      read: false,
      actionLabel: 'View Jobs',
      actionStage: 10
    },
    {
      id: `notif-${Date.now()}-4`,
      type: 'certification',
      icon: 'award',
      title: 'Recommended Certifications',
      message: 'Industry certifications can boost your career. See our recommendations.',
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      read: true,
      actionLabel: 'View Certifications',
      actionStage: 11
    },
    {
      id: `notif-${Date.now()}-5`,
      type: 'tip',
      icon: 'zap',
      title: 'Pro Tip: Complete Your Profile',
      message: 'Adding more skills and uploading your resume helps us provide better recommendations.',
      timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: true,
      actionLabel: 'Update Profile',
      actionStage: 8
    }
  ];
};

const NotificationBell = ({ setStage }) => {
  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, user?.selectedCareerPath]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = () => {
    // storageUtils.getItem already returns parsed data
    const stored = storageUtils.getItem(`${NOTIFICATIONS_KEY}_${user?.userID}`);
    if (stored) {
      setNotifications(stored);
    } else {
      // Generate initial notifications for new users
      const initialNotifs = generateInitialNotifications(user, user?.selectedCareerPath);
      setNotifications(initialNotifs);
      // storageUtils.setItem handles JSON stringification internally
      storageUtils.setItem(`${NOTIFICATIONS_KEY}_${user?.userID}`, initialNotifs);
    }
  };

  const saveNotifications = (notifs) => {
    // storageUtils.setItem handles JSON stringification internally
    storageUtils.setItem(`${NOTIFICATIONS_KEY}_${user?.userID}`, notifs);
    setNotifications(notifs);
  };

  const markAsRead = (notifId) => {
    const updated = notifications.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (notifId) => {
    const updated = notifications.filter(n => n.id !== notifId);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.actionStage) {
      setStage(notif.actionStage);
      setIsOpen(false);
    }
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'book': return <BookOpen className="h-5 w-5" />;
      case 'award': return <Award className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'target': return <Target className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      case 'trending': return <TrendingUp className="h-5 w-5" />;
      case 'alert': return <AlertCircle className="h-5 w-5" />;
      case 'star': return <Star className="h-5 w-5" />;
      case 'zap': return <Zap className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'welcome': return 'bg-yellow-100 text-yellow-600';
      case 'learning': return 'bg-blue-100 text-blue-600';
      case 'opportunity': return 'bg-green-100 text-green-600';
      case 'certification': return 'bg-purple-100 text-purple-600';
      case 'tip': return 'bg-orange-100 text-orange-600';
      case 'alert': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getIconColor(notif.type)}`}>
                      {getIcon(notif.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{formatTime(notif.timestamp)}</span>
                        {notif.actionLabel && (
                          <span className="text-xs text-blue-600 font-medium">{notif.actionLabel} →</span>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <button
                onClick={clearAll}
                className="w-full text-sm text-gray-600 hover:text-red-600 font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export both the component and a helper to add notifications programmatically
export const addNotification = (userId, notification) => {
  // storageUtils.getItem already returns parsed data
  const notifications = storageUtils.getItem(`${NOTIFICATIONS_KEY}_${userId}`) || [];

  const newNotif = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };

  const updated = [newNotif, ...notifications].slice(0, 50); // Keep max 50 notifications
  // storageUtils.setItem handles JSON stringification internally
  storageUtils.setItem(`${NOTIFICATIONS_KEY}_${userId}`, updated);

  return newNotif;
};

export default NotificationBell;
