/**
 * Form Manager - High-level operations for managing forms
 */

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
