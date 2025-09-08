// Simplified using @antfu/eslint-config.
// Focus: TS + React + JSX runtime + Prettier, keep strict any ban.
// Additional ignores & a couple of local rule tweaks only.

import antfu from '@antfu/eslint-config'

// Base config from antfu
export default antfu({
  react: true,
  typescript: true,
  ignores: [
    'dist',
    'build',
    'coverage',
    'node_modules',
    '.vite',
    'tsconfig.json',
    'tsconfig.eslint.json',
    'tsconfig.node.json',
    'tailwind.config.json',
    'generated',
    '*.d.ts',
    'src/**/*.d.ts',
    'statics/*',
    '.claude/**',
    '.vscode/**',
  ],
  rules: {
    // Enforce no explicit any across project
    '@typescript-eslint/no-explicit-any': ['warn'],
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    // Keep prop-types off (handled by TS)
    'react/prop-types': 'off',
  },
}, {
  files: ['**/*.json'],
  rules: {
    'style/eol-last': 'off',
    'eol-last': 'off',
  },
})
