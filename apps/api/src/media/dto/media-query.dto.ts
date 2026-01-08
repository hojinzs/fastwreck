import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum MediaTypeFilter {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class MediaQueryDto {
  @ApiProperty({ 
    description: 'Workspace ID to filter media',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

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
