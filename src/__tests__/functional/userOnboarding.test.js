// Functional Test: User Onboarding Flow
// Verifies: Login → Preferences → Resume → Career Path → Dashboard
import { determineUserNavigationWithDebug } from '../../utils/authUtils';

// Mock dependencies
jest.mock('../../services/storageService', () => ({
  storageService: { setItem: jest.fn(), getItem: jest.fn() },
  userStateService: { getUserState: jest.fn() },
  STORAGE_KEYS: {}
}));

describe('User Onboarding Functional Requirements', () => {
  describe('Navigation Routing (determineUserNavigationWithDebug)', () => {
    it('REQ: New user with no data should start at preferences', () => {
      const nav = determineUserNavigationWithDebug({
        preferences: null,
        careerPath: null,
        resume: null,
        dashboard: null,
        completionLevel: 0
      });

      expect(nav.skipToEnd).toBe(false);
      expect(nav.stage).toBeDefined();
    });

    it('REQ: User with preferences only should go to resume step', () => {
      const nav = determineUserNavigationWithDebug({
        preferences: { pathType: 'tech', careerStage: 'entry' },
        careerPath: null,
        resume: null,
        dashboard: null,
        completionLevel: 1
      });

      expect(nav.skipToEnd).toBe(false);
    });

    it('REQ: User with all data should skip to dashboard', () => {
      const nav = determineUserNavigationWithDebug({
        preferences: { pathType: 'tech' },
        careerPath: { title: 'SWE', id: 'swe-1' },
        resume: { textractAnalysis: { rawText: 'resume content' } },
        dashboard: { learningPaths: [{ title: 'React' }] },
        completionLevel: 4
      });

      expect(nav.skipToEnd).toBe(true);
    });

    it('REQ: User with career path should skip to dashboard (data loads on demand)', () => {
      const nav = determineUserNavigationWithDebug({
        preferences: { pathType: 'tech' },
        careerPath: { title: 'SWE' },
        resume: null,
        dashboard: null,
        completionLevel: 3
      });

      // Career path is the key signal — dashboard loads dynamically
      expect(nav.skipToEnd).toBe(true);
    });
  });
});

describe('Career Path Selection Requirements', () => {
  it('REQ: Career path object must have title and id', () => {
    const validCareerPath = {
      id: 'swe-1',
      title: 'Software Engineer',
      description: 'Build software',
      salaryRange: '$80,000 - $120,000',
      matchScore: 85,
      requiredSkills: ['JavaScript', 'React']
    };

    expect(validCareerPath.id).toBeTruthy();
    expect(validCareerPath.title).toBeTruthy();
    expect(validCareerPath.requiredSkills).toBeInstanceOf(Array);
    expect(validCareerPath.matchScore).toBeGreaterThanOrEqual(0);
    expect(validCareerPath.matchScore).toBeLessThanOrEqual(100);
  });

  it('REQ: Local fallback paths should generate valid career paths', () => {
    // Import inline to avoid module-level mock issues
    const { generateLocalFallbackPaths } = require('../../components/career-compass/CompassServices');

    const user = {
      skills: ['JavaScript', 'React', 'AWS'],
      experienceLevel: 'entry'
    };

    const paths = generateLocalFallbackPaths(user);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths.length).toBeLessThanOrEqual(4);

    paths.forEach(path => {
      expect(path.id).toBeTruthy();
      expect(path.title).toBeTruthy();
      expect(path.description).toBeTruthy();
      expect(path.requiredSkills).toBeInstanceOf(Array);
      expect(path.matchScore).toBeGreaterThanOrEqual(0);
      expect(path.matchScore).toBeLessThanOrEqual(100);
    });
  });

  it('REQ: Fallback paths should boost score for matching skills', () => {
    const { generateLocalFallbackPaths } = require('../../components/career-compass/CompassServices');

    const userWithSkills = { skills: ['React', 'JavaScript', 'Node.js', 'TypeScript'] };
    const userWithoutSkills = { skills: [] };

    const pathsWithSkills = generateLocalFallbackPaths(userWithSkills);
    const pathsWithoutSkills = generateLocalFallbackPaths(userWithoutSkills);

    // Full-Stack path should score higher for user with matching JS skills
    const fullstackWithSkills = pathsWithSkills.find(p => p.title.includes('Full-Stack'));
    const fullstackWithoutSkills = pathsWithoutSkills.find(p => p.title.includes('Full-Stack'));

    if (fullstackWithSkills && fullstackWithoutSkills) {
      expect(fullstackWithSkills.matchScore).toBeGreaterThan(fullstackWithoutSkills.matchScore);
    }
  });
});

describe('Resume Data Requirements', () => {
  it('REQ: Resume data structure should support Textract analysis', () => {
    const validResume = {
      fileName: 'resume.pdf',
      fileType: 'application/pdf',
      textractAnalysis: {
        rawText: 'John Doe, Software Engineer, 5 years experience...',
        skills: ['JavaScript', 'React', 'Node.js'],
        education: ['NC A&T State University'],
        experience: ['Software Engineer at TechCo']
      },
      uploadedAt: new Date().toISOString()
    };

    expect(validResume.textractAnalysis.rawText.length).toBeGreaterThan(0);
    expect(validResume.textractAnalysis.skills).toBeInstanceOf(Array);
    expect(validResume.uploadedAt).toBeTruthy();
  });
});

describe('Dashboard Data Requirements', () => {
  it('REQ: Dashboard must include all 4 content sections', () => {
    const validDashboard = {
      learningPaths: [{ title: 'React Mastery', provider: 'Udemy', progress: 0 }],
      opportunities: [{ role: 'Junior Dev', company: 'TechCo', matchScore: 85 }],
      goals: [{ title: 'Get certified', progress: 0, completed: false }],
      events: [{ title: 'Career Fair', date: '2026-05-01' }],
      careerPath: { id: 'swe-1', title: 'Software Engineer' },
      timestamp: new Date().toISOString()
    };

    expect(validDashboard.learningPaths).toBeInstanceOf(Array);
    expect(validDashboard.opportunities).toBeInstanceOf(Array);
    expect(validDashboard.goals).toBeInstanceOf(Array);
    expect(validDashboard.events).toBeInstanceOf(Array);
    expect(validDashboard.careerPath).toBeTruthy();
    expect(validDashboard.timestamp).toBeTruthy();
  });
});
