import API_CONFIG, {
  makeRecommendationRequest,
  uploadFile,
  downloadFile,
  getDynamicOptions,
  validateAPIConfig
} from './api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API_CONFIG', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Endpoint Configuration', () => {
    it('should have recommendations endpoint configured', () => {
      expect(API_CONFIG.recommendations).toBeDefined();
      expect(API_CONFIG.recommendations.generate).toBeInstanceOf(Function);
      expect(API_CONFIG.recommendations.generate()).toContain('recommendations');
    });

    it('should have files endpoint configured with upload and download', () => {
      expect(API_CONFIG.files).toBeDefined();
      expect(API_CONFIG.files.upload).toBeInstanceOf(Function);
      expect(API_CONFIG.files.download).toBeInstanceOf(Function);
      expect(API_CONFIG.files.upload()).toContain('/upload');
      expect(API_CONFIG.files.download()).toContain('/download');
    });

    it('should have dynamic options endpoint configured', () => {
      expect(API_CONFIG.dynamicOptions).toBeDefined();
      expect(API_CONFIG.dynamicOptions.get).toBeInstanceOf(Function);
      expect(API_CONFIG.dynamicOptions.get()).toContain('dynamic-options');
    });

    it('should have analytics endpoint configured', () => {
      expect(API_CONFIG.analytics).toBeDefined();
      expect(API_CONFIG.analytics.get).toBeInstanceOf(Function);
      expect(API_CONFIG.analytics.enabled).toBeInstanceOf(Function);
    });

    it('should validate API configuration', () => {
      const result = validateAPIConfig();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Default URLs', () => {
    it('should use default recommendations URL when env var not set', () => {
      const url = API_CONFIG.recommendations.generate();
      expect(url).toBe('https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate');
    });

    it('should use default files URL when env var not set', () => {
      const uploadUrl = API_CONFIG.files.upload();
      const downloadUrl = API_CONFIG.files.download();
      expect(uploadUrl).toBe('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/upload');
      expect(downloadUrl).toBe('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/download');
    });

    it('should use default dynamic options URL when env var not set', () => {
      const url = API_CONFIG.dynamicOptions.get();
      expect(url).toBe('https://qvuwgujm49.execute-api.us-east-1.amazonaws.com/dev/dynamic-options');
    });
  });
});

describe('API Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('makeRecommendationRequest', () => {
    it('should make POST request with correct payload structure', async () => {
      const payload = { userId: 'test-123', careerPath: 'Software Engineer' };

      await makeRecommendationRequest(payload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        API_CONFIG.recommendations.generate(),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );

      // Verify the body structure
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.httpMethod).toBe('POST');
      expect(callBody.path).toBe('/recommendations/generate');
      expect(JSON.parse(callBody.body)).toEqual(payload);
    });

    it('should return parsed JSON response', async () => {
      const mockResponse = { recommendations: { careerPaths: [] } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await makeRecommendationRequest({ userId: 'test' });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadFile', () => {
    it('should make POST request to upload endpoint', async () => {
      const formData = new FormData();
      formData.append('file', 'test-content');

      await uploadFile(formData);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        API_CONFIG.files.upload(),
        expect.objectContaining({
          method: 'POST',
          body: formData
        })
      );
    });
  });

  describe('downloadFile', () => {
    it('should make POST request with filename payload', async () => {
      const payload = { filename: 'user123/resume/document.pdf' };

      await downloadFile(payload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        API_CONFIG.files.download(),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      );
    });
  });

  describe('getDynamicOptions', () => {
    it('should make POST request to dynamic options endpoint', async () => {
      const payload = { userId: 'test-123', skills: ['JavaScript'] };

      await getDynamicOptions(payload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        API_CONFIG.dynamicOptions.get(),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in makeRecommendationRequest', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(makeRecommendationRequest({})).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors in makeRecommendationRequest', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({})
      });

      await expect(makeRecommendationRequest({})).rejects.toThrow(
        'API request failed: 500 Internal Server Error'
      );
    });

    it('should handle HTTP errors in uploadFile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        json: () => Promise.resolve({})
      });

      const formData = new FormData();
      await expect(uploadFile(formData)).rejects.toThrow(
        'File upload failed: 413 Payload Too Large'
      );
    });

    it('should handle HTTP errors in downloadFile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({})
      });

      await expect(downloadFile({ filename: 'invalid' })).rejects.toThrow(
        'File download failed: 404 Not Found'
      );
    });

    it('should handle HTTP errors in getDynamicOptions', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({})
      });

      await expect(getDynamicOptions({})).rejects.toThrow(
        'Dynamic options request failed: 400 Bad Request'
      );
    });
  });
});
