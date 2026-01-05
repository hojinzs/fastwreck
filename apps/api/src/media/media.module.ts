import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageService } from './storage/local-storage.service';
import { ImageProcessingService } from './processing/image-processing.service';
import { VideoProcessingService } from './processing/video-processing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    LocalStorageService,
    ImageProcessingService,
    VideoProcessingService,
  ],
  exports: [MediaService],
})
export class MediaModule {}
