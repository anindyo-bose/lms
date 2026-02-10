{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>"],
  "testMatch": ["**/__tests__/**/*.test.ts", "**/*.spec.ts"],
  "maxWorkers": "50%",
  "collectCoverageFrom": [
    "apps/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "packages/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/dist/**"
  ],
  "coverageThreshold": {
    "global": {
      "statements": 95,
      "branches": 95,
      "functions": 95,
      "lines": 95
    }
  },
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapper": {
    "^@composey/shared-types$": "<rootDir>/packages/shared-types/src",
    "^@composey/shared-utils$": "<rootDir>/packages/shared-utils/src",
    "^@composey/contract-specs$": "<rootDir>/packages/contract-specs/src"
  }
}
