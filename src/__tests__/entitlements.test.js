import { describe, it, expect } from 'vitest';
import {
  mapRevenueCatEntitlements,
  mergeEntitlementsRow,
  defaultEntitlements,
} from '../../server/entitlementsRoutes.js';

describe('mapRevenueCatEntitlements – tier mapping', () => {
  it('host_most maps to host_most tier', () => {
    const result = mapRevenueCatEntitlements(['host_most']);
    expect(result.tierId).toBe('host_most');
  });

  it('tier_host_most also maps to host_most', () => {
    const result = mapRevenueCatEntitlements(['tier_host_most']);
    expect(result.tierId).toBe('host_most');
  });

  it('tier_suspect maps to suspect', () => {
    const result = mapRevenueCatEntitlements(['tier_suspect']);
    expect(result.tierId).toBe('suspect');
  });

  it('suspect maps to suspect', () => {
    const result = mapRevenueCatEntitlements(['suspect']);
    expect(result.tierId).toBe('suspect');
  });

  it('twist_truth unlocks the addon', () => {
    const result = mapRevenueCatEntitlements(['twist_truth']);
    expect(result.addonTwistTruth).toBe(true);
    expect(result.tierId).toBe('fibber');
  });

  it('twist_the_truth also unlocks the addon', () => {
    const result = mapRevenueCatEntitlements(['twist_the_truth']);
    expect(result.addonTwistTruth).toBe(true);
  });

  it('dlc_pack_x unlocks pack x', () => {
    const result = mapRevenueCatEntitlements(['dlc_pack_gangsters']);
    expect(result.unlockedThemePackIds).toContain('gangsters');
  });

  it('dlc_pack_some-pack unlocks that pack id', () => {
    const result = mapRevenueCatEntitlements(['dlc_pack_royalty', 'dlc_pack_ninjas']);
    expect(result.unlockedThemePackIds).toContain('royalty');
    expect(result.unlockedThemePackIds).toContain('ninjas');
  });

  it('empty array returns defaults', () => {
    const result = mapRevenueCatEntitlements([]);
    expect(result.tierId).toBe('fibber');
    expect(result.addonTwistTruth).toBe(false);
    expect(result.unlockedThemePackIds).toHaveLength(0);
  });

  it('combines tier + addon + pack from one call', () => {
    const result = mapRevenueCatEntitlements(['host_most', 'twist_truth', 'dlc_pack_wizards']);
    expect(result.tierId).toBe('host_most');
    expect(result.addonTwistTruth).toBe(true);
    expect(result.unlockedThemePackIds).toContain('wizards');
  });

  it('picks the highest tier when multiple are present', () => {
    const result = mapRevenueCatEntitlements(['suspect', 'host_most', 'local_liar']);
    expect(result.tierId).toBe('host_most');
  });
});

describe('mergeEntitlementsRow', () => {
  it('merges two rows keeping the higher tier', () => {
    const prev = { ...defaultEntitlements(), tierId: 'suspect' };
    const next = { tierId: 'fibber', addonTwistTruth: true, unlockedThemePackIds: ['gangsters'] };
    const merged = mergeEntitlementsRow(prev, next);
    expect(merged.tierId).toBe('suspect');
    expect(merged.addonTwistTruth).toBe(true);
    expect(merged.unlockedThemePackIds).toContain('gangsters');
  });

  it('deduplicates unlocked pack ids', () => {
    const prev = { ...defaultEntitlements(), unlockedThemePackIds: ['gangsters', 'ninjas'] };
    const next = { tierId: 'fibber', addonTwistTruth: false, unlockedThemePackIds: ['gangsters'] };
    const merged = mergeEntitlementsRow(prev, next);
    const gangsterCount = merged.unlockedThemePackIds.filter((id) => id === 'gangsters').length;
    expect(gangsterCount).toBe(1);
  });
});
