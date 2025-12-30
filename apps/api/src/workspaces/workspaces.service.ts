import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { WorkspaceRole } from 'prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
