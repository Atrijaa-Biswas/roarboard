import { describe, it, expect } from 'vitest';
import { sanitiseInput } from '../../utils/sanitise';

describe('sanitiseInput', () => {
  it('should strip XSS strings and HTML tags', () => {
    expect(sanitiseInput('<script>alert("xss")</script>Hello <b onmouseover="alert()">World</b>')).toBe('alert("xss")Hello World');
  });
  
  it('should trim whitespace', () => {
    expect(sanitiseInput('   padded   ')).toBe('padded');
  });
  
  it('should truncate to 500 characters', () => {
    const huge = 'a'.repeat(600);
    const result = sanitiseInput(huge);
    expect(result.length).toBe(500);
    expect(result).toBe('a'.repeat(500));
  });

  it('should handle empty strings', () => {
    expect(sanitiseInput('')).toBe('');
    expect(sanitiseInput('   ')).toBe('');
  });
});
