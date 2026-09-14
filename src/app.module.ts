import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { ActivitiesModule } from './activities/activities.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '30d',
      },
    }),
    AuthModule,
    ActivitiesModule,
    ChatModule,
  ],
  controllers: [
    AuthController,
    ActivitiesController,
  ],
  providers: [
    PrismaService,
    AuthService,
    ActivitiesService,
  ],
})
export class AppModule {}
