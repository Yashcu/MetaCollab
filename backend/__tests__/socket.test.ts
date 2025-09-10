import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/config';
import { initializeSocket } from '../src/socket';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { IUser } from '../src/models/User';

describe('Socket.IO Manager', () => {
  let io: SocketIOServer, server: HttpServer, clientSocket: ClientSocket, port: number;
  let user: IUser, userToken: string;
  let otherUser: IUser, otherToken: string;
  let project: any;

  beforeAll((done) => {
    mongoose.connect(process.env.MONGO_URL!).then(async () => {
      user = await User.create({ name: 'Socket User', email: 'socket@test.com', password: 'password' });
      otherUser = await User.create({ name: 'Other User', email: 'other@test.com', password: 'password' });
      project = await Project.create({ name: 'Socket Project', owner: user._id, members: [user._id] });

      const payload1 = { userId: user._id.toString(), name: user.name, role: user.role, email: user.email };
      const payload2 = { userId: otherUser._id.toString(), name: otherUser.name, role: otherUser.role, email: otherUser.email };

      userToken = jwt.sign(payload1, config.JWT_SECRET);
      otherToken = jwt.sign(payload2, config.JWT_SECRET);

      server = createServer();
      io = new SocketIOServer(server);
      initializeSocket(io);
      server.listen(() => {
        const address = server.address();
        port = typeof address === 'string' ? 0 : address!.port;
        done();
      });
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await mongoose.disconnect();
    io.close();
    server.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Authentication', () => {
    it('should reject connection without a token', (done) => {
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect_error', (err) => {
        expect(err.message).toBe('Authentication error: Token not provided');
        done();
      });
    });

    it('should accept connection with a valid token', (done) => {
      clientSocket = Client(`http://localhost:${port}`, { auth: { token: userToken } });
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });
  });

  describe('Project Room Authorization', () => {
    it('should allow a project member to join a project room', (done) => {
      clientSocket = Client(`http://localhost:${port}`, { auth: { token: userToken } });
      clientSocket.on('connect', () => {
        clientSocket.emit('project:join', project._id.toString(), (response: { status: string }) => {
          expect(response.status).toBe('ok');
          done();
        });
      });
    });

    it('should NOT allow a non-member to join a project room', (done) => {
      clientSocket = Client(`http://localhost:${port}`, { auth: { token: otherToken } });
      clientSocket.on('connect', () => {
        clientSocket.emit('project:join', project._id.toString(), (response: { status: string, message?: string }) => {
          expect(response.status).toBe('error');
          expect(response.message).toContain('Access denied');
          done();
        });
      });
    });
  });
});
