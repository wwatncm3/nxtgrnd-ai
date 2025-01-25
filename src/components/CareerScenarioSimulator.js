import React, { useState } from 'react';
import { ChevronRight, Book, Award, Briefcase } from 'lucide-react';

const CareerScenarioSimulator = ({ selectedPath, user }) => {
  const [simulationResults, setSimulationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  // In CareerScenarioSimulator.js, update the runSimulation function:
const runSimulation = async (scenarioType) => {
  setIsLoading(true);
  try {
    const simulationPayload = {
      userId: user?.userID,
      careerPath: selectedPath.title,
      scenarioType,
      experienceLevel: user?.experienceLevel || 'entry',
      skills: selectedPath.requiredSkills || [],
      currentSalary: parseInt(selectedPath.salaryRange?.split('-')[0].replace(/\D/g, '')) || 50000,
      timeframe: '5years',
      includeDetails: true
    };

    console.log('Running simulation with payload:', simulationPayload);

    const response = await fetch(
      'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          httpMethod: 'POST',
          path: '/recommendations/generate',
          body: JSON.stringify({
            requestType: 'career_simulation',
            ...simulationPayload
          })
        })
      }
    );

    const data = await response.json();
    console.log('Raw response:', data);

    // Handle both string and object responses
    let parsedBody;
    try {
      parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      console.log('Parsed body:', parsedBody);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Invalid response format');
    }

    if (!parsedBody?.recommendations?.simulation) {
      throw new Error('No simulation data in response');
    }

    setSimulationResults(parsedBody.recommendations.simulation);
    setActiveScenario(scenarioType);

  } catch (error) {
    console.error('Simulation error:', error);
    // Add error handling UI if needed
  } finally {
    setIsLoading(false);
  }
};

  const renderSimulationResults = () => {
    if (!simulationResults) return null;

    return (
      <div className="mt-6 border-t pt-6">
        <h4 className="text-lg font-semibold mb-4">Simulation Results</h4>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Career Impact</h5>
            <p className="text-gray-700">{simulationResults.impact}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Projected Salary Increase</h5>
              <p className="text-2xl font-bold text-green-600">
                +{simulationResults.salaryIncrease}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Time Investment</h5>
              <p className="text-2xl font-bold text-purple-600">
                {simulationResults.timeInvestment}
              </p>
            </div>
          </div>

          {simulationResults.milestones && (
            <div className="bg-white border rounded-lg p-4">
              <h5 className="font-medium mb-3">Key Milestones</h5>
              <div className="space-y-3">
                {simulationResults.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {milestone.type === 'certification' ? (
                        <Award className="h-4 w-4 text-blue-600" />
                      ) : milestone.type === 'skill' ? (
                        <Book className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-gray-600">{milestone.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {simulationResults.recommendations && (
            <div className="bg-white border rounded-lg p-4">
              <h5 className="font-medium mb-3">Recommendations</h5>
              <ul className="space-y-2">
                {simulationResults.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Career Path Simulator</h3>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          Explore different scenarios and see how they could impact your career journey as a {selectedPath.title}.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Simulating career scenario...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => runSimulation('skill_acquisition')}
            className="w-full border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium mb-2">Skill Acquisition Impact</h4>
                <p className="text-sm text-gray-600">
                  Simulate your career trajectory with additional skills
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>

          <button
            onClick={() => runSimulation('certification')}
            className="w-full border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium mb-2">Certification ROI</h4>
                <p className="text-sm text-gray-600">
                  Calculate the impact of professional certifications
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>

          <button
            onClick={() => runSimulation('specialization')}
            className="w-full border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium mb-2">Career Path Comparison</h4>
                <p className="text-sm text-gray-600">
                  Compare different specialization options
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {renderSimulationResults()}
    </div>
  );
};

export default CareerScenarioSimulator;