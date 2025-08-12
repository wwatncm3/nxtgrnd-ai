import React, { useState, useContext, useEffect } from 'react';
import { 
  ArrowLeft, User, MapPin, Calendar, Award, BookOpen, 
  ExternalLink, Mail, Linkedin, Youtube, Github, Globe,
  Star, Clock, Users, MessageCircle, Share2, Check,
  Plus, Edit3, Camera, RefreshCw
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';

const CreatorProfile = ({ setStage }) => {
  const { user, setUser } = useContext(UserContext);
  
  // Profile states
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    youtube: '',
    publicProfile: true,
    showEmail: false,
    showPhone: false
  });
  
  // Portfolio/Content states
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Load profile data on mount
  useEffect(() => {
    loadCreatorProfile();
  }, [user?.userID]);
  
  const loadCreatorProfile = async () => {
    if (!user?.userID) return;
    
    setIsLoading(true);
    try {
      // Load stored profile data
      const storedProfile = storageUtils.getItem(`creatorProfile_${user.userID}`);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfileData(parsedProfile.profileData || profileData);
        setPortfolioItems(parsedProfile.portfolioItems || []);
        setAchievements(parsedProfile.achievements || []);
      } else {
        // Initialize with default achievements based on user data
        initializeDefaultAchievements();
      }
    } catch (error) {
      console.error('Error loading creator profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const initializeDefaultAchievements = () => {
    const defaultAchievements = [];
    
    // Add achievements based on user data
    if (user?.selectedCareerPath) {
      defaultAchievements.push({
        id: 'career_path_selected',
        title: 'Career Path Selected',
        description: `Chose ${user.selectedCareerPath.title} as career focus`,
        date: new Date().toISOString(),
        type: 'milestone',
        icon: 'Award'
      });
    }
    
    if (user?.skills?.length > 0) {
      defaultAchievements.push({
        id: 'skills_profile_complete',
        title: 'Skills Profile Complete',
        description: `Added ${user.skills.length} skills to profile`,
        date: new Date().toISOString(),
        type: 'skill',
        icon: 'Star'
      });
    }
    
    if (user?.resume) {
      defaultAchievements.push({
        id: 'resume_uploaded',
        title: 'Resume Uploaded',
        description: 'Professional resume added to profile',
        date: user.resume.uploadDate || new Date().toISOString(),
        type: 'document',
        icon: 'BookOpen'
      });
    }
    
    setAchievements(defaultAchievements);
  };
  
  // Save profile data
  const saveCreatorProfile = async () => {
    if (!user?.userID) return;
    
    try {
      const profileToSave = {
        profileData,
        portfolioItems,
        achievements,
        lastUpdated: new Date().toISOString()
      };
      
      storageUtils.setItem(`creatorProfile_${user.userID}`, JSON.stringify(profileToSave));
      
      // Update user context with public profile info
      setUser(prev => ({
        ...prev,
        creatorProfile: profileData
      }));
      analytics.trackEvent('creator_profile_updated', {
      hasWebsite: !!profileData.website,
      hasLinkedIn: !!profileData.linkedin,
      hasGitHub: !!profileData.github,
      portfolioItemsCount: portfolioItems.length,
      achievementsCount: achievements.length
    });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving creator profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };
  
  // Handle profile field changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add portfolio item
  const addPortfolioItem = () => {
    const newItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'project', // project, course, certification, article
      url: '',
      date: new Date().toISOString().split('T')[0],
      skills: [],
      isEditing: true
    };
    analytics.trackEvent('portfolio_item_added', {
    itemType: 'new_item'
  });
    setPortfolioItems(prev => [newItem, ...prev]);
  };
  
  // Update portfolio item
  const updatePortfolioItem = (id, field, value) => {
    setPortfolioItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  // Delete portfolio item
  const deletePortfolioItem = (id) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Save portfolio item
  const savePortfolioItem = (id) => {
    setPortfolioItems(prev => prev.map(item => 
      item.id === id ? { ...item, isEditing: false } : item
    ));
  };
  
  // Get icon component
  const getIconComponent = (iconName) => {
    const icons = {
      Award, Star, BookOpen, User, Calendar, Clock, Users, ExternalLink
    };
    return icons[iconName] || Star;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your creator profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setStage(5)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Creator Profile</h1>
                <p className="text-sm text-gray-600">Showcase your professional journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {saveSuccess && (
                <div className="flex items-center text-green-600 text-sm">
                  <Check size={16} className="mr-1" />
                  Saved!
                </div>
              )}
              
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCreatorProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-white text-2xl font-bold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      <Camera size={14} />
                    </button>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mt-4">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-600">{user?.username && `@${user.username}`}</p>
                
                {user?.selectedCareerPath && (
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {user.selectedCareerPath.title}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Bio Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell others about yourself and your career journey..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {profileData.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>
                
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                      placeholder="City, Country"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      {profileData.location || 'Location not set'}
                    </div>
                  )}
                </div>
                
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <div className="flex items-center text-gray-600">
                    <Award size={16} className="mr-2" />
                    {user?.experienceLevel || user?.careerStage || 'Not specified'}
                  </div>
                </div>
                
                {/* Skills Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <div className="flex items-center text-gray-600">
                    <Star size={16} className="mr-2" />
                    {user?.skills?.length || 0} skills added
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact & Links */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Links</h3>
              
              <div className="space-y-4">
                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleProfileChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : profileData.website ? (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Globe size={16} className="mr-2" />
                      Visit Website
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  ) : (
                    <p className="text-gray-500">No website added</p>
                  )}
                </div>
                
                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => handleProfileChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : profileData.linkedin ? (
                    <a
                      href={profileData.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Linkedin size={16} className="mr-2" />
                      LinkedIn Profile
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  ) : (
                    <p className="text-gray-500">No LinkedIn profile added</p>
                  )}
                </div>
                
                {/* GitHub */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.github}
                      onChange={(e) => handleProfileChange('github', e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : profileData.github ? (
                    <a
                      href={profileData.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Github size={16} className="mr-2" />
                      GitHub Profile
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  ) : (
                    <p className="text-gray-500">No GitHub profile added</p>
                  )}
                </div>
                
                {/* Email visibility toggle */}
                {isEditing && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Privacy Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profileData.showEmail}
                          onChange={(e) => handleProfileChange('showEmail', e.target.checked)}
                          className="mr-3 rounded"
                        />
                        <span className="text-sm text-gray-700">Show email on public profile</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profileData.publicProfile}
                          onChange={(e) => handleProfileChange('publicProfile', e.target.checked)}
                          className="mr-3 rounded"
                        />
                        <span className="text-sm text-gray-700">Make profile public</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Portfolio & Achievements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio & Projects</h3>
                {isEditing && (
                  <button
                    onClick={addPortfolioItem}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Item
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {portfolioItems.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No portfolio items yet.</p>
                    {isEditing && (
                      <button
                        onClick={addPortfolioItem}
                        className="mt-4 text-blue-600 hover:text-blue-700"
                      >
                        Add your first project
                      </button>
                    )}
                  </div>
                ) : (
                  portfolioItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      {item.isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)}
                            placeholder="Project title"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <textarea
                            value={item.description}
                            onChange={(e) => updatePortfolioItem(item.id, 'description', e.target.value)}
                            placeholder="Describe your project..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={3}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select
                              value={item.type}
                              onChange={(e) => updatePortfolioItem(item.id, 'type', e.target.value)}
                              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="project">Project</option>
                              <option value="course">Course</option>
                              <option value="certification">Certification</option>
                              <option value="article">Article</option>
                              <option value="video">Video</option>
                            </select>
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => updatePortfolioItem(item.id, 'date', e.target.value)}
                              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <input
                            type="url"
                            value={item.url}
                            onChange={(e) => updatePortfolioItem(item.id, 'url', e.target.value)}
                            placeholder="Project URL (optional)"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => deletePortfolioItem(item.id)}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => savePortfolioItem(item.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                                {item.type}
                              </span>
                              {isEditing && (
                                <button
                                  onClick={() => updatePortfolioItem(item.id, 'isEditing', true)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-500 text-sm">
                              <Calendar size={14} className="mr-1" />
                              {new Date(item.date).toLocaleDateString()}
                            </div>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                              >
                                View Project
                                <ExternalLink size={12} className="ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Achievements Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements & Milestones</h3>
              
              <div className="space-y-4">
                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No achievements recorded yet.</p>
                  </div>
                ) : (
                  achievements.map((achievement) => {
                    const IconComponent = getIconComponent(achievement.icon);
                    return (
                      <div key={achievement.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
                          <div className="flex items-center mt-2 text-gray-500 text-xs">
                            <Clock size={12} className="mr-1" />
                            {new Date(achievement.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Skills Section */}
            {user?.skills && user.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;