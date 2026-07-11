import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import boundariesPlugin from 'eslint-plugin-boundaries'

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
  {
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      boundaries: boundariesPlugin,
    },
    rules: {
      'no-console': 'warn',
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
    settings: {
      react: {
        version: '19',
      },
      // Epic 2C boundaries (enforced as WARN during Foundation; tightened in later stages).
      // Defines the element taxonomy for the target monorepo. Rules are non-blocking until
      // packages/* and apps/* actually exist, then promote to 'error' (IMPLEMENTATION_RULES R3-R5).
      'boundaries/elements': [
        { type: 'packages', pattern: 'packages/*' },
        { type: 'apps', pattern: 'apps/*' },
        { type: 'lib', pattern: 'lib' },
        { type: 'app', pattern: 'app' },
      ],
    },
  },
  {
    // Soft guard (warn only): domains/packages must not import app/ UI; APIs stay thin.
    // Promoted to 'error' once domains exist (Stage 3).
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'boundaries/element-types': [
        'warn',
        {
          default: 'disallow',
          rules: [{ from: 'packages', disallow: 'app' }],
        },
      ],
    },
  },
]
