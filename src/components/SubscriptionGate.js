import React, { useContext } from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { UserContext } from '../App';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FEATURE_META } from '../config/subscription';

// Upgrade prompt shown when a free-tier user tries to access a pro feature
const UpgradePrompt = ({ feature, setStage }) => {
  const meta = FEATURE_META[feature] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Lock Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-blue-900" />
        </div>

        {/* Feature Name */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {meta.label || 'Pro Feature'}
        </h2>

        {/* Pro Badge */}
        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-teal-600 text-white text-sm font-semibold px-3 py-1 rounded-full mb-4">
          <Crown className="w-3.5 h-3.5" />
          NxtGrnd Pro
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {meta.description || 'This feature is available with NxtGrnd Pro. Upgrade to unlock the full power of NxtGrnd AI.'}
        </p>

        {/* Upgrade Button */}
        <button
          onClick={() => setStage(13)}
          className="w-full bg-gradient-to-r from-blue-900 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-950 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2 mb-4 shadow-lg shadow-blue-200"
        >
          Upgrade to NxtGrnd Pro
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Back Button */}
        <button
          onClick={() => setStage(5)}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// SubscriptionGate - wraps a feature and shows upgrade prompt if user lacks access
const SubscriptionGate = ({ feature, children, fallback }) => {
  const { hasFeature, loading } = useSubscription();
  const { setStage } = useContext(UserContext);

  if (loading) {
    return null;
  }

  if (hasFeature(feature)) {
    return children;
  }

  // Show custom fallback or default upgrade prompt
  if (fallback) {
    return fallback;
  }

  return <UpgradePrompt feature={feature} setStage={setStage} />;
};

// Small inline badge for sidebar/nav items
export const ProBadge = () => (
  <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-blue-900 to-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
    <Crown className="w-2.5 h-2.5" />
    PRO
  </span>
);

// Small lock icon for inline use
export const ProLockIcon = () => (
  <Lock className="w-3.5 h-3.5 text-teal-500" />
);

export default SubscriptionGate;
