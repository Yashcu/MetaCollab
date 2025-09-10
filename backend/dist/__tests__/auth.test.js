"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../src/app"));
const User_1 = require("../src/models/User");
const agent = (0, supertest_1.default)(app_1.default);
describe('Auth Routes: /api/auth', () => {
    beforeAll(async () => {
        await mongoose_1.default.connect(process.env.MONGO_URL);
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
    });
    afterEach(async () => {
        await User_1.User.deleteMany({});
    });
    describe('POST /signup', () => {
        it('should sign up a new user successfully with a valid request', async () => {
            const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
            const res = await agent.post('/api/auth/signup').send(userData);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(userData.email);
            const dbUser = await User_1.User.findOne({ email: userData.email });
            expect(dbUser).not.toBeNull();
        });
        it('should return a 400 error if the email is already in use', async () => {
            const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
            await User_1.User.create(userData);
            const res = await agent.post('/api/auth/signup').send(userData);
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('already exists');
        });
    });
    describe('POST /login', () => {
        it('should log in an existing user with correct credentials', async () => {
            const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
            await User_1.User.create(userData);
            const res = await agent.post('/api/auth/login').send({ email: userData.email, password: userData.password });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
        });
        it('should return a 401 error for incorrect password', async () => {
            const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
            await User_1.User.create(userData);
            const res = await agent.post('/api/auth/login').send({ email: userData.email, password: 'wrongpassword' });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid email or password');
        });
    });
});
//# sourceMappingURL=auth.test.js.map