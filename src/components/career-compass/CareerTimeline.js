import React, { useState, useEffect } from 'react';
import { Award, Briefcase, Clock } from 'lucide-react';
import API_CONFIG from '../../config/api';
import { LoadingSpinner } from '../ui/AnimatedComponents';

const CareerTimeline = ({ path, onMilestoneSelect }) => {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('CareerTimeline: Fetching milestones for path:', path);

    const fetchMilestones = async () => {
      setIsLoading(true);
      try {
        const payload = {
          httpMethod: 'POST',
          path: '/recommendations/generate',
          body: JSON.stringify({
            pathId: path.id,
            requestType: 'milestones',
            experienceLevel: path.experienceLevel,
            includeTimelines: true,
            pathType: path.type || 'career',
            skills: path.requiredSkills || []
          })
        };

        console.log('CareerTimeline: Sending milestone request with payload:', payload);

        const response = await fetch(
          API_CONFIG.recommendations.generate(),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              httpMethod: 'POST',
              path: '/recommendations/generate',
              body: JSON.stringify({
                pathId: path.id,
                requestType: 'milestones',
                experienceLevel: path.experienceLevel,
                includeTimelines: true
              })
            })
          }
        );

        const data = await response.json();
        const parsedBody = JSON.parse(data.body);
        setMilestones(parsedBody.recommendations?.milestones || []);
      } catch (error) {
        console.error('Error fetching milestones:', error);
        setMilestones([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (path?.id) {
      fetchMilestones();
    }
  }, [path.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div
          key={index}
          className="relative flex items-start mb-8 cursor-pointer group"
          onClick={() => onMilestoneSelect && onMilestoneSelect(milestone)}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              {milestone.type === 'skill' ? (
                <Award className="w-6 h-6 text-blue-600" />
              ) : (
                <Briefcase className="w-6 h-6 text-blue-600" />
              )}
            </div>
            {index < milestones.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-blue-200" />
            )}
          </div>
          <div className="ml-4 flex-grow">
            <h4 className="text-lg font-medium">{milestone.title}</h4>
            <p className="text-gray-600 mt-1">{milestone.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{milestone.timeline}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CareerTimeline;
