import React, { useContext, useState } from 'react';
import { ArrowLeft, Check, Crown, Building2, Zap, Mail } from 'lucide-react';
import { UserContext } from '../App';
import { useSubscription } from '../contexts/SubscriptionContext';
import { STRIPE_CONFIG, PRO_FEATURES_LIST } from '../config/subscription';
import API_CONFIG, { fetchWithTimeout } from '../config/api';

const PricingPage = () => {
  const { user, setStage } = useContext(UserContext);
  const { tier, isProUser, isBetaUser, isAdmin } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    const portalEndpoint = API_CONFIG.subscription.createPortalSession();
    if (!portalEndpoint) {
      console.error('Subscription portal API not configured');
      return;
    }

    setPortalLoading(true);
    try {
      const response = await fetchWithTimeout(portalEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.email })
      }, 30000);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('ERROR: Failed to create portal session:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  const freeFeatures = [
    'AI Career Compass (basic)',
    'Personalized Dashboard',
    'Learning Path Recommendations',
    'Video Recommendations',
    'Job Opportunities Board',
    'Goals & Events Tracking'
  ];

  const proFeatures = [
    'Everything in Free, plus:',
    ...PRO_FEATURES_LIST.map(f => f.label)
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setStage(5)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Choose Your Plan</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Unlock Your Full Career Potential
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get AI-powered career tools to accelerate your professional growth. Start free, upgrade when you're ready.
          </p>
        </div>

        {/* Current Plan Badge */}
        {isProUser && (
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 to-teal-600 text-white px-4 py-2 rounded-full font-semibold">
              <Crown className="w-4 h-4" />
              {(isBetaUser || isAdmin) ? 'Full Access (Beta)' : 'NxtGrnd Pro Active'}
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <p className="text-gray-500 mt-2 text-sm">Get started with career guidance</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-400 font-semibold cursor-default"
            >
              {tier === 'free' ? 'Current Plan' : 'Free Tier'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-900 p-8 flex flex-col relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-900 to-teal-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">NxtGrnd Pro</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-gray-900">$15</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <p className="text-gray-500 mt-2 text-sm">Full access to all career tools</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {proFeatures.map((feature, i) => (
                <li key={i} className={`flex items-start gap-2 ${i === 0 ? 'font-semibold' : ''}`}>
                  <Check className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {isProUser ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full py-3 px-6 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </button>
            ) : (
              <div className="text-center text-sm text-gray-500">
                {/* Stripe Pricing Table handles checkout below */}
                <span>Select a plan below to get started</span>
              </div>
            )}
          </div>

          {/* B2B / Institutional */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Institutional</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">Custom</span>
              </div>
              <p className="text-gray-500 mt-2 text-sm">For universities, organizations & teams</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                'Everything in Pro',
                'Bulk user management',
                'Custom branding',
                'Analytics dashboard',
                'Dedicated support',
                'Custom integrations'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="mailto:contact@nxtgrnd.ai"
              className="w-full py-3 px-6 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Contact Sales
            </a>
          </div>
        </div>

        {/* Stripe Pricing Table (only show for non-pro users) */}
        {!isProUser && STRIPE_CONFIG.pricingTableId && STRIPE_CONFIG.publishableKey && (
          <div className="max-w-3xl mx-auto mb-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Select Your Plan
            </h3>
            <stripe-pricing-table
              pricing-table-id={STRIPE_CONFIG.pricingTableId}
              publishable-key={STRIPE_CONFIG.publishableKey}
              client-reference-id={user?.email || ''}
              customer-email={user?.email || ''}
            />
          </div>
        )}

        {/* FAQ / Info */}
        <div className="max-w-2xl mx-auto text-center text-gray-500 text-sm">
          <p className="mb-2">
            Cancel anytime. No long-term contracts. All plans include a 7-day free trial.
          </p>
          <p>
            Questions? Email us at{' '}
            <a href="mailto:support@nxtgrnd.ai" className="text-blue-900 hover:text-teal-600">
              support@nxtgrnd.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
