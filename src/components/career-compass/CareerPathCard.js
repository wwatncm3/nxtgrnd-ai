import React from 'react';
import { GitBranch, CheckCircle } from 'lucide-react';

const CareerPathCard = ({ path, onSelect, isSelected, animationDelay = 0 }) => (
  <button
    onClick={() => onSelect(path)}
    className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ease-out
      animate-slide-up opacity-0 group
      ${isSelected
        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'
      }`}
    style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
  >
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-lg transition-all duration-300 ${
        isSelected ? 'bg-blue-500 scale-110' : 'bg-gray-100 group-hover:bg-blue-100'
      }`}>
        <GitBranch className={`h-6 w-6 transition-colors duration-300 ${
          isSelected ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
        }`} />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg mb-2">{path.title}</h3>
          {isSelected && (
            <CheckCircle className="h-6 w-6 text-blue-500 animate-scale-in" />
          )}
        </div>
        <p className="text-gray-600 mb-4">{path.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Salary Range</p>
            <p className="font-medium">{path.salaryRange || 'Contact for details'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Match Score</p>
            <div className="flex items-center gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-2.5 transition-all duration-700 ease-out progress-bar"
                  style={{ width: `${path.matchScore || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-blue-600 ml-2">{path.matchScore || 0}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {(path.requiredSkills || []).map((skill, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-200
                  ${isSelected
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </button>
);

export default CareerPathCard;
