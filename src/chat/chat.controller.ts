import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
  };
}

@Controller('activities')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/messages')
  messages(
    @Param('id') activityId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.getMessages(
      activityId,
      req.user.id,
    );
  }
}
