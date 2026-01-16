import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIdeaDto, IdeaStatus } from "./dto/create-idea.dto";
import { CreateIdeaSourceDto } from "./dto/create-idea-source.dto";
import { IdeasQueryDto } from "./dto/ideas-query.dto";
import { SearchIdeasDto } from "./dto/search-ideas.dto";
import { UpdateIdeaDto } from "./dto/update-idea.dto";
import { OpenAiEmbeddingsService } from "./embeddings/openai-embeddings.service";

const MAX_SEARCH_LIMIT = 50;

@Injectable()
export class IdeasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: OpenAiEmbeddingsService,
  ) {}

  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("You are not a member of this workspace");
    }
  }

  private formatEmbedding(embedding: number[]) {
    return `[${embedding.map((value) => value.toString()).join(",")}]`;
  }

  private async setIdeaSourceEmbedding(sourceId: string, embedding: number[]) {
    const vectorLiteral = Prisma.raw(
      `'${this.formatEmbedding(embedding)}'::vector`,
    );

    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE idea_sources
        SET embedding = ${vectorLiteral}
        WHERE id = ${sourceId}
      `,
    );
  }

  async create(userId: string, dto: CreateIdeaDto) {
    await this.assertWorkspaceMember(dto.workspaceId, userId);

    const idea = await this.prisma.idea.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || IdeaStatus.NEW,
        workspaceId: dto.workspaceId,
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
        sources: true,
      },
    });

    return idea;
  }

  async findAll(userId: string, query: IdeasQueryDto) {
    await this.assertWorkspaceMember(query.workspaceId, userId);

    const where: Prisma.IdeaWhereInput = {
      workspaceId: query.workspaceId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.prisma.idea.findMany({
      where,
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
          select: { sources: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        sources: true,
      },
    });

    if (!idea) {
      throw new NotFoundException("Idea not found");
    }

    await this.assertWorkspaceMember(idea.workspaceId, userId);

    return idea;
  }

  async update(id: string, userId: string, dto: UpdateIdeaDto) {
    const idea = await this.findOne(id, userId);

    return this.prisma.idea.update({
      where: { id: idea.id },
      data: dto,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        sources: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const idea = await this.findOne(id, userId);

    if (idea.createdById !== userId) {
      throw new ForbiddenException(
        "Only the idea creator can delete this idea",
      );
    }

    await this.prisma.idea.delete({
      where: { id: idea.id },
    });

    return { message: "Idea deleted successfully" };
  }

  async addSource(ideaId: string, userId: string, dto: CreateIdeaSourceDto) {
    const idea = await this.findOne(ideaId, userId);

    const source = await this.prisma.ideaSource.create({
      data: {
        ideaId: idea.id,
        url: dto.url,
        content: dto.content,
        sourceType: dto.sourceType,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    const embedding = await this.embeddingsService.createEmbedding(dto.content);
    if (embedding?.length) {
      await this.setIdeaSourceEmbedding(source.id, embedding);
    }

    return source;
  }

  async getSources(ideaId: string, userId: string) {
    const idea = await this.findOne(ideaId, userId);

    return this.prisma.ideaSource.findMany({
      where: { ideaId: idea.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async removeSource(ideaId: string, sourceId: string, userId: string) {
    const idea = await this.findOne(ideaId, userId);

    const source = await this.prisma.ideaSource.findFirst({
      where: {
        id: sourceId,
        ideaId: idea.id,
      },
    });

    if (!source) {
      throw new NotFoundException("Source not found");
    }

    await this.prisma.ideaSource.delete({
      where: { id: source.id },
    });

    return { message: "Source deleted successfully" };
  }

  async search(userId: string, dto: SearchIdeasDto) {
    await this.assertWorkspaceMember(dto.workspaceId, userId);

    const embedding = await this.embeddingsService.createEmbedding(dto.query);
    if (!embedding?.length) {
      throw new BadRequestException("Embedding generation failed");
    }

    const limit = Math.min(dto.limit ?? 5, MAX_SEARCH_LIMIT);
    const threshold = dto.threshold ?? 0.7;
    const vectorLiteral = Prisma.raw(
      `'${this.formatEmbedding(embedding)}'::vector`,
    );

    const rows = await this.prisma.$queryRaw<
      Array<{
        ideaId: string;
        title: string;
        sourceId: string;
        url: string | null;
        content: string;
        sourceType: string;
        metadata: Prisma.JsonValue | null;
        similarity: number;
      }>
    >(
      Prisma.sql`
        SELECT
          ideas.id AS "ideaId",
          ideas.title AS "title",
          idea_sources.id AS "sourceId",
          idea_sources.url AS "url",
          idea_sources.content AS "content",
          idea_sources.source_type AS "sourceType",
          idea_sources.metadata AS "metadata",
          1 - (idea_sources.embedding <=> ${vectorLiteral}) AS "similarity"
        FROM idea_sources
        JOIN ideas ON ideas.id = idea_sources.idea_id
        WHERE ideas.workspace_id = ${dto.workspaceId}
          AND idea_sources.embedding IS NOT NULL
          AND 1 - (idea_sources.embedding <=> ${vectorLiteral}) >= ${threshold}
        ORDER BY idea_sources.embedding <=> ${vectorLiteral} ASC
        LIMIT ${limit}
      `,
    );

    const grouped = new Map<
      string,
      {
        ideaId: string;
        title: string;
        sources: Array<{
          id: string;
          url: string | null;
          content: string;
          sourceType: string;
          metadata: Prisma.JsonValue | null;
          similarity: number;
        }>;
      }
    >();

    for (const row of rows) {
      if (!grouped.has(row.ideaId)) {
        grouped.set(row.ideaId, {
          ideaId: row.ideaId,
          title: row.title,
          sources: [],
        });
      }

      grouped.get(row.ideaId)!.sources.push({
        id: row.sourceId,
        url: row.url,
        content: row.content,
        sourceType: row.sourceType,
        metadata: row.metadata,
        similarity: row.similarity,
      });
    }

    return { results: Array.from(grouped.values()) };
  }
}
