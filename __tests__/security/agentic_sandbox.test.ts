import { AIAgentController } from '../services/ai_service';

describe('SANS: Agentic AI Action Validation', () => {
  it('should prevent an AI agent from escalating its own permissions', async () => {
    const agent = new AIAgentController(userContext);
    
    const maliciousAction = { action: 'UPDATE_USER_ROLE', target: 'ADMIN' };
    
    const result = await agent.execute(maliciousAction);
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toContain('Insufficient permissions');
  });
});