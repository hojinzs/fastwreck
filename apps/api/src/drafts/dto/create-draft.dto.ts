import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateDraftDto {
  @ApiProperty({ description: 'Draft title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Initial content in Tiptap JSON format' })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ description: 'Change summary for first version' })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}
