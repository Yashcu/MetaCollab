import Pusher from "pusher";

const requiredEnvVars = {
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
};

for (const [name, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env.local file.`
    );
  }
}

export const pusherServer = new Pusher({
  appId: requiredEnvVars.PUSHER_APP_ID!,
  key: requiredEnvVars.NEXT_PUBLIC_PUSHER_KEY!,
  secret: requiredEnvVars.PUSHER_SECRET!,
  cluster: requiredEnvVars.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true, // always use encrypted connection
});