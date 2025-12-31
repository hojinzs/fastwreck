import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { WorkspaceRole, InvitationStatus } from 'prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    // Check if slug already exists
    const existingWorkspace = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });

    if (existingWorkspace) {
      throw new ConflictException('Workspace with this slug already exists');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    await this.checkMembership(id, userId);

    return workspace;
  }

  async update(id: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.checkRole(id, userId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    return this.prisma.workspace.update({
      where: { id },
      data: dto,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.checkRole(id, userId, [WorkspaceRole.OWNER]);

    await this.prisma.workspace.delete({
      where: { id },
    });

    return { message: 'Workspace deleted successfully' };
  }

  async addMember(workspaceId: string, currentUserId: string, dto: AddMemberDto) {
    await this.checkRole(workspaceId, currentUserId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: dto.userId,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    return this.prisma.workspaceMember.create({
      data: {
        userId: dto.userId,
        workspaceId,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateMember(
    workspaceId: string,
    memberId: string,
    currentUserId: string,
    dto: UpdateMemberDto,
  ) {
    await this.checkRole(workspaceId, currentUserId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot change the role of the workspace owner');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async removeMember(workspaceId: string, memberId: string, currentUserId: string) {
    await this.checkRole(workspaceId, currentUserId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }

  async getMembers(workspaceId: string, currentUserId: string) {
    await this.checkMembership(workspaceId, currentUserId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return members;
  }

  private async checkMembership(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return member;
  }

  private async checkRole(
    workspaceId: string,
    userId: string,
    allowedRoles: WorkspaceRole[],
  ) {
    const member = await this.checkMembership(workspaceId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return member;
  }

  // ==================== Invitation Management ====================

  async createInvitation(
    workspaceId: string,
    currentUserId: string,
    dto: CreateInvitationDto,
  ) {
    await this.checkRole(workspaceId, currentUserId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    // Check if user is already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException('User is already a member of this workspace');
      }
    }

    // Cancel existing pending invitations for this email
    await this.prisma.workspaceInvitation.updateMany({
      where: {
        workspaceId,
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.CANCELLED,
      },
    });

    // Create new invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        workspaceId,
        invitedById: currentUserId,
        expiresAt,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Send invitation email
    const mailSent = await this.mailService.sendInvitationEmail(
      dto.email,
      invitation.workspace.name,
      invitation.code,
      invitation.invitedBy.name || invitation.invitedBy.email,
    );

    return {
      ...invitation,
      mailSent,
    };
  }

  async getInvitations(workspaceId: string, currentUserId: string) {
    await this.checkRole(workspaceId, currentUserId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancelInvitation(
    workspaceId: string,
    invitationId: string,
    currentUserId: string,
  ) {
    await this.checkRole(workspaceId, currentUserId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be cancelled');
    }

    return this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.CANCELLED,
      },
    });
  }

  async getMyInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();

    return this.prisma.workspaceInvitation.findMany({
      where: {
        email: user.email,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getInvitationByCode(code: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { code },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      // Update status to expired
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `This invitation is ${invitation.status.toLowerCase()}`,
      );
    }

    // Check if the invited email is already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    return {
      ...invitation,
      userExists: !!existingUser,
    };
  }

  async acceptInvitation(code: string, userId: string) {
    const invitation = await this.getInvitationByCode(code);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email matches
    if (user.email !== invitation.email) {
      throw new BadRequestException(
        'This invitation was sent to a different email address',
      );
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (existingMember) {
      // Mark invitation as accepted anyway
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });
      throw new ConflictException('You are already a member of this workspace');
    }

    // Accept invitation and add member in a transaction
    const result = await this.prisma.$transaction([
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      }),
      this.prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return result[1]; // Return the created member
  }

  // ==================== Owner Transfer ====================

  async transferOwnership(
    workspaceId: string,
    newOwnerId: string,
    currentUserId: string,
  ) {
    // Only current owner can transfer ownership
    await this.checkRole(workspaceId, currentUserId, [WorkspaceRole.OWNER]);

    if (currentUserId === newOwnerId) {
      throw new BadRequestException('You are already the owner');
    }

    // Check if new owner is a member
    const newOwnerMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: newOwnerId,
          workspaceId,
        },
      },
    });

    if (!newOwnerMember) {
      throw new NotFoundException('New owner must be a member of the workspace');
    }

    // Transfer ownership in a transaction
    await this.prisma.$transaction([
      // Update workspace owner
      this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: newOwnerId },
      }),
      // Update new owner's role to OWNER
      this.prisma.workspaceMember.update({
        where: { id: newOwnerMember.id },
        data: { role: WorkspaceRole.OWNER },
      }),
      // Update old owner's role to ADMIN
      this.prisma.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: currentUserId,
            workspaceId,
          },
        },
        data: { role: WorkspaceRole.ADMIN },
      }),
    ]);

    return { message: 'Ownership transferred successfully' };
  }
}
