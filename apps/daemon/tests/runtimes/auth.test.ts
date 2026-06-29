import { describe, it, expect } from 'vitest';
import {
  classifyAgentAuthFailure,
  isDhcoderAuthFailureText,
} from '../../src/runtimes/auth.js';

describe('dhcoder auth classification', () => {
  it('recognizes not-logged-in probe output', () => {
    expect(isDhcoderAuthFailureText('Status: Not logged in')).toBe(true);
  });

  it('recognizes authentication-required messages', () => {
    expect(isDhcoderAuthFailureText('Authentication required. Please run dhcoder login.')).toBe(true);
  });

  it('does not flag logged-in status as auth failure', () => {
    expect(isDhcoderAuthFailureText('Status: Logged in\nToken expires in: 701h 38m')).toBe(false);
  });

  it('returns tailored guidance for dhcoder auth failures', () => {
    const result = classifyAgentAuthFailure('dhcoder', 'Status: Not logged in');
    expect(result).toEqual({
      status: 'missing',
      message:
        'DHcoder is installed but is not authenticated. Run `dhcoder login` in a terminal, then rescan. If Open Design was launched outside an interactive shell, your shell rc files (e.g. ~/.zshrc) may not be loaded into its environment.',
    });
  });

  it('returns null for authenticated dhcoder status', () => {
    expect(classifyAgentAuthFailure('dhcoder', 'Status: Logged in')).toBeNull();
  });
});
