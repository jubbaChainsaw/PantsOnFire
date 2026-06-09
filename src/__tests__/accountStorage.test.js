/**
 * Tests for accountStorage.js
 *
 * The module runs in Vitest (PROD=false by default), so all guards are inactive unless
 * we explicitly set import.meta.env.PROD = true before calling the guard helpers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerAccount,
  loginAccount,
  purchaseTierDemo,
  purchaseAddonTwistTruthDemo,
  purchaseDlcPackDemo,
  isDemoBillingEnabled,
  isLocalAuthEnabled,
} from '../account/accountStorage.js';

// ─── Dev mode tests (PROD=false, the Vitest default) ─────────────────────────

describe('accountStorage – dev mode (PROD=false)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear();
  });

  it('isDemoBillingEnabled() returns true in dev mode', () => {
    expect(isDemoBillingEnabled()).toBe(true);
  });

  it('isLocalAuthEnabled() returns true in dev mode', () => {
    expect(isLocalAuthEnabled()).toBe(true);
  });

  it('registerAccount succeeds with valid credentials', () => {
    const result = registerAccount({ displayName: 'Testplayer', password: 'pass1234' });
    expect(result.ok).toBe(true);
    expect(result.session.displayName).toBe('Testplayer');
    expect(result.session.userId).toBeTruthy();
  });

  it('loginAccount succeeds after registering', () => {
    registerAccount({ displayName: 'LoginTest', password: 'abcdef' });
    const result = loginAccount({ displayName: 'LoginTest', password: 'abcdef' });
    expect(result.ok).toBe(true);
    expect(result.session.displayName).toBe('LoginTest');
  });

  it('loginAccount fails with wrong password', () => {
    registerAccount({ displayName: 'WrongPassUser', password: 'correct' });
    const result = loginAccount({ displayName: 'WrongPassUser', password: 'wrong' });
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('registerAccount rejects display names shorter than 2 chars', () => {
    const result = registerAccount({ displayName: 'X', password: 'pass1234' });
    expect(result.ok).toBe(false);
  });

  it('registerAccount rejects passwords shorter than 4 chars', () => {
    const result = registerAccount({ displayName: 'ValidName', password: 'abc' });
    expect(result.ok).toBe(false);
  });

  it('purchaseTierDemo upgrades tier in dev mode', () => {
    const reg = registerAccount({ displayName: 'BuyerDev', password: 'pass1234' });
    const result = purchaseTierDemo(reg.session.userId, 'suspect');
    expect(result.ok).toBe(true);
    expect(result.session.tierId).toBe('suspect');
  });

  it('purchaseTierDemo rejects downgrade', () => {
    const reg = registerAccount({ displayName: 'DowngradeBuyer', password: 'pass1234' });
    purchaseTierDemo(reg.session.userId, 'suspect');
    const result = purchaseTierDemo(reg.session.userId, 'local_liar');
    expect(result.ok).toBe(false);
  });

  it('purchaseAddonTwistTruthDemo unlocks addon in dev mode', () => {
    const reg = registerAccount({ displayName: 'TwistBuyer', password: 'pass1234' });
    const result = purchaseAddonTwistTruthDemo(reg.session.userId);
    expect(result.ok).toBe(true);
    expect(result.session.addonTwistTruth).toBe(true);
  });

  it('purchaseDlcPackDemo unlocks pack in dev mode', () => {
    const reg = registerAccount({ displayName: 'DlcBuyer', password: 'pass1234' });
    const result = purchaseDlcPackDemo(reg.session.userId, 'theme-pack-1');
    expect(result.ok).toBe(true);
  });
});

// ─── Production mode tests (PROD=true, no override) ──────────────────────────
// We set import.meta.env.PROD = true before each test and restore after.
// This works because isDemoBillingEnabled / isLocalAuthEnabled read the flag lazily.

describe('accountStorage – production mode (PROD=true, no override)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear();
    import.meta.env.PROD = true;
    import.meta.env.VITE_ENABLE_DEMO_BILLING = undefined;
    import.meta.env.VITE_ENABLE_LOCAL_AUTH = undefined;
  });

  afterEach(() => {
    import.meta.env.PROD = false;
    delete import.meta.env.VITE_ENABLE_DEMO_BILLING;
    delete import.meta.env.VITE_ENABLE_LOCAL_AUTH;
  });

  it('isDemoBillingEnabled() returns false when PROD=true and no override', () => {
    expect(isDemoBillingEnabled()).toBe(false);
  });

  it('isLocalAuthEnabled() returns false when PROD=true and no override', () => {
    expect(isLocalAuthEnabled()).toBe(false);
  });

  it('purchaseTierDemo is blocked in production', () => {
    const result = purchaseTierDemo('any-user', 'suspect');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/disabled in production/i);
  });

  it('purchaseAddonTwistTruthDemo is blocked in production', () => {
    const result = purchaseAddonTwistTruthDemo('any-user');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/disabled in production/i);
  });

  it('purchaseDlcPackDemo is blocked in production', () => {
    const result = purchaseDlcPackDemo('any-user', 'pack-id');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/disabled in production/i);
  });

  it('registerAccount is blocked in production', () => {
    const result = registerAccount({ displayName: 'Test', password: 'pass1234' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/disabled in production/i);
  });

  it('loginAccount is blocked in production', () => {
    const result = loginAccount({ displayName: 'Test', password: 'pass1234' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/disabled in production/i);
  });
});

// ─── Production mode with override enabled ────────────────────────────────────

describe('accountStorage – production mode with VITE_ENABLE_DEMO_BILLING=true', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear();
    import.meta.env.PROD = true;
    import.meta.env.VITE_ENABLE_DEMO_BILLING = 'true';
  });

  afterEach(() => {
    import.meta.env.PROD = false;
    delete import.meta.env.VITE_ENABLE_DEMO_BILLING;
  });

  it('isDemoBillingEnabled() returns true when override is set', () => {
    expect(isDemoBillingEnabled()).toBe(true);
  });

  it('purchaseTierDemo is allowed when override is set', () => {
    // Need local auth too for register; bypass by using a non-existent user → account not found
    const result = purchaseTierDemo('nonexistent', 'suspect');
    // Fails with 'Account not found' (not the production guard error)
    expect(result.error).not.toMatch(/disabled in production/i);
  });
});
