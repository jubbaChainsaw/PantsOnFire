/** @param {string | undefined} provider */
export function isCloudAuthProvider(provider) {
  return provider === 'pof' || provider === 'supabase';
}
