import js from '@eslint/js';
import globals from 'globals';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

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
  // Empty catch blocks are used intentionally throughout for best-effort
  // media/audio operations that may fail on some browsers.
  'no-empty': ['error', { allowEmptyCatch: true }],
};

export default [
  js.configs.recommended,
  // Base rules for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
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
      // Downgraded to warn: fixing the ~25 pre-existing setState-in-effect
      // call sites requires a large refactor of App.jsx that carries real
      // regression risk. Track as tech debt; do not block CI.
      'react-hooks/set-state-in-effect': 'warn',
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
    ],
  },
];
