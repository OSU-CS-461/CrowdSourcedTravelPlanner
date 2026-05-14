import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

describe('Jiayi - JWT Expiration Stress Test', () => {
  it('should reject an expired token (CWE-613)', () => {
    const expiredToken = jwt.sign(
      { userId: '123' }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '-1h' }
    );

    const verifyToken = () => jwt.verify(expiredToken, process.env.JWT_SECRET || 'secret');

    expect(verifyToken).toThrow('jwt expired');
  });
});