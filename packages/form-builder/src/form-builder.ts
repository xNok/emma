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
    return `(function() {
  'use strict';

  // Form schema embedded in bundle
  const FORM_SCHEMA = ${JSON.stringify(schema, null, 2)};
  
  // Minimal form renderer (simplified version)
  class EmbeddedFormRenderer {
    constructor(containerId, schema) {
      this.containerId = containerId;
      this.schema = schema;
      this.container = document.getElementById(containerId);
      
      if (!this.container) {
        throw new Error('Container not found: ' + containerId);
      }
    }

    render() {
      this.container.innerHTML = '';
      
      // Create form element
      const form = document.createElement('form');
      form.className = 'emma-form emma-theme-' + this.schema.theme;
      form.setAttribute('novalidate', '');
      
      // Add form title if specified
      if (this.schema.name) {
        const title = document.createElement('h2');
        title.className = 'emma-form-title';
        title.textContent = this.schema.name;
        form.appendChild(title);
      }

      // Render fields
      this.schema.fields.forEach(field => {
        const fieldElement = this.renderField(field);
        form.appendChild(fieldElement);
      });

      // Add honeypot if enabled
      if (this.schema.settings?.honeypot?.enabled) {
        const honeypot = this.createHoneypotField(this.schema.settings.honeypot.fieldName);
        form.appendChild(honeypot);
      }

      // Add submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'emma-submit-button';
      submitButton.textContent = this.schema.settings?.submitButtonText || 'Submit';
      form.appendChild(submitButton);

      // Add form event handlers
      form.addEventListener('submit', (e) => this.handleSubmit(e));
      
      this.container.appendChild(form);
      
      // Load theme CSS
      this.loadThemeCSS();
    }

    renderField(field) {
      const fieldContainer = document.createElement('div');
      fieldContainer.className = 'emma-field emma-field-' + field.type;

      // Label
      if (field.type !== 'hidden') {
        const label = document.createElement('label');
        label.textContent = field.label;
        label.setAttribute('for', field.id);
        if (field.required) {
          label.innerHTML += ' <span class="emma-required">*</span>';
        }
        fieldContainer.appendChild(label);
      }

      // Input element
      let input;
      
      switch (field.type) {
        case 'textarea':
          input = document.createElement('textarea');
          if (field.rows) input.rows = field.rows;
          break;
          
        case 'select':
          input = document.createElement('select');
          (field.options || []).forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            if (option.disabled) optionEl.disabled = true;
            input.appendChild(optionEl);
          });
          break;
          
        case 'radio':
        case 'checkbox':
          const fieldset = document.createElement('fieldset');
          fieldset.className = 'emma-options-fieldset';
          
          (field.options || []).forEach((option, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'emma-option';
            
            const optionInput = document.createElement('input');
            optionInput.type = field.type;
            optionInput.name = field.id;
            optionInput.value = option.value;
            optionInput.id = field.id + '_' + index;
            if (field.required) optionInput.required = true;
            
            const optionLabel = document.createElement('label');
            optionLabel.setAttribute('for', optionInput.id);
            optionLabel.textContent = option.label;
            
            wrapper.appendChild(optionInput);
            wrapper.appendChild(optionLabel);
            fieldset.appendChild(wrapper);
          });
          
          fieldContainer.appendChild(fieldset);
          return fieldContainer;
          
        default:
          input = document.createElement('input');
          input.type = field.type;
      }

      // Common input attributes
      input.name = field.id;
      input.id = field.id;
      
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      if (field.defaultValue) input.value = field.defaultValue;

      // Validation attributes
      if (field.validation) {
        const val = field.validation;
        if (val.minLength) input.minLength = val.minLength;
        if (val.maxLength) input.maxLength = val.maxLength;
        if (val.min !== undefined) input.min = val.min;
        if (val.max !== undefined) input.max = val.max;
        if (val.pattern) input.pattern = val.pattern;
      }

      fieldContainer.appendChild(input);
      return fieldContainer;
    }

    createHoneypotField(fieldName) {
      const honeypot = document.createElement('div');
      honeypot.style.position = 'absolute';
      honeypot.style.left = '-9999px';
      honeypot.setAttribute('aria-hidden', 'true');
      
      const input = document.createElement('input');
      input.type = 'text';
      input.name = fieldName;
      input.tabIndex = -1;
      input.autoComplete = 'off';
      
      honeypot.appendChild(input);
      return honeypot;
    }

    async handleSubmit(event) {
      event.preventDefault();
      
      const form = event.target;
      const submitButton = form.querySelector('.emma-submit-button');
      const originalText = submitButton.textContent;
      
      // Disable submit button
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      
      try {
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
          if (data[key]) {
            // Multiple values (checkboxes)
            if (!Array.isArray(data[key])) {
              data[key] = [data[key]];
            }
            data[key].push(value);
          } else {
            data[key] = value;
          }
        }

        // Check honeypot
        const honeypotField = this.schema.settings?.honeypot?.fieldName;
        if (honeypotField && data[honeypotField]) {
          throw new Error('Spam detected');
        }

        // Submit to API
        const response = await fetch(this.schema.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: this.schema.formId,
            data: data,
            meta: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              referrer: document.referrer,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Submission failed');
        }

        // Show success message
        this.showMessage(this.schema.settings?.successMessage || 'Thank you for your submission!', 'success');
        form.reset();
        
      } catch (error) {
        console.error('Form submission error:', error);
        this.showMessage(this.schema.settings?.errorMessage || 'There was an error submitting your form. Please try again.', 'error');
      } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }

    showMessage(message, type) {
      // Remove existing messages
      const existing = this.container.querySelector('.emma-message');
      if (existing) existing.remove();
      
      const messageEl = document.createElement('div');
      messageEl.className = 'emma-message emma-message-' + type;
      messageEl.textContent = message;
      
      this.container.insertBefore(messageEl, this.container.firstChild);
      
      // Auto-remove success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.remove();
          }
        }, 5000);
      }
    }

    loadThemeCSS() {
      const themeId = 'emma-theme-' + this.schema.theme;
      if (document.getElementById(themeId)) return; // Already loaded
      
      const link = document.createElement('link');
      link.id = themeId;
      link.rel = 'stylesheet';
      link.href = this.schema.apiEndpoint.replace('/api/submit/' + this.schema.formId, '/themes/' + this.schema.theme + '.css');
      document.head.appendChild(link);
    }
  }

  // Auto-initialize if container exists
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('[data-emma-form="${schema.formId}"]');
    containers.forEach(container => {
      new EmbeddedFormRenderer(container.id, FORM_SCHEMA).render();
    });
  });

  // Global API for manual initialization
  window.EmmaForm = window.EmmaForm || {};
  window.EmmaForm['${schema.formId}'] = function(containerId) {
    return new EmbeddedFormRenderer(containerId, FORM_SCHEMA);
  };

})();`;
  }

  /**
   * Generate test HTML file for preview
   */
  private generateTestHtml(schema: FormSchema): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${schema.name} - Emma Form Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .preview-header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preview-header h1 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .preview-info {
            color: #666;
            font-size: 14px;
        }
        #form-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <h1>📝 Form Preview</h1>
        <div class="preview-info">
            <strong>Form ID:</strong> ${schema.formId}<br>
            <strong>Theme:</strong> ${schema.theme}<br>
            <strong>Fields:</strong> ${schema.fields.length}<br>
            <strong>API Endpoint:</strong> <code>${schema.apiEndpoint}</code>
        </div>
        
        <div class="debug-links" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <strong>🔧 Debug Assets:</strong><br>
            <a href="/forms/${schema.formId}/${schema.formId}.js" target="_blank" style="color: #0066cc; text-decoration: none;">📄 JavaScript Bundle</a> |
            <a href="/forms/${schema.formId}/themes/${schema.theme}.css" target="_blank" style="color: #0066cc; text-decoration: none;">🎨 Theme CSS</a> |
            <a href="${schema.apiEndpoint}" target="_blank" style="color: #0066cc; text-decoration: none;">🔗 API Endpoint</a>
        </div>
    </div>

    <div id="form-container" data-emma-form="${schema.formId}">
        <!-- Form will be rendered here -->
    </div>

    <script src="/forms/${schema.formId}/${schema.formId}.js"></script>
</body>
</html>`;
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
}
