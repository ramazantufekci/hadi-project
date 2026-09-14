import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  Server,
  Socket,
} from 'socket.io';

import { ChatService } from './chat.service';

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
  ) {}

  @SubscribeMessage('join_activity')
  async joinActivity(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      activityId: string;
      userId: string;
    },
  ) {
    const allowed =
      await this.chatService.isParticipant(
        data.activityId,
        data.userId,
      );

    if (!allowed) {
      socket.emit('error_message', {
        message:
          'Bu aktivitenin sohbetine erişemezsiniz.',
      });

      return;
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
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      activityId: string;
      userId: string;
      content: string;
    },
  ) {
    try {
      const message =
        await this.chatService.createMessage(
          data.activityId,
          data.userId,
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
