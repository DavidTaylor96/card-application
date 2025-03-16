module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    testMatch: ['**/tests/**/*.test.ts', '**/*.test.ts'],
    globals: {
      'ts-jest': {
        isolatedModules: true
      }
    }
  };