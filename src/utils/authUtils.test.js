import {
  STORAGE_KEYS,
  storageUtils,
  userStateUtils,
  determineUserNavigation,
  determineUserNavigationWithDebug,
  handleAuthError,
  getCurrentStorageUserId,
  setCurrentStorageUserId
} from './authUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
    key: jest.fn((i) => Object.keys(store)[i]),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('authUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Reset current user ID
    setCurrentStorageUserId(null);
  });

  describe('STORAGE_KEYS', () => {
    it('should have all required keys defined as strings', () => {
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe('pathPreferences');
      expect(STORAGE_KEYS.CAREER_PATH).toBe('careerPath');
      expect(STORAGE_KEYS.USER_RESUME).toBe('resume');
      expect(STORAGE_KEYS.USER_DASHBOARD).toBe('dashboard');
      expect(STORAGE_KEYS.USER_SKILLS).toBe('skills');
      expect(STORAGE_KEYS.USER_INTERESTS).toBe('interests');
    });

    it('should have additional keys for new features', () => {
      expect(STORAGE_KEYS.ACHIEVEMENTS).toBe('achievements');
      expect(STORAGE_KEYS.NOTIFICATIONS).toBe('notifications');
      expect(STORAGE_KEYS.COURSE_PROGRESS).toBe('courseProgress');
    });
  });

  describe('getCurrentStorageUserId / setCurrentStorageUserId', () => {
    it('should set and get current user ID', () => {
      setCurrentStorageUserId('user-123');
      expect(getCurrentStorageUserId()).toBe('user-123');
    });

    it('should clear user ID when set to null', () => {
      setCurrentStorageUserId('user-123');
      setCurrentStorageUserId(null);
      // After clearing, the value can be null or undefined depending on localStorage state
      expect(getCurrentStorageUserId()).toBeFalsy();
    });
  });

  describe('storageUtils', () => {
    describe('setItem', () => {
      it('should store data with user-scoped key', () => {
        setCurrentStorageUserId('user-123');
        const result = storageUtils.setItem('testKey', { data: 'test' });

        expect(result).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'user-123_testKey',
          JSON.stringify({ data: 'test' })
        );
      });

      it('should use explicit userId parameter', () => {
        const result = storageUtils.setItem('testKey', { data: 'test' }, 'explicit-user');

        expect(result).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'explicit-user_testKey',
          JSON.stringify({ data: 'test' })
        );
      });

      it('should return false when no user ID is available', () => {
        // No user ID set
        const result = storageUtils.setItem('testKey', { data: 'test' });
        expect(result).toBe(false);
      });

      it('should return false on error', () => {
        setCurrentStorageUserId('user-123');
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Storage full');
        });

        const result = storageUtils.setItem('testKey', { data: 'test' });
        expect(result).toBe(false);
      });
    });

    describe('getItem', () => {
      it('should retrieve and parse data with user-scoped key', () => {
        setCurrentStorageUserId('user-123');
        localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ data: 'test' }));

        const result = storageUtils.getItem('testKey');

        expect(result).toEqual({ data: 'test' });
        expect(localStorageMock.getItem).toHaveBeenCalledWith('user-123_testKey');
      });

      it('should return null if key does not exist', () => {
        setCurrentStorageUserId('user-123');
        localStorageMock.getItem.mockReturnValueOnce(null);

        const result = storageUtils.getItem('nonExistentKey');

        expect(result).toBeNull();
      });

      it('should return null when no user ID is available', () => {
        const result = storageUtils.getItem('testKey');
        expect(result).toBeNull();
      });

      it('should return raw string if not valid JSON', () => {
        setCurrentStorageUserId('user-123');
        localStorageMock.getItem.mockReturnValueOnce('not-json-string');

        const result = storageUtils.getItem('testKey');

        expect(result).toBe('not-json-string');
      });
    });

    describe('removeItem', () => {
      it('should remove item with user-scoped key', () => {
        setCurrentStorageUserId('user-123');
        const result = storageUtils.removeItem('testKey');

        expect(result).toBe(true);
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user-123_testKey');
      });

      it('should return false when no user ID is available', () => {
        const result = storageUtils.removeItem('testKey');
        expect(result).toBe(false);
      });

      it('should return false on error', () => {
        setCurrentStorageUserId('user-123');
        localStorageMock.removeItem.mockImplementationOnce(() => {
          throw new Error('Remove failed');
        });

        const result = storageUtils.removeItem('testKey');
        expect(result).toBe(false);
      });
    });

    describe('checkUserData', () => {
      it('should return status of all user data keys', () => {
        localStorageMock.getItem
          .mockReturnValueOnce(JSON.stringify({ pref: true })) // preferences
          .mockReturnValueOnce(null) // careerPath
          .mockReturnValueOnce(JSON.stringify({ resume: true })) // resume
          .mockReturnValueOnce(null); // dashboard

        const result = storageUtils.checkUserData('user-123');

        expect(result).toEqual({
          preferences: true,
          careerPath: false,
          resume: true,
          dashboard: false
        });
      });
    });
  });

  describe('userStateUtils', () => {
    describe('getUserState', () => {
      it('should return completion level 0 for new user', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = userStateUtils.getUserState('user-123');

        expect(result.completionLevel).toBe(0);
        expect(result.preferences).toBeNull();
        expect(result.careerPath).toBeNull();
        expect(result.resume).toBeNull();
        expect(result.dashboard).toBeNull();
      });

      it('should return completion level 1 for user with preferences', () => {
        localStorageMock.getItem
          .mockReturnValueOnce(JSON.stringify({ pathType: 'tech' })) // preferences
          .mockReturnValueOnce(null) // careerPath
          .mockReturnValueOnce(null) // resume
          .mockReturnValueOnce(null); // dashboard

        const result = userStateUtils.getUserState('user-123');

        expect(result.completionLevel).toBe(1);
      });

      it('should return completion level 4 for complete user', () => {
        localStorageMock.getItem
          .mockReturnValueOnce(JSON.stringify({ pathType: 'tech' })) // preferences
          .mockReturnValueOnce(JSON.stringify({ title: 'Engineer' })) // careerPath
          .mockReturnValueOnce(JSON.stringify({ content: 'base64...' })) // resume
          .mockReturnValueOnce(JSON.stringify({ learningPaths: [] })); // dashboard

        const result = userStateUtils.getUserState('user-123');

        expect(result.completionLevel).toBe(4);
      });

      it('should return completion level 0 when called without userId', () => {
        const result = userStateUtils.getUserState(null);
        expect(result.completionLevel).toBe(0);
      });
    });
  });

  describe('determineUserNavigation', () => {
    it('should return stage 5 for complete user with dashboard', () => {
      const storedState = {
        preferences: { pathType: 'tech' },
        careerPath: { title: 'Engineer' },
        resume: { content: 'base64' },
        dashboard: { learningPaths: [] }
      };

      const result = determineUserNavigation(storedState);

      expect(result.stage).toBe(5);
      expect(result.skipToEnd).toBe(true);
    });

    it('should return stage 5 for user with career path but no dashboard', () => {
      const storedState = {
        preferences: { pathType: 'tech' },
        careerPath: { title: 'Engineer' },
        resume: { content: 'base64' },
        dashboard: null
      };

      const result = determineUserNavigation(storedState);

      expect(result.stage).toBe(5);
      expect(result.skipToEnd).toBe(true);
    });

    it('should return stage 4 for user with preferences and resume but no career path', () => {
      const storedState = {
        preferences: { pathType: 'tech' },
        careerPath: null,
        resume: { content: 'base64' },
        dashboard: null
      };

      const result = determineUserNavigation(storedState);

      expect(result.stage).toBe(4);
      expect(result.skipToEnd).toBe(true);
    });

    it('should return stage 3 for user with only preferences', () => {
      const storedState = {
        preferences: { pathType: 'tech' },
        careerPath: null,
        resume: null,
        dashboard: null
      };

      const result = determineUserNavigation(storedState);

      expect(result.stage).toBe(3);
      expect(result.skipToEnd).toBe(false);
    });

    it('should return stage 2 for new user', () => {
      const storedState = {
        preferences: null,
        careerPath: null,
        resume: null,
        dashboard: null
      };

      const result = determineUserNavigation(storedState);

      expect(result.stage).toBe(2);
      expect(result.skipToEnd).toBe(false);
    });
  });

  describe('determineUserNavigationWithDebug', () => {
    it('should return stage 5 for returning user with career path', () => {
      const storedState = {
        preferences: { pathType: 'tech' },
        careerPath: { title: 'Engineer' },
        resume: null,
        dashboard: null
      };

      const result = determineUserNavigationWithDebug(storedState);

      expect(result.stage).toBe(5);
      expect(result.reason).toContain('Returning user');
    });

    it('should return stage 4 for user with preferences and resume but no path', () => {
      const storedState = {
        preferences: { pathType: 'tech' },
        careerPath: null,
        resume: { content: 'base64' },
        dashboard: null
      };

      const result = determineUserNavigationWithDebug(storedState);

      expect(result.stage).toBe(4);
    });
  });

  describe('handleAuthError', () => {
    it('should return user-friendly message for UserNotFoundException', () => {
      const error = { name: 'UserNotFoundException' };
      const message = handleAuthError(error);

      expect(message).toBe('No account found with this email address.');
    });

    it('should return user-friendly message for NotAuthorizedException', () => {
      const error = { name: 'NotAuthorizedException' };
      const message = handleAuthError(error);

      expect(message).toBe('Incorrect email or password.');
    });

    it('should return user-friendly message for UserNotConfirmedException', () => {
      const error = { name: 'UserNotConfirmedException' };
      const message = handleAuthError(error);

      expect(message).toBe('Please verify your email address first.');
    });

    it('should return user-friendly message for TooManyRequestsException', () => {
      const error = { name: 'TooManyRequestsException' };
      const message = handleAuthError(error);

      expect(message).toBe('Too many login attempts. Please wait a few minutes.');
    });

    it('should return network error message for network issues', () => {
      const error = { name: 'UnknownError', message: 'Network error occurred' };
      const message = handleAuthError(error);

      expect(message).toBe('Connection problem. Please check your internet.');
    });

    it('should return generic message for unknown errors', () => {
      const error = { name: 'SomeUnknownError' };
      const message = handleAuthError(error);

      expect(message).toBe('Authentication failed. Please try again.');
    });
  });
});
