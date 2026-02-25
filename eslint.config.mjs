import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    rules: {
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'only-multiline'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'no-console': 'warn',
      'no-unused-vars': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['components/ui/**/*.vue'],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,mjs}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  }
);
