import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initMonitoring, captureError, trackEvent } from '../lib/monitoring.js';

describe('monitoring (client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('captureError never throws, even with garbage input', () => {
    expect(() => captureError(undefined)).not.toThrow();
    expect(() => captureError(null)).not.toThrow();
    expect(() => captureError('string error')).not.toThrow();
    expect(() => captureError(new Error('real error'))).not.toThrow();
    expect(() => captureError({ weird: 'object' })).not.toThrow();
  });

  it('trackEvent never throws, even with garbage input', () => {
    expect(() => trackEvent('valid_event')).not.toThrow();
    expect(() => trackEvent('')).not.toThrow();
    expect(() => trackEvent('event', { circular: undefined })).not.toThrow();
  });

  it('initMonitoring installs global handlers exactly once', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    initMonitoring();
    const firstCallCount = addSpy.mock.calls.filter(
      ([type]) => type === 'error' || type === 'unhandledrejection',
    ).length;
    // Second init must be a no-op.
    initMonitoring();
    const secondCallCount = addSpy.mock.calls.filter(
      ([type]) => type === 'error' || type === 'unhandledrejection',
    ).length;
    expect(secondCallCount).toBe(firstCallCount);
  });

  it('window error events are captured without crashing the page', () => {
    initMonitoring();
    expect(() =>
      window.dispatchEvent(new ErrorEvent('error', { message: 'synthetic error' })),
    ).not.toThrow();
  });
});
