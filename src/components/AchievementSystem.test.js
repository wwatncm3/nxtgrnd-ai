import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AchievementProvider, useAchievements, ACHIEVEMENTS } from './AchievementSystem';
import * as authUtils from '../utils/authUtils';

// Mock authUtils
jest.mock('../utils/authUtils', () => ({
  getCurrentStorageUserId: jest.fn()
}));

// Test component to expose achievement hooks
const TestComponent = ({ onReady }) => {
  const achievements = useAchievements();

  React.useEffect(() => {
    if (onReady) {
      onReady(achievements);
    }
  }, [achievements, onReady]);

  return (
    <div>
      <div data-testid="total-points">{achievements.totalPoints}</div>
      <div data-testid="achievement-count">{achievements.achievements.length}</div>
    </div>
  );
};

describe('AchievementSystem', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('User Data Isolation', () => {
    it('should properly isolate achievements between different users', async () => {
      // User 1
      authUtils.getCurrentStorageUserId.mockReturnValue('user-123');

      const { rerender } = render(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('0');
      });

      // Unlock achievement for user 1
      let achievementContext;
      rerender(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('CAREER_PATH_SELECTED');
          });
        }
      });

      // Verify user 1 has the achievement
      const user1Data = localStorage.getItem('user-123_achievements');
      expect(user1Data).toBeTruthy();
      expect(JSON.parse(user1Data)).toContain('CAREER_PATH_SELECTED');

      // Switch to User 2
      authUtils.getCurrentStorageUserId.mockReturnValue('user-456');

      rerender(
        <AchievementProvider>
          <TestComponent />
        </AchievementProvider>
      );

      // Wait for user change to take effect
      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('0');
      }, { timeout: 2000 });

      // Verify user 2 has no achievements
      const user2Data = localStorage.getItem('user-456_achievements');
      expect(user2Data).toBeNull();

      // Verify user 1 data is still intact
      const user1DataAfter = localStorage.getItem('user-123_achievements');
      expect(JSON.parse(user1DataAfter)).toContain('CAREER_PATH_SELECTED');
    });

    it('should not allow unlocking achievements without user ID', async () => {
      authUtils.getCurrentStorageUserId.mockReturnValue(null);

      let achievementContext;
      render(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('CAREER_PATH_SELECTED');
          });
        }
      });

      // Verify no achievements were unlocked
      expect(screen.getByTestId('achievement-count')).toHaveTextContent('0');
      expect(screen.getByTestId('total-points')).toHaveTextContent('0');
    });
  });

  describe('Achievement Unlocking', () => {
    beforeEach(() => {
      authUtils.getCurrentStorageUserId.mockReturnValue('test-user');
    });

    it('should unlock achievement and update points', async () => {
      let achievementContext;
      render(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('CAREER_PATH_SELECTED');
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
        expect(screen.getByTestId('total-points')).toHaveTextContent('50');
      });
    });

    it('should not unlock same achievement twice', async () => {
      let achievementContext;
      render(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('CAREER_PATH_SELECTED');
            achievementContext.unlockAchievement('CAREER_PATH_SELECTED');
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-count')).toHaveTextContent('1');
        expect(screen.getByTestId('total-points')).toHaveTextContent('50');
      });
    });

    it('should handle invalid achievement keys gracefully', async () => {
      let achievementContext;
      render(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('INVALID_ACHIEVEMENT');
          });
        }
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
      let achievementContext;
      render(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('CAREER_PATH_SELECTED');
            achievementContext.unlockAchievement('RESUME_UPLOADED');
          });
        }
      });

      await waitFor(() => {
        const stats = achievementContext.getStats();
        expect(stats.unlocked).toBe(2);
        expect(stats.totalPoints).toBe(80); // 50 + 30
        expect(stats.level).toBe(1);
        expect(stats.progressToNextLevel).toBe(80);
      });
    });
  });

  describe('Persistence', () => {
    beforeEach(() => {
      authUtils.getCurrentStorageUserId.mockReturnValue('test-user');
    });

    it('should load achievements from localStorage on mount', async () => {
      // Pre-populate localStorage
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
      let achievementContext;
      render(
        <AchievementProvider>
          <TestComponent
            onReady={(ctx) => {
              achievementContext = ctx;
            }}
          />
        </AchievementProvider>
      );

      await waitFor(() => {
        if (achievementContext) {
          act(() => {
            achievementContext.unlockAchievement('SKILLS_ADDED');
          });
        }
      });

      await waitFor(() => {
        const stored = localStorage.getItem('test-user_achievements');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored)).toContain('SKILLS_ADDED');
      });
    });
  });
});
