import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'out/'],
  },
];

export default eslintConfig;
