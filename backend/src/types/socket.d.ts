// src/types/socket.d.ts

import { UserPayload } from './express';

declare module 'socket.io' {
  interface Socket {
    data: {
      user: UserPayload;
    }
  }
}
