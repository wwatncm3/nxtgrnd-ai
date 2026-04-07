import {
  generateEnhancedRecommendations,
  runCareerSimulation,
  generateDefaultTimeline,
  generateDefaultMarketData,
  generateFallbackSimulation
} from './CompassServices';

// Mock fetch globally
global.fetch = jest.fn();

describe('CompassServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        body: JSON.stringify({
          recommendations: {
            careerPaths: [{ id: 1, title: 'Engineer' }],
            marketTrends: [],
            careerSimulations: [],
            skillImpactAnalysis: []
          }
        })
      })
    });
  });

  describe('generateEnhancedRecommendations', () => {
    const mockUser = {
      userID: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      pathType: 'tech',
      careerStage: 'entry',
      primaryGoal: 'Get a job',
      interests: ['coding', 'AI'],
      skills: ['JavaScript', 'Python'],
      experienceLevel: 'entry'
    };

    it('should return null if no user ID provided', async () => {
      const result = await generateEnhancedRecommendations(null);
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null if user object has no userID', async () => {
      const result = await generateEnhancedRecommendations({});
      expect(result).toBeNull();
    });

    it('should make API request with correct payload', async () => {
      await generateEnhancedRecommendations(mockUser, true, false);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = global.fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.httpMethod).toBe('POST');
      expect(body.path).toBe('/recommendations/generate');

      const payload = JSON.parse(body.body);
      expect(payload.userId).toBe('user-123');
      expect(payload.firstName).toBe('John');
      expect(payload.interests).toEqual(['coding', 'AI']);
      expect(payload.includeEnhancedDetails).toBe(true);
      expect(payload.includePredictions).toBe(true);
    });

    it('should include forceRefresh flag when provided', async () => {
      await generateEnhancedRecommendations(mockUser, true, true);

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      const payload = JSON.parse(body.body);
      expect(payload.forceRefresh).toBe(true);
    });

    it('should return structured data on success', async () => {
      const result = await generateEnhancedRecommendations(mockUser);

      expect(result).toEqual({
        careerPaths: [{ id: 1, title: 'Engineer' }],
        marketTrends: [],
        simulations: [],
        skillImpact: []
      });
    });

    it('should handle API errors gracefully', async () => {
      // Use a non-retryable error (400 doesn't match 500/503/504 retry logic)
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(generateEnhancedRecommendations(mockUser)).rejects.toThrow(
        'Failed to fetch enhanced recommendations: 400'
      );
    });

    it('should handle empty interests and skills arrays', async () => {
      const userWithoutArrays = {
        userID: 'user-456',
        interests: null,
        skills: undefined
      };

      await generateEnhancedRecommendations(userWithoutArrays);

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      const payload = JSON.parse(body.body);
      expect(payload.interests).toEqual([]);
      expect(payload.skills).toEqual([]);
    });
  });

  describe('runCareerSimulation', () => {
    const mockUser = {
      userID: 'user-123',
      experienceLevel: 'mid'
    };

    const mockPath = {
      title: 'Software Engineer',
      requiredSkills: ['JavaScript', 'React'],
      salaryRange: '$80,000 - $120,000'
    };

    it('should make API request with correct simulation payload', async () => {
      await runCareerSimulation(mockUser, mockPath, 'certification');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      const innerBody = JSON.parse(body.body);

      expect(innerBody.requestType).toBe('career_simulation');
      expect(innerBody.careerPath).toBe('Software Engineer');
      expect(innerBody.scenarioType).toBe('certification');
      expect(innerBody.skills).toEqual(['JavaScript', 'React']);
    });

    it('should parse salary range correctly', async () => {
      await runCareerSimulation(mockUser, mockPath, 'skill_acquisition');

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      const innerBody = JSON.parse(body.body);
      expect(innerBody.currentSalary).toBe(80000);
    });

    it('should default to 50000 salary when salary range is invalid', async () => {
      const pathWithoutSalary = { ...mockPath, salaryRange: null };
      await runCareerSimulation(mockUser, pathWithoutSalary, 'certification');

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      const innerBody = JSON.parse(body.body);
      expect(innerBody.currentSalary).toBe(50000);
    });
  });

  describe('generateDefaultTimeline', () => {
    it('should return 4 timeline steps', () => {
      const path = { title: 'Data Scientist' };
      const timeline = generateDefaultTimeline(path);

      expect(timeline).toHaveLength(4);
    });

    it('should include path title in descriptions', () => {
      const path = { title: 'ML Engineer' };
      const timeline = generateDefaultTimeline(path);

      expect(timeline[0].description).toContain('ML Engineer');
    });

    it('should have correct structure for each step', () => {
      const path = { title: 'Developer' };
      const timeline = generateDefaultTimeline(path);

      timeline.forEach(step => {
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('timeline');
        expect(step).toHaveProperty('resources');
        expect(Array.isArray(step.resources)).toBe(true);
      });
    });

    it('should have progressive timelines', () => {
      const path = { title: 'Engineer' };
      const timeline = generateDefaultTimeline(path);

      expect(timeline[0].timeline).toBe('0-3 months');
      expect(timeline[1].timeline).toBe('3-6 months');
      expect(timeline[2].timeline).toBe('6-12 months');
      expect(timeline[3].timeline).toBe('12+ months');
    });
  });

  describe('generateDefaultMarketData', () => {
    it('should return market data with loading indicators', () => {
      const path = { requiredSkills: ['JavaScript', 'Python'] };
      const marketData = generateDefaultMarketData(path);

      expect(marketData.growthRate).toBe('Loading...');
      expect(marketData.demand).toBe('Loading...');
      expect(marketData.jobOpenings).toBe('Loading...');
    });

    it('should include path skills as top skills', () => {
      const path = { requiredSkills: ['React', 'Node.js'] };
      const marketData = generateDefaultMarketData(path);

      expect(marketData.topSkills).toEqual(['React', 'Node.js']);
    });

    it('should handle missing requiredSkills', () => {
      const path = {};
      const marketData = generateDefaultMarketData(path);

      expect(marketData.topSkills).toEqual([]);
    });

    it('should include loading industry placeholder', () => {
      const path = { requiredSkills: [] };
      const marketData = generateDefaultMarketData(path);

      expect(marketData.industries).toHaveLength(1);
      expect(marketData.industries[0].name).toContain('Loading');
    });
  });

  describe('generateFallbackSimulation', () => {
    const mockPath = {
      title: 'Software Engineer',
      requiredSkills: ['JavaScript', 'React', 'Node.js']
    };

    it('should generate simulation results with certification scenario', () => {
      const result = generateFallbackSimulation(mockPath, 'certification');

      expect(result.impact).toContain('certification');
      expect(result.impact).toContain('Software Engineer');
      expect(result.timeInvestment).toBe('6-12 months');
    });

    it('should generate simulation results with skill_acquisition scenario', () => {
      const result = generateFallbackSimulation(mockPath, 'skill_acquisition');

      expect(result.impact).toContain('skill acquisition');
      expect(result.timeInvestment).toBe('12-18 months');
    });

    it('should include salary increase between 20-50%', () => {
      const result = generateFallbackSimulation(mockPath, 'certification');

      expect(result.salaryIncrease).toBeGreaterThanOrEqual(20);
      expect(result.salaryIncrease).toBeLessThanOrEqual(50);
    });

    it('should include milestones', () => {
      const result = generateFallbackSimulation(mockPath, 'certification');

      expect(result.milestones).toHaveLength(2);
      expect(result.milestones[0]).toHaveProperty('type');
      expect(result.milestones[0]).toHaveProperty('title');
      expect(result.milestones[0]).toHaveProperty('timeline');
    });

    it('should include recommendations with path skills', () => {
      const result = generateFallbackSimulation(mockPath, 'certification');

      expect(result.recommendations).toHaveLength(4);
      expect(result.recommendations[0]).toContain('JavaScript');
    });

    it('should handle path without requiredSkills', () => {
      const pathWithoutSkills = { title: 'Analyst' };
      const result = generateFallbackSimulation(pathWithoutSkills, 'certification');

      expect(result.recommendations[0]).toContain('core competencies');
    });
  });
});
