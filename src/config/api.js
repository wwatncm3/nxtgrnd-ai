// API Configuration - Centralized endpoint management
// All API endpoints are configured via environment variables

const API_CONFIG = {
  // Recommendations API - generates career paths, learning resources, opportunities, simulations
  recommendations: {
    baseUrl: process.env.REACT_APP_RECOMMENDATIONS_API || 'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
    generate: () => API_CONFIG.recommendations.baseUrl
  },

  // Files API - upload/download resumes and documents
  files: {
    baseUrl: process.env.REACT_APP_FILES_API || 'https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files',
    upload: () => `${API_CONFIG.files.baseUrl}/upload`,
    download: () => `${API_CONFIG.files.baseUrl}/download`
  },

  // Dynamic Options API - career paths, skills suggestions
  dynamicOptions: {
    baseUrl: process.env.REACT_APP_DYNAMIC_OPTIONS_API || 'https://qvuwgujm49.execute-api.us-east-1.amazonaws.com/dev/dynamic-options',
    get: () => API_CONFIG.dynamicOptions.baseUrl
  },

  // User Data API - persistent user storage (uses same API Gateway as dynamic-options)
  // Derives base URL from dynamicOptions since they share the same API Gateway
  userData: {
    getBaseUrl: () => {
      // Get the base gateway URL and append /user instead of /dynamic-options
      const dynamicBase = API_CONFIG.dynamicOptions.baseUrl;
      return dynamicBase.replace('/dynamic-options', '/user');
    },
    profile: () => `${API_CONFIG.userData.getBaseUrl()}/profile`,
    dashboard: () => `${API_CONFIG.userData.getBaseUrl()}/dashboard`,
    preferences: () => `${API_CONFIG.userData.getBaseUrl()}/preferences`,
    all: () => `${API_CONFIG.userData.getBaseUrl()}/all`
  },

  // Analytics API
  analytics: {
    baseUrl: process.env.REACT_APP_ANALYTICS_ENDPOINT || '',
    get: () => API_CONFIG.analytics.baseUrl
  }
};

// Helper function to make recommendation requests
export const makeRecommendationRequest = async (payload) => {
  const response = await fetch(API_CONFIG.recommendations.generate(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      httpMethod: 'POST',
      path: '/recommendations/generate',
      body: JSON.stringify(payload)
    })
  });
  return response.json();
};

// Helper function to upload files
export const uploadFile = async (formData) => {
  const response = await fetch(API_CONFIG.files.upload(), {
    method: 'POST',
    body: formData
  });
  return response.json();
};

// Helper function to download files
export const downloadFile = async (payload) => {
  const response = await fetch(API_CONFIG.files.download(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
};

// Helper function to get dynamic options
export const getDynamicOptions = async (payload) => {
  const response = await fetch(API_CONFIG.dynamicOptions.get(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export default API_CONFIG;
