import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CareerPathCard from './CareerPathCard';

describe('CareerPathCard', () => {
  const mockPath = {
    id: 'path-1',
    title: 'Software Engineer',
    description: 'Build and maintain software applications',
    salaryRange: '$80,000 - $150,000',
    matchScore: 85,
    requiredSkills: ['JavaScript', 'React', 'Node.js']
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render path title', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('should render path description', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('Build and maintain software applications')).toBeInTheDocument();
  });

  it('should render salary range', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('$80,000 - $150,000')).toBeInTheDocument();
  });

  it('should render match score percentage', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should render all required skills', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockPath);
  });

  it('should have selected styling when isSelected is true', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-blue-500');
    expect(button).toHaveClass('bg-blue-50');
  });

  it('should have default styling when isSelected is false', () => {
    render(
      <CareerPathCard
        path={mockPath}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-gray-200');
    expect(button).not.toHaveClass('bg-blue-50');
  });

  it('should display "Contact for details" when salary range is missing', () => {
    const pathWithoutSalary = { ...mockPath, salaryRange: null };

    render(
      <CareerPathCard
        path={pathWithoutSalary}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('Contact for details')).toBeInTheDocument();
  });

  it('should display 0% when match score is missing', () => {
    const pathWithoutScore = { ...mockPath, matchScore: undefined };

    render(
      <CareerPathCard
        path={pathWithoutScore}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle empty requiredSkills array', () => {
    const pathWithoutSkills = { ...mockPath, requiredSkills: [] };

    render(
      <CareerPathCard
        path={pathWithoutSkills}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // Should still render without errors
    expect(screen.getByText('Required Skills')).toBeInTheDocument();
  });

  it('should handle undefined requiredSkills', () => {
    const pathWithoutSkills = { ...mockPath, requiredSkills: undefined };

    render(
      <CareerPathCard
        path={pathWithoutSkills}
        onSelect={mockOnSelect}
        isSelected={false}
      />
    );

    // Should still render without errors
    expect(screen.getByText('Required Skills')).toBeInTheDocument();
  });
});
