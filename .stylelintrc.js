module.exports = {
  extends: require.resolve('@umijs/max/stylelint'),
  overrides: [
    {
      files: ['**/*.less'],
      customSyntax: 'postcss-less',
    },
  ],
};
