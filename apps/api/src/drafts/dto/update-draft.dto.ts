import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DraftStatus } from 'prisma/client';

export class UpdateDraftDto {
  @ApiPropertyOptional({ description: 'Draft title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Draft status',
    enum: DraftStatus,
  })
  @IsOptional()
  @IsEnum(DraftStatus)
  status?: DraftStatus;
}
