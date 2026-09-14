import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
      },

      orderBy: {
        createdAt: 'asc',
      },

      take: 100,
    });
  }

  async createMessage(
    activityId: string,
    userId: string,
    content: string,
  ) {
    const activity =
      await this.prisma.activity.findUnique({
        where: {
          id: activityId,
        },
      });

    if (!activity) {
      throw new NotFoundException(
        'Aktivite bulunamadı.',
      );
    }

    const allowed =
      await this.isParticipant(
        activityId,
        userId,
      );

    if (!allowed) {
      throw new ForbiddenException(
        'Önce aktiviteye katılmalısınız.',
      );
    }

    return this.prisma.message.create({
      data: {
        activityId,
        senderId: userId,
        content: content.trim(),
      },

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
}
