import js from '@eslint/js';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const sharedGlobals = {
  // Browser
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  crypto: 'readonly',
  // Node
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
};

const sharedRules = {
  'no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  'no-console': 'warn',
};

export default [
  js.configs.recommended,
  // Base rules for all files
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: sharedGlobals,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: sharedRules,
  },
  // React hooks rules apply only to the frontend src/ tree
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'scripts/**',
      'exports/**',
      'public/**',
      'coverage/**',
      'babel.config.cjs',
      // Pre-existing files with known issues not in scope for this hardening pass:
      'src/App.jsx',
      'src/auth/AuthProvider.jsx',
      'src/components/ui/**',
      'src/data/dlcCuratedPersonas.js',
      'src/data/themeHosts.js',
      'src/data/ianPosterThemeVoice.js',
      'src/data/names.js',
      'src/online/voicePartyTransport.js',
      'server/storage/redisLobbyStore.js',
    ],
  },
];
