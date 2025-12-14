import React, { useState, useContext } from 'react';
import {
  ChevronRight, BookOpen, Award, Briefcase, TrendingUp, Clock,
  DollarSign, Target, Zap, CheckCircle, ArrowUpRight, BarChart3,
  GraduationCap, Users, Lightbulb, RefreshCw
} from 'lucide-react';
import { UserContext } from '../App';
import API_CONFIG from '../config/api';
import { LoadingSpinner } from './ui/AnimatedComponents';

const CareerScenarioSimulator = ({ selectedPath, user, onClose }) => {
  const [simulationResults, setSimulationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [error, setError] = useState(null);

  const scenarios = [
    {
      id: 'skill_acquisition',
      title: 'Skill Acquisition Impact',
      description: 'See how learning new skills affects your career trajectory',
      icon: BookOpen,
      color: 'blue',
      question: 'What if I master 3 additional key skills?'
    },
    {
      id: 'certification',
      title: 'Certification ROI',
      description: 'Calculate the return on investment for certifications',
      icon: Award,
      color: 'purple',
      question: 'What if I earn an industry certification?'
    },
    {
      id: 'specialization',
      title: 'Specialization Path',
      description: 'Compare different career specialization options',
      icon: Target,
      color: 'green',
      question: 'What if I specialize in a niche area?'
    },
    {
      id: 'leadership',
      title: 'Leadership Track',
      description: 'Explore management and leadership opportunities',
      icon: Users,
      color: 'orange',
      question: 'What if I pursue a leadership role?'
    }
  ];

  const generateFallbackResults = (scenarioType) => {
    const careerTitle = selectedPath?.title || 'Professional';
    const baseSalary = parseInt(selectedPath?.salaryRange?.split('-')[0]?.replace(/\D/g, '')) || 60000;

    const fallbacks = {
      skill_acquisition: {
        impact: `Adding advanced skills in ${careerTitle} can significantly accelerate your career growth. Technical proficiency combined with soft skills creates a powerful combination that employers value highly.`,
        salaryIncrease: 18,
        timeInvestment: '6-12 months',
        marketDemand: 'High',
        competitionLevel: 'Medium',
        projectedSalary: Math.round(baseSalary * 1.18).toLocaleString(),
        milestones: [
          { type: 'skill', title: 'Complete Advanced Technical Training', timeline: '0-3 months', completed: false },
          { type: 'skill', title: 'Build Portfolio Projects', timeline: '3-6 months', completed: false },
          { type: 'certification', title: 'Earn Skill-Based Certification', timeline: '6-9 months', completed: false },
          { type: 'career', title: 'Apply for Senior Positions', timeline: '9-12 months', completed: false }
        ],
        recommendations: [
          'Focus on high-demand skills in your industry',
          'Combine technical skills with communication abilities',
          'Contribute to open-source or public projects',
          'Network with professionals who have the skills you want'
        ],
        riskLevel: 'Low',
        confidenceScore: 85
      },
      certification: {
        impact: `Professional certifications in ${careerTitle} provide credibility and demonstrate expertise to employers. Certified professionals often have access to better opportunities and higher starting salaries.`,
        salaryIncrease: 22,
        timeInvestment: '3-6 months',
        marketDemand: 'Very High',
        competitionLevel: 'Medium-High',
        projectedSalary: Math.round(baseSalary * 1.22).toLocaleString(),
        milestones: [
          { type: 'skill', title: 'Complete Prerequisite Learning', timeline: '0-1 month', completed: false },
          { type: 'certification', title: 'Enroll in Certification Program', timeline: '1-2 months', completed: false },
          { type: 'certification', title: 'Pass Certification Exam', timeline: '3-4 months', completed: false },
          { type: 'career', title: 'Update Resume & Apply', timeline: '4-6 months', completed: false }
        ],
        recommendations: [
          'Choose certifications recognized by industry leaders',
          'Join study groups for better preparation',
          'Practice with official exam simulations',
          'Maintain certification through continuing education'
        ],
        riskLevel: 'Low',
        confidenceScore: 90
      },
      specialization: {
        impact: `Specializing within ${careerTitle} positions you as an expert in a niche area. Specialists often command premium rates and have less competition for top positions.`,
        salaryIncrease: 28,
        timeInvestment: '12-18 months',
        marketDemand: 'High',
        competitionLevel: 'Low',
        projectedSalary: Math.round(baseSalary * 1.28).toLocaleString(),
        milestones: [
          { type: 'skill', title: 'Identify High-Value Specialization', timeline: '0-2 months', completed: false },
          { type: 'skill', title: 'Deep Dive into Specialty Area', timeline: '2-8 months', completed: false },
          { type: 'career', title: 'Build Specialized Portfolio', timeline: '8-12 months', completed: false },
          { type: 'career', title: 'Establish Thought Leadership', timeline: '12-18 months', completed: false }
        ],
        recommendations: [
          'Research emerging trends in your field',
          'Connect with current specialists for insights',
          'Create content showcasing your expertise',
          'Target companies that need your specific skills'
        ],
        riskLevel: 'Medium',
        confidenceScore: 78
      },
      leadership: {
        impact: `Transitioning to leadership in ${careerTitle} opens doors to management roles, higher compensation, and broader organizational impact. Leadership skills are transferable across industries.`,
        salaryIncrease: 35,
        timeInvestment: '18-24 months',
        marketDemand: 'High',
        competitionLevel: 'High',
        projectedSalary: Math.round(baseSalary * 1.35).toLocaleString(),
        milestones: [
          { type: 'skill', title: 'Develop Leadership Competencies', timeline: '0-6 months', completed: false },
          { type: 'skill', title: 'Lead Team Projects', timeline: '6-12 months', completed: false },
          { type: 'certification', title: 'Management Training/MBA', timeline: '12-18 months', completed: false },
          { type: 'career', title: 'Secure Leadership Position', timeline: '18-24 months', completed: false }
        ],
        recommendations: [
          'Volunteer for cross-functional team leadership',
          'Develop emotional intelligence and communication',
          'Seek mentorship from current leaders',
          'Build a track record of successful projects'
        ],
        riskLevel: 'Medium-High',
        confidenceScore: 72
      }
    };

    return fallbacks[scenarioType] || fallbacks.skill_acquisition;
  };

  const runSimulation = async (scenarioType) => {
    setIsLoading(true);
    setError(null);
    setActiveScenario(scenarioType);

    try {
      const simulationPayload = {
        userId: user?.userID,
        careerPath: selectedPath?.title,
        scenarioType,
        experienceLevel: user?.experienceLevel || 'entry',
        skills: selectedPath?.requiredSkills || [],
        currentSalary: parseInt(selectedPath?.salaryRange?.split('-')[0]?.replace(/\D/g, '')) || 50000,
        timeframe: '5years',
        includeDetails: true
      };

      const response = await fetch(
        API_CONFIG.recommendations.generate(),
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
      let parsedBody;

      try {
        parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response format');
      }

      if (parsedBody?.recommendations?.simulation) {
        setSimulationResults(parsedBody.recommendations.simulation);
      } else {
        // Use fallback data when API doesn't return expected format
        setSimulationResults(generateFallbackResults(scenarioType));
      }
    } catch (error) {
      console.error('Simulation error:', error);
      // Use fallback data on error
      setSimulationResults(generateFallbackResults(scenarioType));
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulation = () => {
    setSimulationResults(null);
    setActiveScenario(null);
    setError(null);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:bg-orange-100' }
    };
    return colors[color] || colors.blue;
  };

  const getMilestoneIcon = (type) => {
    switch (type) {
      case 'certification': return <Award className="h-4 w-4" />;
      case 'skill': return <BookOpen className="h-4 w-4" />;
      case 'career': return <Briefcase className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'medium-high': return 'text-orange-600 bg-orange-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Career Scenario Simulator</h2>
              <p className="text-blue-100 text-sm">{selectedPath?.title || 'Your Career'}</p>
            </div>
          </div>
          {simulationResults && (
            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              New Simulation
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {!simulationResults ? (
          <>
            {/* Intro */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-medium">Explore Your Future</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Select a scenario below to simulate how different career decisions could impact your trajectory, salary, and timeline.
                  </p>
                </div>
              </div>
            </div>

            {/* Scenario Cards */}
            {isLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="md" showDots />
                <p className="mt-6 text-gray-600 font-medium">Running simulation...</p>
                <p className="text-sm text-gray-500">Analyzing career trajectory</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {scenarios.map((scenario) => {
                  const colors = getColorClasses(scenario.color);
                  const Icon = scenario.icon;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => runSimulation(scenario.id)}
                      className={`text-left p-5 rounded-xl border-2 ${colors.border} ${colors.hover} transition-all group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {scenario.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                          <p className="text-xs text-gray-500 mt-2 italic">"{scenario.question}"</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Active Scenario Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {scenarios.find(s => s.id === activeScenario)?.title}
                </span>
                {simulationResults.confidenceScore && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {simulationResults.confidenceScore}% Confidence
                  </span>
                )}
              </div>
            </div>

            {/* Impact Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Career Impact Analysis
              </h3>
              <p className="text-gray-700 leading-relaxed">{simulationResults.impact}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">+{simulationResults.salaryIncrease}%</p>
                <p className="text-xs text-green-700">Salary Increase</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-600">{simulationResults.timeInvestment}</p>
                <p className="text-xs text-blue-700">Time Investment</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-purple-600">${simulationResults.projectedSalary}</p>
                <p className="text-xs text-purple-700">Projected Salary</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${getRiskColor(simulationResults.riskLevel)}`}>
                <Target className="h-6 w-6 mx-auto mb-2" />
                <p className="text-lg font-bold">{simulationResults.riskLevel}</p>
                <p className="text-xs">Risk Level</p>
              </div>
            </div>

            {/* Milestones Timeline */}
            {simulationResults.milestones && (
              <div className="bg-white border rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Roadmap Milestones
                </h3>
                <div className="space-y-4">
                  {simulationResults.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${milestone.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {milestone.completed ? <CheckCircle className="h-4 w-4" /> : getMilestoneIcon(milestone.type)}
                        </div>
                        {index < simulationResults.milestones.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={`font-medium ${milestone.completed ? 'text-green-700' : 'text-gray-900'}`}>
                          {milestone.title}
                        </p>
                        <p className="text-sm text-gray-500">{milestone.timeline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {simulationResults.recommendations && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-orange-600" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {simulationResults.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <ArrowUpRight className="h-4 w-4 text-orange-600 flex-shrink-0 mt-1" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Market Info */}
            {(simulationResults.marketDemand || simulationResults.competitionLevel) && (
              <div className="grid grid-cols-2 gap-4">
                {simulationResults.marketDemand && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Market Demand</p>
                    <p className="font-semibold text-gray-900">{simulationResults.marketDemand}</p>
                  </div>
                )}
                {simulationResults.competitionLevel && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Competition Level</p>
                    <p className="font-semibold text-gray-900">{simulationResults.competitionLevel}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerScenarioSimulator;
