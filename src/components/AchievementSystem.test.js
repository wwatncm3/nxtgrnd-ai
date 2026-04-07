import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AchievementProvider, useAchievements, ACHIEVEMENTS } from './AchievementSystem';
import * as authUtils from '../utils/authUtils';

// Mock authUtils
jest.mock('../utils/authUtils', () => ({
  getCurrentStorageUserId: jest.fn()
}));

// Helper component that captures context and exposes it via ref
let capturedCtx = null;
const TestComponent = () => {
  const achievements = useAchievements();
  capturedCtx = achievements;

  return (
    <div>
      <div data-testid="total-points">{achievements.totalPoints}</div>
      <div data-testid="achievement-count">{achievements.achievements.length}</div>
    </div>
  );
};

describe('AchievementSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    capturedCtx = null;
  });

  describe('User Data Isolation', () => {
    it('should properly isolate achievements between different users', async () => {
      // User 1 unlocks an achievement
      authUtils.getCurrentStorageUserId.mockReturnValue('user-123');

      const { unmount } = render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('CAREER_PATH_SELECTED');
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
      });

      // Verify localStorage for user 1
      const user1Data = localStorage.getItem('user-123_achievements');
      expect(user1Data).toBeTruthy();
      expect(JSON.parse(user1Data)).toContain('CAREER_PATH_SELECTED');

      // Unmount and remount as User 2
      unmount();
      capturedCtx = null;
      authUtils.getCurrentStorageUserId.mockReturnValue('user-456');

      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      // User 2 should have no achievements (no data in their localStorage key)
      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('0');
      });

      // Verify user 1 data is still intact
      const user1DataAfter = localStorage.getItem('user-123_achievements');
      expect(JSON.parse(user1DataAfter)).toContain('CAREER_PATH_SELECTED');
    });

    it('should not allow unlocking achievements without user ID', async () => {
      authUtils.getCurrentStorageUserId.mockReturnValue(null);

      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('CAREER_PATH_SELECTED');
      });

      expect(screen.getByTestId('achievement-count')).toHaveTextContent('0');
      expect(screen.getByTestId('total-points')).toHaveTextContent('0');
    });
  });

  describe('Achievement Unlocking', () => {
    beforeEach(() => {
      authUtils.getCurrentStorageUserId.mockReturnValue('test-user');
    });

    it('should unlock achievement and update points', async () => {
      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('CAREER_PATH_SELECTED');
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
        expect(screen.getByTestId('total-points')).toHaveTextContent('50');
      });
    });

    it('should not unlock same achievement twice', async () => {
      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('CAREER_PATH_SELECTED');
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
      });

      // Try unlocking again
      act(() => {
        capturedCtx.unlockAchievement('CAREER_PATH_SELECTED');
      });

      // Should still be 1
      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
        expect(screen.getByTestId('total-points')).toHaveTextContent('50');
      });
    });

    it('should handle invalid achievement keys gracefully', async () => {
      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('INVALID_ACHIEVEMENT');
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('0');
        expect(screen.getByTestId('total-points')).toHaveTextContent('0');
      });
    });
  });

  describe('Achievement Statistics', () => {
    beforeEach(() => {
      authUtils.getCurrentStorageUserId.mockReturnValue('test-user');
    });

    it('should calculate correct statistics', async () => {
      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('CAREER_PATH_SELECTED');
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
      });

      act(() => {
        capturedCtx.unlockAchievement('RESUME_UPLOADED');
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('2');
        expect(screen.getByTestId('total-points')).toHaveTextContent('80');
      });

      const stats = capturedCtx.getStats();
      expect(stats.unlocked).toBe(2);
      expect(stats.totalPoints).toBe(80);
      expect(stats.level).toBe(1);
      expect(stats.progressToNextLevel).toBe(80);
    });
  });

  describe('Persistence', () => {
    beforeEach(() => {
      authUtils.getCurrentStorageUserId.mockReturnValue('test-user');
    });

    it('should load achievements from localStorage on mount', async () => {
      localStorage.setItem(
        'test-user_achievements',
        JSON.stringify(['CAREER_PATH_SELECTED', 'RESUME_UPLOADED'])
      );

      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('2');
        expect(screen.getByTestId('total-points')).toHaveTextContent('80');
      });
    });

    it('should persist achievements to localStorage when unlocked', async () => {
      render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(capturedCtx).toBeTruthy();
      });

      act(() => {
        capturedCtx.unlockAchievement('SKILLS_ADDED');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('test-user_achievements');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored)).toContain('SKILLS_ADDED');
      });
    });
  });
});
