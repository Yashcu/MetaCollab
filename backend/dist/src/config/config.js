"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
// Define the schema for your environment variables using Zod
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(5000),
    MONGO_URI: zod_1.z.string().nonempty(),
    JWT_SECRET: zod_1.z.string().nonempty(),
    JWT_EXPIRES_IN: zod_1.z.string().nonempty().default('1d'),
    CLIENT_URL: zod_1.z.url().default('http://localhost:5173'),
});
// Parse and validate process.env
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    const treeifiedErrors = zod_1.z.treeifyError(parsedEnv.error);
    console.error('Invalid environment variables:', treeifiedErrors);
    throw new Error('Invalid environment variables.');
}
// Export the validated and type-safe config
exports.config = {
    ...parsedEnv.data,
    isProduction: parsedEnv.data.NODE_ENV === 'production',
};
//# sourceMappingURL=config.js.map