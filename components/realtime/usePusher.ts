"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";

// ---------------------------------------------------------------------------
// usePusher — subscribe to a single event on a single Pusher channel.
//
// IMPORTANT: The callback is stored in a ref so we always call the latest
// version of it WITHOUT putting it in the useEffect dependency array.
// If we put the callback in deps, any inline function passed as callback
// would cause the effect to re-run on every render — unsubscribing and
// resubscribing to Pusher on every single render (a "subscription storm").
// ---------------------------------------------------------------------------

/**
 * Subscribe to a Pusher channel event.
 */
export const usePusher = <TData = unknown>(
  channelName: string,
  eventName: string,
  callback: (data: TData) => void
): void => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const handler = (data: TData) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      pusher.unsubscribe(channelName);
    };

    // Only re-subscribe if the channel name or event name changes.
    // The callback is intentionally excluded — it's handled via the ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, eventName]);
};