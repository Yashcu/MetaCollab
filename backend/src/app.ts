import express, { Application, Request, Response } from 'express'; // Added Request, Response
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import compression from 'compression';

import { config } from './config/config';
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import invitationRoutes from './routes/invitationRoutes';
import taskRoutes from './routes/taskRoutes';
import adminRoutes from './routes/adminRoutes';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorMiddleware';

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter, authRoutes);

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRoutes = express.Router();
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/projects', projectRoutes);
apiRoutes.use('/invitations', invitationRoutes);
apiRoutes.use('/projects/:projectId/tasks', taskRoutes);
apiRoutes.use('/admin', adminRoutes);

app.use('/api', generalApiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
