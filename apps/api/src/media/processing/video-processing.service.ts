import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { IStorageService } from '../storage/storage.interface';

export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
  size: number; // in KB
}

export interface VideoVariants {
  thumbnail?: VideoThumbnail;
}

@Injectable()
export class VideoProcessingService {
  async processVideo(
    buffer: Buffer,
    workspaceId: string,
    originalFilename: string,
    storageService: IStorageService,
  ): Promise<VideoVariants> {
    const variants: VideoVariants = {};

    // Create temporary file for video (ffmpeg needs a file path)
    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(tempDir, `video-${Date.now()}.tmp`);
    const tempThumbnailPath = path.join(
      tempDir,
      `thumbnail-${Date.now()}.jpg`,
    );

    try {
      // Write buffer to temporary file
      await fs.writeFile(tempVideoPath, buffer);

      // Generate thumbnail at 1 second
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .screenshots({
            count: 1,
            timemarks: ['1'], // 1 second
            filename: path.basename(tempThumbnailPath),
            folder: tempDir,
            size: '1000x?', // Max width 1000px, maintain aspect ratio
          })
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      // Read thumbnail file
      const thumbnailBuffer = await fs.readFile(tempThumbnailPath);

      // Get thumbnail dimensions (using sharp would be better, but we can parse from ffmpeg)
      const thumbnailInfo = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          ffmpeg.ffprobe(tempThumbnailPath, (err, metadata) => {
            if (err) {
              reject(err);
            } else {
              const stream = metadata.streams[0];
              resolve({
                width: stream.width || 0,
                height: stream.height || 0,
              });
            }
          });
        },
      );

      // Upload thumbnail
      const uploadResult = await storageService.upload(
        {
          buffer: thumbnailBuffer,
          originalname: `${path.parse(originalFilename).name}.jpg`,
          mimetype: 'image/jpeg',
          size: thumbnailBuffer.length,
        },
        workspaceId,
        'variants/thumbnail',
      );

      variants.thumbnail = {
        url: uploadResult.url,
        width: thumbnailInfo.width,
        height: thumbnailInfo.height,
        size: parseFloat((thumbnailBuffer.length / 1024).toFixed(1)),
      };
    } catch (error) {
      console.error('Failed to create video thumbnail:', error);
    } finally {
      // Clean up temporary files
      try {
        await fs.unlink(tempVideoPath);
      } catch {}
      try {
        await fs.unlink(tempThumbnailPath);
      } catch {}
    }

    return variants;
  }
}
