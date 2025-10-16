/**
 * Emma Configuration Management
 * Handles local storage and configuration for the Emma CLI
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import type { FormSchema } from '@xnok/emma-shared/types';

export interface EmmaConfigData {
  initialized: boolean;
  defaultTheme: string;
  localServerPort: number;
  localServerHost: string;
  formsDirectory: string;
  buildsDirectory: string;
  // Optional deployment provider defaults
  cloudflare?: {
    bucket?: string;
    publicUrl?: string;
    accountId?: string;
  };
}

export class EmmaConfig {
  private configDir: string;
  private configFile: string;
  private data: EmmaConfigData;

  constructor(customConfigDir?: string) {
    this.configDir = customConfigDir || path.join(os.homedir(), '.emma');
    this.configFile = path.join(this.configDir, 'config.json');

    // Default configuration
    this.data = {
      initialized: false,
      defaultTheme: 'default',
      localServerPort: 3333,
      localServerHost: 'localhost',
      formsDirectory: path.join(this.configDir, 'forms'),
      buildsDirectory: path.join(this.configDir, 'builds'),
    };
  }

  /**
   * Load configuration from disk
   */
  async load(): Promise<void> {
    try {
      if (await fs.pathExists(this.configFile)) {
        const fileData = (await fs.readJson(this.configFile)) as Record<
          string,
          string | number | boolean
        >;
        this.data = { ...this.data, ...fileData };
      }
    } catch (error) {
      // If config file is corrupted, start with defaults
      console.warn('Warning: Could not load configuration, using defaults');
    }
  }

  /**
   * Save configuration to disk
   */
  async save(): Promise<void> {
    await fs.ensureDir(this.configDir);
    await fs.writeJson(this.configFile, this.data, { spaces: 2 });
  }

  /**
   * Initialize Emma configuration
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.configDir);
    await fs.ensureDir(this.data.formsDirectory);
    await fs.ensureDir(this.data.buildsDirectory);

    this.data.initialized = true;
    await this.save();
  }

  /**
   * Check if Emma is initialized
   */
  isInitialized(): boolean {
    return this.data.initialized;
  }

  /**
   * Get configuration values
   */
  get<K extends keyof EmmaConfigData>(key: K): EmmaConfigData[K] {
    return this.data[key];
  }

  /**
   * Set configuration values
   */
  set<K extends keyof EmmaConfigData>(key: K, value: EmmaConfigData[K]): void {
    this.data[key] = value;
  }

  /**
   * Get the forms directory path
   */
  getFormsDir(): string {
    return this.data.formsDirectory;
  }

  /**
   * Get the builds directory path
   */
  getBuildsDir(): string {
    return this.data.buildsDirectory;
  }

  /**
   * Get form schema file path
   */
  getFormPath(formId: string): string {
    return path.join(this.data.formsDirectory, `${formId}.yaml`);
  }

  /**
   * Get form build directory path
   */
  getBuildPath(formId: string): string {
    return path.join(this.data.buildsDirectory, formId);
  }

  /**
   * Save form schema
   */
  async saveFormSchema(formId: string, schema: FormSchema): Promise<void> {
    const formPath = this.getFormPath(formId);
    await fs.ensureDir(path.dirname(formPath));
    const yamlContent = yaml.dump(schema, { indent: 2 });
    await fs.writeFile(formPath, yamlContent, 'utf8');
  }

  /**
   * Load form schema
   */
  async loadFormSchema(formId: string): Promise<FormSchema | null> {
    const formPath = this.getFormPath(formId);

    if (!(await fs.pathExists(formPath))) {
      return null;
    }

    try {
      const yamlContent = await fs.readFile(formPath, 'utf8');
      return yaml.load(yamlContent) as FormSchema;
    } catch (error) {
      throw new Error(
        `Failed to load form schema for ${formId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all form schemas
   */
  async listFormSchemas(): Promise<string[]> {
    if (!(await fs.pathExists(this.data.formsDirectory))) {
      return [];
    }

    const files = await fs.readdir(this.data.formsDirectory);
    return files
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
      .map((file) => path.basename(file, path.extname(file)));
  }

  /**
   * Delete form schema
   */
  async deleteFormSchema(formId: string): Promise<void> {
    const formPath = this.getFormPath(formId);
    const buildPath = this.getBuildPath(formId);

    // Remove schema file
    if (await fs.pathExists(formPath)) {
      await fs.remove(formPath);
    }

    // Remove build directory
    if (await fs.pathExists(buildPath)) {
      await fs.remove(buildPath);
    }
  }
}
