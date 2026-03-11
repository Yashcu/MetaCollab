import PusherJS from "pusher-js";

let pusherClient: PusherJS | null = null;

export const getPusherClient = (): PusherJS => {
  if (pusherClient) {
    return pusherClient;
  }
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!pusherKey) {
    throw new Error(
      "NEXT_PUBLIC_PUSHER_KEY is not set. Add it to your .env.local file."
    );
  }

  if (!pusherCluster) {
    throw new Error(
      "NEXT_PUBLIC_PUSHER_CLUSTER is not set. Add it to your .env.local file."
    );
  }

  // Create the Pusher connection
  pusherClient = new PusherJS(pusherKey, {
    cluster: pusherCluster,
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
    },
  });

  return pusherClient;
};