import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateActivityDto,
  ) {
    const activity = await this.prisma.activity.create({
      data: {
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        latitude: dto.latitude,
        longitude: dto.longitude,
        startTime: new Date(dto.startTime),
        maxPeople: dto.maxPeople,
      },
    });

    await this.prisma.participant.create({
      data: {
        activityId: activity.id,
        userId,
      },
    });

    return activity;
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm = 10,
  ) {
    const radiusMeters = radiusKm * 1000;

    return this.prisma.$queryRaw`
      SELECT
        a.*,
        ST_Distance(
          ST_SetSRID(
            ST_MakePoint(a.longitude, a.latitude),
            4326
          )::geography,
          ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )::geography
        ) AS distance_meters
      FROM "Activity" a
      WHERE
        a."startTime" > NOW()
        AND ST_DWithin(
          ST_SetSRID(
            ST_MakePoint(a.longitude, a.latitude),
            4326
          )::geography,
          ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )::geography,
          ${radiusMeters}
        )
      ORDER BY distance_meters ASC
      LIMIT 100;
    `;
  }

  async findOne(id: string) {
    const activity =
      await this.prisma.activity.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              rating: true,
              ratingCount: true,
            },
          },
          participants: {
            where: {
              status: 'JOINED',
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  rating: true,
                },
              },
            },
          },
        },
      });

    if (!activity) {
      throw new NotFoundException(
        'Aktivite bulunamadı.',
      );
    }

    return activity;
  }

  async join(
    activityId: string,
    userId: string,
  ) {
    const activity =
      await this.prisma.activity.findUnique({
        where: {
          id: activityId,
        },
        include: {
          participants: {
            where: {
              status: 'JOINED',
            },
          },
        },
      });

    if (!activity) {
      throw new NotFoundException(
        'Aktivite bulunamadı.',
      );
    }

    if (
      activity.participants.length >=
      activity.maxPeople
    ) {
      throw new BadRequestException(
        'Aktivite dolu.',
      );
    }

    const existing =
      await this.prisma.participant.findUnique({
        where: {
          activityId_userId: {
            activityId,
            userId,
          },
        },
      });

    if (existing?.status === 'JOINED') {
      throw new BadRequestException(
        'Zaten katıldınız.',
      );
    }

    if (existing) {
      return this.prisma.participant.update({
        where: {
          id: existing.id,
        },
        data: {
          status: 'JOINED',
        },
      });
    }

    return this.prisma.participant.create({
      data: {
        activityId,
        userId,
        status: 'JOINED',
      },
    });
  }

  async leave(
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

    if (!participant) {
      throw new NotFoundException(
        'Katılım bulunamadı.',
      );
    }

    return this.prisma.participant.update({
      where: {
        id: participant.id,
      },
      data: {
        status: 'LEFT',
      },
    });
  }
}
