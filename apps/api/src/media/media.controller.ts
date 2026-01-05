import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { MediaQueryDto } from './dto/media-query.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        workspaceId: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 104857600, // 100MB max (will be checked in service)
      },
      fileFilter: (req, file, cb) => {
        // Only allow images and videos
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only image and video files are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.mediaService.uploadMedia(file, workspaceId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all media for workspace' })
  async findAll(
    @Query('workspaceId') workspaceId: string,
    @Query() query: MediaQueryDto,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.mediaService.findAll(workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.mediaService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata' })
  async update(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() updateDto: UpdateMediaDto,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.mediaService.update(id, workspaceId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  async remove(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.mediaService.remove(id, workspaceId);
  }
}
