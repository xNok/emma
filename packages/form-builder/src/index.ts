/**
 * Main exports for the Emma Form Builder
 */

export { EmmaConfig } from './config.js';
export { FormManager } from './form-manager.js';
export { FormBuilder } from './form-builder.js';
export { LocalDeployment } from './local-deployment.js';

// Re-export shared types
export type {
  FormSchema,
  FormField,
  FieldType,
  ValidationRules,
  FormSettings,
} from '@xnok/shared/types';
