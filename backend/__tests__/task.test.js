"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = require("../src/models/Project");
const Task_1 = require("../src/models/Task");
const User_1 = require("../src/models/User");
const helpers_1 = require("../src/test-utils/helpers");
describe('Task Routes: /api/projects/:projectId/tasks', () => {
    let ownerAgent, ownerToken;
    let otherAgent, otherToken;
    let project;
    beforeEach(async () => {
        const ownerData = await (0, helpers_1.getAuthAgent)();
        ownerAgent = ownerData.agent;
        ownerToken = ownerData.token;
        const otherUserData = await (0, helpers_1.getAuthAgent)();
        otherAgent = otherUserData.agent;
        otherToken = otherUserData.token;
        const projectRes = await ownerAgent
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Task Project' });
        project = projectRes.body.data;
    });
    afterEach(async () => {
        await User_1.User.deleteMany({});
        await Project_1.Project.deleteMany({});
        await Task_1.Task.deleteMany({});
    });
    beforeAll(async () => {
        await mongoose_1.default.connect(process.env.MONGO_URL);
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
    });
    describe('POST /', () => {
        it('should create a task in a project if the user is a member', async () => {
            const taskData = { title: 'New Important Task' };
            const res = await ownerAgent
                .post(`/api/projects/${project.id}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(taskData);
            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe(taskData.title);
            expect(res.body.data.project).toBe(project.id);
        });
        it('should NOT create a task if the user is NOT a member of the project', async () => {
            const taskData = { title: 'Malicious Task' };
            const res = await otherAgent
                .post(`/api/projects/${project.id}/tasks`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send(taskData);
            expect(res.status).toBe(403);
        });
    });
    describe('PUT /:taskId', () => {
        it('should allow a project member to update a task', async () => {
            const taskRes = await ownerAgent
                .post(`/api/projects/${project.id}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Initial Title' });
            const taskId = taskRes.body.data.id;
            const updateData = { title: 'Updated Title' };
            const res = await ownerAgent
                .put(`/api/projects/${project.id}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(updateData);
            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('Updated Title');
        });
    });
});
//# sourceMappingURL=task.test.js.map