import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { WsJwtGuard } from './ws-jwt.guard';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],

  controllers: [
    ChatController,
  ],

  providers: [
    ChatGateway,
    ChatService,
    WsJwtGuard,
    PrismaService,
  ],
})
export class ChatModule {}
