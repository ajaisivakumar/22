import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, hashToken, normalizeEmail, generateSecureToken } from '../src/utils/crypto';
import { signupSchema } from '../src/validators/auth.validator';

describe('Auth Utilities & Crypto', () => {
  it('should hash and verify passwords accurately', async () => {
    const rawPassword = 'SecurePassword2026!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).toBeDefined();
    expect(hashed).not.toEqual(rawPassword);

    const isMatch = await comparePassword(rawPassword, hashed);
    expect(isMatch).toBe(true);

    const isWrong = await comparePassword('WrongPassword', hashed);
    expect(isWrong).toBe(false);
  });

  it('should normalize email addresses correctly', () => {
    expect(normalizeEmail('  User@College.EDU  ')).toBe('user@college.edu');
    expect(normalizeEmail('JOHN.DOE@GMAIL.COM')).toBe('john.doe@gmail.com');
  });

  it('should generate secure tokens and generate consistent sha256 hashes', () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(64);

    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should validate strong passwords in signup schema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@college.edu',
      password: 'StrongPassword1',
    };
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = {
      name: 'John Doe',
      email: 'john@college.edu',
      password: 'weak',
    };
    const invalidResult = signupSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
});
