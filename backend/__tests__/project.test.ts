import mongoose from 'mongoose';
import { Project } from '../src/models/Project';
import { User } from '../src/models/User';
import { getAuthAgent } from '../src/test-utils/helpers';

describe('Project Routes: /api/projects', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL!);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await Project.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /', () => {
    it('should create a new project and return the populated owner', async () => {
      const { agent, user, token } = await getAuthAgent();
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
      const { agent: agentA, token: tokenA } = await getAuthAgent();
      const { agent: agentB, token: tokenB } = await getAuthAgent();
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
      const { agent, token } = await getAuthAgent();
      const createRes = await agent.post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name: 'To Be Deleted' });
      const projectId = createRes.body.data.id;
      const deleteRes = await agent.delete(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`);
      expect(deleteRes.status).toBe(200);
    });
    it('should NOT allow a non-owner to delete a project', async () => {
      const { agent: ownerAgent, token: ownerToken } = await getAuthAgent();
      const { agent: otherAgent, token: otherToken } = await getAuthAgent();
      const createRes = await ownerAgent.post('/api/projects').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Protected Project' });
      const projectId = createRes.body.data.id;
      const deleteRes = await otherAgent.delete(`/api/projects/${projectId}`).set('Authorization', `Bearer ${otherToken}`);
      expect(deleteRes.status).toBe(404);
    });
  });
});
