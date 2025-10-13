#!/usr/bin/env node
// Simple generator to convert openapi.yaml to a runtime TS module (src/openapi.ts)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, '..');
const yamlPath = resolve(root, 'openapi.yaml');
const tsOut = resolve(root, 'src', 'openapi.ts');

const src = readFileSync(yamlPath, 'utf8');
const obj = YAML.parse(src);

const header = `// Auto-generated from openapi.yaml. Do not edit by hand.\n/* eslint-disable */\n/* istanbul ignore file */\n/* eslint-disable prettier/prettier */\n`;
const body = `export const openApiSpec = ${JSON.stringify(obj, null, 2)} as const;\n\nexport type OpenApiObject = typeof openApiSpec;\n`;

writeFileSync(tsOut, header + body, 'utf8');
console.log(`Wrote ${tsOut}`);
