import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().nonempty(),
  CLIENT_URL: z.url().default('http://localhost:5173'),
  SOCKET_URL: z.url().default('http://localhost:5000'),
  JWT_SECRET: z.string().nonempty(),
  JWT_EXPIRES_IN: z.string().nonempty().default('1d'),
  REFRESH_TOKEN_SECRET: z.string().nonempty(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().nonempty().default('7d'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    'Invalid environment variables:',
    JSON.stringify(parsedEnv.error.flatten().fieldErrors, null, 2)
  );
  throw new Error('Invalid environment variables. Check your .env file.');
}

export const config = {
  ...parsedEnv.data,
  isProduction: parsedEnv.data.NODE_ENV === 'production',
};
