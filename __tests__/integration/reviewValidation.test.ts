import { describe, it, expect } from 'vitest';
import { reviewSchema } from '../schemas/reviewSchema';

describe('Noble - Review Validation (Zod Stress Test)', () => {
  it('should reject ratings higher than 5 (Boundary Value Analysis)', () => {
    const result = reviewSchema.safeParse({
      rating: 6,
      comment: "Great place!",
      tripId: "123"
    });
    expect(result.success).toBe(false);
  });

  it('should reject excessively long comments (Buffer Overflow/DOS prevention)', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: "a".repeat(10001),
      tripId: "123"
    });
    expect(result.success).toBe(false);
  });
});