// Set environment variables before any modules are imported.
// This file runs via jest.config.js `setupFiles` — before the module registry loads.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.DATABASE_URL = 'postgresql://user:karis@localhost:5432/storyforge_test';
