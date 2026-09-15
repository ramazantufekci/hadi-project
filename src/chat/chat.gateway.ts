import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';

import {
  Server,
  Socket,
} from 'socket.io';

import { ChatService } from './chat.service';
import { WsJwtGuard } from './ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly wsJwtGuard: WsJwtGuard,
  ) {}

  async handleConnection(
    client: Socket,
  ) {
    try {
      await this.wsJwtGuard
        .canActivate({
          switchToWs: () => ({
            getClient: () => client,
          }),
        } as any);
    } catch {
      client.emit(
        'error_message',
        {
          message:
            'Oturum geçersiz.',
        },
      );

      client.disconnect();
    }
  }

  @SubscribeMessage('join_activity')
  async joinActivity(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    data: {
      activityId: string;
    },
  ) {
    const userId =
      socket.data.userId;

    if (!userId) {
      throw new WsException(
        'Oturum bulunamadı.',
      );
    }

    const allowed =
      await this.chatService.isParticipant(
        data.activityId,
        userId,
      );

    if (!allowed) {
      throw new WsException(
        'Önce aktiviteye katılmalısınız.',
      );
    }

    await socket.join(
      `activity:${data.activityId}`,
    );

    socket.emit(
      'joined_activity',
      {
        activityId:
          data.activityId,
      },
    );
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    data: {
      activityId: string;
      content: string;
    },
  ) {
    const userId =
      socket.data.userId;

    if (!userId) {
      throw new WsException(
        'Oturum bulunamadı.',
      );
    }

    try {
      const message =
        await this.chatService.createMessage(
          data.activityId,
          userId,
          data.content,
        );

      this.server
        .to(
          `activity:${data.activityId}`,
        )
        .emit(
          'new_message',
          message,
        );
    } catch (error) {
      socket.emit(
        'error_message',
        {
          message:
            error instanceof Error
              ? error.message
              : 'Mesaj gönderilemedi.',
        },
      );
    }
  }
}
