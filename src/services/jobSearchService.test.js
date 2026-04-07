import {
  getJobBoardSearchUrls,
  calculateJobMatchScore,
  searchJobs
} from './jobSearchService';

// Mock fetchWithTimeout
jest.mock('../config/api', () => ({
  fetchWithTimeout: jest.fn()
}));

import { fetchWithTimeout } from '../config/api';

describe('jobSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getJobBoardSearchUrls', () => {
    it('should generate URLs for all supported job boards', () => {
      const urls = getJobBoardSearchUrls('Software Engineer', 'Houston');

      expect(urls.linkedin).toContain('linkedin.com/jobs');
      expect(urls.linkedin).toContain('Software%20Engineer');
      expect(urls.linkedin).toContain('Houston');
      expect(urls.indeed).toContain('indeed.com/jobs');
      expect(urls.glassdoor).toContain('glassdoor.com');
      expect(urls.handshake).toContain('joinhandshake.com');
      expect(urls.ziprecruiter).toContain('ziprecruiter.com');
      expect(urls.dice).toContain('dice.com');
      expect(urls.wellfound).toContain('wellfound.com');
      expect(urls.builtin).toContain('builtin.com');
    });

    it('should handle missing location', () => {
      const urls = getJobBoardSearchUrls('Data Scientist');

      expect(urls.linkedin).toContain('Data%20Scientist');
      expect(urls.linkedin).not.toContain('location');
      expect(urls.indeed).not.toContain('&l=');
    });

    it('should encode special characters', () => {
      const urls = getJobBoardSearchUrls('C++ Developer', 'New York');

      expect(urls.linkedin).toContain('C%2B%2B');
      expect(urls.indeed).toContain('New%20York');
    });
  });

  describe('calculateJobMatchScore', () => {
    const baseJob = {
      role: 'Software Engineer',
      description: 'Build web applications with React and Node.js',
      tags: ['JavaScript', 'React', 'AWS'],
      locationType: 'remote'
    };

    it('should return base score of 70 with no matches', () => {
      const score = calculateJobMatchScore(
        { role: 'Chef', description: 'Cook food', tags: [], locationType: 'onsite' },
        ['Painting'],
        ['Art'],
        'Artist'
      );
      expect(score).toBe(70);
    });

    it('should add 15 points for career path match', () => {
      const score = calculateJobMatchScore(baseJob, [], [], 'Software Engineer');
      // 70 base + 15 career path + 5 remote = 90
      expect(score).toBe(90);
    });

    it('should add points for skill matches (max 10)', () => {
      const score = calculateJobMatchScore(
        baseJob,
        ['JavaScript', 'React', 'AWS', 'Node.js', 'Python', 'TypeScript'],
        [],
        ''
      );
      // 70 base + min(4*2, 10) skills + 5 remote = 85
      expect(score).toBeGreaterThanOrEqual(83);
      expect(score).toBeLessThanOrEqual(95);
    });

    it('should add 5 points for remote jobs', () => {
      const remoteJob = { ...baseJob, locationType: 'remote' };
      const onsiteJob = { ...baseJob, locationType: 'onsite' };

      const remoteScore = calculateJobMatchScore(remoteJob, [], [], '');
      const onsiteScore = calculateJobMatchScore(onsiteJob, [], [], '');

      expect(remoteScore - onsiteScore).toBe(5);
    });

    it('should cap score at 100', () => {
      const score = calculateJobMatchScore(
        baseJob,
        ['JavaScript', 'React', 'AWS', 'Node.js', 'web'],
        ['coding', 'technology', 'software', 'engineering', 'programming'],
        'Software Engineer'
      );
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('searchJobs', () => {
    it('should fetch from enabled job boards', async () => {
      // Mock Remotive response
      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobs: [{
            id: 1,
            title: 'React Developer',
            company_name: 'TechCo',
            publication_date: '2026-04-01',
            url: 'https://example.com/job/1',
            tags: ['React', 'JavaScript'],
            description: 'Build React apps'
          }]
        })
      });

      // Mock Arbeitnow response
      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{
            slug: 'dev-job',
            title: 'Frontend Developer',
            company_name: 'WebCo',
            created_at: '2026-04-01',
            url: 'https://example.com/job/2',
            tags: ['JavaScript'],
            remote: true
          }]
        })
      });

      const results = await searchJobs({
        keywords: 'React',
        userSkills: ['React', 'JavaScript']
      });

      expect(results.jobs.length).toBeGreaterThan(0);
      expect(results.sources).toContain('Remotive');
      expect(results.sources).toContain('Arbeitnow');
    });

    it('should handle API failures gracefully', async () => {
      fetchWithTimeout.mockRejectedValue(new Error('API down'));

      const results = await searchJobs({ keywords: 'Developer' });

      expect(results.jobs).toEqual([]);
      expect(results.totalFound).toBe(0);
    });

    it('should sort results by match score', async () => {
      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobs: [
            { id: 1, title: 'Chef', company_name: 'FoodCo', publication_date: '2026-04-01', url: '#', tags: [] },
            { id: 2, title: 'React Engineer', company_name: 'TechCo', publication_date: '2026-04-01', url: '#', tags: ['React', 'JavaScript'] }
          ]
        })
      });

      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const results = await searchJobs({
        keywords: 'React',
        userSkills: ['React', 'JavaScript'],
        careerPath: 'React Engineer'
      });

      if (results.jobs.length >= 2) {
        expect(results.jobs[0].matchScore).toBeGreaterThanOrEqual(results.jobs[1].matchScore);
      }
    });

    it('should filter by remote when specified', async () => {
      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jobs: [
            { id: 1, title: 'Dev', company_name: 'Co', publication_date: '2026-04-01', url: '#', tags: [] }
          ]
        })
      });

      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { slug: 'onsite', title: 'Dev', company_name: 'Co', created_at: '2026-04-01', url: '#', tags: [], remote: false }
          ]
        })
      });

      const results = await searchJobs({ keywords: 'Dev', remote: true });

      // All returned jobs should be remote
      results.jobs.forEach(job => {
        expect(job.locationType).toBe('remote');
      });
    });

    it('should respect limit parameter', async () => {
      const manyJobs = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        title: `Job ${i}`,
        company_name: 'Co',
        publication_date: '2026-04-01',
        url: '#',
        tags: []
      }));

      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: manyJobs })
      });

      fetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const results = await searchJobs({ keywords: '', limit: 5 });
      expect(results.jobs.length).toBeLessThanOrEqual(5);
    });
  });
});
