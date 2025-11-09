import { toWebHandler } from './server';

// Create the H3 web handler
const handler = toWebHandler();

/**
 * Cloudflare Workers entry point using Nitro bindings
 * Nitro automatically provides access to bindings via event.context.cloudflare
 */
export default {
  async fetch(request: Request) {
    // Nitro will automatically pass bindings through event.context.cloudflare
    return handler(request);
  },
};
