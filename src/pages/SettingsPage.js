import React, { useState, useContext } from 'react';
import { ArrowLeft, Upload, Bell, Lock, CreditCard, User } from 'lucide-react';
import { UserContext } from '../App'; // Import your context

const SettingsPage = () => {
  const { user, setUser, setStage } = useContext(UserContext);

  // Active tab in settings
  const [activeTab, setActiveTab] = useState('account');

  // We’ll store local state for the avatar so we can preview changes.
  // If user.avatar exists, it’s already in base64 or a blob URL. Use that first.
  const [avatar, setAvatar] = useState(user.avatar || null);

  /**
   * Generic, local fields to "edit" inside the account tab, 
   * loaded from user context if available.
   */
  const [localFirstName, setLocalFirstName] = useState(user.firstName || '');
  const [localLastName, setLocalLastName] = useState(user.lastName || '');
  const [localEmail, setLocalEmail] = useState(user.email || '');
  const [localPhone, setLocalPhone] = useState(user.phoneNumber || '');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    // Merge local changes back into the global user object
    setUser((prev) => ({
      ...prev,
      firstName: localFirstName,
      lastName: localLastName,
      email: localEmail,
      phoneNumber: localPhone,
      avatar: avatar,
    }));
    alert('Profile updated!');
  };

  // Tab button helper
  const TabButton = ({ id, icon: Icon, label, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // ACCOUNT TAB
  const AccountInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={localFirstName}
            onChange={(e) => setLocalFirstName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            value={localLastName}
            onChange={(e) => setLocalLastName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={localPhone}
            onChange={(e) => setLocalPhone(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <User size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              Upload New
              <input 
                type="file" 
                className="hidden" 
                onChange={handleAvatarChange} 
                accept="image/*" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Save Changes */}
      <button 
        onClick={handleSaveChanges} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Save Changes
      </button>
    </div>
  );

  // SUBSCRIPTION TAB
  const Subscription = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Plan: Premium</h3>
        <p className="text-blue-700 mb-4">Renewal Date: Dec 31, 2024</p>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            View Billing History
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );

  // PRIVACY TAB
  const Privacy = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Update Password
          </button>
        </div>
      </div>
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Privacy Preferences</h3>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Manage Connected Apps
        </button>
      </div>
    </div>
  );

  // NOTIFICATIONS TAB
  const Notifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive updates about your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 peer"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
            <div>
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-gray-500">Get notifications in your browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 peer"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setStage(4)} // Go back to main feed (stage 4)
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 p-4 border-b md:border-b-0 md:border-r">
              <nav className="space-y-2">
                <TabButton 
                  id="account"
                  icon={User}
                  label="Account Info"
                  active={activeTab === 'account'}
                />
                <TabButton 
                  id="subscription"
                  icon={CreditCard}
                  label="Subscription Plan"
                  active={activeTab === 'subscription'}
                />
                <TabButton 
                  id="privacy"
                  icon={Lock}
                  label="Privacy & Security"
                  active={activeTab === 'privacy'}
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
            <div className="flex-1 p-6">
              {activeTab === 'account' && <AccountInfo />}
              {activeTab === 'subscription' && <Subscription />}
              {activeTab === 'privacy' && <Privacy />}
              {activeTab === 'notifications' && <Notifications />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
