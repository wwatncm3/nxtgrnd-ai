// Subscription Configuration - Tier definitions, feature mappings, and Stripe config
// Single source of truth for the freemium model

export const TIERS = {
  FREE: 'free',
  PRO: 'pro',
  BETA: 'beta',
  B2B: 'b2b',
  ADMIN: 'admin'
};

// Admin emails — full access + admin controls
export const ADMIN_EMAILS = [
  'willwalton3@gmail.com',
  process.env.REACT_APP_ADMIN_EMAIL || ''
].filter(Boolean);

// Features available per tier
export const TIER_FEATURES = {
  [TIERS.FREE]: [
    'career_compass_basic',
    'dashboard',
    'learning_paths',
    'video_recs',
    'job_opportunities',
    'goals_events'
  ],
  [TIERS.PRO]: [
    'career_compass_basic',
    'dashboard',
    'learning_paths',
    'video_recs',
    'job_opportunities',
    'goals_events',
    'resume_ats',
    'mentor_matching',
    'linkedin_finder',
    'career_roadmap_full',
    'career_simulator',
    'market_insights'
  ],
  [TIERS.BETA]: [
    'career_compass_basic',
    'dashboard',
    'learning_paths',
    'video_recs',
    'job_opportunities',
    'goals_events',
    'resume_ats',
    'mentor_matching',
    'linkedin_finder',
    'career_roadmap_full',
    'career_simulator',
    'market_insights'
  ],
  [TIERS.B2B]: [
    'career_compass_basic',
    'dashboard',
    'learning_paths',
    'video_recs',
    'job_opportunities',
    'goals_events',
    'resume_ats',
    'mentor_matching',
    'linkedin_finder',
    'career_roadmap_full',
    'career_simulator',
    'market_insights'
  ],
  [TIERS.ADMIN]: [
    'career_compass_basic',
    'dashboard',
    'learning_paths',
    'video_recs',
    'job_opportunities',
    'goals_events',
    'resume_ats',
    'mentor_matching',
    'linkedin_finder',
    'career_roadmap_full',
    'career_simulator',
    'market_insights'
  ]
};

// Feature metadata for UI display (upgrade prompts, pricing page)
export const FEATURE_META = {
  resume_ats: {
    key: 'resume_ats',
    label: 'Resume ATS Scanner',
    description: 'Get your resume scored by our AI-powered ATS scanner with detailed feedback on keywords, formatting, and optimization tips.',
    tier: TIERS.PRO,
    stage: 6
  },
  mentor_matching: {
    key: 'mentor_matching',
    label: 'Mentor Matching',
    description: 'Find industry mentors matched to your career goals through our AI-powered LinkedIn discovery system.',
    tier: TIERS.PRO,
    stage: 12
  },
  career_simulator: {
    key: 'career_simulator',
    label: 'Career Scenario Simulator',
    description: 'Run "what-if" analyses on career decisions — see projected salary impact, timeline, and risk for different paths.',
    tier: TIERS.PRO
  },
  market_insights: {
    key: 'market_insights',
    label: 'Market Insights',
    description: 'Access real-time market demand data, salary benchmarks, and industry growth projections for your career path.',
    tier: TIERS.PRO
  },
  career_roadmap_full: {
    key: 'career_roadmap_full',
    label: 'Full Career Roadmap',
    description: 'Get a detailed, personalized career roadmap with milestones, timelines, and skill development plans.',
    tier: TIERS.PRO
  },
  linkedin_finder: {
    key: 'linkedin_finder',
    label: 'LinkedIn Connection Finder',
    description: 'Discover and connect with professionals in your target industry through intelligent LinkedIn search.',
    tier: TIERS.PRO
  }
};

// Stripe configuration (reads from environment variables)
export const STRIPE_CONFIG = {
  pricingTableId: process.env.REACT_APP_STRIPE_PRICING_TABLE_ID || '',
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
  portalApiUrl: process.env.REACT_APP_SUBSCRIPTION_PORTAL_API || ''
};

// Beta cutoff date — users created before this date get beta (full) access
export const BETA_CUTOFF_DATE = '2026-04-01T00:00:00.000Z';

// Helper: check if a tier has access to a feature
export const tierHasFeature = (tier, featureKey) => {
  const features = TIER_FEATURES[tier] || TIER_FEATURES[TIERS.FREE];
  return features.includes(featureKey);
};

// Helper: get the required tier for a feature
export const getRequiredTier = (featureKey) => {
  return FEATURE_META[featureKey]?.tier || TIERS.FREE;
};

// Pro features list (for pricing page display)
export const PRO_FEATURES_LIST = Object.values(FEATURE_META).filter(
  f => f.tier === TIERS.PRO
);
