import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const src = path.resolve(__dirname, '../src/templates');
  const dest = path.resolve(__dirname, '../dist/templates');
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
  console.log(`Copied templates to ${dest}`);
}

main().catch((err) => {
  console.error('Failed to copy templates', err);
  process.exit(1);
});
