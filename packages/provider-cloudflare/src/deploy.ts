/**
 * Cloudflare R2 Deployment Provider
 * Handles deployment of forms to Cloudflare R2 storage
 */

import fs from 'fs-extra';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  type S3ServiceException,
} from '@aws-sdk/client-s3';
import type {
  FormSchema,
  FormRegistry,
  FormRegistryEntry,
} from '@xnok/emma-shared/types';

export interface CloudflareDeploymentOptions {
  bucket: string; // R2 bucket name
  publicUrl: string; // Base public URL serving the bucket (e.g., https://forms.example.com)
  accountId?: string | undefined; // Optional explicit account ID
  apiToken?: string | undefined; // Optional explicit API token
  overwrite?: boolean; // Overwrite existing objects
  snapshot?: string; // Optional snapshot timestamp to deploy
  // S3-only
  accessKeyId?: string; // R2 access key id
  secretAccessKey?: string; // R2 secret access key
  endpoint?: string; // Optional custom S3 endpoint (defaults to https://<accountId>.r2.cloudflarestorage.com)
}

export interface CloudflareDeploymentResult {
  bundleKey: string;
  bundleUrl: string;
  themeKey?: string;
  themeUrl?: string;
  indexKey?: string;
  indexUrl?: string;
  rendererKey?: string;
  rendererUrl?: string;
  schemaKey?: string;
  schemaUrl?: string;
}

/**
 * EmmaConfig interface - defines the required config methods
 * This allows the provider to work with any config implementation
 */
export interface EmmaConfigInterface {
  // Form schema operations
  loadFormSchema(formId: string): Promise<FormSchema | null>;
  saveFormSchema(formId: string, schema: FormSchema): Promise<void>;
  getBuildPath(formId: string): string;
  
  // Config state operations
  isInitialized(): boolean;
  
  // Config get/set operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any): void;
  save(): Promise<void>;
}

export class CloudflareR2Deployment {
  constructor(private config: EmmaConfigInterface) {}

  async deploy(
    formId: string,
    options: CloudflareDeploymentOptions
  ): Promise<CloudflareDeploymentResult> {
    // Validate inputs
    if (!options.bucket) throw new Error('Missing R2 bucket name');
    if (!options.publicUrl) throw new Error('Missing publicUrl');

    const schema = await this.config.loadFormSchema(formId);
    if (!schema) {
      throw new Error(`Schema not found for form "${formId}"`);
    }

    // Determine which snapshot to deploy
    let snapshotTimestamp: number;
    if (options.snapshot) {
      snapshotTimestamp = parseInt(options.snapshot, 10);
      if (isNaN(snapshotTimestamp)) {
        throw new Error('Invalid snapshot timestamp');
      }
      // Verify snapshot exists
      const snapshots = schema.snapshots || [];
      const snapshotExists = snapshots.some(
        (s) => s.timestamp === snapshotTimestamp
      );
      if (!snapshotExists) {
        throw new Error(
          `Snapshot ${snapshotTimestamp} not found. Use "emma history ${formId}" to see available snapshots.`
        );
      }
    } else {
      // Use current snapshot
      snapshotTimestamp =
        schema.currentSnapshot || Math.floor(Date.now() / 1000);
    }

    // Resolve build artifacts with snapshot timestamp
    const buildDir = this.config.getBuildPath(formId);
    const bundleName = `${formId}-${snapshotTimestamp}.js`;
    const bundlePath = path.join(buildDir, bundleName);

    if (!(await fs.pathExists(bundlePath))) {
      throw new Error(
        `Bundle not found: ${bundlePath}. Run "emma build ${formId}${options.snapshot ? ` --snapshot ${snapshotTimestamp}` : ''}" first.`
      );
    }

    // Upload bundle with timestamp-based key (flat structure in bucket root)
    const bundleKey = bundleName;
    await this.uploadToR2(bundlePath, options.bucket, bundleKey, options);

    const themeFile = schema.theme;
    const themeCss = path.join(buildDir, 'themes', `${themeFile}.css`);
    const indexPath = path.join(buildDir, 'index.html');
    const rendererPath = path.join(buildDir, 'emma-forms.esm.js');

    let themeKey: string | undefined;
    if (await fs.pathExists(themeCss)) {
      themeKey = `${formId}/themes/${path.basename(themeCss)}`;
      await this.uploadToR2(themeCss, options.bucket, themeKey, options);
    }

    const indexKey = `${formId}/index.html`;
    await this.uploadToR2(indexPath, options.bucket, indexKey, options);

    const rendererKey = `${formId}/emma-forms.esm.js`;
    await this.uploadToR2(rendererPath, options.bucket, rendererKey, options);

    const schemaKey = `${formId}/${formId}.json`;
    await this.uploadContentToR2(
      JSON.stringify(schema, null, 2),
      options.bucket,
      schemaKey,
      options
    );

    // Update form registry
    await this.updateRegistry(formId, schema, snapshotTimestamp, options);

    // Mark snapshot as deployed in local schema
    const snapshots = schema.snapshots || [];
    if (snapshots.length > 0) {
      const snapshot = snapshots.find((s) => s.timestamp === snapshotTimestamp);
      if (snapshot) {
        snapshot.deployed = true;
        await this.config.saveFormSchema(formId, schema);
      }
    }

    return {
      bundleKey,
      bundleUrl: this.joinUrl(options.publicUrl, bundleKey),
      themeKey,
      themeUrl: themeKey
        ? this.joinUrl(options.publicUrl, themeKey)
        : undefined,
      indexKey,
      indexUrl: this.joinUrl(options.publicUrl, indexKey),
      rendererKey,
      rendererUrl: this.joinUrl(options.publicUrl, rendererKey),
      schemaKey,
      schemaUrl: this.joinUrl(options.publicUrl, schemaKey),
    };
  }

