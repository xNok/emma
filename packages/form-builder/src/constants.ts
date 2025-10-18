/**
 * Shared constants for form builder CLI
 */

import type { FieldType } from '@xnok/emma-shared/types';

/**
 * Available field types for forms with display names and descriptions
 */
export const FIELD_TYPES: {
  name: string;
  value: FieldType;
  description: string;
}[] = [
  { name: 'Text Input', value: 'text', description: 'Single-line text field' },
  {
    name: 'Email',
    value: 'email',
    description: 'Email address with validation',
  },
  { name: 'Textarea', value: 'textarea', description: 'Multi-line text field' },
  { name: 'Number', value: 'number', description: 'Numeric input' },
  { name: 'Phone', value: 'tel', description: 'Phone number' },
  { name: 'URL', value: 'url', description: 'Website URL' },
  {
    name: 'Select Dropdown',
    value: 'select',
    description: 'Dropdown selection',
  },
  {
    name: 'Radio Buttons',
    value: 'radio',
    description: 'Single choice from options',
  },
  { name: 'Checkboxes', value: 'checkbox', description: 'Multiple selections' },
  { name: 'Date', value: 'date', description: 'Date picker' },
  { name: 'Time', value: 'time', description: 'Time picker' },
  {
    name: 'Date & Time',
    value: 'datetime-local',
    description: 'Date and time picker',
  },
  {
    name: 'Hidden Field',
    value: 'hidden',
    description: 'Hidden value (for tracking)',
  },
];

/**
 * Available themes for forms
 */
export const THEMES = [
  { name: 'Default', value: 'default', description: 'Clean, modern styling' },
  {
    name: 'Minimal',
    value: 'minimal',
    description: 'Minimal, borderless design',
  },
];
