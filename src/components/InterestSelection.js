import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, X, Search, Check, Upload, AlertCircle, Download, FileText, UploadCloud } from 'lucide-react';
import { UserContext } from '../App';
import  skillsData  from '../data/skills';
import { storageUtils, STORAGE_KEYS } from '../utils/authUtils';
import { storageService } from '../services/storageService';
import API_CONFIG, { fetchWithTimeout } from '../config/api';
import { LoadingSpinner } from './ui/AnimatedComponents';

const CareerInterests = ({ onComplete, initialData = {} }) => {
  const { user, setUser } = useContext(UserContext);
  const [selectedSkills, setSelectedSkills] = useState(initialData.skills || []);
  const [experienceLevel, setExperienceLevel] = useState(initialData.experienceLevel || '');
  const [, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [step, setStep] = useState(1);
  const [skillOptions, setSkillOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Pagination constants
  const skillsPerPage = 15;

  // State to manage the success message visibility
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Handle resume template download
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/Resume Template.docx';
    link.download = 'Resume Template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowTemplateModal(false);
  };

  useEffect(() => {
    const loadSkills = () => {
      setIsLoading(true);
      
      // Use imported skills data (exactly from your CSV)
      const skills = [...skillsData].sort();
      
      setSkillOptions(skills);
      setIsLoading(false);
      console.log(`Loaded ${skills.length} skills from your CSV data`);
    };

    loadSkills();
  }, []);

  // Memoized filtered skills with pagination
  const filteredSkills = useMemo(() => {
    const filtered = searchTerm
      ? skillOptions.filter(skill =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : skillOptions;

    // Pagination
    const startIndex = (page - 1) * skillsPerPage;
    return filtered.slice(startIndex, startIndex + skillsPerPage);
  }, [skillOptions, searchTerm, page]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    const filtered = searchTerm
      ? skillOptions.filter(skill =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : skillOptions;
    return Math.ceil(filtered.length / skillsPerPage);
  }, [skillOptions, searchTerm]);

  const handleSkillSelect = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => [...prev, skill]);
    }
    setIsDropdownOpen(false);
  };

  const handleSkillRemove = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    console.log('Resume upload initiated:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    });

    if (!file) {
      return;
    }

    // Enhanced file validation
    const validTypes = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };
    
    if (!validTypes[file.type]) {
      setUploadError(`Invalid file type. Please upload a PDF, DOC, or DOCX file. Current type: ${file.type}`);
      return;
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    // Clear any previous errors
    setUploadError('');

    if (!user?.userID) {
      setUploadError('Please complete your profile before uploading a resume.');
      return;
    }

    setIsUploading(true);

    try {
      const base64Content = await toBase64(file);
      console.log('File converted to base64:', {
        contentLength: base64Content?.length,
        filename: `${user.userID}/resume/${file.name}`
      });

      const response = await fetchWithTimeout(API_CONFIG.files.upload(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          filename: `${user.userID}/resume/${file.name}`,
          fileContent: base64Content,
          fileType: file.type
        }),
      }, 60000);

      const responseData = await response.json();
      console.log('Upload response:', {
        status: response.ok,
        hasTextract: !!responseData.textractAnalysis
      });

      if (response.ok) {
        const resumeData = {
          name: file.name,
          type: file.type,
          content: base64Content,
          uploadDate: new Date().toISOString(),
          path: `${user.userID}/resume/${file.name}`,
          textractAnalysis: responseData.textractAnalysis || null  // Match key name with ResumeAnalysis.js
        };

        // Store complete resume data in session storage
        console.log('Storing resume data:', {
          name: resumeData.name,
          type: resumeData.type,
          hasTextract: !!resumeData.textractAnalysis,
          textractTextLength: resumeData.textractAnalysis?.rawText?.length || 0,
          path: resumeData.path
        });
        
        // Save to localStorage AND sync to DynamoDB
        storageService.setItem(STORAGE_KEYS.USER_RESUME, resumeData);

        // Update component state
        setResumeFile(file);
        setResumeName(file.name);
        
        // Update user context
        setUser(prevUser => ({
          ...prevUser,
          resume: resumeData
        }));

        // Show success message
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);

      } else {
        throw new Error(responseData.message || 'Unknown error occurred.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to upload the file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async () => {
    if (isSubmitting || !user || !user.userID) {
      console.log('Preventing duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    
    console.log('Submitting profile with:', {
      skills: selectedSkills.length,
      experienceLevel,
      resumeUploaded: !!resumeName
    });

    try {
      // Get resume data from session storage
      const storedResume = storageUtils.getItem(STORAGE_KEYS.USER_RESUME);
      console.log('Retrieved resume from session storage:', storedResume ? 'Found' : 'Not found');

      const preferencesPayload = {
        userId: user.userID,
        skills: selectedSkills,
        experienceLevel: experienceLevel || 'entry', // default if user skipped selector
        resume: storedResume || null
      };

      console.log('Sending preferences payload:', preferencesPayload);

      const response = await fetchWithTimeout(
        API_CONFIG.dynamicOptions.get(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/dynamic-options',
            body: JSON.stringify(preferencesPayload)
          })
        }
      );

      if (!response.ok) throw new Error('Failed to save preferences');

      console.log('Preferences saved successfully');

      // Create the complete updated user data
      // Note: storedResume is already parsed by storageUtils.getItem()
      const updatedUserData = {
        ...user,
        skills: selectedSkills,
        experienceLevel: experienceLevel || 'entry',
        resume: storedResume || null
      };

      console.log('Passing complete user data to parent:', updatedUserData);

      // Pass complete data to parent
      onComplete(updatedUserData);

    } catch (error) {
      console.error('Error:', error);
      setUploadError('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.skills-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const addCustomSkill = () => {
    const trimmedSkill = searchTerm.trim();
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      setSelectedSkills((prev) => [...prev, trimmedSkill]);
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50 p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-900 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-teal-600">Profile</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Help us understand your interests to personalize your career journey
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-md transition-all ${
              step >= 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <div className={`h-1 w-16 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-teal-500' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-md transition-all ${
              step >= 2 ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Step 1: Skills Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Select Your Skills</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Choose skills you have or would like to develop
              </p>
            </div>
            
            {/* Selected Skills Display */}
            <div className="min-h-[60px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600 mb-2">Selected Skills ({selectedSkills.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No skills selected yet. Search below to add skills.</p>
                ) : (
                  selectedSkills.map((skill, index) => (
                    <span
                      key={`selected-${skill}-${index}`}
                      className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full flex items-center text-sm
                               border border-green-200 hover:bg-green-200 transition-colors"
                    >
                      {skill}
                      <button
                        onClick={() => handleSkillRemove(skill)}
                        className="ml-2 hover:text-green-900 focus:outline-none"
                        title={`Remove ${skill}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Enhanced Search Input */}
            <div className="skills-dropdown-container relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search skills or add custom ones..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                    setIsDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      e.preventDefault();
                      addCustomSkill();
                    }
                    if (e.key === 'Escape') {
                      setIsDropdownOpen(false);
                    }
                  }}
                  className="w-full px-4 py-3 pl-10 pr-20 border-2 border-gray-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-sm sm:text-base"
                  onFocus={() => setIsDropdownOpen(true)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                
                {/* Add Custom Skill Button */}
                {searchTerm.trim() && !selectedSkills.includes(searchTerm.trim()) && (
                  <button
                    onClick={addCustomSkill}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 
                             bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>

              {/* Instructions */}
              {!searchTerm && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    TIP: <strong>Tip:</strong> Type to search from our skills database or add your own custom skills by pressing Enter
                  </p>
                </div>
              )}

              {/* Dropdown */}
              {isLoading ? (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center mt-1">
                  <LoadingSpinner size="sm" />
                  <p className="text-sm text-gray-600 mt-2">Loading skills...</p>
                </div>
              ) : isDropdownOpen && searchTerm && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                  {/* Add Custom Skill Option */}
                  {searchTerm.trim() && !skillOptions.some(skill => 
                    skill.toLowerCase() === searchTerm.trim().toLowerCase()
                  ) && !selectedSkills.includes(searchTerm.trim()) && (
                    <button
                      onClick={addCustomSkill}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100
                               flex items-center gap-3 font-medium text-blue-600"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                        +
                      </div>
                      Add "{searchTerm.trim()}" as custom skill
                    </button>
                  )}
                  
                  {/* Skills List */}
                  {filteredSkills.length > 0 && (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredSkills.map((skill, index) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={`${skill}-${index}`}
                            onClick={() => handleSkillSelect(skill)}
                            disabled={isSelected}
                            className={`w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700
                                       flex items-center justify-between group transition-colors
                                       ${isSelected ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                          >
                            <span className={isSelected ? 'text-gray-400' : ''}>
                              {skill}
                            </span>
                            {isSelected ? (
                              <span className="text-gray-400 text-sm">
                                <Check size={16} />
                              </span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-100 text-blue-600">
                                <Check size={16} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* No Results */}
                  {filteredSkills.length === 0 && searchTerm.trim() && (
                    <div className="px-4 py-6 text-gray-500 text-center">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">No matching skills found</p>
                      <p className="text-sm mt-1">Press Enter or click "Add" to create a custom skill</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {filteredSkills.length > 0 && totalPages > 1 && (
                    <div className="border-t border-gray-100 p-2 flex items-center justify-between bg-gray-50 rounded-b-lg">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPage(p => Math.max(1, p - 1));
                        }}
                        disabled={page === 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPage(p => Math.min(totalPages, p + 1));
                        }}
                        disabled={page === totalPages}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep(2)}
              disabled={selectedSkills.length === 0}
              className={`w-full py-3 rounded-lg font-semibold text-sm sm:text-base
                         shadow-md hover:shadow-lg transition-all 
                         flex items-center justify-center gap-2
                         ${selectedSkills.length === 0 
                           ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                           : 'bg-blue-600 text-white hover:bg-blue-700'
                         }`}
            >
              Next Step <ChevronRight size={20} />
            </button>

            {selectedSkills.length === 0 && (
              <p className="text-center text-sm text-gray-500">
                Please select at least one skill to continue
              </p>
            )}
          </div>
        )}

        {/* Step 2: Resume Upload */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Upload Your Resume</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Help us understand your background better (optional but recommended)
              </p>
            </div>

            {/* Experience Level Selector */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Where are you in your career?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Student / New Grad', value: 'entry' },
                  { label: 'Early Career', sublabel: '1–3 yrs', value: 'early' },
                  { label: 'Mid-Level', sublabel: '4–7 yrs', value: 'mid' },
                  { label: 'Senior+', sublabel: '8+ yrs', value: 'senior' },
                ].map(({ label, sublabel, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExperienceLevel(value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-sm font-medium transition-all
                      ${experienceLevel === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                  >
                    <span>{label}</span>
                    {sublabel && <span className="text-xs font-normal text-gray-400 mt-0.5">{sublabel}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Need a Template? */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <FileText className="h-5 w-5 text-blue-900" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Need a resume template?</p>
                    <p className="text-xs text-gray-500">Download our professional template to get started</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900 to-teal-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-12 w-12 text-blue-500 animate-bounce" />
                  <p className="text-blue-600 font-medium text-sm sm:text-base mt-4">Uploading & Analyzing Resume...</p>
                  <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
                </div>
              ) : (
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 flex flex-col items-center transition-colors"
                >
                  <Upload className="h-10 w-10 mb-3" />
                  <span className="font-medium text-sm sm:text-base">Click to upload your resume</span>
                  <span className="text-sm text-gray-500 mt-1">PDF, DOC, or DOCX (Max 10MB)</span>
                </label>
              )}
            </div>
            
            {/* Upload Status Messages */}
            {uploadSuccess && (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-100 text-green-800 rounded-lg border border-green-200">
                <Check size={20} />
                <span className="font-medium">Upload Successful!</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-start gap-2 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}

            {resumeName && !isUploading && !uploadSuccess && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-700 text-sm font-medium truncate pr-2">{resumeName}</span>
                </div>
                <button
                  onClick={() => {
                    setResumeFile(null);
                    setResumeName('');
                    setUploadError('');
                    storageUtils.removeItem(STORAGE_KEYS.USER_RESUME);
                    setUser(prev => ({...prev, resume: null}));
                  }}
                  className="text-green-700 hover:text-green-800 flex-shrink-0 p-1"
                  title="Remove resume"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300 font-medium text-sm sm:text-base
                         hover:bg-gray-50 transition-all disabled:opacity-50"
                disabled={isUploading}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm sm:text-base
                           shadow-md hover:shadow-lg transition-all
                           ${(isUploading || isSubmitting) 
                             ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                             : 'bg-blue-600 text-white hover:bg-blue-700'
                           }`}
                disabled={isUploading || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Complete Profile'}
              </button>
            </div>

            {/* Skip Option */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
                disabled={isUploading || isSubmitting}
              >
                Skip resume upload and continue
              </button>
            </div>
          </div>
        )}

        {/* Resume Template Download Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-900 to-teal-600 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">Resume Template</h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Preview Card */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="h-8 w-8 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Resume Template.docx</p>
                      <p className="text-sm text-gray-500 mt-1">Professional resume template with modern formatting</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Microsoft Word</span>
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">Editable</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  This template includes sections for your contact information, summary, experience, education, and skills.
                  You can customize it to fit your needs.
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-900 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                  >
                    <Download className="h-5 w-5" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerInterests;