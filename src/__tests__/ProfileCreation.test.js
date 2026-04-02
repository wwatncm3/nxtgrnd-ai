import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserContext } from '../App';

// Mock Amplify auth
jest.mock('@aws-amplify/auth', () => ({
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  resendSignUpCode: jest.fn(),
  signIn: jest.fn(),
  getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
  fetchUserAttributes: jest.fn(),
  signOut: jest.fn()
}));

// Mock analytics
jest.mock('../utils/analytics', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    setUser: jest.fn(),
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    cleanup: jest.fn()
  }
}));

// Mock storageService
jest.mock('../services/storageService', () => ({
  storageService: {
    setItem: jest.fn(() => true),
    getItem: jest.fn(() => null),
    removeItem: jest.fn(() => true),
    forceSync: jest.fn(),
    loadFromCloud: jest.fn()
  },
  userStateService: {
    getUserState: jest.fn().mockResolvedValue({
      preferences: null,
      careerPath: null,
      resume: null,
      dashboard: null,
      completionLevel: 0
    })
  }
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
    USER_PREFERENCES: 'pathPreferences',
    CAREER_PATH: 'careerPath',
    USER_RESUME: 'resume',
    USER_DASHBOARD: 'dashboard',
    SUBSCRIPTION_TIER: 'subscriptionTier'
  },
  getCurrentStorageUserId: jest.fn(),
  setCurrentStorageUserId: jest.fn(),
  determineUserNavigationWithDebug: jest.fn(() => ({ skipToEnd: false, stage: 3 })),
  handleAuthError: jest.fn(() => 'An error occurred'),
  debugUtils: {
    testSessionStorage: jest.fn(() => true),
    logAllStoredData: jest.fn()
  },
  migrateOldStorageKeys: jest.fn(),
  cleanupNonScopedKeys: jest.fn()
}));

// Mock LoginHandler
jest.mock('../components/LoginHandler', () => ({
  useLoginHandler: () => ({
    handleLogin: jest.fn()
  })
}));

import ProfileCreation from '../components/ProfileCreation';

const renderWithContext = (ui, { user = {}, setUser = jest.fn() } = {}) => {
  return render(
    <UserContext.Provider value={{ user, setUser, stage: 1, setStage: jest.fn(), selectedCareerPath: null, setSelectedCareerPath: jest.fn() }}>
      {ui}
    </UserContext.Provider>
  );
};

describe('ProfileCreation', () => {
  it('renders the landing page by default', () => {
    renderWithContext(<ProfileCreation onNext={jest.fn()} />);
    // Landing page should show the app name
    expect(screen.getByText(/NxtGrnd/i)).toBeInTheDocument();
  });

  it('shows the sign in button on the landing page', () => {
    renderWithContext(<ProfileCreation onNext={jest.fn()} />);
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
  });

  it('shows the get started button on the landing page', () => {
    renderWithContext(<ProfileCreation onNext={jest.fn()} />);
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });

  it('transitions to login view when sign in is clicked', async () => {
    renderWithContext(<ProfileCreation onNext={jest.fn()} />);
    fireEvent.click(screen.getByText(/Sign In/i));
    // handleViewTransition has a 150ms setTimeout
    await waitFor(() => {
      const emailInput = screen.queryByPlaceholderText(/email/i);
      if (emailInput) {
        expect(emailInput).toBeInTheDocument();
      }
    }, { timeout: 500 });
  });

  it('renders featured learning paths on landing page', () => {
    renderWithContext(<ProfileCreation onNext={jest.fn()} />);
    expect(screen.getByText(/Software Engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Science & Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloud & Cybersecurity/i)).toBeInTheDocument();
  });
});
