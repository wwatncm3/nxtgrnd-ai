// Dashboard utility functions and hooks
import { useState, useEffect } from 'react';
import { storageUtils, STORAGE_KEYS } from '../../utils/authUtils';
import { storageService, STORAGE_KEYS as SERVICE_KEYS } from '../../services/storageService';
import analytics from '../../utils/analytics';

// Store dashboard data to localStorage + DynamoDB (user-scoped)
export const storeDashboardData = (userId, data) => {
  if (!userId) return;
  try {
    const dashboardData = {
      learningPaths: data.learningPaths || [],
      opportunities: data.opportunities || [],
      goals: data.goals || [],
      events: data.events || [],
      timestamp: new Date().toISOString(),
      careerPath: data.careerPath,
      careerPathId: data.careerPath?.id
    };
    // Use new storage service which syncs to DynamoDB
    storageService.setItem(SERVICE_KEYS.USER_DASHBOARD, dashboardData, userId);
    // Also save career path separately for navigation
    if (data.careerPath) {
      storageService.setItem(SERVICE_KEYS.CAREER_PATH, data.careerPath, userId);
    }
    console.log('Dashboard data stored for user:', userId, '(syncing to DynamoDB)');
  } catch (err) {
    console.error('Error storing dashboard data:', err);
  }
};

// Get dashboard data from localStorage (user-scoped)
export const getDashboardFromSession = (userId, currentCareerPath) => {
  try {
    const dashboardData = storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD, userId);
    if (dashboardData) {
      const storedCareerPathId = dashboardData.careerPath?.id || dashboardData.careerPath?.title;
      const currentCareerPathId = currentCareerPath?.id || currentCareerPath?.title;

      if (storedCareerPathId === currentCareerPathId) {
        console.log('Dashboard data matches current career path');
        return dashboardData;
      } else {
        console.log('Career path changed, clearing old dashboard data', {
          stored: storedCareerPathId,
          current: currentCareerPathId
        });
        storageUtils.removeItem(STORAGE_KEYS.USER_DASHBOARD, userId);
        return null;
      }
    }
  } catch (err) {
    console.error('Error reading dashboard from session:', err);
  }
  return null;
};

// Enhanced Search Hook with debouncing
export const useSearch = (searchQuery, delay = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, delay]);

  return debouncedQuery;
};

// Comprehensive Search Function
export const searchContent = (query, learningPaths, opportunities, goals, events) => {
  if (!query || query.trim().length < 2) {
    return {
      learningPaths,
      opportunities,
      goals,
      events,
      totalResults: learningPaths.length + opportunities.length + goals.length + events.length,
      hasResults: true
    };
  }

  const searchTerm = query.toLowerCase().trim();

  // Search Learning Paths (including nested resources)
  const filteredLearningPaths = learningPaths.filter(path => {
    const titleMatch = path.title?.toLowerCase().includes(searchTerm);
    const providerMatch = path.provider?.toLowerCase().includes(searchTerm);
    const descriptionMatch = path.description?.toLowerCase().includes(searchTerm);
    const skillsMatch = path.skills?.some(skill => skill.toLowerCase().includes(searchTerm));
    const lessonMatch = path.nextLesson?.toLowerCase().includes(searchTerm);

    // Search within resources
    const resourceMatch = path.resources?.some(resource =>
      resource.title?.toLowerCase().includes(searchTerm) ||
      resource.provider?.toLowerCase().includes(searchTerm) ||
      resource.description?.toLowerCase().includes(searchTerm) ||
      resource.type?.toLowerCase().includes(searchTerm)
    );

    return titleMatch || providerMatch || descriptionMatch || skillsMatch || lessonMatch || resourceMatch;
  });

  // Search Opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    const roleMatch = opp.role?.toLowerCase().includes(searchTerm);
    const companyMatch = opp.company?.toLowerCase().includes(searchTerm);
    const locationMatch = opp.location?.toLowerCase().includes(searchTerm);
    const descriptionMatch = opp.description?.toLowerCase().includes(searchTerm);

    return roleMatch || companyMatch || locationMatch || descriptionMatch;
  });

  // Search Goals
  const filteredGoals = goals.filter(goal => {
    const titleMatch = goal.title?.toLowerCase().includes(searchTerm);
    const descriptionMatch = goal.description?.toLowerCase().includes(searchTerm);

    return titleMatch || descriptionMatch;
  });

  // Search Events
  const filteredEvents = events.filter(event => {
    const titleMatch = event.title?.toLowerCase().includes(searchTerm);
    const descriptionMatch = event.description?.toLowerCase().includes(searchTerm);
    const providerMatch = event.provider?.toLowerCase().includes(searchTerm);

    return titleMatch || descriptionMatch || providerMatch;
  });

  const totalResults = filteredLearningPaths.length + filteredOpportunities.length +
                      filteredGoals.length + filteredEvents.length;
  analytics.trackSearchPerformed(query, totalResults);
  return {
    learningPaths: filteredLearningPaths,
    opportunities: filteredOpportunities,
    goals: filteredGoals,
    events: filteredEvents,
    totalResults,
    hasResults: totalResults > 0
  };
};

// Calculate match score between required skills and user skills
export const calculateMatchScore = (required = [], userSkills = []) => {
  if (!required.length || !userSkills.length) return 85;

  const matching = required.filter(skill =>
    userSkills.some(userSkill =>
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );

  return Math.round((matching.length / required.length) * 100);
};
