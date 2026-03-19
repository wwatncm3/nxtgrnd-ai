import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { UserContext } from '../App';
import { TIERS, TIER_FEATURES, BETA_CUTOFF_DATE, ADMIN_EMAILS } from '../config/subscription';
import { getUserSubscription, updateUserSubscription } from '../services/dynamoService';
import { storageUtils, STORAGE_KEYS } from '../utils/authUtils';
import API_CONFIG from '../config/api';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [tier, setTier] = useState(TIERS.FREE);
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const userId = user?.email;

  // Load subscription tier
  const loadSubscription = useCallback(async () => {
    if (!userId) {
      setTier(TIERS.FREE);
      setLoading(false);
      return;
    }

    // Check if user is an admin
    if (ADMIN_EMAILS.includes(userId.toLowerCase())) {
      setTier(TIERS.ADMIN);
      storageUtils.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, TIERS.ADMIN, userId);
      setLoading(false);
      return;
    }

    // Instant render from localStorage cache
    const cached = storageUtils.getItem(STORAGE_KEYS.SUBSCRIPTION_TIER, userId);
    if (cached) {
      setTier(cached);
    }

    try {
      const subData = await getUserSubscription(userId);

      if (subData.tier) {
        // User has a subscription tier set in DynamoDB
        setTier(subData.tier);
        setSubscriptionDetails(subData);
        storageUtils.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, subData.tier, userId);
      } else {
        // No tier set — check if user is approved for closed beta
        let isBetaApproved = false;

        // Check beta access API if configured
        const betaEndpoint = API_CONFIG.subscription.checkBetaAccess();
        if (betaEndpoint) {
          try {
            const betaRes = await fetch(`${betaEndpoint}?email=${encodeURIComponent(userId)}`);
            const betaData = await betaRes.json();
            isBetaApproved = betaData.approved === true;
          } catch (err) {
            console.warn('Beta access check failed, falling back to date check:', err);
          }
        }

        // Fallback: check if created before beta cutoff date
        if (!isBetaApproved) {
          const profile = storageUtils.getItem(STORAGE_KEYS.USER_PROFILE, userId);
          const createdAt = profile?.createdAt || user?.createdAt;
          if (createdAt && new Date(createdAt) < new Date(BETA_CUTOFF_DATE)) {
            isBetaApproved = true;
          }
        }

        if (isBetaApproved) {
          setTier(TIERS.BETA);
          storageUtils.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, TIERS.BETA, userId);
          await updateUserSubscription(userId, { tier: TIERS.BETA });
        } else {
          setTier(TIERS.FREE);
          storageUtils.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, TIERS.FREE, userId);
        }
      }
    } catch (error) {
      console.error('ERROR: Failed to load subscription:', error);
      // Fall back to cached value or free
      if (!cached) {
        setTier(TIERS.FREE);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, user?.createdAt]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Check if current tier has access to a feature
  const hasFeature = useCallback((featureKey) => {
    const features = TIER_FEATURES[tier] || TIER_FEATURES[TIERS.FREE];
    return features.includes(featureKey);
  }, [tier]);

  // Force refresh (e.g., after Stripe checkout return)
  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    // Retry up to 3 times with delay (webhook may not have fired yet)
    for (let attempt = 0; attempt < 3; attempt++) {
      await loadSubscription();
      if (tier !== TIERS.FREE) break;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }, [loadSubscription, tier]);

  const value = {
    tier,
    loading,
    subscriptionDetails,
    hasFeature,
    isProUser: tier === TIERS.PRO || tier === TIERS.BETA || tier === TIERS.B2B || tier === TIERS.ADMIN,
    isFreeUser: tier === TIERS.FREE,
    isBetaUser: tier === TIERS.BETA,
    isAdmin: tier === TIERS.ADMIN,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
