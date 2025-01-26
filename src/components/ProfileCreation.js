import React, { useState, useContext } from 'react';
import { 
  signIn, 
  signUp, 
  confirmSignUp, 
  fetchUserAttributes,
  updateUserAttributes,
  resendSignUpCode,
  getCurrentUser 
} from '@aws-amplify/auth';
import { User, Upload, BookOpen, Users, Rocket, Target, Briefcase, Compass, Shield } from 'lucide-react';
import CareerInterests from './InterestSelection';
import { UserContext } from '../App';


function OnboardingFlow({ onNext }) {
  const { user, setUser } = useContext(UserContext);
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
          Create Account
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
 // Updated handleLogin function using Cognito
 const handleLogin = async (e) => {
  e.preventDefault();
  try {
    console.log('Login attempt with:', loginData);

    // Sign in using Cognito with email
    const { isSignedIn, nextStep } = await signIn({
      username: loginData.username,
      password: loginData.password
    });

    if (isSignedIn) {
      const userAttributes = await fetchUserAttributes();
      
      // Create user data object from Cognito attributes
      const completeUserData = {
        userID: loginData.username,
        username: userAttributes.preferred_username || loginData.username,
        email: userAttributes.email,
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
      };

      // Check for path preferences in session storage
      const storedPreferences = sessionStorage.getItem('userPathPreferences');
      const pathPreferences = storedPreferences ? JSON.parse(storedPreferences) : null;

      // Update user data with path preferences if they exist
      const finalUserData = {
        ...completeUserData,
        ...(pathPreferences || {})
      };

      // Update the global user context
      setUser(finalUserData);

      // If no path preferences, move to path selection
      if (!pathPreferences) {
        console.log('No path preferences found, redirecting to path selection');
        setView('signup');
        setCurrentSection('compass');
      } else {
        // Check for career path
        const storedCareerPath = sessionStorage.getItem('selectedCareerPath');
        if (storedCareerPath) {
          console.log('Career path found, redirecting to dashboard');
          onNext(finalUserData, true);
        } else {
          console.log('No career path found, redirecting to Interest Selection');
          onNext(finalUserData, false);
        }
      }
    }

  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'An error occurred during login. Please try again.';
    
    // Handle specific Cognito error messages
    if (error.code === 'UserNotFoundException') {
      errorMessage = 'User not found. Please check your username.';
    } else if (error.code === 'NotAuthorizedException') {
      errorMessage = 'Incorrect username or password.';
    } else if (error.code === 'UserNotConfirmedException') {
      errorMessage = 'Please verify your email before logging in.';
    }
    
    setErrors(prev => ({ ...prev, login: errorMessage }));
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

  const isValidPassword = (password) => {
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPolicy.test(password);
  };

  // Replace these handlers:
  const handleVerification = async (e) => {
    e.preventDefault();
    try {
      await confirmSignUp({
        username: unverifiedUser.username,
        confirmationCode: verificationCode
      });
      
      setView('login');
    } catch (error) {
      console.error('Verification error:', error);
      setErrors(prev => ({
        ...prev,
        verification: error.message || 'Error verifying email'
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

      <form onSubmit={handleLogin} className="space-y-6">
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
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign In
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
    </div>
  );
  // Add this with your other render functions (after renderLoginSection and before renderCompassSection)
  
  const renderVerificationSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">We've sent a verification code to your email</p>
      </div>

      <form onSubmit={handleVerification} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Verification Code</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {errors.verification && (
          <p className="text-red-600 text-sm text-center">{errors.verification}</p>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2"
        >
          Verify Email
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          className="w-full py-2 px-4 text-blue-600 hover:text-blue-700"
        >
          Resend Code
        </button>
      </form>
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
        <div className="text-red-600 text-sm mb-2">{errors.accountStep}</div>
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
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleSelectionCard('firstName', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.firstName && (
            <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleSelectionCard('lastName', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.lastName && (
            <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleSelectionCard('email', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleSelectionCard('username', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.username && (
            <p className="text-red-600 text-sm mt-1">{errors.username}</p>
          )}
        </div>
  
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleSelectionCard('password', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>
      </div>
  
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentSection('previousSection')} // Replace 'previousSection' with your actual state value
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
      </div>
    </div>
  );
  
  

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
          
          sessionStorage.setItem('userPathPreferences', JSON.stringify(pathPreferences));

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
  currentSection === 'verify' ? renderVerificationSection() :
  currentSection === 'compass' ? renderCompassSection() :
  renderAccountSection()
)}
  
          {view === 'signup' && (
            <div className="flex justify-between mt-8">
              {currentSection !== 'account' && (
                <button
                  onClick={() => setCurrentSection(currentSection === 'compass' ? 'account' : 'landing')}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentSection === 'account' ? 'Next' : 'Submit'}
              </button>
            </div>
          )}
  
          {view === 'login' && (
            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => setView('signup')}
                className="text-blue-600 hover:text-blue-700"
              >
                Don’t have an account? Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
}

export default OnboardingFlow;