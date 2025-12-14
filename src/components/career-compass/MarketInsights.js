import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../config/api';
import { LoadingSpinner } from '../ui/AnimatedComponents';

const MarketInsights = ({ pathId, path }) => {
  console.log('MarketInsights: Rendering with pathId:', pathId, 'and path:', path);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('MarketInsights: Starting to fetch insights for pathId:', pathId);

    const fetchMarketInsights = async () => {
      setIsLoading(true);
      try {
        const payload = {
          httpMethod: 'POST',
          path: '/recommendations/generate',
          body: JSON.stringify({
            pathId,
            requestType: 'market_insights',
            includeProjections: true,
            location: 'United States',
            timeframe: '5years'
          })
        };

        console.log('MarketInsights: Sending request with payload:', payload);

        const response = await fetch(
          API_CONFIG.recommendations.generate(),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              httpMethod: 'POST',
              path: '/recommendations/generate',
              body: JSON.stringify({
                pathId,
                requestType: 'market_insights',
                includeProjections: true
              })
            })
          }
        );

        const data = await response.json();
        console.log('MarketInsights: Received raw data:', data);

        let parsedBody;
        try {
          parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
          console.log('MarketInsights: Parsed body:', parsedBody);
        } catch (parseError) {
          console.error('MarketInsights: Error parsing response body:', parseError);
          throw new Error('Invalid response format');
        }

        if (!parsedBody?.recommendations?.marketInsights) {
          console.warn('MarketInsights: No market insights found in response');
          throw new Error('No market insights available');
        }

        setInsights(parsedBody.recommendations.marketInsights);
      } catch (error) {
        console.error('Error fetching market insights:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (pathId) {
      fetchMarketInsights();
    }
  }, [pathId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load market insights at this time.</p>
        <p className="text-sm text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Demand Growth</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {insights.demandGrowth}%
            </span>
            <span className="text-sm text-gray-600">YoY</span>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Avg. Salary</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              ${insights.averageSalary.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Open Positions</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">
              {insights.openPositions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Top Required Skills</h4>
        <div className="flex flex-wrap gap-2">
          {insights.requiredSkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill.name} ({skill.demandPercentage}%)
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Industry Distribution</h4>
        <div className="space-y-3">
          {insights.industryDistribution.map((industry, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">{industry.name}</span>
                <span className="text-sm font-medium">{industry.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 rounded-full h-2"
                  style={{ width: `${industry.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
