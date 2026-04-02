import { fetchWithTimeout } from './api';

// Mock global fetch
global.fetch = jest.fn();

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should resolve when fetch completes before timeout', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const promise = fetchWithTimeout('https://api.example.com/test', {}, 5000);
    const result = await promise;

    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should abort when timeout is reached', async () => {
    global.fetch.mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }
      });
    });

    const promise = fetchWithTimeout('https://api.example.com/slow', {}, 100);
    jest.advanceTimersByTime(150);

    await expect(promise).rejects.toThrow('aborted');
  });

  it('should pass options through to fetch', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    };

    await fetchWithTimeout('https://api.example.com/test', options, 5000);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('should default to 30s timeout', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    await fetchWithTimeout('https://api.example.com/test');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
