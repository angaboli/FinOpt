const path = require('path');

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@infrastructure': './src/infrastructure',
            '@presentation': './src/presentation',
            '@shared': './src/shared',
            '@finopt/shared': path.resolve(__dirname, '../../packages/shared/src'),
          },
        },
      ],
    ],
  };
};
