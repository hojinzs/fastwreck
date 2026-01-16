import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "prisma/client";
import { IdeasService } from "./ideas.service";
import { CreateIdeaDto } from "./dto/create-idea.dto";
import { UpdateIdeaDto } from "./dto/update-idea.dto";
import { CreateIdeaSourceDto } from "./dto/create-idea-source.dto";
import { IdeasQueryDto } from "./dto/ideas-query.dto";
import { SearchIdeasDto } from "./dto/search-ideas.dto";

@ApiTags("ideas")
@ApiBearerAuth()
@Controller("ideas")
@UseGuards(JwtAuthGuard)
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @ApiOperation({ summary: "Create a new idea" })
  @ApiResponse({ status: 201, description: "Idea created successfully" })
  @ApiResponse({ status: 403, description: "Not a member of the workspace" })
  create(@CurrentUser() user: User, @Body() dto: CreateIdeaDto) {
    return this.ideasService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all ideas in a workspace" })
  @ApiQuery({ name: "workspaceId", required: true })
  @ApiResponse({ status: 200, description: "List of ideas" })
  @ApiResponse({ status: 403, description: "Not a member of the workspace" })
  findAll(@CurrentUser() user: User, @Query() query: IdeasQueryDto) {
    return this.ideasService.findAll(user.id, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get idea by ID" })
  @ApiResponse({ status: 200, description: "Idea found" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  @ApiResponse({ status: 403, description: "No access to this idea" })
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.ideasService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update idea" })
  @ApiResponse({ status: 200, description: "Idea updated successfully" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  @ApiResponse({ status: 403, description: "No access to this idea" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateIdeaDto,
  ) {
    return this.ideasService.update(id, user.id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete idea" })
  @ApiResponse({ status: 200, description: "Idea deleted successfully" })
  @ApiResponse({ status: 403, description: "Only creator can delete idea" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  remove(@Param("id") id: string, @CurrentUser() user: User) {
    return this.ideasService.remove(id, user.id);
  }

  @Post(":id/sources")
  @ApiOperation({ summary: "Add source to idea" })
  @ApiResponse({ status: 201, description: "Source added successfully" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  @ApiResponse({ status: 403, description: "No access to this idea" })
  addSource(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateIdeaSourceDto,
  ) {
    return this.ideasService.addSource(id, user.id, dto);
  }

  @Get(":id/sources")
  @ApiOperation({ summary: "Get sources for idea" })
  @ApiResponse({ status: 200, description: "List of sources" })
  @ApiResponse({ status: 404, description: "Idea not found" })
  @ApiResponse({ status: 403, description: "No access to this idea" })
  getSources(@Param("id") id: string, @CurrentUser() user: User) {
    return this.ideasService.getSources(id, user.id);
  }

  @Delete(":id/sources/:sourceId")
  @ApiOperation({ summary: "Remove source from idea" })
  @ApiResponse({ status: 200, description: "Source removed successfully" })
  @ApiResponse({ status: 404, description: "Source not found" })
  @ApiResponse({ status: 403, description: "No access to this idea" })
  removeSource(
    @Param("id") id: string,
    @Param("sourceId") sourceId: string,
    @CurrentUser() user: User,
  ) {
    return this.ideasService.removeSource(id, sourceId, user.id);
  }

  @Post("search")
  @ApiOperation({ summary: "Search ideas by vector similarity (internal)" })
  @ApiResponse({ status: 200, description: "Search results" })
  @ApiResponse({ status: 403, description: "Not a member of the workspace" })
  search(@CurrentUser() user: User, @Body() dto: SearchIdeasDto) {
    return this.ideasService.search(user.id, dto);
  }
}
