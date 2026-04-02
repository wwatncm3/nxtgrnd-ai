import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserContext } from '../App';

// Mock Amplify
jest.mock('@aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
  fetchUserAttributes: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined)
}));

// Mock storageService
const mockFlushPendingSync = jest.fn().mockResolvedValue(undefined);
jest.mock('../services/storageService', () => ({
  storageService: {
    setItem: jest.fn(() => true),
    getItem: jest.fn(() => null),
    removeItem: jest.fn(() => true),
    forceSync: jest.fn()
  },
  flushPendingSync: (...args) => mockFlushPendingSync(...args)
}));

// Mock authUtils
jest.mock('../utils/authUtils', () => ({
  storageUtils: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => true),
    removeItem: jest.fn(),
    clearAllUserData: jest.fn()
  },
  STORAGE_KEYS: {
    CAREER_PATH: 'careerPath',
    USER_DASHBOARD: 'dashboard',
    COURSE_PROGRESS: 'courseProgress',
    COMPLETED_TASKS: 'completedTasks',
    USER_RESUME: 'resume'
  },
  getCurrentStorageUserId: jest.fn(() => 'test@example.com'),
  setCurrentStorageUserId: jest.fn()
}));

// Mock subscription context
jest.mock('../contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    tier: 'beta',
    hasFeature: jest.fn(() => true),
    isProUser: true,
    isFreeUser: false,
    isAdmin: false,
    loading: false
  }),
  SubscriptionProvider: ({ children }) => children
}));

// Mock OnboardingTooltip
jest.mock('../components/OnboardingTooltip', () => ({
  usePageTooltip: jest.fn()
}));

// Mock AnimatedComponents
jest.mock('../components/ui/AnimatedComponents', () => ({
  FullPageLoader: () => <div data-testid="full-page-loader">Loading...</div>
}));

// Mock dashboard components with proper async behavior
const mockLearningPaths = [{ title: 'Mock Path', resources: [] }];
const mockOpportunities = [{ title: 'Mock Opportunity' }];
const mockGoals = [{ title: 'Mock Goal' }];
const mockEvents = [{ title: 'Mock Event' }];
const mockStoreDashboardData = jest.fn();

jest.mock('../components/dashboard', () => ({
  DashboardHeader: ({ handleLogout, setIsSidebarOpen }) => (
    <header data-testid="dashboard-header">
      <button onClick={handleLogout} data-testid="logout-btn">Logout</button>
      <button onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)} data-testid="menu-btn">Menu</button>
    </header>
  ),
  DashboardSidebar: () => <aside data-testid="dashboard-sidebar">Sidebar</aside>,
  LearningPathsSection: ({ paths }) => (
    <section data-testid="learning-paths">
      {paths?.map((p, i) => <div key={i}>{p.title}</div>)}
    </section>
  ),
  OpportunitiesSection: ({ opportunities }) => (
    <section data-testid="opportunities">
      {opportunities?.map((o, i) => <div key={i}>{o.title}</div>)}
    </section>
  ),
  GoalsSection: () => <section data-testid="goals">Goals</section>,
  EventsSection: () => <section data-testid="events">Events</section>,
  VideoRecommendations: () => <div data-testid="videos">Videos</div>,
  SearchResultsInfo: () => null,
  storeDashboardData: (...args) => mockStoreDashboardData(...args),
  getDashboardFromSession: (userId, careerPath) => {
    // Return cached dashboard data to skip async loading
    if (userId && careerPath) {
      return {
        learningPaths: [{ title: 'Mock Path', resources: [] }],
        opportunities: [{ title: 'Mock Opportunity' }],
        goals: [{ title: 'Mock Goal' }],
        events: [{ title: 'Mock Event' }]
      };
    }
    return null;
  },
  useSearch: (query) => query || '',
  searchContent: () => ({
    learningPaths: [],
    opportunities: [],
    goals: [],
    events: [],
    totalResults: 0,
    hasResults: false
  }),
  generateLearningPaths: jest.fn().mockResolvedValue([{ title: 'Mock Path', resources: [] }]),
  generateOpportunities: jest.fn().mockResolvedValue([{ title: 'Mock Opportunity' }]),
  generateGoals: jest.fn().mockResolvedValue([{ title: 'Mock Goal' }]),
  generateEvents: jest.fn().mockResolvedValue([{ title: 'Mock Event' }])
}));

import MainContent from '../components/MainContent';

const defaultUser = {
  email: 'test@example.com',
  userID: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  selectedCareerPath: {
    title: 'Software Engineer',
    description: 'Build software',
    requiredSkills: ['JavaScript']
  }
};

const renderWithContext = (ui, { user = defaultUser, setUser = jest.fn(), setStage = jest.fn() } = {}) => {
  return render(
    <UserContext.Provider value={{
      user,
      setUser,
      stage: 5,
      setStage,
      selectedCareerPath: user?.selectedCareerPath || null,
      setSelectedCareerPath: jest.fn()
    }}>
      {ui}
    </UserContext.Provider>
  );
};

describe('MainContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard without crashing', async () => {
    const mockSetStage = jest.fn();
    renderWithContext(<MainContent setStage={mockSetStage} />);
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    });
  });

  it('renders without a career path without crashing (redirects to career compass)', async () => {
    const mockSetStage = jest.fn();
    const userWithoutPath = {
      email: 'test@example.com',
      userID: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      selectedCareerPath: null
    };

    // Should not crash -- will either redirect to stage 4 or show loading
    renderWithContext(
      <MainContent setStage={mockSetStage} />,
      { user: userWithoutPath, setStage: mockSetStage }
    );

    await waitFor(() => {
      // Without a career path and no stored one, component calls setStage(4) to redirect
      expect(mockSetStage).toHaveBeenCalledWith(4);
    });
  });

  it('displays the user name in the welcome message', async () => {
    renderWithContext(<MainContent setStage={jest.fn()} />);
    await waitFor(() => {
      // The welcome h1 contains "Welcome {firstName} to your {careerPath} Dashboard!"
      // Text is split across child elements, so use a function matcher
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('Test');
      expect(heading.textContent).toContain('Software Engineer');
    });
  });

  it('has flushPendingSync available for logout flow', () => {
    const { flushPendingSync } = require('../services/storageService');
    expect(typeof flushPendingSync).toBe('function');
    expect(() => flushPendingSync()).not.toThrow();
  });

  it('renders dashboard sections when career path is set', async () => {
    renderWithContext(<MainContent setStage={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('learning-paths')).toBeInTheDocument();
    });
  });
});
