import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Üretim (Production) ortamında buraya Next.js yönetim panelinin tam URL'i yazılmalıdır
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Yeni bir cihaz bağlandığında çalışır
  handleConnection(client: Socket) {
    console.log(`🔌 [WS CONNECT] Client connected: ${client.id}`);
  }

  // Cihaz bağlantıyı kestiğinde çalışır
  handleDisconnect(client: Socket) {
    console.log(`❌ [WS DISCONNECT] Client disconnected: ${client.id}`);
  }

  // Şubeye özel odaya (room) katılma işlemi (SaaS Yalıtımı)
  @SubscribeMessage('join_branch')
  handleJoinBranch(client: Socket, payload: { branchId: string }) {
    if (payload && payload.branchId) {
      const roomName = `branch_${payload.branchId}`;
      void client.join(roomName); // Cihazı şubeye özel odaya sokuyoruz [1]
      console.log(
        `=== [WS ROOM JOIN] Client ${client.id} joined room: ${roomName} ===`,
      );
      client.emit('joined_room', { room: roomName });
    }
  }

  // Şubedeki belirli odalara (KDS, Garson, Yönetici) anlık sipariş/durum güncellemesi gönderme
  emitToBranch(
    branchId: string,
    eventName: string,
    data: Record<string, unknown>,
  ) {
    const roomName = `branch_${branchId}`;
    this.server.to(roomName).emit(eventName, data);
    console.log(
      `🔔 [WS BROADCAST] Sent event '${eventName}' to room: ${roomName}`,
    );
  }
}
