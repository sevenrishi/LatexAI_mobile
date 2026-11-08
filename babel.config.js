module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@components': './src/components',
          '@utils': './src/utils',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
