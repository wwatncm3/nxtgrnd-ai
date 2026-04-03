import React, { useState, useContext } from 'react';
import {
  signUp,
  confirmSignUp,
  resendSignUpCode
} from '@aws-amplify/auth';
import { User, Upload, BookOpen, Users, Rocket, Target, Briefcase, Compass, Shield, ArrowLeft, ArrowRight, Check, Eye, EyeOff, Monitor, Database, Cloud, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { UserContext } from '../App';
import { useLoginHandler } from './LoginHandler';
import { STORAGE_KEYS } from '../utils/authUtils';
import { storageService } from '../services/storageService';
import analytics from '../utils/analytics';

function OnboardingFlow({ onNext }) {
  const { setUser } = useContext(UserContext);
  const { handleLogin } = useLoginHandler();
  const [view, setView] = useState('landing');
  const [currentSection, setCurrentSection] = useState('account');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    avatar: null,
    pathType: '',
    careerStage: '',
    primaryGoal: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [verificationCode, setVerificationCode] = useState('');
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Smooth transition helper
  const handleViewTransition = (newView, newSection = null) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView(newView);
      if (newSection) setCurrentSection(newSection);
      setErrors({});
      setIsTransitioning(false);
    }, 150);
  };

  // Featured learning paths data
  const featuredPaths = [
    {
      Icon: Monitor,
      title: 'Software Engineering',
      description: 'From hackathons to Fortune 500 — build production-grade skills in React, Node.js, and system design that top recruiters look for at career fairs.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      Icon: Database,
      title: 'Data Science & Analytics',
      description: 'Turn research projects into industry credentials. Master Python, ML, and data storytelling for roles at top companies actively seeking diverse talent.',
      color: 'bg-teal-50 text-teal-600'
    },
    {
      Icon: Cloud,
      title: 'Cloud & Cybersecurity',
      description: 'Earn AWS, Azure, and security certifications that open doors. Join the growing network of graduates leading enterprise cloud strategy.',
      color: 'bg-cyan-50 text-cyan-600'
    }
  ];

  // Enhanced Landing Page with modern gradient design
  const renderLandingPage = () => (
    <div className={`transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
      {/* Full page gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100 -z-10"></div>

      <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-slideDown">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-teal-600 to-blue-900">NxtGrnd AI</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl animate-slideUp delay-100">
            AI-powered career development for the next generation of leaders
          </p>
          <p className="text-gray-500 text-sm md:text-base mt-3 max-w-2xl mx-auto animate-slideUp delay-150">
            Discover career paths that match your skills, connect with real opportunities, and build your future — born at NC A&T, built for every student ready to level up.
          </p>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="relative mb-10 animate-slideUp delay-200 max-w-full overflow-hidden px-4">
          <div className="bg-gradient-to-r from-teal-100 via-blue-50 to-teal-100 rounded-2xl p-4 shadow-xl max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-100 rounded-md px-4 py-1 text-xs text-gray-500">
                    AI-powered career dashboard
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Mini chart representations */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2">Career Progress</div>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 60, 45, 80, 65, 90, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{height: `${h}%`}}></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2">Skills Match</div>
                    <div className="relative w-20 h-20 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle cx="40" cy="40" r="35" stroke="#14b8a6" strokeWidth="8" fill="none"
                          strokeDasharray="220" strokeDashoffset="55" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-teal-600">75%</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2">Opportunities</div>
                    <div className="space-y-2 mt-2">
                      <div className="h-2 bg-green-300 rounded-full w-full"></div>
                      <div className="h-2 bg-green-400 rounded-full w-4/5"></div>
                      <div className="h-2 bg-green-500 rounded-full w-3/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating elements */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-3 animate-bounce-slow hidden md:block">
            <Compass className="w-8 h-8 text-blue-500" />
          </div>
          <div className="absolute -right-4 top-1/4 bg-white rounded-xl shadow-lg p-3 animate-bounce-slow delay-500 hidden md:block">
            <Target className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-12 animate-slideUp delay-300">
          <button
            onClick={() => handleViewTransition('signup')}
            className="group flex-1 py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl
                     hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2 text-lg font-semibold
                     transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl
                     active:scale-[0.98] shadow-lg"
          >
            <span className="flex items-center justify-center">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button
            onClick={() => handleViewTransition('login')}
            className="flex-1 py-4 px-8 bg-white border-2 border-gray-200 text-gray-700
                     rounded-xl hover:border-blue-300 hover:bg-gray-50 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2 text-lg font-semibold
                     transform transition-all duration-200 hover:scale-[1.02]
                     active:scale-[0.98] shadow-md"
          >
            Sign In
          </button>
        </div>

        {/* Stats Section with Icons */}
        <div className="flex justify-center items-center gap-6 md:gap-12 mb-12 animate-slideUp delay-400">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">2000+</div>
              <div className="text-sm text-gray-500">Professionals</div>
            </div>
          </div>
          <div className="h-12 w-px bg-gray-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Compass className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-600">100+</div>
              <div className="text-sm text-gray-500">Career Paths</div>
            </div>
          </div>
          <div className="h-12 w-px bg-gray-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Featured Learning Paths */}
        <div className="animate-slideUp delay-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Learning Paths</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPaths.map((path, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100"
                onClick={() => handleViewTransition('signup')}
              >
                <div className={`w-14 h-14 ${path.color} rounded-xl flex items-center justify-center mb-4`}>
                  <path.Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{path.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{path.description}</p>
                <button className="text-blue-600 font-semibold text-sm flex items-center hover:text-blue-700 transition-colors">
                  Start Learning
                  <ArrowRight className="ml-1 w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Login Section
  const renderLoginSection = () => (
    <div className={`transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100 -z-10"></div>

      <div className="space-y-6 animate-fadeIn max-w-md mx-auto">
        <div className="text-center mb-8 animate-slideDown">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-900 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue your career journey</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleLoginSubmit} className="space-y-5 animate-slideUp delay-100">
            {/* Email Field with floating label effect */}
            <div className="relative">
              <input
                type="email"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-14 px-4 pt-6 pb-2 bg-gray-50 border-2 border-gray-200 rounded-xl
                         focus:border-teal-500 focus:bg-white transition-all duration-200
                         placeholder-transparent"
                placeholder="Email"
                id="email"
                autoComplete="off"
              />
              <label
                htmlFor="email"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'email' || loginData.username
                    ? 'top-2 text-xs text-teal-600 font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
              >
                Email Address
              </label>
            </div>

            {/* Password Field with show/hide toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-14 px-4 pt-6 pb-2 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl
                         focus:border-teal-500 focus:bg-white transition-all duration-200
                         placeholder-transparent"
                placeholder="Password"
                id="password"
                autoComplete="new-password"
              />
              <label
                htmlFor="password"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'password' || loginData.password
                    ? 'top-2 text-xs text-teal-600 font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {errors.login && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <p className="text-red-600 text-sm flex items-center">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">!</span>
                  </span>
                  {errors.login}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="group w-full h-14 bg-gradient-to-r from-blue-900 to-teal-600 text-white rounded-xl
                       hover:from-blue-800 hover:to-teal-500 focus:outline-none focus:ring-2
                       focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50
                       transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100
                       relative overflow-hidden font-semibold text-lg"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoggingIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="flex justify-center items-center space-x-6 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => handleViewTransition('landing')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <button
              onClick={() => handleViewTransition('signup')}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Account Section with better form styling
  const renderAccountSection = () => (
    <div className={`transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100 -z-10"></div>

      <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
        <div className="text-center mb-6 animate-slideDown">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-900 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Set up your NxtGrnd AI profile to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {errors.accountStep && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 animate-shake">
              <p className="text-red-600 text-sm flex items-center">
                <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
                {errors.accountStep}
              </p>
            </div>
          )}

          {/* Enhanced Avatar Upload */}
          <div className="flex justify-center mb-6 animate-slideUp delay-100">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-900 to-teal-600 rounded-xl p-2.5 cursor-pointer
                             hover:from-blue-800 hover:to-teal-500 transition-all duration-200 shadow-lg
                             transform hover:scale-110 active:scale-95">
                <Upload className="w-4 h-4 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          {/* Enhanced Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-slideUp delay-200">
            {/* First Name */}
            <div className="relative">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleSelectionCard('firstName', e.target.value)}
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-14 px-4 pt-6 pb-2 bg-gray-50 border-2 border-gray-200 rounded-xl
                         focus:border-teal-500 focus:bg-white transition-all duration-200
                         placeholder-transparent"
                placeholder="First Name"
                id="firstName"
                autoComplete="off"
              />
              <label
                htmlFor="firstName"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'firstName' || formData.firstName
                    ? 'top-2 text-xs text-teal-600 font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
              >
                First Name *
              </label>
              {errors.firstName && (
                <p className="text-red-600 text-xs mt-1 animate-slideIn">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="relative">
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleSelectionCard('lastName', e.target.value)}
                onFocus={() => setFocusedField('lastName')}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-14 px-4 pt-6 pb-2 bg-gray-50 border-2 border-gray-200 rounded-xl
                         focus:border-teal-500 focus:bg-white transition-all duration-200
                         placeholder-transparent"
                placeholder="Last Name"
                id="lastName"
                autoComplete="off"
              />
              <label
                htmlFor="lastName"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'lastName' || formData.lastName
                    ? 'top-2 text-xs text-teal-600 font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
              >
                Last Name *
              </label>
              {errors.lastName && (
                <p className="text-red-600 text-xs mt-1 animate-slideIn">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleSelectionCard('email', e.target.value)}
                onFocus={() => setFocusedField('formEmail')}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-14 px-4 pt-6 pb-2 bg-gray-50 border-2 border-gray-200 rounded-xl
                         focus:border-teal-500 focus:bg-white transition-all duration-200
                         placeholder-transparent"
                placeholder="Email"
                id="formEmail"
                autoComplete="off"
              />
              <label
                htmlFor="formEmail"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'formEmail' || formData.email
                    ? 'top-2 text-xs text-teal-600 font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
              >
                Email Address *
              </label>
              {errors.email && (
                <p className="text-red-600 text-xs mt-1 animate-slideIn">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleSelectionCard('username', e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-14 px-4 pt-6 pb-2 bg-gray-50 border-2 border-gray-200 rounded-xl
                         focus:border-teal-500 focus:bg-white transition-all duration-200
                         placeholder-transparent"
                placeholder="Username"
                id="username"
                autoComplete="off"
              />
              <label
                htmlFor="username"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'username' || formData.username
                    ? 'top-2 text-xs text-teal-600 font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
              >
                Username *
              </label>
              {errors.username && (
                <p className="text-red-600 text-xs mt-1 animate-slideIn">{errors.username}</p>
              )}
            </div>

            {/* Enhanced Password Field */}
            <div className="md:col-span-2 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleSelectionCard('password', e.target.value)}
                onFocus={() => setFocusedField('formPassword')}
                onBlur={() => setFocusedField(null)}
                className={`peer w-full h-14 px-4 pt-6 pb-2 pr-12 bg-gray-50 border-2 rounded-xl
                         focus:bg-white transition-all duration-200 placeholder-transparent ${
                           formData.password && isValidPassword(formData.password)
                             ? 'border-green-300 focus:border-green-500 bg-green-50'
                             : formData.password && formData.password.length > 0
                             ? 'border-orange-300 focus:border-orange-500'
                             : 'border-gray-200 focus:border-teal-500'
                         }`}
                placeholder="Password"
                id="formPassword"
              />
              <label
                htmlFor="formPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${focusedField === 'formPassword' || formData.password
                    ? 'top-2 text-xs font-medium'
                    : 'top-1/2 -translate-y-1/2 text-gray-500'}
                  ${formData.password && isValidPassword(formData.password)
                    ? 'text-green-600'
                    : focusedField === 'formPassword' || formData.password
                    ? 'text-teal-600'
                    : 'text-gray-500'}`}
              >
                Password *
              </label>

              {/* Password visibility toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>

              {/* Success checkmark */}
              {formData.password && isValidPassword(formData.password) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-bounceIn">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Enhanced Password Requirements */}
              {formData.password && formData.password.length > 0 && (
                <PasswordRequirements password={formData.password} />
              )}

              {(!formData.password || formData.password.length === 0) && (
                <p className="text-xs text-gray-500 mt-2">
                  Must contain at least 8 characters, uppercase letter, number, and special character
                </p>
              )}

              {errors.password && (
                <p className="text-red-600 text-xs mt-1 animate-slideIn">{errors.password}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Rest of your existing functions with some enhancements...
  const isValidPassword = (password) => {
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPolicy.test(password);
  };

  // Enhanced Password Requirements Component
  function PasswordRequirements({ password }) {
    const requirements = [
      { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
      { id: 'lowercase', label: 'One lowercase letter (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
      { id: 'uppercase', label: 'One uppercase letter (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
      { id: 'number', label: 'One number (0-9)', test: (pwd) => /\d/.test(pwd) },
      { id: 'special', label: 'One special character (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) }
    ];

    const isPasswordValid = password ? isValidPassword(password) : false;
    const validCount = requirements.filter(req => req.test(password || '')).length;

    return (
      <div className="mt-3 p-4 bg-gray-50 rounded-lg border animate-slideIn">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
          {isPasswordValid && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium animate-bounceIn">
              Valid
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          {requirements.map((req, index) => {
            const isValid = password ? req.test(password) : false;
            return (
              <div
                key={req.id}
                className={`flex items-center text-sm transition-all duration-300 animate-slideIn`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`mr-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isValid 
                    ? 'bg-green-100 text-green-600 scale-110' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isValid ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <span className={`transition-all duration-300 ${
                  isValid ? 'text-green-600 line-through' : 'text-gray-600'
                }`}>
                  {req.label}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Status:</span>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isPasswordValid 
                ? 'text-green-600' 
                : validCount === 0 
                ? 'text-gray-400' 
                : 'text-orange-600'
            }`}>
              {isPasswordValid
                ? 'Meets all requirements'
                : validCount === 0
                ? 'Enter password' 
                : `${validCount}/5 requirements met`
              }
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                isPasswordValid ? 'bg-green-500' : validCount > 0 ? 'bg-orange-400' : 'bg-gray-300'
              }`}
              style={{ width: `${(validCount / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Options with enhanced styling
  const navigationOptions = {
    pathTypes: [
      {
        id: 'explorer',
        label: 'Career Explorer', 
        description: 'Discover new paths and opportunities in different fields',
        icon: Compass,
        gradient: 'from-blue-500 to-cyan-500'
      },
      {
        id: 'accelerator',
        label: 'Career Accelerator',
        description: 'Advance faster in your current career path',
        icon: Rocket,
        gradient: 'from-teal-500 to-cyan-500'
      },
      {
        id: 'transformer',
        label: 'Career Transformer',
        description: 'Make a strategic shift to a new industry or role',
        icon: Target,
        gradient: 'from-green-500 to-emerald-500'
      }
    ],
    careerStages: [
      {
        id: 'student',
        label: 'Student/Recent Graduate',
        description: 'Building foundation for career launch',
        icon: BookOpen,
        gradient: 'from-indigo-500 to-blue-500'
      },
      {
        id: 'earlyCareer',
        label: 'Early Career Professional',
        description: '1-5 years of work experience',
        icon: Briefcase,
        gradient: 'from-orange-500 to-red-500'
      },
      {
        id: 'midCareer',
        label: 'Mid-Career Professional',
        description: '5+ years of experience',
        icon: Shield,
        gradient: 'from-gray-600 to-gray-800'
      }
    ],
    primaryGoals: [
      {
        id: 'mentorship',
        label: 'Get Mentored',
        description: 'Connect with experienced professionals who can guide your growth',
        icon: Users,
        gradient: 'from-teal-500 to-cyan-500'
      },
      {
        id: 'learning',
        label: 'Skill Development',
        description: 'Access curated learning paths and creator content',
        icon: BookOpen,
        gradient: 'from-blue-900 to-blue-700'
      },
      {
        id: 'opportunities',
        label: 'Find Opportunities',
        description: 'Discover jobs and projects aligned with your goals',
        icon: Target,
        gradient: 'from-rose-500 to-pink-500'
      }
    ]
  };

  // Enhanced Selection Card Component
  function SelectionCard({ option, field, selected }) {
    const Icon = option.icon;
    const isSelected = selected === option.id;
    
    return (
      <button
        onClick={() => handleSelectionCard(field, option.id)}
        className={`group w-full p-6 border-2 rounded-xl text-left transition-all duration-300 relative overflow-hidden
          transform hover:scale-[1.02] active:scale-[0.98] ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-lg' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Background gradient for selected state */}
        {isSelected && (
          <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-5`}></div>
        )}
        
        <div className="relative z-10">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 transition-all duration-300 ${
            isSelected 
              ? `bg-gradient-to-br ${option.gradient} text-white shadow-lg` 
              : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <h3 className={`font-semibold text-lg mb-2 transition-colors duration-300 ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {option.label}
          </h3>
          
          <p className={`text-sm transition-colors duration-300 ${
            isSelected ? 'text-blue-700' : 'text-gray-600'
          }`}>
            {option.description}
          </p>
          
          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounceIn">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </button>
    );
  }

  // Enhanced Compass Section
  const renderCompassSection = () => (
    <div className={`transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
      <div className="space-y-8 animate-fadeIn">
        <div className="text-center mb-8 animate-slideDown">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-50 to-teal-50 rounded-full mb-4">
            <Compass className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Start Your Journey</h2>
          <p className="text-gray-600">Tell us about your goals to power your AI Career Compass™</p>
        </div>

        {errors.compassStep && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 animate-shake">
            <p className="text-red-600 text-sm flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">!</span>
              </span>
              {errors.compassStep}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Path Type Selection */}
          <div className="space-y-6 animate-slideUp delay-100">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose your path type</h3>
              <p className="text-gray-600 text-sm">What kind of career journey are you on?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {navigationOptions.pathTypes.map((option, index) => (
                <div 
                  key={option.id} 
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SelectionCard
                    option={option}
                    field="pathType"
                    selected={formData.pathType}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Career Stage Selection */}
          <div className="space-y-6 animate-slideUp delay-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Where are you in your journey?</h3>
              <p className="text-gray-600 text-sm">Help us understand your current experience level</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {navigationOptions.careerStages.map((option, index) => (
                <div 
                  key={option.id} 
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SelectionCard
                    option={option}
                    field="careerStage"
                    selected={formData.careerStage}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Primary Goal Selection */}
          <div className="space-y-6 animate-slideUp delay-300">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">What's your primary goal?</h3>
              <p className="text-gray-600 text-sm">What do you want to achieve first?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {navigationOptions.primaryGoals.map((option, index) => (
                <div 
                  key={option.id} 
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SelectionCard
                    option={option}
                    field="primaryGoal"
                    selected={formData.primaryGoal}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Verification Section
  const renderVerificationSection = () => (
    <div className={`transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 -z-10"></div>

      <div className="space-y-6 animate-fadeIn max-w-md mx-auto">
        <div className="text-center mb-6 animate-slideDown">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600 mb-2">
            We've sent a verification code to <strong className="text-teal-600">{unverifiedUser?.username}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Check your email inbox and spam folder for the verification code
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleVerification} className="space-y-6 animate-slideUp delay-100">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Verification Code (6 digits)
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full h-16 text-center text-2xl tracking-[0.5em] font-mono bg-gray-50 border-2 border-gray-200
                         rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200
                         placeholder-gray-300"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <div className="flex justify-center mt-2">
                <div className="flex space-x-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-1 rounded-full transition-all duration-200 ${
                        i < verificationCode.length
                          ? 'bg-blue-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {errors.verification && (
              <div className={`p-4 border rounded-lg animate-slideIn ${
                errors.verification.toLowerCase().includes('success') || errors.verification.toLowerCase().includes('verified')
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <p className="text-sm flex items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                    errors.verification.toLowerCase().includes('success') || errors.verification.toLowerCase().includes('verified')
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}>
                    {errors.verification.toLowerCase().includes('success') || errors.verification.toLowerCase().includes('verified') ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-white" />
                    )}
                  </span>
                  {errors.verification}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={verificationCode.length !== 6}
              className={`group w-full h-14 rounded-xl focus:outline-none focus:ring-2
                         focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-lg ${
                verificationCode.length === 6
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-[1.02] shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center justify-center">
                Verify Email
                {verificationCode.length === 6 && (
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                )}
              </span>
            </button>

            <div className="text-center space-y-4 animate-slideUp delay-200">
              <button
                type="button"
                onClick={handleResendCode}
                className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium
                         transition-colors duration-200 hover:underline"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Resend verification code
              </button>
              <p className="text-xs text-gray-500">
                Didn't receive the code? Check your spam folder or try resending
              </p>
            </div>
          </form>

          <div className="flex justify-center items-center space-x-6 pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => handleViewTransition('login', 'account')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <button
              onClick={() => handleViewTransition('signup', 'account')}
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors font-medium"
            >
              Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Bottom Navigation
  const renderBottomNavigation = () => {
    if (view !== 'signup') return null;
    
    return (
      <div className="flex justify-between items-center mt-8 pt-6 border-t animate-slideUp delay-400">
        {/* Back Button Logic */}
        <div>
          {currentSection === 'verify' && (
            <button
              onClick={() => handleViewTransition('signup', 'account')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-all duration-200 
                       hover:bg-gray-50 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Account
            </button>
          )}
          {currentSection === 'compass' && (
            <button
              onClick={() => handleViewTransition('signup', 'verify')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-all duration-200 
                       hover:bg-gray-50 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          )}
          {currentSection === 'account' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleViewTransition('landing')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-all duration-200
                         hover:bg-gray-50 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleViewTransition('login')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              >
                Already have an account? Sign In
              </button>
            </div>
          )}
        </div>

        {/* Next/Submit Button Logic */}
        <div>
          {currentSection === 'account' && (
            <div className="flex flex-col items-end">
              <button
                onClick={handleNext}
                disabled={
                  !formData.firstName || 
                  !formData.lastName || 
                  !formData.email || 
                  !formData.username || 
                  !formData.password ||
                  !isValidPassword(formData.password)
                }
                className={`group flex items-center px-6 py-3 rounded-lg transition-all duration-200 font-semibold ${
                  (!formData.firstName || 
                   !formData.lastName || 
                   !formData.email || 
                   !formData.username || 
                   !formData.password ||
                   !isValidPassword(formData.password))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] shadow-lg'
                }`}
              >
                Create Account
                {(formData.firstName && formData.lastName && formData.email && formData.username && formData.password && isValidPassword(formData.password)) && (
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                )}
              </button>
              
              {formData.password && 
               formData.password.length > 0 && 
               !isValidPassword(formData.password) && (
                <p className="text-xs text-orange-600 mt-2 text-right animate-slideIn">
                  Complete password requirements to continue
                </p>
              )}
            </div>
          )}
          {currentSection === 'compass' && (
            <button
              onClick={handleNext}
              disabled={!formData.pathType || !formData.careerStage || !formData.primaryGoal}
              className={`group flex items-center px-6 py-3 rounded-lg transition-all duration-200 font-semibold ${
                (!formData.pathType || !formData.careerStage || !formData.primaryGoal)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transform hover:scale-[1.02] shadow-lg'
              }`}
            >
              Complete Setup
              {(formData.pathType && formData.careerStage && formData.primaryGoal) && (
                <Check className="ml-2 w-5 h-5 transition-transform group-hover:scale-110" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Your existing handler functions with minor enhancements...
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await handleLogin(
        loginData, 
        setUser, 
        onNext, 
        setErrors, 
        setIsLoggingIn,
        setView,
        setCurrentSection,
        setUnverifiedUser
      );
       analytics.trackEvent('user_login', { 
        method: 'email',
        username: loginData.username 
      });
    } catch (error) {
      console.error('Login submission error:', error);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onload = (evt) => setAvatarPreview(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectionCard = (field, value) => {
    if (field === 'interests' || field === 'skills') {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field] ? [...prev[field], value] : [value],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors(prev => ({
        ...prev,
        verification: 'Please enter a valid 6-digit verification code'
      }));
      return;
    }

    try {
      console.log('CONFIG: Verifying email for:', unverifiedUser.username);
      
      await confirmSignUp({
        username: unverifiedUser.username,
        confirmationCode: verificationCode
      });
      
      console.log('Email verification successful');

      setErrors(prev => ({ ...prev, verification: '' }));

      setErrors(prev => ({
        ...prev,
        verification: 'Email verified successfully! You can now log in.'
      }));
      
      setLoginData({
        username: unverifiedUser.username,
        password: unverifiedUser.password || ''
      });
      
      setTimeout(() => {
        handleViewTransition('login', 'account');
      }, 2000);
      
    } catch (error) {
      console.error('ERROR: Verification error:', error);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (error.code === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code. Please check the code and try again.';
      } else if (error.code === 'ExpiredCodeException') {
        errorMessage = 'Verification code has expired. Please request a new code.';
      } else if (error.code === 'LimitExceededException') {
        errorMessage = 'Too many attempts. Please wait before trying again.';
      }
      
      setErrors(prev => ({
        ...prev,
        verification: errorMessage
      }));
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({
        username: unverifiedUser.username
      });
      setErrors(prev => ({
        ...prev,
        verification: 'Verification code has been resent to your email'
      }));
    } catch (error) {
      console.error('Error resending code:', error);
      setErrors(prev => ({
        ...prev,
        verification: 'Error resending verification code'
      }));
    }
  };

  const validateAccountStep = () => {
    const newErrors = {};
    let valid = true;
  
    const requiredFields = ['firstName', 'lastName', 'email', 'username', 'password'];
  
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
        valid = false;
      }
    });
  
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      valid = false;
    }
  
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const validateCompassStep = async () => {
    const newErrors = {};
    let valid = true;
  
    if (!formData.pathType) {
      newErrors.pathType = 'Please select a path type';
      valid = false;
    }
    if (!formData.careerStage) {
      newErrors.careerStage = 'Please select your career stage';
      valid = false;
    }
    if (!formData.primaryGoal) {
      newErrors.primaryGoal = 'Please select your primary goal';
      valid = false;
    }
  
    setErrors((prev) => ({ ...prev, ...newErrors }));
  
    if (valid) {
      try {
        const payload = {
          httpMethod: 'POST',
          path: '/recommendations',
          body: JSON.stringify({
            RecommendationID: `rec-${formData.username}`,
            UserID: formData.email,
            CareerPath: formData.pathType,
            Steps: [
              { StepNumber: 1, Title: 'Define Goals' },
              { StepNumber: 2, Title: 'Explore Resources' },
              { StepNumber: 3, Title: 'Track Progress' },
            ],
          }),
        };
  
        const response = await fetch('https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) throw new Error('Error saving preferences');
        const result = await response.json();
        console.log('Preferences saved successfully:', result);
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    }
  
    return valid;
  };

  const handleNext = async () => {
    if (currentSection === 'account') {
      if (validateAccountStep()) {
        if (!isValidPassword(formData.password)) {
          setErrors(prev => ({ 
            ...prev, 
            accountStep: 'Password must contain at least 8 characters, an uppercase letter, a number and a special character'
          }));
          return;
        }
        try {
          const userAttributes = {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
            preferred_username: formData.username
          };
  
          await signUp({
            username: formData.email, 
            password: formData.password,
            options: {
              userAttributes,
              authenticationFlowType: 'USER_SRP_AUTH'
            }
          });
  
          console.log('Cognito signup successful');
          analytics.trackUserSignup('email');
  
          setUnverifiedUser({
            username: formData.email,
            password: formData.password
          });
  
          handleViewTransition('signup', 'verify');
  
        } catch (error) {
          console.error('Error creating user:', error);
          let errorMessage = 'Failed to create user. Please try again.';
  
          if (error.code === 'UsernameExistsException') {
            errorMessage = 'An account with this email already exists.';
          } else if (error.code === 'InvalidPasswordException') {
            errorMessage = 'Password does not meet requirements. Please use a stronger password.';
          } else if (error.code === 'InvalidParameterException') {
            errorMessage = 'Please check your input and try again.';
          }
  
          setErrors(prev => ({ ...prev, accountStep: errorMessage }));
        }
      }
    } else if (currentSection === 'compass') {
      if (await validateCompassStep()) {
        try {
          const pathPreferences = {
            pathType: formData.pathType,
            careerStage: formData.careerStage,
            primaryGoal: formData.primaryGoal,
            avatar: avatarPreview // Include avatar in preferences so it's persisted
          };

          console.log('🖼️ Saving pathPreferences with avatar:', pathPreferences.avatar ? 'PRESENT' : 'MISSING');

          // Save to localStorage AND sync to DynamoDB
          storageService.setItem(STORAGE_KEYS.USER_PREFERENCES, pathPreferences);

          setUser(prevUser => {
            const updatedUser = {
              ...prevUser,
              ...pathPreferences
            };
            console.log('🖼️ Updated user context with avatar:', updatedUser.avatar ? 'PRESENT' : 'MISSING');
            return updatedUser;
          });

          onNext({
            ...formData,
            avatar: avatarPreview
          });
        } catch (error) {
          console.error('Error saving preferences:', error);
          setErrors(prev => ({ 
            ...prev, 
            compassStep: 'Failed to save preferences. Please try again.'
          }));
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8">
            {/* Progress indicator for signup flow */}
            {view === 'signup' && (
              <div className="mb-8 animate-slideDown">
                <div className="flex items-center justify-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                    currentSection === 'account' ? 'bg-blue-500 text-white' : 
                    currentSection === 'verify' || currentSection === 'compass' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentSection === 'verify' || currentSection === 'compass' ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <div className={`h-1 w-16 rounded transition-all duration-300 ${
                    currentSection === 'verify' || currentSection === 'compass' ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                    currentSection === 'verify' ? 'bg-blue-500 text-white' : 
                    currentSection === 'compass' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentSection === 'compass' ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <div className={`h-1 w-16 rounded transition-all duration-300 ${
                    currentSection === 'compass' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                    currentSection === 'compass' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                </div>
                <div className="flex justify-center space-x-8 mt-4">
                  <span className="text-xs text-gray-600">Account</span>
                  <span className="text-xs text-gray-600">Verify</span>
                  <span className="text-xs text-gray-600">Goals</span>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="relative">
              {view === 'landing' && renderLandingPage()}
              {view === 'login' && renderLoginSection()}
              {view === 'signup' && currentSection === 'account' && renderAccountSection()}
              {view === 'signup' && currentSection === 'verify' && renderVerificationSection()}
              {view === 'signup' && currentSection === 'compass' && renderCompassSection()}
            </div>

            {/* Bottom Navigation */}
            {renderBottomNavigation()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;