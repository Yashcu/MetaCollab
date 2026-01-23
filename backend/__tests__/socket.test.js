"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socket_io_client_1 = require("socket.io-client");
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../src/config/config");
const socket_1 = require("../src/socket");
const User_1 = require("../src/models/User");
const Project_1 = require("../src/models/Project");
describe('Socket.IO Manager', () => {
    let io, server, clientSocket, port;
    let user, userToken;
    let otherUser, otherToken;
    let project;
    beforeAll((done) => {
        mongoose_1.default.connect(process.env.MONGO_URL).then(async () => {
            user = await User_1.User.create({ name: 'Socket User', email: 'socket@test.com', password: 'password' });
            otherUser = await User_1.User.create({ name: 'Other User', email: 'other@test.com', password: 'password' });
            project = await Project_1.Project.create({ name: 'Socket Project', owner: user._id, members: [user._id] });
            const payload1 = { userId: user._id.toString(), name: user.name, role: user.role, email: user.email };
            const payload2 = { userId: otherUser._id.toString(), name: otherUser.name, role: otherUser.role, email: otherUser.email };
            userToken = jsonwebtoken_1.default.sign(payload1, config_1.config.JWT_SECRET);
            otherToken = jsonwebtoken_1.default.sign(payload2, config_1.config.JWT_SECRET);
            server = (0, http_1.createServer)();
            io = new socket_io_1.Server(server);
            (0, socket_1.initializeSocket)(io);
            server.listen(() => {
                const address = server.address();
                port = typeof address === 'string' ? 0 : address.port;
                done();
            });
        });
    });
    afterAll(async () => {
        await User_1.User.deleteMany({});
        await Project_1.Project.deleteMany({});
        await mongoose_1.default.disconnect();
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
            clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`);
            clientSocket.on('connect_error', (err) => {
                expect(err.message).toBe('Authentication error: Token not provided');
                done();
            });
        });
        it('should accept connection with a valid token', (done) => {
            clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, { auth: { token: userToken } });
            clientSocket.on('connect', () => {
                expect(clientSocket.connected).toBe(true);
                done();
            });
        });
    });
    describe('Project Room Authorization', () => {
        it('should allow a project member to join a project room', (done) => {
            clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, { auth: { token: userToken } });
            clientSocket.on('connect', () => {
                clientSocket.emit('project:join', project._id.toString(), (response) => {
                    expect(response.status).toBe('ok');
                    done();
                });
            });
        });
        it('should NOT allow a non-member to join a project room', (done) => {
            clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, { auth: { token: otherToken } });
            clientSocket.on('connect', () => {
                clientSocket.emit('project:join', project._id.toString(), (response) => {
                    expect(response.status).toBe('error');
                    expect(response.message).toContain('Access denied');
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=socket.test.js.map