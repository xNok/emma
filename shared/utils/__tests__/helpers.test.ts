import { describe, it, expect } from 'vitest';
import { isValidEmail } from '../helpers';

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
    expect(isValidEmail('123@123.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('test')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('test@example')).toBe(false); // The current regex expects a dot in the domain
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test example.com')).toBe(false);
  });
});
