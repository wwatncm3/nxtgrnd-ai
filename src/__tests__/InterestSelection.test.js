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

// Mock API config
jest.mock('../config/api', () => ({
  __esModule: true,
  default: {
    files: {
      upload: () => 'https://mock-api.com/upload'
    },
    recommendations: {
      generate: () => 'https://mock-api.com/recommendations'
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
    USER_PREFERENCES: 'pathPreferences',
    CAREER_PATH: 'careerPath',
    USER_RESUME: 'resume',
    USER_SKILLS: 'skills',
    USER_INTERESTS: 'interests'
  },
  getCurrentStorageUserId: jest.fn(() => 'test@example.com'),
  setCurrentStorageUserId: jest.fn()
}));

// Mock skills data
jest.mock('../data/skills', () => ({
  __esModule: true,
  default: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'SQL', 'Java', 'Docker']
}));

// Mock AnimatedComponents
jest.mock('../components/ui/AnimatedComponents', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

import InterestSelection from '../components/InterestSelection';

const renderWithContext = (ui, { user = { email: 'test@example.com', userID: 'test@example.com' }, setUser = jest.fn() } = {}) => {
  return render(
    <UserContext.Provider value={{ user, setUser, stage: 3, setStage: jest.fn(), selectedCareerPath: null, setSelectedCareerPath: jest.fn() }}>
      {ui}
    </UserContext.Provider>
  );
};

describe('InterestSelection', () => {
  it('renders the skills selection heading', async () => {
    renderWithContext(<InterestSelection onComplete={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Select Your Skills')).toBeInTheDocument();
    });
  });

  it('renders the search input for skills', async () => {
    renderWithContext(<InterestSelection onComplete={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search skills/i)).toBeInTheDocument();
    });
  });

  it('shows skills when search input is focused/used', async () => {
    renderWithContext(<InterestSelection onComplete={jest.fn()} />);
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search skills/i);
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'Java' } });
    });
    // After typing, matching skills should appear
    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  it('renders with null user without crashing (userID guard)', async () => {
    // Render without a userID to test the guard
    renderWithContext(
      <InterestSelection onComplete={jest.fn()} />,
      { user: { email: null, userID: null }, setUser: jest.fn() }
    );
    await waitFor(() => {
      // Component should still render even without userID
      expect(screen.getByText('Select Your Skills')).toBeInTheDocument();
    });
  });

  it('shows the step progress indicators', async () => {
    renderWithContext(<InterestSelection onComplete={jest.fn()} />);
    await waitFor(() => {
      // Step 1 and 2 indicators should be visible
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
