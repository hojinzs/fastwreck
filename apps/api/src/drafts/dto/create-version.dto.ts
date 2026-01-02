import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({ description: 'Content in Tiptap JSON format' })
  @IsObject()
  @IsNotEmpty()
  content: any;

  @ApiPropertyOptional({ description: 'Content in HTML format' })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiPropertyOptional({ description: 'Content in Markdown format' })
  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @ApiPropertyOptional({ description: 'Summary of changes' })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}
