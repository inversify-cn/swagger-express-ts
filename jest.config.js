module.exports = {
  'testEnvironment': 'node',
  roots: ['./'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: 'e2e\\.(spec|test)\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json',
      // 'enableTsDiagnostics': true
    },
  },
  testURL: 'http://localhost',
  modulePathIgnorePatterns: ['<rootDir>/dist'],
}
