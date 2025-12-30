import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthProvider, WorkspaceRole } from 'prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  // ==================== Profile Management ====================

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // OIDC users cannot change their email
    if (dto.email && user.provider === AuthProvider.OIDC) {
      throw new BadRequestException(
        'Email cannot be changed for OIDC authenticated users',
      );
    }

    // Check if new email already exists
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getMyWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      ...membership.workspace,
      myRole: membership.role,
      joinedAt: membership.createdAt,
      membershipId: membership.id,
    }));
  }

  async leaveWorkspace(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this workspace');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Workspace owner cannot leave. Transfer ownership first.',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: {
        id: membership.id,
      },
    });

    return { message: 'Successfully left the workspace' };
  }
}
