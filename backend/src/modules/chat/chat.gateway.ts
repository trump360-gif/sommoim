import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; userId: string },
  ) {
    const canJoin = await this.chatService.canAccessChat(data.meetingId, data.userId);
    if (!canJoin) {
      client.emit('error', { message: '채팅방에 접근할 수 없습니다' });
      return;
    }

    client.join(`meeting:${data.meetingId}`);
    client.emit('joined', { meetingId: data.meetingId });
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string },
  ) {
    client.leave(`meeting:${data.meetingId}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetingId: string; userId: string; content: string },
  ) {
    const message = await this.chatService.createMessage(data.meetingId, data.userId, data.content);
    this.server.to(`meeting:${data.meetingId}`).emit('message', message);
  }
}
