const plugins = [['@babel/plugin-proposal-decorators', { version: 'legacy' }]]

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      { targets: { node: 'current' }, useBuiltIns: 'entry', corejs: '3.27' },
    ],
    '@babel/preset-typescript',
  ],
  plugins: plugins,
}
