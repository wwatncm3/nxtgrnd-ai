import React from 'react';
import { RotateCcw, User, RefreshCw, ChevronLeft } from 'lucide-react';

const RefreshOptionsBanner = ({ onUpdateSkills, onRefreshRecommendations, onDismiss }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RotateCcw className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Update Your Career Path</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Want to explore different options? You can update your skills, upload a new resume, or get fresh AI recommendations based on your current preferences.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onUpdateSkills}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="h-4 w-4" />
            Update Skills & Resume
          </button>
          <button
            onClick={onRefreshRecommendations}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Get Fresh Recommendations
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  </div>
);

export default RefreshOptionsBanner;
