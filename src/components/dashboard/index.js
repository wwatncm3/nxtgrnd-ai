// Dashboard Components Index
export { default as DashboardHeader } from './DashboardHeader';
export { default as DashboardSidebar } from './DashboardSidebar';
export { default as LearningPathsSection } from './LearningPathsSection';
export { default as OpportunitiesSection } from './OpportunitiesSection';
export { default as GoalsSection } from './GoalsSection';
export { default as EventsSection } from './EventsSection';
export { default as VideoRecommendations } from './VideoRecommendations';

// Utilities
export {
  storeDashboardData,
  getDashboardFromSession,
  useSearch,
  searchContent,
  calculateMatchScore
} from './DashboardUtils';

// Search Components
export { HighlightText, SearchResultsInfo, ResourceCard } from './SearchComponents';

// Services
export {
  generateLearningPaths,
  generateOpportunities,
  generateGoals,
  generateEvents
} from './DashboardServices';
