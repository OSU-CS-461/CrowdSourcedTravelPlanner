import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Chloe - Security & IDOR Verification', () => {
  it('should prevent User B from editing User A’s trip (CWE-639)', async () => {
    const userBToken = "JWT_TOKEN_FOR_USER_B";
    const userATripId = "TRIP_ID_OWNED_BY_USER_A";

    const response = await request(app)
      .patch(`/api/experiences/${userATripId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ title: "Hacked Title" });

    expect(response.status).toBe(403); 
    expect(response.body.message).toBe("You do not have permission to edit this resource.");
  });
});