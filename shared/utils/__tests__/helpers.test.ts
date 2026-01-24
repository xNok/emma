import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../helpers';

describe('sanitizeInput', () => {
  it('should escape < and >', () => {
    expect(sanitizeInput('<div>')).toBe('&lt;div&gt;');
  });

  it('should escape double quotes', () => {
    expect(sanitizeInput('class="test"')).toBe('class=&quot;test&quot;');
  });

  it('should escape single quotes', () => {
    expect(sanitizeInput("it's")).toBe('it&#x27;s');
  });

  it('should escape forward slashes', () => {
    expect(sanitizeInput('a/b')).toBe('a&#x2F;b');
  });

  it('should handle mixed content', () => {
    const input = '<div class="test">It\'s a/b</div>';
    const expected = '&lt;div class=&quot;test&quot;&gt;It&#x27;s a&#x2F;b&lt;&#x2F;div&gt;';
    expect(sanitizeInput(input)).toBe(expected);
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle strings with no special characters', () => {
    expect(sanitizeInput('hello world')).toBe('hello world');
  });
});
