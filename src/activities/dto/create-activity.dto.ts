import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsDateString()
  startTime: string;

  @IsInt()
  @Min(1)
  maxPeople: number;
}
