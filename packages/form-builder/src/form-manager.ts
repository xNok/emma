/**
 * Form Manager - High-level operations for managing forms
 */

import fs from 'fs-extra';
import path from 'path';
import type { FormSchema } from '@emma/shared/types';
import type { EmmaConfig } from './config.js';
import { FormBuilder } from './form-builder.js';
import { LocalDeployment } from './local-deployment.js';

export class FormManager {
  private builder: FormBuilder;
  private deployment: LocalDeployment;

  constructor(private config: EmmaConfig) {
    this.builder = new FormBuilder(config);
    this.deployment = new LocalDeployment(config);
  }

  /**
   * Create a new form schema
   */
  async createForm(formId: string, schema: FormSchema): Promise<void> {
    await this.config.saveFormSchema(formId, schema);
  }

  /**
   * Get form schema
   */
  async getForm(formId: string): Promise<FormSchema | null> {
    return this.config.loadFormSchema(formId);
  }

  /**
   * List all forms
   */
  async listForms(): Promise<string[]> {
    return this.config.listFormSchemas();
  }

  /**
   * Delete a form
   */
  async deleteForm(formId: string): Promise<void> {
    await this.config.deleteFormSchema(formId);
  }

  /**
   * Build a form bundle
   */
  async buildForm(formId: string): Promise<void> {
    const schema = await this.getForm(formId);
    if (!schema) {
      throw new Error(`Form not found: ${formId}`);
    }

    await this.builder.build(formId, schema);
  }

  /**
   * Check if a form needs to be rebuilt
   * Returns true if:
   * - Bundle doesn't exist
   * - Schema file is newer than the bundle
   */
  async needsRebuild(formId: string): Promise<boolean> {
    const buildPath = this.config.getBuildPath(formId);
    const bundlePath = path.join(buildPath, `${formId}.js`);
    
    // Bundle doesn't exist
    if (!(await fs.pathExists(bundlePath))) {
      return true;
    }

    // Check if schema is newer than bundle
    const schemaPath = this.config.getFormPath(formId);
    if (await fs.pathExists(schemaPath)) {
      const bundleStats = await fs.stat(bundlePath);
      const schemaStats = await fs.stat(schemaPath);
      return schemaStats.mtime > bundleStats.mtime;
    }

    return false;
  }

  /**
   * Ensure form is built (build if needed)
   */
  async ensureBuilt(formId: string): Promise<boolean> {
    if (await this.needsRebuild(formId)) {
      await this.buildForm(formId);
      return true; // Was rebuilt
    }
    return false; // Already up to date
  }

  /**
   * Deploy a form locally
   */
  async deployForm(formId: string, options: { host: string; port: number }) {
    return this.deployment.deploy(formId, options);
  }

  /**
   * Check if deployment server is running
   */
  isDeploymentRunning(): boolean {
    return this.deployment.isRunning();
  }
}
