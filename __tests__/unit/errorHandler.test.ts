import { describe, it, expect, vi } from 'vitest';
import { errorHandlerMiddleware } from '../middleware/errorHandlerMiddleware';
import { Prisma } from '@prisma/client';

describe('Noble - Error Middleware Stress Test', () => {
  it('should map Prisma P2002 (Unique Constraint) to 409 Conflict', () => {
    const mReq = {} as any;
    const mRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const mNext = vi.fn();
    
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });

    errorHandlerMiddleware(error, mReq, mRes, mNext);

    expect(mRes.status).toHaveBeenCalledWith(409);
    expect(mRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('already exists')
    }));
  });

  it('should handle 503 for database connection failures (System Integrity)', () => {
    const mRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const error = { name: 'PrismaClientInitializationError' };

    errorHandlerMiddleware(error, {} as any, mRes, vi.fn());

    expect(mRes.status).toHaveBeenCalledWith(503);
  });
});