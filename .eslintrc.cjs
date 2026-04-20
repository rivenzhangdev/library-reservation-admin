module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'unused-imports'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    // 将 any 类型检查降级为警告，避免阻断开发流程
    '@typescript-eslint/no-explicit-any': 'warn',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // 允许在条件语句和循环中声明函数
    'no-inner-declarations': 'off',
    // 允许使用 require（兼容旧代码）
    '@typescript-eslint/no-var-requires': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['.umirc.ts'],
    },
    {
      files: ['.umirc.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'unused-imports/no-unused-vars': 'off',
      },
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-inner-declarations': 'off',
      },
    },
  ],
};
