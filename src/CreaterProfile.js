import React, { useState, useContext } from 'react';
import {
  UserCircle, Edit3, ArrowLeft, Target, Briefcase, Award,
  BookOpen, Mail, LinkedinIcon, Settings, ChevronRight, Star,
  TrendingUp, Clock, CheckCircle
} from 'lucide-react';
import { UserContext } from './App';

const CreatorProfile = ({ setStage }) => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Build profile data from user context
  const profile = {
    name: user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'Your Name',
    email: user?.email || '',
    avatar: user?.avatar || null,
    careerPath: user?.selectedCareerPath?.title || 'Career Explorer',
    experienceLevel: user?.experienceLevel || user?.careerStage || 'Getting Started',
    skills: user?.skills || user?.selectedCareerPath?.requiredSkills || [],
    interests: user?.interests || [],
    primaryGoal: user?.primaryGoal || 'Career Development',
    pathType: user?.pathType || 'career'
  };

  // Format experience level for display
  const formatExperienceLevel = (level) => {
    const levels = {
      'entry': 'Entry Level',
      'junior': 'Junior (0-2 years)',
      'mid': 'Mid-Level (2-5 years)',
      'senior': 'Senior (5+ years)',
      'executive': 'Executive/Leadership'
    };
    return levels[level?.toLowerCase()] || level || 'Getting Started';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setStage(5)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <button
            onClick={() => setStage(8)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Banner - Brand Colors */}
          <div className="h-32 bg-gradient-to-r from-blue-900 via-blue-800 to-teal-600"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
              {/* Avatar */}
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                    <UserCircle className="h-16 w-16 text-blue-400" />
                  </div>
                )}
              </div>

              {/* Name and Info */}
              <div className="flex-1 pt-4 sm:pt-0 sm:pb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-500">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Career Path</p>
                <p className="font-semibold text-gray-900 truncate">{profile.careerPath}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-semibold text-gray-900">{formatExperienceLevel(profile.experienceLevel)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Skills</p>
                <p className="font-semibold text-gray-900">{profile.skills.length} tracked</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Goal</p>
                <p className="font-semibold text-gray-900 truncate">{profile.primaryGoal}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex">
              {['overview', 'skills', 'interests'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Career Journey</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pursuing: {profile.careerPath}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          You're on a journey to become a {profile.careerPath}. Keep learning and growing!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setStage(9)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Learning Paths</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setStage(10)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Jobs & Projects</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setStage(11)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-teal-600" />
                        <span className="font-medium">Certifications</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setStage(6)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Resume Analysis</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Skills</h3>
                {profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No skills tracked yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Complete learning paths to add skills to your profile
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'interests' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Interests</h3>
                {profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No interests added yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Update your profile in settings to add interests
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
