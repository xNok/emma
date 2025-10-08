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

export interface FormSchema {
  formId: string;
  name: string;
  version: string;
  theme: string;
  apiEndpoint: string;
  fields: FormField[];
  settings?: FormSettings;
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
