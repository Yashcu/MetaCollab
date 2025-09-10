describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw an error if JWT_SECRET is not defined', () => {
    delete process.env.JWT_SECRET;

    // The act of importing the module should throw the error
    expect(() => require('../src/config/config')).toThrow(
      'Invalid environment variables. Check your .env file.'
    );
  });

  it('should load config successfully with all required variables', () => {
    process.env.MONGO_URI = 'mongodb://test';
    process.env.JWT_SECRET = 'secret';
    process.env.REFRESH_TOKEN_SECRET = 'refresh_secret';

    const { config } = require('../src/config/config');
    expect(config.PORT).toBe(5000);
    expect(config.JWT_SECRET).toBe('secret');
  });
});
