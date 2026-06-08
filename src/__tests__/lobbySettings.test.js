import { describe, it, expect } from 'vitest';
import { sanitizeLobbySettings } from '../../server/storage/lobbyStore.js';

describe('sanitizeLobbySettings', () => {
  it('returns default settings when called with empty object', () => {
    const result = sanitizeLobbySettings({});
    expect(result.mode).toBe('classic');
    expect(result.winCondition).toBe('rounds');
    expect(result.pointsToWin).toBe(15);
    expect(result.roundsPerPlayer).toBe(1);
    expect(result.adultMode).toBe(false);
  });

  it('clamps pointsToWin to min 5', () => {
    const result = sanitizeLobbySettings({ pointsToWin: 1 });
    expect(result.pointsToWin).toBe(5);
  });

  it('clamps pointsToWin to max 50', () => {
    const result = sanitizeLobbySettings({ pointsToWin: 999 });
    expect(result.pointsToWin).toBe(50);
  });

  it('accepts pointsToWin within range', () => {
    const result = sanitizeLobbySettings({ pointsToWin: 25 });
    expect(result.pointsToWin).toBe(25);
  });

  it('clamps roundsPerPlayer to min 1', () => {
    const result = sanitizeLobbySettings({ roundsPerPlayer: 0 });
    expect(result.roundsPerPlayer).toBe(1);
  });

  it('clamps roundsPerPlayer to max 6', () => {
    const result = sanitizeLobbySettings({ roundsPerPlayer: 100 });
    expect(result.roundsPerPlayer).toBe(6);
  });

  it('accepts roundsPerPlayer within range', () => {
    const result = sanitizeLobbySettings({ roundsPerPlayer: 3 });
    expect(result.roundsPerPlayer).toBe(3);
  });

  it('forces mode to "classic" regardless of input', () => {
    const result = sanitizeLobbySettings({ mode: 'chaos' });
    expect(result.mode).toBe('classic');
  });

  it('recognises winCondition "points"', () => {
    const result = sanitizeLobbySettings({ winCondition: 'points' });
    expect(result.winCondition).toBe('points');
  });

  it('defaults winCondition to "rounds" for unknown values', () => {
    const result = sanitizeLobbySettings({ winCondition: 'bananas' });
    expect(result.winCondition).toBe('rounds');
  });

  it('caps inviteUsernames at 64 entries', () => {
    const longList = Array.from({ length: 100 }, (_, i) => `user${i}`);
    const result = sanitizeLobbySettings({ inviteUsernames: longList });
    expect(result.inviteUsernames).toHaveLength(64);
  });

  it('returns defaults when called with null', () => {
    const result = sanitizeLobbySettings(null);
    expect(result.winCondition).toBe('rounds');
  });

  it('floors decimal values', () => {
    const result = sanitizeLobbySettings({ pointsToWin: 12.9, roundsPerPlayer: 3.7 });
    expect(result.pointsToWin).toBe(12);
    expect(result.roundsPerPlayer).toBe(3);
  });
});
