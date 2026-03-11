import {
  storeDashboardData,
  getDashboardFromSession,
  useSearch,
  searchContent,
  calculateMatchScore
} from './DashboardUtils';
import { storageUtils, STORAGE_KEYS } from '../../utils/authUtils';
import { storageService, STORAGE_KEYS as SERVICE_KEYS } from '../../services/storageService';
import { renderHook, act } from '@testing-library/react';

// Mock storageUtils (used by getDashboardFromSession)
jest.mock('../../utils/authUtils', () => ({
  storageUtils: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  },
  STORAGE_KEYS: {
    USER_DASHBOARD: 'dashboard'
  }
}));

// Mock storageService (used by storeDashboardData)
jest.mock('../../services/storageService', () => ({
  storageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  },
  STORAGE_KEYS: {
    USER_DASHBOARD: 'dashboard',
    CAREER_PATH: 'careerPath'
  }
}));

// Mock analytics
jest.mock('../../utils/analytics', () => ({
  trackSearchPerformed: jest.fn()
}));

describe('DashboardUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    it('should have USER_DASHBOARD key defined', () => {
      expect(STORAGE_KEYS.USER_DASHBOARD).toBeDefined();
    });
  });

  describe('storeDashboardData', () => {
    it('should not store data if userId is not provided', () => {
      storeDashboardData(null, { learningPaths: [] });
      expect(storageService.setItem).not.toHaveBeenCalled();
    });

    it('should not store data if userId is undefined', () => {
      storeDashboardData(undefined, { learningPaths: [] });
      expect(storageService.setItem).not.toHaveBeenCalled();
    });

    it('should store dashboard data with correct parameters', () => {
      const userId = 'user-123';
      const data = {
        learningPaths: [{ id: 1, title: 'Path 1' }],
        opportunities: [{ id: 1, role: 'Developer' }],
        goals: [{ id: 1, title: 'Goal 1' }],
        events: [{ id: 1, title: 'Event 1' }],
        careerPath: { id: 'cp-1', title: 'Software Engineer' }
      };

      storeDashboardData(userId, data);

      // storeDashboardData calls setItem twice: once for dashboard, once for careerPath
      expect(storageService.setItem).toHaveBeenCalledTimes(2);
      expect(storageService.setItem).toHaveBeenCalledWith(
        SERVICE_KEYS.USER_DASHBOARD,
        expect.objectContaining({
          learningPaths: data.learningPaths,
          opportunities: data.opportunities,
          goals: data.goals,
          events: data.events,
          careerPath: data.careerPath,
          careerPathId: 'cp-1',
          timestamp: expect.any(String)
        }),
        userId
      );
    });

    it('should handle empty arrays gracefully', () => {
      const userId = 'user-456';
      const data = {};

      storeDashboardData(userId, data);

      // Only dashboard call when no careerPath
      expect(storageService.setItem).toHaveBeenCalledWith(
        SERVICE_KEYS.USER_DASHBOARD,
        expect.objectContaining({
          learningPaths: [],
          opportunities: [],
          goals: [],
          events: []
        }),
        userId
      );
    });
  });

  describe('getDashboardFromSession', () => {
    it('should return null if no stored data exists', () => {
      storageUtils.getItem.mockReturnValue(null);

      const result = getDashboardFromSession('user-123', { id: 'path-1' });

      expect(result).toBeNull();
      expect(storageUtils.getItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DASHBOARD, 'user-123');
    });

    it('should return stored data if career path matches', () => {
      const storedData = {
        learningPaths: [{ id: 1 }],
        careerPath: { id: 'path-1', title: 'Engineer' }
      };
      storageUtils.getItem.mockReturnValue(storedData);

      const result = getDashboardFromSession('user-123', { id: 'path-1' });

      expect(result).toEqual(storedData);
    });

    it('should clear and return null if career path changed', () => {
      const storedData = {
        learningPaths: [{ id: 1 }],
        careerPath: { id: 'path-1', title: 'Engineer' }
      };
      storageUtils.getItem.mockReturnValue(storedData);

      const result = getDashboardFromSession('user-123', { id: 'path-2' });

      expect(result).toBeNull();
      expect(storageUtils.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DASHBOARD, 'user-123');
    });

    it('should return null if getItem throws an error', () => {
      storageUtils.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getDashboardFromSession('user-123', { id: 'path-1' });

      expect(result).toBeNull();
    });
  });

  describe('useSearch hook', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce search query', () => {
      const { result, rerender } = renderHook(
        ({ query }) => useSearch(query, 300),
        { initialProps: { query: '' } }
      );

      expect(result.current).toBe('');

      // Update query
      rerender({ query: 'test' });
      expect(result.current).toBe(''); // Not updated yet

      // Fast forward timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('test');
    });

    it('should use default delay of 300ms', () => {
      const { result, rerender } = renderHook(
        ({ query }) => useSearch(query),
        { initialProps: { query: '' } }
      );

      rerender({ query: 'search' });

      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(result.current).toBe('');

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('search');
    });
  });

  describe('searchContent', () => {
    const mockLearningPaths = [
      { id: 1, title: 'JavaScript Fundamentals', provider: 'Coursera', description: 'Learn JS', skills: ['JavaScript', 'Web'] },
      { id: 2, title: 'Python Basics', provider: 'Udemy', description: 'Learn Python', skills: ['Python', 'Data'] }
    ];

    const mockOpportunities = [
      { id: 1, role: 'Frontend Developer', company: 'TechCorp', location: 'Remote', description: 'Build UIs' },
      { id: 2, role: 'Backend Developer', company: 'DataInc', location: 'NYC', description: 'Build APIs' }
    ];

    const mockGoals = [
      { id: 1, title: 'Learn React', description: 'Master React framework' },
      { id: 2, title: 'Get Certified', description: 'AWS certification' }
    ];

    const mockEvents = [
      { id: 1, title: 'Tech Conference', description: 'Annual tech meetup', provider: 'TechOrg' },
      { id: 2, title: 'Workshop', description: 'React workshop', provider: 'DevShop' }
    ];

    it('should return all data when query is empty', () => {
      const result = searchContent('', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.learningPaths).toEqual(mockLearningPaths);
      expect(result.opportunities).toEqual(mockOpportunities);
      expect(result.goals).toEqual(mockGoals);
      expect(result.events).toEqual(mockEvents);
      expect(result.hasResults).toBe(true);
    });

    it('should return all data when query is too short', () => {
      const result = searchContent('a', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.learningPaths).toEqual(mockLearningPaths);
      expect(result.totalResults).toBe(8);
    });

    it('should filter learning paths by title', () => {
      const result = searchContent('JavaScript', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.learningPaths).toHaveLength(1);
      expect(result.learningPaths[0].title).toBe('JavaScript Fundamentals');
    });

    it('should filter opportunities by role', () => {
      const result = searchContent('Frontend', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].role).toBe('Frontend Developer');
    });

    it('should filter goals by title', () => {
      const result = searchContent('React', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.goals).toHaveLength(1);
      expect(result.goals[0].title).toBe('Learn React');
    });

    it('should filter events by provider', () => {
      const result = searchContent('TechOrg', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].provider).toBe('TechOrg');
    });

    it('should be case insensitive', () => {
      const result = searchContent('JAVASCRIPT', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.learningPaths).toHaveLength(1);
    });

    it('should return hasResults false when no matches', () => {
      const result = searchContent('nonexistent', mockLearningPaths, mockOpportunities, mockGoals, mockEvents);

      expect(result.totalResults).toBe(0);
      expect(result.hasResults).toBe(false);
    });
  });

  describe('calculateMatchScore', () => {
    it('should return 85 when required skills is empty', () => {
      const score = calculateMatchScore([], ['JavaScript', 'Python']);
      expect(score).toBe(85);
    });

    it('should return 85 when user skills is empty', () => {
      const score = calculateMatchScore(['JavaScript', 'Python'], []);
      expect(score).toBe(85);
    });

    it('should return 100 when all required skills match', () => {
      const required = ['JavaScript', 'React'];
      const userSkills = ['JavaScript', 'React', 'Node.js'];

      const score = calculateMatchScore(required, userSkills);
      expect(score).toBe(100);
    });

    it('should return correct percentage for partial matches', () => {
      const required = ['JavaScript', 'React', 'Node.js', 'Python'];
      const userSkills = ['JavaScript', 'React'];

      const score = calculateMatchScore(required, userSkills);
      expect(score).toBe(50); // 2 out of 4
    });

    it('should handle partial string matches where required includes user skill', () => {
      // Required skill 'JavaScript' contains userSkill 'script'
      // 'javascript'.includes('script') = true
      const required = ['JavaScript', 'React'];
      const userSkills = ['script', 'React'];

      const score = calculateMatchScore(required, userSkills);
      // Both match: JavaScript includes 'script', React exact match
      expect(score).toBe(100);
    });

    it('should handle partial string matches where user skill includes required', () => {
      // Test: 'javascript expert'.includes('javascript') = true
      const required = ['JavaScript'];
      const userSkills = ['JavaScript Expert'];

      const score = calculateMatchScore(required, userSkills);
      expect(score).toBe(100);
    });

    it('should be case insensitive', () => {
      const required = ['JAVASCRIPT', 'REACT'];
      const userSkills = ['javascript', 'react'];

      const score = calculateMatchScore(required, userSkills);
      expect(score).toBe(100);
    });
  });
});
