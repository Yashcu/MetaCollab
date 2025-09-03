import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    callbackURL: process.env.GITHUB_CALLBACK_URL || "/api/auth/github/callback",
  },
  nodeEnv: process.env.NODE_ENV || "development",
};
