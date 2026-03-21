module.exports = {
  testEnvironment: 'node',
  testMatch: [
    "**/tests/**/*.test.js",
    "**/src/tests/**/*.test.js"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/frontend/",
    "/mobile/"
  ]
};
