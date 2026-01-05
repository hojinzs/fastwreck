import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum MediaTypeFilter {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class MediaQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: MediaTypeFilter })
  @IsOptional()
  @IsEnum(MediaTypeFilter)
  type?: MediaTypeFilter;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
