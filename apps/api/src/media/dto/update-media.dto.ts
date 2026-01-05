import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateMediaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
