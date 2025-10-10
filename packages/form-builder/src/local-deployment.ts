/**
 * Local Deployment - Simulates production deployment using local server
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
import express from 'express';
import type { EmmaConfig } from './config.js';
import { FormBuilder } from './form-builder.js';

export interface DeploymentOptions {
  host: string;
  port: number;
}

export interface DeploymentResult {
  formUrl: string;
  apiUrl: string;
  serverUrl: string;
}

export class LocalDeployment {
  private app: express.Application | null = null;
  private server: any = null;
  private currentPort: number | null = null;

  constructor(private config: EmmaConfig) {}

  /**
   * Deploy a form to local server
   */
  async deploy(
    formId: string,
    options: DeploymentOptions
  ): Promise<DeploymentResult> {
    const schema = await this.config.loadFormSchema(formId);
    if (!schema) {
      throw new Error(`Form schema not found: ${formId}`);
    }

    // Build form if not already built
    const buildPath = this.config.getBuildPath(formId);
    const bundlePath = path.join(buildPath, 'form.js');

    if (!(await fs.pathExists(bundlePath))) {
      const builder = new FormBuilder(this.config);
      await builder.build(formId, schema);
    }

    // Start or update server
    await this.ensureServer(options);

    const serverUrl = `http://${options.host}:${options.port}`;
    const formUrl = `${serverUrl}/forms/${formId}`;
    const apiUrl = `${serverUrl}/api/submit/${formId}`;

    return {
      formUrl,
      apiUrl,
      serverUrl,
    };
  }

  /**
   * Ensure form is deployed (build and deploy if needed)
   */
  async ensureDeployed(
    formId: string,
    options: DeploymentOptions
  ): Promise<DeploymentResult> {
    return this.deploy(formId, options);
  }

  /**
   * Start or ensure server is running
   */
  private async ensureServer(options: DeploymentOptions): Promise<void> {
    if (this.server && this.currentPort === options.port) {
      return; // Server already running
    }

    // Stop existing server if port changed
    if (this.server) {
      await this.stopServer();
    }

    await this.startServer(options);
  }

  /**
   * Start the local development server
   */
  private async startServer(options: DeploymentOptions): Promise<void> {
    this.app = express();

    // Middleware
    this.app.use(express.json());
    this.app.use(
      express.static(path.resolve(currentDir, '../../../form-renderer/themes'))
    );

    // Serve form builds
    const buildsDir = this.config.getBuildsDir();

    // Serve all form assets from /forms/:formId/:asset (must come before the general form route)
    this.app.get('/forms/:formId/*', async (req, res) => {
      const formId = req.params.formId;
      // Extract the asset path from the full URL
      const fullPath = req.path;
      const assetPath = fullPath.replace(`/forms/${formId}/`, '');
      const formDir = path.join(buildsDir, formId);
      const fullAssetPath = path.join(formDir, assetPath);

      if (await fs.pathExists(fullAssetPath)) {
        // Set correct MIME type for JS files
        if (fullAssetPath.endsWith('.js')) {
          res.type('application/javascript');
        } else if (fullAssetPath.endsWith('.css')) {
          res.type('text/css');
        }
        res.sendFile(fullAssetPath);
      } else {
        res.status(404).send('Asset not found');
      }
    });

    // Form preview pages (must come after the asset route)
    this.app.get('/forms/:formId', async (req, res) => {
      const formId = req.params.formId;
      const indexPath = path.join(buildsDir, formId, 'index.html');

      if (await fs.pathExists(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send(`
          <h1>Form Not Found</h1>
          <p>Form "${formId}" has not been built.</p>
          <p>Run: <code>emma build ${formId}</code></p>
        `);
      }
    });

    // API submission endpoint
    this.app.post('/api/submit/:formId', async (req, res) => {
      const formId = req.params.formId;
      const { data, meta } = req.body;

      console.log(`📨 Form submission received for ${formId}:`);
      console.log('Data:', data);
      console.log('Meta:', meta);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Basic honeypot check
      const schema = await this.config.loadFormSchema(formId);
      if (schema?.settings?.honeypot?.enabled) {
        const honeypotField = schema.settings.honeypot.fieldName;
        if (data[honeypotField]) {
          return res.status(400).json({
            success: false,
            error: 'Spam detected',
          });
        }
      }

      // Simulate successful submission
      return res.json({
        success: true,
        message: 'Form submitted successfully',
        submissionId: `sub_${Date.now()}`,
      });
    });

    // Server info endpoint
    this.app.get('/api/info', (_req, res) => {
      res.json({
        service: 'Emma Forms Local Server',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        forms: [], // TODO: List available forms
      });
    });

    // Root page with form listing
    this.app.get('/', async (_req, res) => {
      const formIds = await this.config.listFormSchemas();

      let formsList = '';
      if (formIds.length > 0) {
        formsList =
          '<ul>' +
          formIds
            .map(
              (id) =>
                `<li><a href="/forms/${id}">${id}</a> - <a href="/forms/${id}/form.js">Bundle</a></li>`
            )
            .join('') +
          '</ul>';
      } else {
        formsList =
          '<p><em>No forms available. Create one with <code>emma create my-form</code></em></p>';
      }

      res.send(`
        <html>
          <head>
            <title>Emma Forms - Local Development Server</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
              h1 { color: #2563eb; }
              code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
              .info { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
            </style>
          </head>
          <body>
            <h1>📝 Emma Forms - Local Development Server</h1>
            
            <div class="info">
              <strong>Server Status:</strong> Running<br>
              <strong>Port:</strong> ${options.port}<br>
              <strong>Forms Directory:</strong> ${this.config.getFormsDir()}<br>
              <strong>Builds Directory:</strong> ${this.config.getBuildsDir()}
            </div>
            
            <h2>Available Forms</h2>
            ${formsList}
            
            <h2>API Endpoints</h2>
            <ul>
              <li><code>GET /forms/:formId</code> - Form preview</li>
              <li><code>GET /forms/:formId/form.js</code> - Form bundle</li>
              <li><code>POST /api/submit/:formId</code> - Form submission</li>
              <li><code>GET /themes/:theme.css</code> - Theme CSS</li>
              <li><code>GET /api/info</code> - Server info</li>
            </ul>
            
            <h2>CLI Commands</h2>
            <ul>
              <li><code>emma create &lt;name&gt;</code> - Create new form</li>
              <li><code>emma build &lt;form-id&gt;</code> - Build form bundle</li>
              <li><code>emma preview &lt;form-id&gt;</code> - Open form in browser</li>
              <li><code>emma list</code> - List all forms</li>
            </ul>
          </body>
        </html>
      `);
    });

    // Start server
    return new Promise((resolve, reject) => {
      this.server = this.app!.listen(options.port, options.host, () => {
        this.currentPort = options.port;
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${options.port} is already in use`));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Stop the server
   */
  async stopServer(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.server = null;
          this.currentPort = null;
          resolve();
        });
      });
    }
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Get current server port
   */
  getCurrentPort(): number | null {
    return this.currentPort;
  }
}
