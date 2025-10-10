/**
 * Form Builder - Builds JavaScript bundles from form schemas
 */

import fs from 'fs-extra';
import path from 'path';
import type { FormSchema } from '@emma/shared/types';
import type { EmmaConfig } from './config.js';

import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export interface BuildResult {
  bundlePath: string;
  outputDir: string;
  size: number;
}

export class FormBuilder {
  constructor(private config: EmmaConfig) {}

  /**
   * Build a form bundle from schema
   */
  async build(formId: string, schema: FormSchema): Promise<BuildResult> {
    const outputDir = this.config.getBuildPath(formId);
    await fs.ensureDir(outputDir);

    // Generate the form bundle JavaScript
    const bundleContent = this.generateFormBundle(schema);

    // Write bundle file with unique name
    const bundlePath = path.join(outputDir, `${schema.formId}.js`);
    await fs.writeFile(bundlePath, bundleContent, 'utf8');

    // Copy theme CSS if it exists
    await this.copyThemeAssets(schema.theme, outputDir);

    // Copy renderer runtime (emma-forms.min.js) for preview/runtime
    await this.copyRendererRuntime(outputDir);

    // Create a test HTML file for local preview
    const testHtmlContent = this.generateTestHtml(schema);
    const testHtmlPath = path.join(outputDir, 'index.html');
    await fs.writeFile(testHtmlPath, testHtmlContent, 'utf8');

    // Get file size
    const stats = await fs.stat(bundlePath);

    return {
      bundlePath,
      outputDir,
      size: stats.size,
    };
  }

  /**
   * Generate the JavaScript bundle content
   */
  private generateFormBundle(schema: FormSchema): string {
    const template = this.readTemplate('bundle.template.js');
    return template
      .replace('__FORM_SCHEMA__', JSON.stringify(schema, null, 2))
      .replace(/__FORM_ID__/g, schema.formId);
  }

  /**
   * Generate test HTML file for preview
   */
  private generateTestHtml(schema: FormSchema): string {
    const template = this.readTemplate('preview.template.html');
    return template
      .replace('__FORM_NAME__', schema.name)
      .replace(/__FORM_ID__/g, schema.formId)
      .replace(/__THEME__/g, schema.theme)
      .replace('__FIELDS_COUNT__', String(schema.fields.length))
      .replace(/__API_ENDPOINT__/g, schema.apiEndpoint);
  }

  /**
   * Read a template file from templates directory with dist fallback
   */
  private readTemplate(fileName: string): string {
    const templatesDir = path.resolve(currentDir, './templates');
    const distTemplatesDir = path.resolve(currentDir, '../templates');
    const primaryPath = path.join(templatesDir, fileName);
    const distPath = path.join(distTemplatesDir, fileName);

    if (fs.existsSync(primaryPath)) {
      return fs.readFileSync(primaryPath, 'utf8');
    }
    if (fs.existsSync(distPath)) {
      return fs.readFileSync(distPath, 'utf8');
    }
    throw new Error(`Template not found: ${fileName}`);
  }

  /**
   * Copy theme assets to build directory
   */
  private async copyThemeAssets(
    theme: string,
    outputDir: string
  ): Promise<void> {
    const themesDir = path.resolve(currentDir, '../../form-renderer/themes');
    const themeFile = path.join(themesDir, `${theme}.css`);

    if (await fs.pathExists(themeFile)) {
      const themeOutputDir = path.join(outputDir, 'themes');
      await fs.ensureDir(themeOutputDir);
      await fs.copy(themeFile, path.join(themeOutputDir, `${theme}.css`));
    }
  }

  /**
   * Copy the form-renderer runtime bundle next to the form bundle
   */
  private async copyRendererRuntime(outputDir: string): Promise<void> {
    const rendererDist = path.resolve(
      currentDir,
      '../../form-renderer/dist/emma-forms.min.js'
    );
    if (await fs.pathExists(rendererDist)) {
      await fs.copy(rendererDist, path.join(outputDir, 'emma-forms.min.js'));
    } else {
      // Fallback to esm build if minified not present
      const rendererESM = path.resolve(
        currentDir,
        '../../form-renderer/dist/emma-forms.js'
      );
      if (await fs.pathExists(rendererESM)) {
        await fs.copy(rendererESM, path.join(outputDir, 'emma-forms.min.js'));
      }
    }
  }
}
