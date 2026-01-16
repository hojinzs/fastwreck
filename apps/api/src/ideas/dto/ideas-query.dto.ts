import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IdeaStatus } from "./create-idea.dto";

export class IdeasQueryDto {
  @ApiProperty({ description: "Workspace ID" })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({ description: "Idea status filter", enum: IdeaStatus })
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @ApiPropertyOptional({ description: "Search query for title/description" })
  @IsOptional()
  @IsString()
  search?: string;
}
