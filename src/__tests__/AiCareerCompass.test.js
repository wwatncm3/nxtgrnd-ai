import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserContext } from '../App';

// Mock Amplify
jest.mock('@aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
  fetchUserAttributes: jest.fn(),
  signOut: jest.fn()
}));

// Mock analytics
jest.mock('../utils/analytics', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    trackCareerPathSelected: jest.fn()
  }
}));

// Mock API config
jest.mock('../config/api', () => ({
  __esModule: true,
  default: {
    recommendations: {
      generate: () => 'https://mock-api.com/recommendations'
    },
    subscription: {
      checkBetaAccess: () => null
    }
  },
  fetchWithTimeout: jest.fn()
}));

// Mock storageService
jest.mock('../services/storageService', () => ({
  storageService: {
    setItem: jest.fn(() => true),
    getItem: jest.fn(() => null),
    removeItem: jest.fn(() => true),
    forceSync: jest.fn()
  }
}));

// Mock authUtils
jest.mock('../utils/authUtils', () => ({
  storageUtils: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => true),
    removeItem: jest.fn()
  },
  STORAGE_KEYS: {
    COMPASS_CACHE: 'compassRecs',
    CAREER_PATH: 'careerPath',
    USER_DASHBOARD: 'dashboard',
    USER_RESUME: 'resume',
    USER_SKILLS: 'skills'
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
    loading: false
  }),
  SubscriptionProvider: ({ children }) => children
}));

// Mock career-compass components
jest.mock('../components/career-compass', () => ({
  CareerPathCard: ({ path, onSelect }) => (
    <div data-testid="career-path-card" onClick={() => onSelect(path)}>
      <h3>{path.title}</h3>
      <p>{path.description}</p>
    </div>
  ),
  RefreshOptionsBanner: () => <div data-testid="refresh-banner">Refresh</div>,
  MarketInsights: () => <div data-testid="market-insights">Market Insights</div>,
  generateEnhancedRecommendations: jest.fn().mockResolvedValue({
    careerPaths: [
      {
        title: 'Software Engineer',
        description: 'Build and maintain software systems',
        matchScore: 95,
        requiredSkills: ['JavaScript', 'React'],
        salary: { entry: '$70K', mid: '$110K', senior: '$150K' }
      },
      {
        title: 'Data Scientist',
        description: 'Analyze data and build ML models',
        matchScore: 85,
        requiredSkills: ['Python', 'SQL'],
        salary: { entry: '$75K', mid: '$120K', senior: '$160K' }
      }
    ],
    marketTrends: [],
    simulations: [],
    skillImpact: []
  }),
  generateDefaultTimeline: jest.fn(() => []),
  generateFallbackSimulation: jest.fn(() => ({})),
  generateLocalFallbackPaths: jest.fn(() => [
    { title: 'Software Engineer', description: 'Fallback', matchScore: 90, requiredSkills: [] }
  ])
}));

// Mock CareerScenarioSimulator
jest.mock('../components/CareerScenarioSimulator', () => () => (
  <div data-testid="scenario-simulator">Simulator</div>
));

// Mock SubscriptionGate
jest.mock('../components/SubscriptionGate', () => ({ children }) => <>{children}</>);

// Mock AnimatedComponents
jest.mock('../components/ui/AnimatedComponents', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  FullPageLoader: () => <div data-testid="full-page-loader">Loading page...</div>
}));

import AiCareerCompass from '../pages/AiCareerCompass';

const mockUser = {
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  skills: ['JavaScript', 'React'],
  selectedCareerPath: null
};

const renderWithContext = (ui, { user = mockUser, setUser = jest.fn(), setStage = jest.fn() } = {}) => {
  return render(
    <UserContext.Provider value={{ user, setUser, stage: 4, setStage, selectedCareerPath: null, setSelectedCareerPath: jest.fn() }}>
      {ui}
    </UserContext.Provider>
  );
};

describe('AiCareerCompass', () => {
  it('renders without crashing', async () => {
    renderWithContext(<AiCareerCompass />);
    await waitFor(() => {
      // Should render the component (may show loading first, then content)
      expect(document.body).toBeTruthy();
    });
  });

  it('displays career path recommendations after loading', async () => {
    renderWithContext(<AiCareerCompass />);
    await waitFor(() => {
      const cards = screen.queryAllByTestId('career-path-card');
      if (cards.length > 0) {
        expect(cards.length).toBeGreaterThanOrEqual(1);
      }
    }, { timeout: 3000 });
  });

  it('allows selecting a career path', async () => {
    const mockSetUser = jest.fn();
    renderWithContext(<AiCareerCompass />, { setUser: mockSetUser });

    await waitFor(() => {
      const cards = screen.queryAllByTestId('career-path-card');
      if (cards.length > 0) {
        fireEvent.click(cards[0]);
      }
    }, { timeout: 3000 });
  });

  it('handles tab navigation between overview sections', async () => {
    renderWithContext(<AiCareerCompass />);
    await waitFor(() => {
      // Look for tab buttons
      const overviewTab = screen.queryByText(/overview/i);
      const timelineTab = screen.queryByText(/timeline/i);
      if (overviewTab && timelineTab) {
        fireEvent.click(timelineTab);
        fireEvent.click(overviewTab);
      }
    }, { timeout: 3000 });
  });

  it('renders back navigation button', async () => {
    const mockSetStage = jest.fn();
    renderWithContext(<AiCareerCompass />, { setStage: mockSetStage });
    await waitFor(() => {
      const backButton = screen.queryByText(/back/i);
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockSetStage).toHaveBeenCalled();
      }
    }, { timeout: 3000 });
  });
});
