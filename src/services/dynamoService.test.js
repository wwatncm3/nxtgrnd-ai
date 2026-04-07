import {
  saveUserProfile,
  getUserProfile,
  saveDashboardData,
  getDashboardData,
  saveUserPreferences,
  getUserPreferences,
  loadAllUserData,
  saveAllUserData,
  deleteAllUserData,
  syncLocalToDynamo,
  checkDynamoConnection
} from './dynamoService';

// Mock aws-amplify auth
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn().mockResolvedValue({
    tokens: { idToken: { toString: () => 'mock-token' } }
  })
}));

// Mock aws-config
jest.mock('../aws-config', () => ({
  DynamoDB: {
    tables: {
      users: 'nxtgrnd-users',
      userDashboards: 'nxtgrnd-user-dashboards',
      userPreferences: 'nxtgrnd-user-preferences'
    }
  }
}));

// Mock API_CONFIG and fetchWithTimeout
jest.mock('../config/api', () => ({
  __esModule: true,
  default: {
    userData: {
      getBaseUrl: jest.fn(() => 'https://api.test.com/user')
    }
  },
  fetchWithTimeout: jest.fn()
}));

import { fetchWithTimeout } from '../config/api';
import API_CONFIG from '../config/api';

describe('dynamoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    API_CONFIG.userData.getBaseUrl.mockReturnValue('https://api.test.com/user');
  });

  describe('when API is configured', () => {
    beforeEach(() => {
      fetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    describe('saveUserProfile', () => {
      it('should POST profile data', async () => {
        const result = await saveUserProfile('user-123', { name: 'Trey' });
        expect(fetchWithTimeout).toHaveBeenCalledWith(
          'https://api.test.com/user/profile',
          expect.objectContaining({ method: 'POST' }),
          30000
        );
        expect(result.success).toBe(true);
      });
    });

    describe('getUserProfile', () => {
      it('should GET profile by userId', async () => {
        fetchWithTimeout.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ profile: { name: 'Trey' } })
        });

        const result = await getUserProfile('user-123');
        expect(fetchWithTimeout).toHaveBeenCalledWith(
          expect.stringContaining('/profile?userId=user-123'),
          expect.objectContaining({ method: 'GET' }),
          30000
        );
        expect(result).toEqual({ name: 'Trey' });
      });

      it('should return null when no profile found', async () => {
        fetchWithTimeout.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

        const result = await getUserProfile('user-123');
        expect(result).toBeNull();
      });
    });

    describe('saveDashboardData', () => {
      it('should POST dashboard data', async () => {
        const result = await saveDashboardData('user-123', { learningPaths: [] });
        expect(fetchWithTimeout).toHaveBeenCalled();
        expect(result.success).toBe(true);
      });
    });

    describe('getDashboardData', () => {
      it('should GET dashboard by userId', async () => {
        fetchWithTimeout.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ dashboard: { learningPaths: ['path1'] } })
        });

        const result = await getDashboardData('user-123');
        expect(result).toEqual({ learningPaths: ['path1'] });
      });
    });

    describe('loadAllUserData', () => {
      it('should load all data at once', async () => {
        fetchWithTimeout.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            profile: { name: 'Trey' },
            dashboard: { careerPath: 'SWE' },
            preferences: { theme: 'dark' },
            hasData: true
          })
        });

        const result = await loadAllUserData('user-123');
        expect(result.hasData).toBe(true);
        expect(result.profile.name).toBe('Trey');
        expect(result.dashboard.careerPath).toBe('SWE');
      });
    });

    describe('deleteAllUserData', () => {
      it('should DELETE all user data', async () => {
        const result = await deleteAllUserData('user-123');
        expect(fetchWithTimeout).toHaveBeenCalledWith(
          expect.stringContaining('/all?userId=user-123'),
          expect.objectContaining({ method: 'DELETE' }),
          30000
        );
        expect(result.success).toBe(true);
      });
    });

    describe('syncLocalToDynamo', () => {
      it('should sync local data to DynamoDB', async () => {
        const localData = {
          resume: { text: 'resume data' },
          skills: ['JavaScript'],
          careerPath: { title: 'SWE' },
          pathPreferences: { type: 'tech' }
        };

        const result = await syncLocalToDynamo('user-123', localData);
        expect(result.success).toBe(true);
        expect(fetchWithTimeout).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should return null on API failure for GET operations', async () => {
        fetchWithTimeout.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' })
        });

        const result = await getUserProfile('user-123');
        expect(result).toBeNull();
      });

      it('should return localOnly on network error for save operations', async () => {
        fetchWithTimeout.mockRejectedValueOnce(new Error('Network error'));

        const result = await saveUserProfile('user-123', { name: 'Trey' });
        // Falls back to localOnly since apiRequest returns null on error
        expect(result).toEqual({ success: true, localOnly: true });
      });
    });
  });

  describe('when API is NOT configured', () => {
    beforeEach(() => {
      API_CONFIG.userData.getBaseUrl.mockImplementation(() => { throw new Error('Not configured'); });
    });

    it('saveUserProfile should return localOnly', async () => {
      const result = await saveUserProfile('user-123', { name: 'Trey' });
      expect(result).toEqual({ success: true, localOnly: true });
      expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it('getUserProfile should return null', async () => {
      const result = await getUserProfile('user-123');
      expect(result).toBeNull();
    });

    it('loadAllUserData should return empty data', async () => {
      const result = await loadAllUserData('user-123');
      expect(result.hasData).toBe(false);
      expect(result.profile).toBeNull();
    });

    it('deleteAllUserData should return localOnly', async () => {
      const result = await deleteAllUserData('user-123');
      expect(result).toEqual({ success: true, localOnly: true });
    });
  });
});
