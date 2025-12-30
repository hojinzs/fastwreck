import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'prisma/client';

@ApiTags('drafts')
@ApiBearerAuth()
@Controller('drafts')
@UseGuards(JwtAuthGuard)
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new draft' })
  @ApiResponse({ status: 201, description: 'Draft created successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of the workspace' })
  create(@CurrentUser() user: User, @Body() dto: CreateDraftDto) {
    return this.draftsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all drafts in a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, description: 'List of drafts' })
  @ApiResponse({ status: 403, description: 'Not a member of the workspace' })
  findAll(@CurrentUser() user: User, @Query('workspaceId') workspaceId: string) {
    return this.draftsService.findAll(user.id, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get draft by ID' })
  @ApiResponse({ status: 200, description: 'Draft found' })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  @ApiResponse({ status: 403, description: 'No access to this draft' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.draftsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update draft metadata' })
  @ApiResponse({ status: 200, description: 'Draft updated successfully' })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  @ApiResponse({ status: 403, description: 'No access to this draft' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateDraftDto,
  ) {
    return this.draftsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete draft' })
  @ApiResponse({ status: 200, description: 'Draft deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only creator can delete draft' })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.draftsService.remove(id, user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a draft' })
  @ApiResponse({ status: 200, description: 'List of versions' })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  @ApiResponse({ status: 403, description: 'No access to this draft' })
  getVersions(@Param('id') id: string, @CurrentUser() user: User) {
    return this.draftsService.getVersions(id, user.id);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get specific version of a draft' })
  @ApiResponse({ status: 200, description: 'Version found' })
  @ApiResponse({ status: 404, description: 'Draft or version not found' })
  @ApiResponse({ status: 403, description: 'No access to this draft' })
  getVersion(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user: User,
  ) {
    return this.draftsService.getVersion(id, version, user.id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new version of the draft' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  @ApiResponse({ status: 403, description: 'No access to this draft' })
  createVersion(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateVersionDto,
  ) {
    return this.draftsService.createVersion(id, user.id, dto);
  }

  @Post(':id/revert/:version')
  @ApiOperation({ summary: 'Revert draft to a specific version' })
  @ApiResponse({ status: 201, description: 'Draft reverted successfully' })
  @ApiResponse({ status: 404, description: 'Draft or version not found' })
  @ApiResponse({ status: 403, description: 'No access to this draft' })
  revertToVersion(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user: User,
  ) {
    return this.draftsService.revertToVersion(id, version, user.id);
  }
}
