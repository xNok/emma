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
