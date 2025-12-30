import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from 'prisma/client';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my pending invitations' })
  @ApiResponse({ status: 200, description: 'List of invitations for current user' })
  getMyInvitations(@CurrentUser() user: User) {
    return this.workspacesService.getMyInvitations(user.id);
  }

  @Get(':code')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get invitation details by code',
    description:
      'Public endpoint to view invitation details. Used for signup page.',
  })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 400, description: 'Invitation expired or already used' })
  getInvitationByCode(@Param('code') code: string) {
    return this.workspacesService.getInvitationByCode(code);
  }

  @Post(':code/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept workspace invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid invitation or email mismatch' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  acceptInvitation(@Param('code') code: string, @CurrentUser() user: User) {
    return this.workspacesService.acceptInvitation(code, user.id);
  }
}
