// API Configuration - Centralized endpoint management
// All API endpoints are configured via environment variables

// Fetch with timeout to prevent hanging requests
export const fetchWithTimeout = (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

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

  // Subscription API - Stripe portal and subscription status
  subscription: {
    portalUrl: process.env.REACT_APP_SUBSCRIPTION_PORTAL_API || '',
    betaAccessUrl: process.env.REACT_APP_BETA_ACCESS_API || '',
    createPortalSession: () => API_CONFIG.subscription.portalUrl,
    checkBetaAccess: () => API_CONFIG.subscription.betaAccessUrl
  },

  // Analytics API (optional - leave empty if not using external analytics)
  analytics: {
    baseUrl: process.env.REACT_APP_ANALYTICS_ENDPOINT || null,
    get: () => API_CONFIG.analytics.baseUrl,
    enabled: () => !!API_CONFIG.analytics.baseUrl
  }
}

// API Health Check - validates endpoint configuration
export const validateAPIConfig = () => {
  const issues = [];

  // Check required endpoints
  if (!API_CONFIG.recommendations.baseUrl) {
    issues.push('CRITICAL: Recommendations API endpoint is missing');
  }

  if (!API_CONFIG.files.baseUrl) {
    issues.push('CRITICAL: Files API endpoint is missing');
  }

  if (!API_CONFIG.dynamicOptions.baseUrl) {
    issues.push('CRITICAL: Dynamic Options API endpoint is missing');
  }

  // Analytics is optional
  if (!API_CONFIG.analytics.baseUrl) {
    console.warn('WARNING: Analytics API endpoint not configured (optional)');
  }

  if (issues.length > 0) {
    console.error('ERROR: API Configuration Issues:', issues);
    return { valid: false, issues };
  }

  console.log('SUCCESS: All required API endpoints are configured');
  return { valid: true, issues: [] };
};

// Helper function to make recommendation requests
export const makeRecommendationRequest = async (payload) => {
  try {
    const endpoint = API_CONFIG.recommendations.generate();
    if (!endpoint) {
      throw new Error('Recommendations API endpoint not configured');
    }

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        httpMethod: 'POST',
        path: '/recommendations/generate',
        body: JSON.stringify(payload)
      })
    }, 30000);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ERROR: Recommendation request failed:', error);
    throw error;
  }
};

// Helper function to upload files
export const uploadFile = async (formData) => {
  try {
    const endpoint = API_CONFIG.files.upload();
    if (!endpoint) {
      throw new Error('Files API endpoint not configured');
    }

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      body: formData
    }, 60000);

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ERROR: File upload failed:', error);
    throw error;
  }
};

// Helper function to download files
export const downloadFile = async (payload) => {
  try {
    const endpoint = API_CONFIG.files.download();
    if (!endpoint) {
      throw new Error('Files API endpoint not configured');
    }

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 30000);

    if (!response.ok) {
      throw new Error(`File download failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ERROR: File download failed:', error);
    throw error;
  }
};

// Helper function to get dynamic options
export const getDynamicOptions = async (payload) => {
  try {
    const endpoint = API_CONFIG.dynamicOptions.get();
    if (!endpoint) {
      throw new Error('Dynamic Options API endpoint not configured');
    }

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 30000);

    if (!response.ok) {
      throw new Error(`Dynamic options request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ERROR: Dynamic options request failed:', error);
    throw error;
  }
};

export default API_CONFIG;
