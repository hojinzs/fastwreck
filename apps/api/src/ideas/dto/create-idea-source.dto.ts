import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";

export enum IdeaSourceType {
  RSS = "RSS",
  YOUTUBE = "YOUTUBE",
  MANUAL = "MANUAL",
}

export class CreateIdeaSourceDto {
  @ApiPropertyOptional({ description: "Source URL" })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ description: "Source content text" })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  content: string;

  @ApiPropertyOptional({ description: "Source type", enum: IdeaSourceType })
  @IsOptional()
  @IsEnum(IdeaSourceType)
  sourceType?: IdeaSourceType;

  @ApiPropertyOptional({
    description: "Metadata for the source",
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: object;
}
