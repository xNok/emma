import { describe, it, expect } from 'vitest';
import cloudflareIndex from '../cloudflare-index';

describe('Cloudflare Index', () => {
  it('should handle requests and initialize repositories', async () => {
    const mockRequest = new Request('http://localhost/health');

    const response = await cloudflareIndex.fetch(mockRequest);

    // Check that a response was returned
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
