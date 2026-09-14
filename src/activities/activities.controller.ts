import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
	user: {
		id: string;
	}
}

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly service: ActivitiesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateActivityDto,
  ) {
    return this.service.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  nearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    return this.service.findNearby(
      Number(latitude),
      Number(longitude),
      radius ? Number(radius) : 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.join(
      id,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/leave')
  leave(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.leave(
      id,
      req.user.id,
    );
  }
}
