"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = require("../src/models/Project");
const User_1 = require("../src/models/User");
const helpers_1 = require("../src/test-utils/helpers");
describe('Project Routes: /api/projects', () => {
    beforeAll(async () => {
        await mongoose_1.default.connect(process.env.MONGO_URL);
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
    });
    afterEach(async () => {
        await Project_1.Project.deleteMany({});
        await User_1.User.deleteMany({});
    });
    describe('POST /', () => {
        it('should create a new project and return the populated owner', async () => {
            const { agent, user, token } = await (0, helpers_1.getAuthAgent)();
            const projectData = { name: 'My First Project' };
            const res = await agent
                .post('/api/projects')
                .set('Authorization', `Bearer ${token}`)
                .send(projectData);
            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(projectData.name);
            expect(String(res.body.data.owner.id)).toEqual(String(user.id));
        });
    });
    describe('GET /', () => {
        it("should return only projects the user is a member of", async () => {
            const { agent: agentA, token: tokenA } = await (0, helpers_1.getAuthAgent)();
            const { agent: agentB, token: tokenB } = await (0, helpers_1.getAuthAgent)();
            await agentA.post('/api/projects').set('Authorization', `Bearer ${tokenA}`).send({ name: 'Project A' });
            await agentB.post('/api/projects').set('Authorization', `Bearer ${tokenB}`).send({ name: 'Project B' });
            const res = await agentA.get('/api/projects').set('Authorization', `Bearer ${tokenA}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Project A');
        });
    });
    describe('DELETE /:projectId', () => {
        it('should allow the owner of a project to delete it', async () => {
            const { agent, token } = await (0, helpers_1.getAuthAgent)();
            const createRes = await agent.post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name: 'To Be Deleted' });
            const projectId = createRes.body.data.id;
            const deleteRes = await agent.delete(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`);
            expect(deleteRes.status).toBe(200);
        });
        it('should NOT allow a non-owner to delete a project', async () => {
            const { agent: ownerAgent, token: ownerToken } = await (0, helpers_1.getAuthAgent)();
            const { agent: otherAgent, token: otherToken } = await (0, helpers_1.getAuthAgent)();
            const createRes = await ownerAgent.post('/api/projects').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Protected Project' });
            const projectId = createRes.body.data.id;
            const deleteRes = await otherAgent.delete(`/api/projects/${projectId}`).set('Authorization', `Bearer ${otherToken}`);
            expect(deleteRes.status).toBe(404);
        });
    });
});
//# sourceMappingURL=project.test.js.map