  /**
   * Update the form registry in R2
   * The registry tracks all forms and their current snapshots
   */
  private async updateRegistry(
    formId: string,
    schema: FormSchema,
    deployedSnapshot: number,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    const registryKey = 'registry.json';

    // Try to fetch existing registry
    let registry: FormRegistry;
    try {
      const existingRegistry = await this.fetchRegistry(options);
      registry = existingRegistry;
    } catch (error) {
      // Registry doesn't exist yet, create new one
      registry = {
        forms: [],
        lastUpdated: Math.floor(Date.now() / 1000),
      };
    }

    // Find or create entry for this form
    const forms: FormRegistryEntry[] = registry.forms;
    let formEntry: FormRegistryEntry | undefined = forms.find(
      (f) => f.formId === formId
    );

    const snapshots = schema.snapshots || [];
    const allSnapshots: number[] = snapshots
      .map((s) => s.timestamp)
      .sort((a: number, b: number) => a - b);

    if (formEntry) {
      // Update existing entry
      formEntry.name = schema.name;
      formEntry.currentSnapshot = deployedSnapshot;
      formEntry.allSnapshots = allSnapshots;
      formEntry.publicUrl = this.joinUrl(
        options.publicUrl,
        `${formId}-${deployedSnapshot}.js`
      );
    } else {
      // Create new entry
      formEntry = {
        formId,
        name: schema.name,
        currentSnapshot: deployedSnapshot,
        allSnapshots,
        publicUrl: this.joinUrl(
          options.publicUrl,
          `${formId}-${deployedSnapshot}.js`
        ),
      };
      forms.push(formEntry);
    }

    // Update last modified timestamp
    registry.lastUpdated = Math.floor(Date.now() / 1000);

    // Upload updated registry
    await this.uploadContentToR2(
      JSON.stringify(registry, null, 2),
      options.bucket,
      registryKey,
      { ...options, overwrite: true } // Always overwrite registry
    );
  }

  /**
   * Fetch the existing registry from R2
   */
  private async fetchRegistry(
    options: CloudflareDeploymentOptions
  ): Promise<FormRegistry> {
    const s3 = this.getS3Client(options);
    const registryKey = 'registry.json';

    try {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: options.bucket,
          Key: registryKey,
        })
      );

      if (!response.Body) {
        throw new Error('Empty registry response');
      }

      const bodyString = await response.Body.transformToString();
      return JSON.parse(bodyString) as FormRegistry;
    } catch (error) {
      const err = error as S3ServiceException;
      if (
        err.$metadata?.httpStatusCode === 404 ||
        err.name === 'NoSuchKey' ||
        err.message?.includes('not found')
      ) {
        // Registry doesn't exist yet
        throw new Error('Registry not found');
      }
      throw error;
    }
  }

  private async uploadContentToR2(
    content: string | Buffer,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    await this.uploadContentViaS3(content, bucket, key, options);
  }

  private async uploadContentViaS3(
    content: string | Buffer,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    const s3 = this.getS3Client(options);
    if (!options.overwrite) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(
          `Object already exists at ${bucket}/${key}. Use --overwrite to replace.`
        );
      } catch (err) {
        const e = err as S3ServiceException;
        const code = e.$metadata?.httpStatusCode;
        const msg = (e.name || e.message || '').toLowerCase();
        if (
          code !== 404 &&
          !msg.includes('not found') &&
          !msg.includes('no such key') &&
          !msg.includes('404')
        ) {
          throw err;
        }
      }
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
      })
    );
  }

  private joinUrl(base: string, key: string): string {
    return `${base.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  private async uploadToR2(
    filePath: string,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    await this.uploadViaS3(filePath, bucket, key, options);
  }

  private getS3Client(options: CloudflareDeploymentOptions): S3Client {
    const endpoint =
      options.endpoint ||
      (options.accountId
        ? `https://${options.accountId}.r2.cloudflarestorage.com`
        : undefined);
    if (!endpoint) {
      throw new Error(
        'Missing S3 endpoint: provide --endpoint or --account-id to derive R2 endpoint'
      );
    }
    if (!options.accessKeyId || !options.secretAccessKey) {
      throw new Error(
        'Missing R2 credentials: provide --access-key-id and --secret-access-key or set env vars'
      );
    }
    return new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  private async uploadViaS3(
    filePath: string,
    bucket: string,
    key: string,
    options: CloudflareDeploymentOptions
  ): Promise<void> {
    const s3 = this.getS3Client(options);
    // If not overwriting, check existence
    if (!options.overwrite) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(
          `Object already exists at ${bucket}/${key}. Use --overwrite to replace.`
        );
      } catch (err) {
        // Not found => proceed; Only rethrow if it's not a 404 style error
        const e = err as S3ServiceException;
        const code = e.$metadata?.httpStatusCode;
        const msg = (e.name || e.message || '').toLowerCase();
        if (
          code !== 404 &&
          !msg.includes('not found') &&
          !msg.includes('no such key') &&
          !msg.includes('404')
        ) {
          throw err;
        }
      }
    }
    const body = await fs.readFile(filePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      })
    );
  }
}
