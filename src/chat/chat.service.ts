import 'package:socket_io_client/socket_io_client.dart' as io;
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import '../config/api_config.dart';
import { PrismaService } from '../prisma.service';
@Injectable()
export class ChatService {
  // NestJS tarafında socket nesnelerini genellikle Gateway yönetir, 
  // ancak servise bir mantık kuracaksanız buraya yazabilirsiniz.
  
  constructor(private readonly prisma: PrismaService,) {}
  async isParticipant(
    activityId: string,
    userId: string,
  ) {
    const participant =
      await this.prisma.participant.findUnique({
        where: {
          activityId_userId: {
            activityId,
            userId,
          },
        },
      });

    return participant?.status === 'JOINED';
  }
  io.Socket? socket;

  void connect({
    required String token,
  }) {
    socket = io.io(
      ApiConfig.baseUrl,
      io.OptionBuilder()
          .setTransports([
            'websocket',
          ])
          .setAuth({
            'token': token,
          })
          .disableAutoConnect()
          .build(),
    );

    socket!.connect();
  }

  async getMessages(
    activityId: string,
    userId: string,
  ) {
    const allowed =
      await this.isParticipant(
        activityId,
        userId,
      );

    if (!allowed) {
      throw new ForbiddenException(
        'Bu aktivitenin sohbetine erişemezsiniz.',
      );
    }

    return this.prisma.message.findMany({
      where: {
        activityId,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        orderBy: {
        createdAt: 'asc',
          include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
  void joinActivity({
    required String activityId,
  }) {
    socket?.emit(
      'join_activity',
      {
        'activityId': activityId,
      },
    );
  }

  void sendMessage({
    required String activityId,
    required String content,
  }) {
    socket?.emit(
      'send_message',
      {
        'activityId': activityId,
        'content': content,
      },
    );
  }

  void onMessage(
    Function(dynamic) callback,
  ) {
    socket?.on(
      'new_message',
      callback,
    );
  }

  void onError(
    Function(dynamic) callback,
  ) {
    socket?.on(
      'error_message',
      callback,
    );
  }

  void disconnect() {
    socket?.disconnect();
    socket?.dispose();
    socket = null;
  }
}
