/**
 * API Worker Resolution Utilities
 * Provides shared logic for resolving and loading pre-built API worker scripts
 */

import path from 'path';
import fs from 'fs-extra';

export interface WorkerResolutionResult {
  scriptPath: string;
  scriptContent: string;
  packageVersion: string;
  packageDir: string;
}

export interface WorkerResolutionOptions {
  platform: 'cloudflare' | 'node';
  packageName?: string;
  version?: string;
}

/**
 * Resolve the API worker package and load its pre-built script
 *
 * @param options - Resolution options
 * @returns Worker resolution result with script content and metadata
 * @throws Error if the worker package or script cannot be found
 */
export async function resolveApiWorker(
  options: WorkerResolutionOptions
): Promise<WorkerResolutionResult> {
  const packageName = options.packageName || '@xnok/emma-api-worker';

  // 1. Find the root directory of the installed worker package
  let workerPackageDir: string;
  let packageJson: { name: string; version: string };

  try {
    // We try to resolve first naturally
    let packageJsonPath: string;
    try {
      packageJsonPath = require.resolve(`${packageName}/package.json`);
    } catch (e) {
      // If not found, use explicit paths
      packageJsonPath = require.resolve(`${packageName}/package.json`, {
        paths: [process.cwd(), __dirname],
      });
    }
    workerPackageDir = path.dirname(packageJsonPath);
    packageJson = (await fs.readJSON(packageJsonPath)) as {
      name: string;
      version: string;
    };
  } catch (e) {
    throw new Error(
      `Fatal: '${packageName}' not found. Make sure the package is installed.`
    );
  }

  // 2. Find the pre-built script file
  // The path differs slightly depending on the Nitro preset target
  let platformSubdir: string = options.platform;

  if (options.platform === 'cloudflare') {
    platformSubdir = 'cloudflare-worker';
  } else if (options.platform === 'node') {
    platformSubdir = 'node-server';
  }

  const scriptPath = path.join(
    workerPackageDir,
    'dist',
    platformSubdir,
    'server',
    'index.mjs'
  );

  if (!(await fs.pathExists(scriptPath))) {
    throw new Error(
      `Could not find pre-built file at ${scriptPath}. ` +
        `Make sure the package has been built for platform '${options.platform}'.`
    );
  }

  // 3. Read the script
  const scriptContent = await fs.readFile(scriptPath, 'utf8');

  // 4. Optionally validate version if specified
  if (options.version && packageJson.version !== options.version) {
    console.warn(
      `Warning: Requested version ${options.version} but found ${packageJson.version}`
    );
  }

  return {
    scriptPath,
    scriptContent,
    packageVersion: packageJson.version,
    packageDir: workerPackageDir,
  };
}

/**
 * Get the installed version of the API worker package
 *
 * @param packageName - Optional package name (defaults to @xnok/emma-api-worker)
 * @returns Package version or null if not found
 */
export async function getApiWorkerVersion(
  packageName = '@xnok/emma-api-worker'
): Promise<string | null> {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [process.cwd(), __dirname],
    });
    const packageJson = (await fs.readJSON(packageJsonPath)) as {
      version: string;
    };
    return packageJson.version;
  } catch (e) {
    return null;
  }
}
