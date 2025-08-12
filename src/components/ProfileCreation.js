import React, { useState, useContext } from 'react';
import { 
  signUp, 
  confirmSignUp, 
  fetchUserAttributes,
  updateUserAttributes,
  resendSignUpCode,
  getCurrentUser 
} from '@aws-amplify/auth';
import { User, Upload, BookOpen, Users, Rocket, Target, Briefcase, Compass, Shield } from 'lucide-react';
import CareerInterests from './InterestSelection'; // Add this back if needed
import { UserContext } from '../App';
import { useLoginHandler } from './LoginHandler';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';


function OnboardingFlow({ onNext }) {
  const { user, setUser } = useContext(UserContext);
  const { handleLogin } = useLoginHandler();
  const [view, setView] = useState('landing'); // 'landing', 'login', or 'signup'
  const [currentSection, setCurrentSection] = useState('account');
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
  // New Landing Page Component
  const renderLandingPage = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-6">
          <Compass className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to CareerDay</h2>
        <p className="text-gray-600 text-lg mb-8">Your AI-powered career development platform</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setView('signup')}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2 text-lg"
        >
          Get Started
        </button>
        
        <button
          onClick={() => setView('login')}
          className="w-full py-3 px-4 border-2 border-blue-600 text-blue-600 
                   rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2 text-lg"
        >
          Sign In
        </button>
      </div>

      <p className="text-center text-gray-500 mt-6">
        Join thousands of professionals advancing their careers
      </p>
    </div>
  );

  // Navigation options for AI Career Compass
  const navigationOptions = {
    pathTypes: [
      {
        id: 'explorer',
        label: 'Career Explorer', 
        description: 'Discover new paths and opportunities in different fields',
        icon: Compass
      },
      {
        id: 'accelerator',
        label: 'Career Accelerator',
        description: 'Advance faster in your current career path',
        icon: Rocket
      },
      {
        id: 'transformer',
        label: 'Career Transformer',
        description: 'Make a strategic shift to a new industry or role',
        icon: Target
      }
    ],
    careerStages: [
      {
        id: 'student',
        label: 'Student/Recent Graduate',
        description: 'Building foundation for career launch',
        icon: BookOpen
      },
      {
        id: 'earlyCareer',
        label: 'Early Career Professional',
        description: '1-5 years of work experience',
        icon: Briefcase
      },
      {
        id: 'midCareer',
        label: 'Mid-Career Professional',
        description: '5+ years of experience',
        icon: Shield
      }
    ],
    primaryGoals: [
      {
        id: 'mentorship',
        label: 'Get Mentored',
        description: 'Connect with experienced professionals who can guide your growth',
        icon: Users
      },
      {
        id: 'learning',
        label: 'Skill Development',
        description: 'Access curated learning paths and creator content',
        icon: BookOpen
      },
      {
        id: 'opportunities',
        label: 'Find Opportunities',
        description: 'Discover jobs and projects aligned with your goals',
        icon: Target
      }
    ]
  };

 // Updated handleLogin function using Cognito
 const handleLoginSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await handleLogin(
      loginData, 
      setUser, 
      onNext, 
      setErrors, 
      setIsLoggingIn,
      setView,              // Pass setView for navigation
      setCurrentSection,    // Pass setCurrentSection for navigation
      setUnverifiedUser     // Pass setUnverifiedUser for verification flow
    );
     analytics.trackEvent('user_login', { 
      method: 'email',
      username: loginData.username 
    });
  } catch (error) {
    console.error('Login submission error:', error);
    // Error is already handled in handleLogin
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

  function SelectionCard({ option, field, selected }) {
    const Icon = option.icon;
    return (
      <button
        onClick={() => handleSelectionCard(field, option.id)}
        className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
          selected === option.id 
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Icon 
          className={`w-8 h-8 mb-3 ${
            selected === option.id ? 'text-blue-500' : 'text-gray-400'
          }`} 
        />
        <h3 className="font-semibold text-lg mb-2">{option.label}</h3>
        <p className="text-gray-600 text-sm">{option.description}</p>
      </button>
    );
  
    
  }
  function PasswordRequirements({ password }) {
    const requirements = [
      {
        id: 'length',
        label: 'At least 8 characters',
        test: (pwd) => pwd.length >= 8
      },
      {
        id: 'lowercase',
        label: 'One lowercase letter (a-z)',
        test: (pwd) => /[a-z]/.test(pwd)
      },
      {
        id: 'uppercase',
        label: 'One uppercase letter (A-Z)',
        test: (pwd) => /[A-Z]/.test(pwd)
      },
      {
        id: 'number',
        label: 'One number (0-9)',
        test: (pwd) => /\d/.test(pwd)
      },
      {
        id: 'special',
        label: 'One special character (@$!%*?&)',
        test: (pwd) => /[@$!%*?&]/.test(pwd)
      }
    ];

    const isPasswordValid = password ? (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) : false;
    const validCount = requirements.filter(req => req.test(password || '')).length;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
          {isPasswordValid && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              ✓ Valid
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          {requirements.map((req) => {
            const isValid = password ? req.test(password) : false;
            return (
              <div
                key={req.id}
                className={`flex items-center text-xs transition-colors ${
                  isValid ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                <div className={`mr-2 w-4 h-4 rounded-full flex items-center justify-center ${
                  isValid 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isValid ? '✓' : '○'}
                </div>
                <span className={isValid ? 'line-through' : ''}>{req.label}</span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Status:</span>
            <span className={`text-xs font-medium ${
              isPasswordValid 
                ? 'text-green-600' 
                : validCount === 0 
                ? 'text-gray-400' 
                : 'text-amber-600'
            }`}>
              {isPasswordValid 
                ? '✓ Meets all requirements' 
                : validCount === 0 
                ? 'Enter password' 
                : `${validCount}/5 requirements met`
              }
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  const isValidPassword = (password) => {
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPolicy.test(password);
  };

  // Replace these handlers:
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
    console.log('📧 Verifying email for:', unverifiedUser.username);
    
    await confirmSignUp({
      username: unverifiedUser.username,
      confirmationCode: verificationCode
    });
    
    console.log('✅ Email verification successful');

    
    // Clear verification errors
    setErrors(prev => ({ ...prev, verification: '' }));
    
    // Show success message briefly
    setErrors(prev => ({
      ...prev,
      verification: '✅ Email verified successfully! You can now log in.'
    }));
    
    // Auto-populate login form with verified credentials
    setLoginData({
      username: unverifiedUser.username,
      password: unverifiedUser.password || ''
    });
    
    // Navigate to login after a brief delay
    setTimeout(() => {
      setView('login');
      setCurrentSection('account');
      setErrors({});
    }, 2000);
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    
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
    alert('Verification code has been resent to your email');
  } catch (error) {
    console.error('Error resending code:', error);
    setErrors(prev => ({
      ...prev,
      verification: 'Error resending verification code'
    }));
  }
};

  // Modified Login Section with Back Button
  const renderLoginSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to continue your career journey</p>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={loginData.username}
            onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={loginData.password}
            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {errors.login && (
          <p className="text-red-600 text-sm text-center">{errors.login}</p>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoggingIn ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="flex justify-center space-x-4">
        <button 
          onClick={() => setView('landing')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={() => setView('signup')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Create an account
        </button>
      </div>
      {/* Debug button (development only)
      {process.env.NODE_ENV === 'development' && (
        <button 
          type="button"
          onClick={() => {
            console.group('🔍 Login Debug');
            console.log('Form data:', loginData);
            console.log('Session items:', {
              preferences: storageUtils.getItem('userPathPreferences'),
              careerPath: storageUtils.getItem('selectedCareerPath'),
              resume: storageUtils.getItem('userResume'),
              dashboard: storageUtils.getItem(`userDashboard_${loginData.username}`)
            });
            console.groupEnd();
          }}
          className="w-full text-xs text-gray-500 underline mt-2"
        >
          Debug Session Data
        </button>
      )} */}
    </div>
  );
  
  const renderVerificationSection = () => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
      <p className="text-gray-600 mb-2">
        We've sent a verification code to <strong>{unverifiedUser?.username}</strong>
      </p>
      <p className="text-sm text-gray-500">
        Check your email inbox and spam folder for the verification code
      </p>
    </div>

    <form onSubmit={handleVerification} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Verification Code (6 digits)
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-lg tracking-widest"
          maxLength={6}
          autoComplete="one-time-code"
        />
      </div>

      {errors.verification && (
        <div className={`p-3 border rounded-lg ${
          errors.verification.includes('✅') 
            ? 'bg-green-50 border-green-200 text-green-600' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <p className="text-sm">{errors.verification}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={verificationCode.length !== 6}
        className={`w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
          verificationCode.length === 6
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Verify Email
      </button>

      <div className="text-center space-y-3">
        <button
          type="button"
          onClick={handleResendCode}
          className="text-blue-600 hover:text-blue-700 text-sm underline"
        >
          Resend verification code
        </button>
        <p className="text-xs text-gray-500">
          Didn't receive the code? Check your spam folder or try resending
        </p>
      </div>
    </form>

    {/* FIXED: Proper back navigation */}
    <div className="flex justify-center space-x-4 pt-4 border-t">
      <button 
        onClick={() => {
          setView('login');
          setCurrentSection('account');
          setErrors({});
        }}
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        Back to Login
      </button>
      <button
        onClick={() => {
          setView('signup');
          setCurrentSection('account');
          setErrors({});
        }}
        className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        Back to Sign Up
      </button>
    </div>
  </div>
);
  const renderCompassSection = () => (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full mb-4">
          <Compass className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Journey</h2>
        <p className="text-gray-600">Tell us about your goals to power your AI Career Compass™</p>
      </div>

      {errors.compassStep && (
        <div className="text-red-600 text-sm mb-2">{errors.compassStep}</div>
      )}

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose your path type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {navigationOptions.pathTypes.map(option => (
              <SelectionCard
                key={option.id}
                option={option}
                field="pathType"
                selected={formData.pathType}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Where are you in your journey?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {navigationOptions.careerStages.map(option => (
              <SelectionCard
                key={option.id}
                option={option}
                field="careerStage"
                selected={formData.careerStage}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">What's your primary goal?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {navigationOptions.primaryGoals.map(option => (
              <SelectionCard
                key={option.id}
                option={option}
                field="primaryGoal"
                selected={formData.primaryGoal}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSection = () => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full mb-4">
        <User className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
      <p className="text-gray-600">Set up your CareerDay profile to get started</p>
    </div>

    {errors.accountStep && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
        <p className="text-red-600 text-sm">{errors.accountStep}</p>
      </div>
    )}

    <div className="flex justify-center">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition">
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">First Name *</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => handleSelectionCard('firstName', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter your first name"
          required
        />
        {errors.firstName && (
          <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name *</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => handleSelectionCard('lastName', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter your last name"
          required
        />
        {errors.lastName && (
          <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleSelectionCard('email', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="your.email@example.com"
          required
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Username *</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => handleSelectionCard('username', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Choose a username"
          required
        />
        {errors.username && (
          <p className="text-red-600 text-sm mt-1">{errors.username}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Password *</label>
        <div className="relative">
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleSelectionCard('password', e.target.value)}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 pr-10
                      focus:ring-1 transition-colors ${
                        formData.password && isValidPassword(formData.password)
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50'
                          : formData.password && formData.password.length > 0
                          ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
            placeholder="Create a strong password"
            required
          />
          
          {/* Success checkmark when password is valid */}
          {formData.password && isValidPassword(formData.password) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Show password requirements when user starts typing */}
        {formData.password && formData.password.length > 0 && (
          <PasswordRequirements password={formData.password} />
        )}
        
        {/* Show static hint when password field is empty */}
        {(!formData.password || formData.password.length === 0) && (
          <p className="text-xs text-gray-500 mt-1">
            Must contain at least 8 characters, uppercase letter, number, and special character
          </p>
        )}
        
        {/* Show validation errors */}
        {errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password}</p>
        )}
      </div>
    </div>
    
    {/* REMOVED: Problematic back button that was causing issues */}
  </div>
);

const renderBottomNavigation = () => {
  if (view !== 'signup') return null;
  
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t">
      {/* Back Button Logic */}
      <div>
        {currentSection === 'verify' && (
          <button
            onClick={() => {
              setCurrentSection('account');
              setErrors({});
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center"
          >
            <span className="mr-1">←</span> Back to Account
          </button>
        )}
        {currentSection === 'compass' && (
          <button
            onClick={() => {
              setCurrentSection('verify');
              setErrors({});
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center"
          >
            <span className="mr-1">←</span> Back
          </button>
        )}
        {currentSection === 'account' && (
          <button
            onClick={() => setView('landing')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center"
          >
            <span className="mr-1">←</span> Back to Home
          </button>
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
        !isValidPassword(formData.password)  // ← ADD THIS LINE
      }
      className={`px-6 py-2 rounded-lg transition-colors font-medium ${
        (!formData.firstName || 
         !formData.lastName || 
         !formData.email || 
         !formData.username || 
         !formData.password ||
         !isValidPassword(formData.password))
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      Create Account
    </button>
    
    {/* Show helpful message when password is invalid */}
    {formData.password && 
     formData.password.length > 0 && 
     !isValidPassword(formData.password) && (
      <p className="text-xs text-amber-600 mt-1 text-right">
        Complete password requirements to continue
      </p>
    )}
  </div>
)}
        {currentSection === 'compass' && (
          <button
            onClick={handleNext}
            disabled={!formData.pathType || !formData.careerStage || !formData.primaryGoal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
          </button>
        )}
      </div>
    </div>
  );
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
  
  
  // Updated handleNext function for signup using Cognito
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
          // Prepare user attributes 
          const userAttributes = {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
            preferred_username: formData.username
          };
  
          // Sign up using email as username
          const { isSignUpComplete, userId, nextStep } = await signUp({
            username: formData.email, 
            password: formData.password,
            options: {
              userAttributes,
              authenticationFlowType: 'USER_SRP_AUTH'
            }
          });
  
          console.log('Cognito signup successful');
          analytics.trackUserSignup('email');
  
          // Store user credentials for verification
          setUnverifiedUser({
            username: formData.email,
            password: formData.password
          });
  
          // Move to verification section
          setCurrentSection('verify');
  
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
          // Store path preferences in session storage
          const pathPreferences = {
            pathType: formData.pathType,
            careerStage: formData.careerStage,
            primaryGoal: formData.primaryGoal
          };
          
          storageUtils.setItem('userPathPreferences', JSON.stringify(pathPreferences));

          // Update local user state
          setUser(prevUser => ({
            ...prevUser,
            ...pathPreferences
          }));

          onNext(formData);
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
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CareerDay</h1>
        </div>

        {view === 'landing' && renderLandingPage()}
        {view === 'login' && renderLoginSection()}
        {view === 'signup' && (
          <>
            {currentSection === 'verify' ? renderVerificationSection() :
             currentSection === 'compass' ? renderCompassSection() :
             renderAccountSection()}
            
            {/* USE THE NEW NAVIGATION FUNCTION */}
            {renderBottomNavigation()}
          </>
        )}

        {view === 'login' && (
          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => setView('signup')}
              className="text-blue-600 hover:text-blue-700"
            >
              Don't have an account? Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default OnboardingFlow;