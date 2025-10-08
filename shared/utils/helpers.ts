/**
 * Utility functions for form IDs and data handling
 */

import { customAlphabet } from 'nanoid';

// Generate URL-safe IDs
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

/**
 * Generates a unique form ID
 */
export function generateFormId(baseName?: string): string {
  const timestamp = Date.now().toString(36);
  const random = nanoid(6);

  if (baseName) {
    const slug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${slug}-${timestamp}${random}`;
  }

  return `form-${timestamp}${random}`;
}

/**
 * Generates a unique submission ID
 */
export function generateSubmissionId(): string {
  return `sub_${nanoid(16)}`;
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Parses YAML-like form schema (simplified)
 */
export function parseFormSchema(yamlContent: string): unknown {
  // This is a placeholder - in production, use a proper YAML parser
  try {
    return JSON.parse(yamlContent);
  } catch {
    throw new Error('Invalid form schema format');
  }
}

/**
 * Converts a record to URL-encoded form data
 */
export function toFormData(data: Record<string, string | string[]>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  });

  return formData;
}
