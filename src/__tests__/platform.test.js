import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isNativeAppShell,
  isGameHostingAllowed,
  isPurchasingAllowed,
} from '../lib/platform.js';

function setNativeShell(present) {
  if (present) {
    window.ReactNativeWebView = { postMessage: () => {} };
  } else {
    delete window.ReactNativeWebView;
  }
}

describe('platform gating', () => {
  beforeEach(() => {
    setNativeShell(false);
    import.meta.env.PROD = false;
    delete import.meta.env.VITE_WEB_JOIN_ONLY;
    delete import.meta.env.VITE_ENABLE_WEB_HOSTING;
  });

  afterEach(() => {
    setNativeShell(false);
    import.meta.env.PROD = false;
    delete import.meta.env.VITE_WEB_JOIN_ONLY;
    delete import.meta.env.VITE_ENABLE_WEB_HOSTING;
  });

  it('detects the native app shell via ReactNativeWebView', () => {
    expect(isNativeAppShell()).toBe(false);
    setNativeShell(true);
    expect(isNativeAppShell()).toBe(true);
  });

  it('dev web build: hosting and purchasing allowed', () => {
    expect(isGameHostingAllowed()).toBe(true);
    expect(isPurchasingAllowed()).toBe(true);
  });

  it('production web build: hosting and purchasing blocked by default', () => {
    import.meta.env.PROD = true;
    expect(isGameHostingAllowed()).toBe(false);
    expect(isPurchasingAllowed()).toBe(false);
  });

  it('production native shell: hosting and purchasing allowed', () => {
    import.meta.env.PROD = true;
    setNativeShell(true);
    expect(isGameHostingAllowed()).toBe(true);
    expect(isPurchasingAllowed()).toBe(true);
  });

  it('production web with VITE_ENABLE_WEB_HOSTING=true: hosting restored', () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_ENABLE_WEB_HOSTING = 'true';
    expect(isGameHostingAllowed()).toBe(true);
  });

  it('VITE_WEB_JOIN_ONLY=true forces join-only even in dev', () => {
    import.meta.env.VITE_WEB_JOIN_ONLY = 'true';
    expect(isGameHostingAllowed()).toBe(false);
  });

  it('VITE_WEB_JOIN_ONLY does not affect the native shell', () => {
    import.meta.env.VITE_WEB_JOIN_ONLY = 'true';
    setNativeShell(true);
    expect(isGameHostingAllowed()).toBe(true);
  });
});
