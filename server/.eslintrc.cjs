module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-process-exit': 'off',
  },
};
