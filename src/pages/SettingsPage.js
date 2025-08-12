import React, { useState, useContext, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Bell, Lock, CreditCard, User, Save, 
  Eye, EyeOff, Check, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import { updateUserAttributes, getCurrentUser, fetchUserAttributes } from '@aws-amplify/auth';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';

const SettingsPage = ({ setStage }) => {
  const { user, setUser } = useContext(UserContext);
  
  // Active tab in settings
  const [activeTab, setActiveTab] = useState('account');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Avatar state
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Form states for account info
  const [accountForm, setAccountForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: ''
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    careerAlerts: true,
    weeklyDigest: false,
    pushNotifications: false,
    resumeReminders: true
  });
  
  // Load user data on component mount
  useEffect(() => {
    if (user) {
      // Debug: Log all user data to see what's available
      console.log('SettingsPage - Full user data:', user);
      console.log('SettingsPage - User experience level:', user?.experienceLevel);
      console.log('SettingsPage - User career stage:', user?.careerStage);
      
      // Check for resume in session storage
      const storedResume = storageUtils.getItem('userResume');
      console.log('SettingsPage - Stored resume:', storedResume ? 'Found' : 'Not found');
      
      setAccountForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        phoneNumber: user.phoneNumber || ''
      });
      
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
      
      // Load notification preferences from session storage
      const savedNotifications = storageUtils.getItem(`notifications_${user.userID}`);
      if (savedNotifications) {
        setNotifications(savedNotifications);
      }
    }
  }, [user]);

  // Function to get resume status from session storage
  const getResumeStatus = () => {
    try {
      const storedResume = storageUtils.getItem('userResume');
      if (storedResume) {
        return 'Uploaded';
      }
      return user?.resume ? 'Uploaded' : 'Not uploaded';
    } catch (error) {
      return user?.resume ? 'Uploaded' : 'Not uploaded';
    }
  };

  // Function to get experience level from various sources
  const getExperienceLevel = () => {
    // Try multiple possible sources for experience level
    return user?.experienceLevel || 
           user?.careerStage || 
           user?.experience || 
           'Not specified';
  };
  
  // Validate phone number format for Cognito
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') return null; // Phone is optional
    
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove leading + for processing
    const digitsOnly = cleaned.replace(/^\+/, '');
    
    // Handle different input formats
    if (digitsOnly.length === 10) {
      // US number without country code: 2345678900
      return `+1${digitsOnly}`;
    }
    
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // US number with country code: 12345678900
      return `+${digitsOnly}`;
    }
    
    if (cleaned.startsWith('+') && digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      // Already formatted international number: +12345678900
      return cleaned;
    }
    
    // Invalid format
    return null;
  };
  
  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }
      
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };
  
  // Handle account form changes
  const handleAccountChange = (field, value) => {
    setAccountForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear phone-related errors when user types
    if (field === 'phoneNumber' && error.includes('phone')) {
      setError('');
    }
  };
  
  // Handle password form changes
  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };
  
  // Handle notification changes
  const handleNotificationChange = (setting, value) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Validate password requirements
  const validatePassword = (password) => {
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPolicy.test(password);
  };
  
  // Save account changes
  const handleSaveAccount = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!accountForm.firstName || !accountForm.lastName || !accountForm.email) {
        throw new Error('Please fill in all required fields');
      }
      
      // Validate and format phone number
      const formattedPhone = validatePhoneNumber(accountForm.phoneNumber);
      if (accountForm.phoneNumber && !formattedPhone) {
        throw new Error('Please enter a valid phone number in international format (+1234567890)');
      }
      
      // Update Cognito user attributes - only include phone if it's valid
      const attributesToUpdate = {
        given_name: accountForm.firstName,
        family_name: accountForm.lastName,
        email: accountForm.email,
        preferred_username: accountForm.username
      };
      
      // Only add phone number if it's provided and valid
      if (formattedPhone) {
        attributesToUpdate.phone_number = formattedPhone;
      }
      
      try {
        await updateUserAttributes({
          userAttributes: attributesToUpdate
        });
        console.log('✅ Cognito attributes updated successfully');
      } catch (cognitoError) {
        console.error('❌ Cognito update error:', cognitoError);
        
        if (cognitoError.name === 'InvalidParameterException') {
          if (cognitoError.message.includes('phone')) {
            throw new Error('Invalid phone number format. Please use international format: +1234567890');
          } else if (cognitoError.message.includes('email')) {
            throw new Error('Invalid email format. Please enter a valid email address.');
          } else {
            throw new Error('Invalid input format. Please check your information and try again.');
          }
        } else {
          throw new Error(`Failed to update account: ${cognitoError.message}`);
        }
      }
      
      // Upload avatar if changed
      let avatarUrl = user.avatar;
      if (avatar) {
        try {
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(avatar);
          });
          
          const response = await fetch('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `${user.userID}/profile/avatar.${avatar.type.split('/')[1]}`,
              fileContent: base64Data,
              fileType: avatar.type
            })
          });
          
          if (response.ok) {
            avatarUrl = avatarPreview;
          }
        } catch (uploadError) {
          console.warn('Avatar upload failed, continuing with other updates:', uploadError);
        }
      }
      
      // Update user context
      const updatedUser = {
        ...user,
        ...accountForm,
        phoneNumber: formattedPhone || accountForm.phoneNumber,
        avatar: avatarUrl
      };
      
      setUser(updatedUser);
      
      // Store updated user data in session storage
      storageUtils.setItem('userProfile', updatedUser);
      analytics.trackEvent('account_settings_updated', {
      fieldsUpdated: Object.keys(accountForm).filter(key => accountForm[key]),
      hasAvatar: !!avatar,
      hasPhoneNumber: !!formattedPhone
    });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving account:', error);
      setError(error.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save password changes
  const handleSavePassword = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Validate password form
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        throw new Error('Please fill in all password fields');
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (!validatePassword(passwordForm.newPassword)) {
        throw new Error('Password must contain at least 8 characters, uppercase letter, number, and special character');
      }
      
      // Note: AWS Cognito password change would typically be handled here
      // For now, we'll simulate success
      console.log('Password change request submitted');
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      analytics.trackEvent('password_changed', {
      method: 'settings_page'
    });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save notification preferences
  const handleSaveNotifications = () => {
    try {
      storageUtils.setItem(`notifications_${user.userID}`, notifications);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save notification preferences');
    }
  };
  
  // Tab button component
  const TabButton = ({ id, icon: Icon, label, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
  
  // Account Tab Component
  const AccountTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
        
        {/* Profile Picture Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <Upload size={16} className="mr-2" />
                Upload New Photo
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG, GIF or WebP. Max size 5MB.</p>
            </div>
          </div>
        </div>
        
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountForm.firstName}
              onChange={(e) => handleAccountChange('firstName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your first name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountForm.lastName}
              onChange={(e) => handleAccountChange('lastName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your last name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={accountForm.email}
              onChange={(e) => handleAccountChange('email', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={accountForm.username}
              onChange={(e) => handleAccountChange('username', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Choose a username"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={accountForm.phoneNumber}
              onChange={(e) => handleAccountChange('phoneNumber', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                accountForm.phoneNumber && !validatePhoneNumber(accountForm.phoneNumber)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              placeholder="+1234567890 or (234) 567-8900"
            />
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-500">
                Optional. Use international format: +1234567890
              </p>
              {accountForm.phoneNumber && !validatePhoneNumber(accountForm.phoneNumber) && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  Please enter a valid phone number
                </p>
              )}
              {accountForm.phoneNumber && validatePhoneNumber(accountForm.phoneNumber) && (
                <p className="text-sm text-green-600 flex items-center">
                  <Check size={14} className="mr-1" />
                  Valid format: {validatePhoneNumber(accountForm.phoneNumber)}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Career Profile Info */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Selected Career Path:</span>
              <p className="text-gray-600 mt-1">{user?.selectedCareerPath?.title || 'Not selected'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Experience Level:</span>
              <p className="text-gray-600 mt-1">{getExperienceLevel()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Skills Count:</span>
              <p className="text-gray-600 mt-1">{user?.skills?.length || 0} skills selected</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Resume Status:</span>
              <p className="text-gray-600 mt-1">{getResumeStatus()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-6">
          <button
            onClick={handleSaveAccount}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Changes
          </button>
          
          {saveSuccess && (
            <div className="flex items-center text-green-600 text-sm">
              <Check size={16} className="mr-1" />
              Changes saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Security Tab Component
  const SecurityTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Must contain at least 8 characters, uppercase letter, number, and special character
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Confirm your new password"
            />
          </div>
          
          <button
            onClick={handleSavePassword}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Lock size={16} className="mr-2" />
            )}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
  
  // Notifications Tab Component
  const NotificationsTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
        
        <div className="space-y-6">
          {Object.entries({
            emailUpdates: {
              title: "Email Updates",
              description: "Receive important updates about your account and career progress"
            },
            careerAlerts: {
              title: "Career Opportunities",
              description: "Get notified about new job opportunities matching your profile"
            },
            weeklyDigest: {
              title: "Weekly Progress Digest",
              description: "Weekly summary of your learning progress and achievements"
            },
            pushNotifications: {
              title: "Browser Notifications",
              description: "Receive real-time notifications in your browser"
            },
            resumeReminders: {
              title: "Resume Analysis Reminders",
              description: "Reminders to update and analyze your resume regularly"
            }
          }).map(([key, setting]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{setting.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
          
          <button
            onClick={handleSaveNotifications}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Bell size={16} className="mr-2" />
            Save Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setStage(5)} // Go back to dashboard
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
          
          {user?.selectedCareerPath && (
            <div className="hidden md:block">
              <span className="text-sm text-gray-500">Career Path:</span>
              <p className="font-medium text-gray-900">{user.selectedCareerPath.title}</p>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle size={20} className="text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="w-full lg:w-64 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
              <nav className="space-y-2">
                <TabButton 
                  id="account"
                  icon={User}
                  label="Account Info"
                  active={activeTab === 'account'}
                />
                <TabButton 
                  id="security"
                  icon={Lock}
                  label="Security"
                  active={activeTab === 'security'}
                />
                <TabButton 
                  id="notifications"
                  icon={Bell}
                  label="Notifications"
                  active={activeTab === 'notifications'}
                />
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 lg:p-8">
              {activeTab === 'account' && <AccountTab />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;