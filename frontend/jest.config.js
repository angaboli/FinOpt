'use strict';

const path = require('path');
const preset = require('jest-expo/jest-preset');

const jestExpoSetup = require.resolve('jest-expo/src/preset/setup.js');

module.exports = {
  ...preset,
  setupFiles: [
    ...preset.setupFiles.filter((f) => path.resolve(f) !== path.resolve(jestExpoSetup)),
    require.resolve('./jest-native-modules-patch.js'),
    jestExpoSetup,
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
};
