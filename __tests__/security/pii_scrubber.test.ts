import { scrubDataForLLM } from '../utils/pii_utils';

describe('SANS: LLM Data Leakage Prevention', () => {
  it('should detect and redact PII before sending payload to LLM provider', () => {
    const rawInput = "My name is Noble Huang and my email is noble@oregonstate.edu";
    const scrubbed = scrubDataForLLM(rawInput);
    
    expect(scrubbed).not.toContain('Noble Huang');
    expect(scrubbed).not.toContain('oregonstate.edu');
    expect(scrubbed).toContain('[REDACTED_NAME]');
  });
});