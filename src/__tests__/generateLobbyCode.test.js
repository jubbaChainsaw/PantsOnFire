// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateLobbyCode } from '../../server/storage/lobbyStore.js';

const ALLOWED_CHARS = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
const AMBIGUOUS_CHARS = new Set('0O1I');

describe('generateLobbyCode', () => {
  it('returns a 6-character string', () => {
    const code = generateLobbyCode();
    expect(code).toHaveLength(6);
  });

  it('only contains allowed characters', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateLobbyCode();
      for (const ch of code) {
        expect(ALLOWED_CHARS.has(ch), `"${ch}" in code "${code}" is not an allowed char`).toBe(
          true,
        );
      }
    }
  });

  it('never contains ambiguous characters (0, O, 1, I)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateLobbyCode();
      for (const ch of code) {
        expect(
          AMBIGUOUS_CHARS.has(ch),
          `"${ch}" in code "${code}" is an ambiguous char`,
        ).toBe(false);
      }
    }
  });

  it('generates varied codes (low collision probability)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateLobbyCode()));
    expect(codes.size).toBeGreaterThan(40);
  });

  it('returns uppercase string', () => {
    const code = generateLobbyCode();
    expect(code).toBe(code.toUpperCase());
  });
});
