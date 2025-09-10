import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';

const agent = request(app);

describe('Auth Routes: /api/auth', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL!);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /signup', () => {
    it('should sign up a new user successfully with a valid request', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const res = await agent.post('/api/auth/signup').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(userData.email);

      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser).not.toBeNull();
    });

    it('should return a 400 error if the email is already in use', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      await User.create(userData);
      const res = await agent.post('/api/auth/signup').send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /login', () => {
    it('should log in an existing user with correct credentials', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      await User.create(userData);
      const res = await agent.post('/api/auth/login').send({ email: userData.email, password: userData.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return a 401 error for incorrect password', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      await User.create(userData);
      const res = await agent.post('/api/auth/login').send({ email: userData.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });
});
