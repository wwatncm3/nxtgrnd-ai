import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Compass, ChevronRight, ChevronDown, ChevronUp, X, Search, Check, Upload } from 'lucide-react';
import { UserContext } from '../App';
import  skillsData  from '../data/skills';
import { storageUtils } from '../utils/authUtils';

const CareerInterests = ({ onComplete, initialData = {} }) => {
  const { user, setUser } = useContext(UserContext);
  const [selectedSkills, setSelectedSkills] = useState(initialData.skills || []);
  const [experienceLevel, setExperienceLevel] = useState(initialData.experienceLevel || '');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [step, setStep] = useState(1);
  const [skillOptions, setSkillOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Pagination constants
  const skillsPerPage = 20;

  // ✅ FIX: State to manage the success message visibility
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  // Add a new state variable to track upload loading status
const [isUploading, setIsUploading] = useState(false);

// Then modify the handleResumeUpload function to use this state
const handleResumeUpload = async (e) => {
  const file = e.target.files[0];
  console.log('Resume upload initiated:', {
    name: file?.name,
    type: file?.type,
    size: file?.size
  });

  if (!file) {
    // No alert needed if the user cancels the file dialog
    return;
  }

  // Enhanced file validation
  const validTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };
  
  if (!validTypes[file.type]) {
    alert(`Invalid file type. Please upload a PDF, DOC, or DOCX file. Current type: ${file.type}`);
    return;
  }

  // Check file size (10MB limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    alert('File size too large. Please upload a file smaller than 10MB.');
    return;
  }

  // Set uploading state to true to show loading animation
  setIsUploading(true);

  try {
    const base64Content = await toBase64(file);
    console.log('File converted to base64:', {
      contentLength: base64Content?.length,
      filename: `${user.userID}/resume/${file.name}`
    });

    const response = await fetch('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/upload', {
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
    });

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
        textract: responseData.textractAnalysis || null
      };

      // Store complete resume data in session storage
      console.log('Storing resume data:', {
        name: resumeData.name,
        type: resumeData.type,
        hasTextract: !!resumeData.textract,
        path: resumeData.path
      });
      
      storageUtils.setItem('userResume', JSON.stringify(resumeData));

      // Update component state
      setResumeFile(file);
      setResumeName(file.name);
      
      // Update user context
      setUser(prevUser => ({
        ...prevUser,
        resume: resumeData
      }));

      // ✅ FIX: Remove alert and set success state instead
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000); // Hide message after 3 seconds

    } else {
      throw new Error(responseData.message || 'Unknown error occurred.');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload the file. Please try again.');
  } finally {
    // Set uploading state back to false when done (success or error)
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

  // Add this state
const [isSubmitting, setIsSubmitting] = useState(false);

// Then modify the handleSubmit function
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
    const storedResume = storageUtils.getItem('userResume');
    console.log('Retrieved resume from session storage:', storedResume ? 'Found' : 'Not found');

    const preferencesPayload = {
      userId: user.userID,
      skills: selectedSkills,
      experienceLevel,
      resume: storedResume ? JSON.parse(storedResume) : null
    };

    console.log('Sending preferences payload:', preferencesPayload);

    const response = await fetch(
      'https://qvuwgujm49.execute-api.us-east-1.amazonaws.com/dev/dynamic-options',
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

    // ✅ FIX: Create the complete updated user data
    const updatedUserData = {
      ...user,
      skills: selectedSkills,
      experienceLevel,
      resume: storedResume ? JSON.parse(storedResume) : null
    };

    console.log('Passing complete user data to parent:', updatedUserData);

    // ✅ FIX: Pass complete data to parent - let parent handle setUser
    // Remove the local setUser call and setTimeout
    onComplete(updatedUserData);

  } catch (error) {
    console.error('Error:', error);
    alert('Failed to save preferences. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-center">CareerDay</h1>
        </div>
        <p className="text-gray-600 text-center mb-8">
          Help us understand your interests to personalize your career journey
        </p>

        {step === 1 && (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold">Select Skills</h2>
    
    {/* Display selected skills as badges ABOVE the search */}
    <div className="flex flex-wrap gap-2 min-h-[40px]">
      {selectedSkills.map((skill, index) => (
        <span
          key={`selected-${skill}-${index}`}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full flex items-center
                   border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          {skill}
          <button
            onClick={() => handleSkillRemove(skill)}
            className="ml-2 hover:text-blue-800 focus:outline-none"
          >
            <X size={14} />
          </button>
        </span>
      ))}
    </div>

    {/* Enhanced search input with add functionality */}
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Type to search or add custom skills..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
            setIsDropdownOpen(true);
          }}
          onKeyDown={(e) => {
            // Allow adding custom skills with Enter key
            if (e.key === 'Enter' && searchTerm.trim()) {
              e.preventDefault();
              const trimmedSkill = searchTerm.trim();
              if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
                setSelectedSkills((prev) => [...prev, trimmedSkill]);
                setSearchTerm('');
                setIsDropdownOpen(false);
              }
            }
            // Close dropdown with Escape key
            if (e.key === 'Escape') {
              setIsDropdownOpen(false);
            }
          }}
          className="w-full px-4 py-2 pl-10 pr-20 border border-gray-200 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onFocus={() => setIsDropdownOpen(true)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        
        {/* Add custom skill button */}
        {searchTerm.trim() && !selectedSkills.includes(searchTerm.trim()) && (
          <button
            onClick={() => {
              const trimmedSkill = searchTerm.trim();
              if (trimmedSkill) {
                setSelectedSkills((prev) => [...prev, trimmedSkill]);
                setSearchTerm('');
                setIsDropdownOpen(false);
              }
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 
                     bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        )}
      </div>

      {/* Show instructions when no search term */}
      {!searchTerm && (
        <div className="mt-2 text-sm text-gray-500">
          💡 Type to search from our skills database or add your own custom skills by pressing Enter
        </div>
      )}

      {isLoading ? (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : isDropdownOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Option to add custom skill at the top */}
          {searchTerm.trim() && !skillOptions.some(skill => 
            skill.toLowerCase() === searchTerm.trim().toLowerCase()
          ) && !selectedSkills.includes(searchTerm.trim()) && (
            <button
              onClick={() => {
                const trimmedSkill = searchTerm.trim();
                setSelectedSkills((prev) => [...prev, trimmedSkill]);
                setSearchTerm('');
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100
                       flex items-center gap-2 font-medium text-blue-600"
            >
              <span className="text-lg">+</span>
              Add "{searchTerm.trim()}" as custom skill
            </button>
          )}
          
          {/* Dropdown list of matching skills */}
          {filteredSkills.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {filteredSkills.map((skill, index) => (
                <button
                  key={`${skill}-${index}`}
                  onClick={() => handleSkillSelect(skill)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700
                           flex items-center justify-between group"
                  disabled={selectedSkills.includes(skill)}
                >
                  <span className={selectedSkills.includes(skill) ? 'text-gray-400' : ''}>
                    {skill}
                  </span>
                  {selectedSkills.includes(skill) ? (
                    <span className="text-gray-400">
                      <Check size={16} />
                    </span>
                  ) : (
                    <span className="opacity-0 group-hover:opacity-100 text-blue-600">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* No results message */}
          {filteredSkills.length === 0 && searchTerm.trim() && (
            <div className="px-4 py-3 text-gray-500 text-center">
              No matching skills found. Press Enter or click "Add" to create a custom skill.
            </div>
          )}
          
          {/* Pagination at bottom of dropdown (only show if we have results) */}
          {filteredSkills.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-100 p-2 flex items-center justify-between bg-gray-50 rounded-b-lg">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPage(p => Math.max(1, p - 1));
                }}
                disabled={page === 1}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
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
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    <button
      onClick={() => setStep(2)}
      disabled={selectedSkills.length === 0}
      className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold 
               hover:bg-blue-700 shadow-md hover:shadow-lg transition-all 
               flex items-center justify-center gap-2 disabled:opacity-50
               disabled:cursor-not-allowed"
    >
      Next Step <ChevronRight size={20} />
    </button>
  </div>
)}

{step === 2 && (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold">Upload Your Resume</h2>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-blue-600 font-medium">Uploading & Analyzing Resume...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
        </div>
      ) : (
        <label
          htmlFor="resume-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-700 flex flex-col items-center"
        >
          <Upload className="h-8 w-8 mb-2" />
          <span className="font-medium">Click to upload your resume</span>
          <span className="text-sm text-gray-500 mt-1">PDF, DOC, or DOCX</span>
        </label>
      )}
    </div>
    
    {/* ✅ FIX: Conditionally render success message or file name */}
    {uploadSuccess ? (
      <div className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg transition-all">
        <Check size={20} />
        <span className="font-medium">Upload Successful!</span>
      </div>
    ) : resumeName && !isUploading && (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
        <span className="text-green-700 truncate pr-2">{resumeName}</span>
        <button
          onClick={() => {
            setResumeFile(null);
            setResumeName('');
            // ✅ FIX: Ensure resume is cleared from session and context
            storageUtils.removeItem('userResume');
            setUser(prev => ({...prev, resume: null}));
          }}
          className="text-green-700 hover:text-green-800 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    )}

    <div className="flex gap-4">
      <button
        onClick={() => setStep(1)}
        className="flex-1 py-3 rounded-lg border border-gray-300 font-medium
                 hover:bg-gray-50 transition-all"
        disabled={isUploading}
      >
        Back
      </button>
      <button
  onClick={handleSubmit}
  className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold
           hover:bg-blue-700 shadow-md hover:shadow-lg transition-all
           disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isUploading || isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Complete Profile'}
</button>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default CareerInterests;