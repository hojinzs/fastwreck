import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'prisma/client';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 409, description: 'Workspace slug already exists' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  findAll(@CurrentUser() user: User) {
    return this.workspacesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace found' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only workspace owner can delete' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.remove(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to workspace' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspacesService.addMember(id, user.id, dto);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or cannot modify owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.workspacesService.updateMember(id, memberId, user.id, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or cannot remove owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.removeMember(id, memberId, user.id);
  }
}
