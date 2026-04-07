// Integration Test: Dashboard Data Flow
// Tests: storeDashboardData → localStorage → getDashboardFromSession → searchContent
import { storeDashboardData, getDashboardFromSession, searchContent, calculateMatchScore } from '../../components/dashboard/DashboardUtils';

// Mock storageService
jest.mock('../../services/storageService', () => ({
  storageService: {
    setItem: jest.fn()
  },
  STORAGE_KEYS: {
    USER_DASHBOARD: 'dashboard',
    CAREER_PATH: 'careerPath'
  }
}));

// Mock authUtils
jest.mock('../../utils/authUtils', () => ({
  storageUtils: {
    getItem: jest.fn(),
    removeItem: jest.fn()
  },
  STORAGE_KEYS: {
    USER_DASHBOARD: 'dashboard'
  }
}));

// Mock analytics
jest.mock('../../utils/analytics', () => ({
  trackSearchPerformed: jest.fn()
}));

import { storageUtils } from '../../utils/authUtils';
import { storageService } from '../../services/storageService';

describe('Dashboard Data Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('store → retrieve cycle', () => {
    it('should store dashboard data and retrieve it when career path matches', () => {
      const userId = 'test-user';
      const careerPath = { id: 'swe-1', title: 'Software Engineer' };
      const dashboardData = {
        learningPaths: [{ title: 'React Mastery', provider: 'Udemy' }],
        opportunities: [{ role: 'Junior Dev', company: 'TechCo' }],
        goals: [{ title: 'Get certified' }],
        events: [{ title: 'Tech Conference' }],
        careerPath
      };

      // Store
      storeDashboardData(userId, dashboardData);
      expect(storageService.setItem).toHaveBeenCalled();

      // Mock retrieval
      storageUtils.getItem.mockReturnValueOnce({
        ...dashboardData,
        timestamp: new Date().toISOString(),
        careerPathId: careerPath.id
      });

      // Retrieve with same career path
      const retrieved = getDashboardFromSession(userId, careerPath);
      expect(retrieved).toBeTruthy();
      expect(retrieved.learningPaths).toHaveLength(1);
    });

    it('should clear data when career path changes', () => {
      const userId = 'test-user';
      const oldCareerPath = { id: 'swe-1', title: 'Software Engineer' };
      const newCareerPath = { id: 'ds-1', title: 'Data Scientist' };

      // Mock stored data with old career path
      storageUtils.getItem.mockReturnValueOnce({
        learningPaths: [],
        careerPath: oldCareerPath,
        timestamp: new Date().toISOString()
      });

      // Try to retrieve with new career path
      const result = getDashboardFromSession(userId, newCareerPath);
      expect(result).toBeNull();
      expect(storageUtils.removeItem).toHaveBeenCalled();
    });

    it('should not store without userId', () => {
      storeDashboardData(null, { learningPaths: [] });
      expect(storageService.setItem).not.toHaveBeenCalled();
    });
  });

  describe('search across dashboard data', () => {
    const learningPaths = [
      { title: 'React Fundamentals', provider: 'Udemy', description: 'Learn React', skills: ['React', 'JavaScript'] },
      { title: 'Python for Data Science', provider: 'Coursera', description: 'Learn Python', skills: ['Python', 'Data'] },
      { title: 'AWS Cloud Practitioner', provider: 'AWS', description: 'Cloud certification', skills: ['AWS', 'Cloud'] }
    ];

    const opportunities = [
      { role: 'React Developer', company: 'TechCo', location: 'Remote', description: 'Build UIs' },
      { role: 'Data Analyst', company: 'DataCo', location: 'Houston', description: 'Analyze data' }
    ];

    const goals = [
      { title: 'Get AWS Certified', description: 'Earn cloud certification' },
      { title: 'Build Portfolio', description: 'Create 3 projects' }
    ];

    const events = [
      { title: 'Tech Career Fair', description: 'Network with employers', provider: 'NC A&T' }
    ];

    it('should return all items when query is empty', () => {
      const results = searchContent('', learningPaths, opportunities, goals, events);
      expect(results.hasResults).toBe(true);
      expect(results.learningPaths).toHaveLength(3);
      expect(results.opportunities).toHaveLength(2);
    });

    it('should filter across all categories for "React"', () => {
      const results = searchContent('React', learningPaths, opportunities, goals, events);
      expect(results.learningPaths).toHaveLength(1);
      expect(results.learningPaths[0].title).toBe('React Fundamentals');
      expect(results.opportunities).toHaveLength(1);
      expect(results.opportunities[0].role).toBe('React Developer');
    });

    it('should search within skills arrays', () => {
      const results = searchContent('Python', learningPaths, opportunities, goals, events);
      expect(results.learningPaths).toHaveLength(1);
      expect(results.learningPaths[0].title).toContain('Python');
    });

    it('should search goals by description', () => {
      const results = searchContent('certification', learningPaths, opportunities, goals, events);
      expect(results.goals).toHaveLength(1);
      expect(results.goals[0].title).toContain('AWS');
    });

    it('should return empty results for no matches', () => {
      const results = searchContent('blockchain', learningPaths, opportunities, goals, events);
      expect(results.hasResults).toBe(false);
      expect(results.totalResults).toBe(0);
    });
  });

  describe('match score calculation flow', () => {
    it('should calculate high score for matching skills', () => {
      const required = ['React', 'JavaScript', 'Node.js'];
      const userSkills = ['React', 'JavaScript', 'TypeScript', 'Node.js'];
      const score = calculateMatchScore(required, userSkills);
      expect(score).toBe(100); // All 3 required skills matched
    });

    it('should calculate partial match', () => {
      const required = ['React', 'JavaScript', 'Go', 'Rust'];
      const userSkills = ['React', 'JavaScript'];
      const score = calculateMatchScore(required, userSkills);
      expect(score).toBe(50); // 2 of 4 matched
    });

    it('should return 85 default when no data', () => {
      expect(calculateMatchScore([], ['React'])).toBe(85);
      expect(calculateMatchScore(['React'], [])).toBe(85);
    });
  });
});
