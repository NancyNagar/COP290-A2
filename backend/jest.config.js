// jest.config.js  (place at: C:\assignment2\COP290-A2\backend\jest.config.js)
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    workerIdleMemoryLimit: "512MB",
    testMatch: ["**/tests/**/*.test.ts"],

    // Fixes "Cannot find module '../types/express'" — it's a .d.ts type-only file,
    // not a real runtime module. Map it to an empty stub so Jest doesn't crash.
    moduleNameMapper: {
        "^../types/express$": "<rootDir>/src/tests/__stubs__/empty.ts",
        "^../../types/express$": "<rootDir>/src/tests/__stubs__/empty.ts",
    },

    // Remove or leave empty — do NOT reference a file that doesn't exist
    // setupFilesAfterEnv: [],
};