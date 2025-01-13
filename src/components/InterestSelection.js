import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Compass, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { UserContext } from '../App';
import Papa from 'papaparse';

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

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/skills.csv');
        const text = await response.text();

        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Filter base skills (remove text after hyphen)
            const skills = [...new Set(
              results.data
                .map((row) => {
                  const skillText = row['Skill'] || row['skill'];
                  if (typeof skillText === 'string') {
                    const index = skillText.indexOf('-');
                    return index !== -1 ? skillText.substring(0, index).trim() : skillText.trim();
                  }
                  return null;
                })
                .filter(Boolean)
                .sort() // Sort alphabetically
            )];

            setSkillOptions(skills);
            setIsLoading(false);
            console.log(`Parsed ${skills.length} skills`);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          },
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setIsLoading(false);
      }
    };

    fetchSkills();
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
    setSelectedSkills((prev) => [...prev, skill]);
    setIsDropdownOpen(false);
  };

  const handleSkillRemove = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      alert('Invalid file type. Please upload a .pdf, .doc, or .docx file.');
      return;
    }

    try {
      const base64Content = await toBase64(file);
      const response = await fetch('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `${user.userID}/resume/${file.name}`,
          fileContent: base64Content,
        }),
      });

      const responseData = await response.json();
      console.log('File upload response:', responseData);

      if (response.ok) {
        setResumeFile(file);
        setResumeName(file.name);
        alert('File uploaded successfully!');
      } else {
        throw new Error(responseData.message || 'Unknown error occurred.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload the file. Please try again.');
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
    if (!user || !user.userID) {
      console.error('UserID is missing');
      return;
    }

    try {
      const preferencesPayload = {
        userId: user.userID,
        skills: selectedSkills,
        experienceLevel,
        resume: resumeName || null
      };

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

      setUser(prevUser => ({
        ...prevUser,
        skills: selectedSkills,
        experienceLevel
      }));

      onComplete({
        skills: selectedSkills,
        experienceLevel,
        resume: resumeName
      });
    } catch (error) {
      console.error('Error:', error);
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

        {/* Step 1: Skills */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Select Skills</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when searching
                  setIsDropdownOpen(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setIsDropdownOpen(false)}
              />
              {/* Show dropdown if we have any filtered skills */}
              {isLoading ? (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg p-4 text-center">
                  Loading skills...
                </div>
              ) : isDropdownOpen && filteredSkills.length > 0 ? (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSkills.map((skill, index) => (
                    <button
                      key={`${skill}-${index}`}
                      onClick={() => handleSkillSelect(skill)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Pagination controls */}
            {!isLoading && filteredSkills.length > 0 && (
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 disabled:opacity-50"
                >
                  <ChevronUp />
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 disabled:opacity-50"
                >
                  <ChevronDown />
                </button>
              </div>
            )}

            {/* Display selected skills as badges */}
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill, index) => (
                <span
                  key={`selected-${skill}-${index}`}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center"
                >
                  {skill}
                  <button
                    onClick={() => handleSkillRemove(skill)}
                    className="ml-1 focus:outline-none"
                  >
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Next Step <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Resume Upload */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Upload Your Resume</h2>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              className="border border-gray-300 rounded-lg p-2 w-full"
            />
            {resumeName && (
              <p className="text-green-600 mt-2">Uploaded: {resumeName}</p>
            )}
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 py-3 rounded-lg text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              Complete Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerInterests;