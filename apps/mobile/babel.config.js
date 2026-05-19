module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(!isTest);

  return {
    presets: [
      [
        'babel-preset-expo',
        // En mode test, on désactive le plugin Reanimated qui nécessite
        // react-native-worklets/plugin (non disponible hors du bundler natif)
        isTest ? { reanimated: false } : {},
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': '.' },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  };
};
