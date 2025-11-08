import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Copy templates
  const templatesSrc = path.resolve(__dirname, '../src/templates');
  const templatesDest = path.resolve(__dirname, '../dist/templates');
  await mkdir(templatesDest, { recursive: true });
  await cp(templatesSrc, templatesDest, { recursive: true });
  console.log(`Copied templates to ${templatesDest}`);
}

main().catch((err) => {
  console.error('Failed to copy templates', err);
  process.exit(1);
});
