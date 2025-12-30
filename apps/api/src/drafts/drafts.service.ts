import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class DraftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDraftDto) {
    // Verify user has access to workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: dto.workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Default content if not provided
    const defaultContent = dto.content || {
      type: 'doc',
      content: [],
    };

    // Create draft with first version
    const draft = await this.prisma.draft.create({
      data: {
        title: dto.title,
        workspaceId: dto.workspaceId,
        createdById: userId,
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            content: defaultContent,
            changeSummary: dto.changeSummary || 'Initial version',
            createdById: userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    return draft;
  }

  async findAll(userId: string, workspaceId: string) {
    // Verify user has access to workspace
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

    const drafts = await this.prisma.draft.findMany({
      where: { workspaceId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return drafts;
  }

  async findOne(id: string, userId: string) {
    const draft = await this.prisma.draft.findUnique({
      where: { id },
      include: {
        workspace: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    // Verify user has access to workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: draft.workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this draft');
    }

    return draft;
  }

  async update(id: string, userId: string, dto: UpdateDraftDto) {
    const draft = await this.findOne(id, userId);

    const updated = await this.prisma.draft.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const draft = await this.findOne(id, userId);

    // Only draft creator can delete
    if (draft.createdById !== userId) {
      throw new ForbiddenException('Only the draft creator can delete this draft');
    }

    await this.prisma.draft.delete({
      where: { id },
    });

    return { message: 'Draft deleted successfully' };
  }

  async getVersions(draftId: string, userId: string) {
    const draft = await this.findOne(draftId, userId);

    const versions = await this.prisma.draftVersion.findMany({
      where: { draftId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });

    return versions;
  }

  async getVersion(draftId: string, version: number, userId: string) {
    const draft = await this.findOne(draftId, userId);

    const draftVersion = await this.prisma.draftVersion.findUnique({
      where: {
        draftId_version: {
          draftId,
          version,
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!draftVersion) {
      throw new NotFoundException('Version not found');
    }

    return draftVersion;
  }

  async createVersion(draftId: string, userId: string, dto: CreateVersionDto) {
    const draft = await this.findOne(draftId, userId);

    const newVersion = draft.currentVersion + 1;

    // Create new version and update draft's currentVersion
    const [version] = await this.prisma.$transaction([
      this.prisma.draftVersion.create({
        data: {
          draftId,
          version: newVersion,
          content: dto.content,
          contentHtml: dto.contentHtml,
          contentMarkdown: dto.contentMarkdown,
          changeSummary: dto.changeSummary,
          createdById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.draft.update({
        where: { id: draftId },
        data: { currentVersion: newVersion },
      }),
    ]);

    return version;
  }

  async revertToVersion(draftId: string, version: number, userId: string) {
    const draft = await this.findOne(draftId, userId);

    // Get the target version
    const targetVersion = await this.prisma.draftVersion.findUnique({
      where: {
        draftId_version: {
          draftId,
          version,
        },
      },
    });

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    // Create a new version with content from target version
    const newVersion = draft.currentVersion + 1;

    const [revertedVersion] = await this.prisma.$transaction([
      this.prisma.draftVersion.create({
        data: {
          draftId,
          version: newVersion,
          content: targetVersion.content,
          contentHtml: targetVersion.contentHtml,
          contentMarkdown: targetVersion.contentMarkdown,
          changeSummary: `Reverted to version ${version}`,
          createdById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.draft.update({
        where: { id: draftId },
        data: { currentVersion: newVersion },
      }),
    ]);

    return revertedVersion;
  }
}
