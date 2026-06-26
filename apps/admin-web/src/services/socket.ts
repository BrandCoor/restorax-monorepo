import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Tek bir soket bağlantısı oluşturup tüm sayfalarda yeniden kullanmak için (Singleton Pattern)
export const getSocket = (baseURL: string): Socket => {
  if (!socket) {
    socket = io(baseURL, {
      autoConnect: false,
    });
  }
  return socket;
};