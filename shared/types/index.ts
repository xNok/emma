/**
 * Core TypeScript types for Emma Forms
 * These types are shared across all packages
 */

// ============================================================================
// Form Schema Types
// ============================================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'tel'
  | 'url'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'hidden';

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string; // Custom validation function name
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRules;
  options?: FieldOption[]; // For select, radio, checkbox
  rows?: number; // For textarea
  defaultValue?: string | string[];
  helpText?: string;
  autocomplete?: string;
  addedAt?: number; // Unix timestamp when field was added (for snapshot tracking)
}

export interface HoneypotSettings {
  enabled: boolean;
  fieldName: string;
}

export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
  honeypot?: HoneypotSettings;
  reCaptcha?: {
    enabled: boolean;
    siteKey?: string;
  };
  doubleOptIn?: boolean;
  redirectUrl?: string; // Redirect after successful submission
}

export interface FormSnapshot {
  timestamp: number; // Unix timestamp
  r2Key: string; // Storage key in R2 (e.g., "contact-form-1729089000.js")
  changes: string; // Description of changes made in this snapshot
  deployed?: boolean; // Whether this snapshot has been deployed
}

export interface FormSchema {
  formId: string;
  name: string;
  version: string; // Legacy field, kept for backward compatibility
  theme: string;
  apiEndpoint: string;
  fields: FormField[];
  settings?: FormSettings;
  // Snapshot tracking
  createdAt?: number; // Unix timestamp when form was created
  lastModified?: number; // Unix timestamp when form was last modified
  currentSnapshot?: number; // Current snapshot timestamp
  snapshots?: FormSnapshot[]; // History of all snapshots
}

// ============================================================================
// Form Registry Types (for R2 storage)
// ============================================================================

export interface FormRegistryEntry {
  formId: string;
  name: string;
  currentSnapshot: number;
  allSnapshots: number[];
  publicUrl: string; // URL to current snapshot bundle
}

export interface FormRegistry {
  forms: FormRegistryEntry[];
  lastUpdated: number; // Unix timestamp
}

// ============================================================================
// API Types
// ============================================================================

export interface SubmissionData {
  formId: string;
  data: Record<string, string | string[]>;
  meta?: SubmissionMeta;
}

export interface SubmissionMeta {
  timestamp?: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
}

export interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  error?: string;
  field?: string; // Field with validation error
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Database Types
// ============================================================================

export interface FormRecord {
  id: string;
  name: string;
  schema: string; // JSON string
  version: string;
  api_endpoint: string | null;
  created_at: number;
  updated_at: number;
  active: number; // SQLite boolean (0 or 1)
  deploy_count: number;
  submission_count: number;
}

export interface SubmissionRecord {
  id: string;
  form_id: string;
  data: string; // JSON string
  meta: string | null; // JSON string
  spam_score: number;
  status: 'new' | 'read' | 'archived' | 'spam';
  created_at: number;
  form_snapshot?: number; // Unix timestamp of form snapshot used
  form_bundle?: string; // Bundle file name (e.g., "contact-form-1729089000.js")
}

export interface MetadataRecord {
  key: string;
  value: string;
  updated_at: number;
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemeConfig {
  name: string;
  cssContent: string;
  description?: string;
  author?: string;
  version?: string;
}

// ============================================================================
// Form Builder Types (TUI)
// ============================================================================

export interface BuilderConfig {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  r2BucketName: string;
  d1DatabaseId: string;
  apiWorkerUrl: string;
  cdnUrl: string;
}

export interface DeploymentResult {
  success: boolean;
  formId: string;
  cdnUrl?: string;
  error?: string;
}

export interface BuildResult {
  success: boolean;
  bundlePath?: string;
  bundleSize?: number;
  error?: string;
}

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Provider capabilities define what a provider can do
 */
export type ProviderCapability =
  | 'deploy' // Can deploy forms to a hosting service
  | 'submission-query' // Can query form submissions
  | 'migrations' // Can run database migrations
  | 'preview'; // Can provide preview functionality

/**
 * Provider manifest - describes a provider package
 */
export interface ProviderManifest {
  name: string; // e.g., 'cloudflare', 'digitalocean'
  displayName: string; // e.g., 'Cloudflare R2 + D1'
  description: string;
  packageName: string; // e.g., '@emma/provider-cloudflare'
  version?: string;
  capabilities: ProviderCapability[];
  isAvailable?: () => Promise<boolean>; // Check if provider is configured/available
}

/**
 * Generic config interface that providers can use
 * This avoids circular dependencies while providing type safety
 *
 * Providers should extend this interface with their specific config structure
 * to get proper type safety for get/set operations.
 */
export interface ProviderConfigInterface {
  isInitialized(): boolean;
  /**
   * Get a configuration value by key
   * @param key - The configuration key
   * @returns The configuration value (type depends on the key)
   */
  get(key: string): unknown;
  /**
   * Set a configuration value by key
   * @param key - The configuration key
   * @param value - The configuration value
   */
  set(key: string, value: unknown): void;
  /**
   * Save the configuration to persistent storage
   */
  save(): Promise<void>;
}

/**
 * Generic provider options from CLI
 */
export interface ProviderOptions {
  [key: string]: string | boolean | number | undefined;
}

/**
 * Deployment provider definition
 * Used by providers that can deploy forms
 *
 * @template TCommand - The CLI command type (e.g., Commander's Command)
 * @template TConfig - The config type (e.g., EmmaConfig)
 */
export interface DeploymentProviderDefinition<
  TCommand = unknown,
  TConfig extends ProviderConfigInterface = ProviderConfigInterface,
> {
  name: string;
  description: string;
  capabilities?: ProviderCapability[];
  register?: (parent: TCommand, config: TConfig) => void;
  execute?: (
    config: TConfig,
    formId: string,
    options: ProviderOptions
  ) => Promise<void>;
  init?: (config: TConfig) => Promise<{ success: boolean; message?: string }>;
  checkReadiness?: (
    config: TConfig
  ) => Promise<{ ready: boolean; issues?: string[] }>;
}

/**
 * Submission provider definition
 * Used by providers that can query form submissions
 */
export interface SubmissionProviderDefinition {
  name: string;
  description: string;
  capabilities?: ProviderCapability[];
  querySubmissions?: (
    options: SubmissionQueryOptions
  ) => Promise<SubmissionRecord[]>;
  isAvailable?: () => Promise<boolean>;
}

/**
 * Options for querying submissions
 */
export interface SubmissionQueryOptions {
  formId: string;
  snapshot?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Provider Constants
// ============================================================================

/**
 * Registry of known provider identifiers that should be loaded synchronously
 * These are built-in providers that are always available
 *
 * To add a new built-in provider:
 * 1. Add the provider package as a dependency
 * 2. Add the package identifier to this array
 * 3. Ensure the provider exports either:
 *    - A `create<ProviderName>Provider` function, or
 *    - A `<providerName>Provider` object with register/execute methods
 *
 * Example:
 * ```typescript
 * const BUILT_IN_PROVIDERS = [
 *   '@xnok/emma-provider-cloudflare',
 *   '@xnok/emma-provider-s3',        // Will look for createS3Provider or s3Provider
 *   '@my-org/emma-provider-custom',  // Custom provider
 * ] as const;
 * ```
 */
export const BUILT_IN_PROVIDERS = ['@xnok/emma-provider-cloudflare'] as const;
