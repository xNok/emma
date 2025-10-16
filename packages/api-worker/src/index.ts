import { serve } from '@hono/node-server';
import app from './server';

console.log('Server is running on http://localhost:3000');

serve({
  fetch: app.fetch,
  port: 3000,
});
