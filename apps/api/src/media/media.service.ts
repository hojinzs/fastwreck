import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStorageService } from './storage/local-storage.service';
import { ImageProcessingService } from './processing/image-processing.service';
import { VideoProcessingService } from './processing/video-processing.service';
import { MediaQueryDto } from './dto/media-query.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
  private readonly maxSizeImage: number;
  private readonly maxSizeVideo: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: LocalStorageService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly videoProcessing: VideoProcessingService,
  ) {
    this.maxSizeImage =
      parseInt(
        this.configService.get<string>('MEDIA_UPLOAD_MAX_SIZE_IMAGE') || '',
      ) || 10485760; // 10MB default
    this.maxSizeVideo =
      parseInt(
        this.configService.get<string>('MEDIA_UPLOAD_MAX_SIZE_VIDEO') || '',
      ) || 104857600; // 100MB default
  }

  async uploadMedia(
    file: Express.Multer.File,
    workspaceId: string,
    userId: string,
  ) {
    // Determine media type
    const mediaType = file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';

    // Validate file size
    const maxSize = mediaType === 'IMAGE' ? this.maxSizeImage : this.maxSizeVideo;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`,
      );
    }

    // Upload original file
    const uploadResult = await this.storageService.upload(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      workspaceId,
      'original',
    );

    // Process variants
    let variants = null;
    if (mediaType === 'IMAGE') {
      variants = await this.imageProcessing.processImage(
        file.buffer,
        workspaceId,
        uploadResult.filename,
        this.storageService,
      );
    } else {
      variants = await this.videoProcessing.processVideo(
        file.buffer,
        workspaceId,
        uploadResult.filename,
        this.storageService,
      );
    }

    // Save media record
    const media = await this.prisma.media.create({
      data: {
        workspaceId,
        uploadedById: userId,
        filename: uploadResult.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: mediaType,
        storagePath: uploadResult.storagePath,
        variants: variants as any,
      },
    });

    return media;
  }

  async findAll(workspaceId: string, query: MediaQueryDto) {
    const { search, type, page = 1, limit = 20 } = query;

    const where: any = {
      workspaceId,
    };

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: media,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, workspaceId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, workspaceId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async update(id: string, workspaceId: string, updateDto: UpdateMediaDto) {
    const media = await this.findOne(id, workspaceId);

    return this.prisma.media.update({
      where: { id: media.id },
      data: updateDto,
    });
  }

  async remove(id: string, workspaceId: string) {
    const media = await this.findOne(id, workspaceId);

    // Delete file from storage
    await this.storageService.delete(media.storagePath);

    // Delete variants from storage
    if (media.variants) {
      const variants = media.variants as any;
      for (const variant of Object.values(variants)) {
        if (variant && typeof variant === 'object' && 'url' in variant) {
          const variantPath = (variant as any).url.replace('/uploads/', '');
          await this.storageService.delete(variantPath);
        }
      }
    }

    // Delete database record
    await this.prisma.media.delete({
      where: { id },
    });

    return { success: true };
  }
}
