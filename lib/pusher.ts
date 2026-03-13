import Pusher from "pusher";

let _pusherInstance: Pusher | null = null;

function getPusher(): Pusher {
  if (_pusherInstance) return _pusherInstance;

  const requiredEnvVars = {
    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    PUSHER_SECRET: process.env.PUSHER_SECRET,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  };

  for (const [name, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      console.warn(`[Pusher] Missing required environment variable: ${name}`);
      // Return a dummy instance that no-ops in development if keys are missing
      if (process.env.NODE_ENV !== "production") {
        return { trigger: async () => {}, authorizeChannel: () => ({}) } as unknown as Pusher;
      }
      throw new Error(`Missing required environment variable: ${name}. Add it to your .env.local file.`);
    }
  }

  _pusherInstance = new Pusher({
    appId: requiredEnvVars.PUSHER_APP_ID!,
    key: requiredEnvVars.NEXT_PUBLIC_PUSHER_KEY!,
    secret: requiredEnvVars.PUSHER_SECRET!,
    cluster: requiredEnvVars.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true, // always use encrypted connection
  });

  return _pusherInstance;
}

// Proxies the Pusher instance so it's only instantiated when a method like .trigger() is called
export const pusherServer = new Proxy({} as Pusher, {
  get(target, prop: keyof Pusher) {
    const instance = getPusher();
    // Bind to the instance so methods preserve context
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});