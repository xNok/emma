import { createServer } from 'node:http';
import { toNodeHandler } from 'h3';
import app from './server';

const handler = toNodeHandler(app);

const server = createServer(handler);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
