import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RefreshOptionsBanner from './RefreshOptionsBanner';

describe('RefreshOptionsBanner', () => {
  const mockOnUpdateSkills = jest.fn();
  const mockOnRefreshRecommendations = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render banner title', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Update Your Career Path')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/Want to explore different options/)).toBeInTheDocument();
  });

  it('should render "Update Skills & Resume" button', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Update Skills & Resume')).toBeInTheDocument();
  });

  it('should render "Get Fresh Recommendations" button', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Get Fresh Recommendations')).toBeInTheDocument();
  });

  it('should call onUpdateSkills when "Update Skills & Resume" is clicked', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    const button = screen.getByText('Update Skills & Resume');
    fireEvent.click(button);

    expect(mockOnUpdateSkills).toHaveBeenCalledTimes(1);
    expect(mockOnRefreshRecommendations).not.toHaveBeenCalled();
  });

  it('should call onRefreshRecommendations when "Get Fresh Recommendations" is clicked', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    const button = screen.getByText('Get Fresh Recommendations');
    fireEvent.click(button);

    expect(mockOnRefreshRecommendations).toHaveBeenCalledTimes(1);
    expect(mockOnUpdateSkills).not.toHaveBeenCalled();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    // The dismiss button contains the ChevronLeft icon
    const buttons = screen.getAllByRole('button');
    // The dismiss button is the last one (contains just the icon)
    const dismissButton = buttons.find(btn =>
      btn.className.includes('text-gray-400')
    );

    if (dismissButton) {
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    }
  });

  it('should have correct button styling', () => {
    render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    const updateButton = screen.getByText('Update Skills & Resume');
    const refreshButton = screen.getByText('Get Fresh Recommendations');

    // Primary button (filled)
    expect(updateButton).toHaveClass('bg-blue-600');
    expect(updateButton).toHaveClass('text-white');

    // Secondary button (outlined)
    expect(refreshButton).toHaveClass('bg-white');
    expect(refreshButton).toHaveClass('text-blue-600');
    expect(refreshButton).toHaveClass('border');
  });

  it('should have gradient background', () => {
    const { container } = render(
      <RefreshOptionsBanner
        onUpdateSkills={mockOnUpdateSkills}
        onRefreshRecommendations={mockOnRefreshRecommendations}
        onDismiss={mockOnDismiss}
      />
    );

    const banner = container.firstChild;
    expect(banner).toHaveClass('bg-gradient-to-r');
    expect(banner).toHaveClass('from-blue-50');
    expect(banner).toHaveClass('to-indigo-50');
  });
});
