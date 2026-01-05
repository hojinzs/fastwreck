import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { IStorageService } from '../storage/storage.interface';

export interface ImageVariant {
  name: string;
  url: string;
  width: number;
  height: number;
  size: number; // in KB
}

export interface ImageVariants {
  thumbnail?: ImageVariant;
  small?: ImageVariant;
  medium?: ImageVariant;
  large?: ImageVariant;
}

@Injectable()
export class ImageProcessingService {
  private readonly sizes = {
    thumbnail: { width: 245, height: null },
    small: { width: 500, height: null },
    medium: { width: 750, height: null },
    large: { width: 1000, height: null },
  };

  async processImage(
    buffer: Buffer,
    workspaceId: string,
    originalFilename: string,
    storageService: IStorageService,
  ): Promise<ImageVariants> {
    const variants: ImageVariants = {};

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    for (const [name, size] of Object.entries(this.sizes)) {
      // Skip if original image is smaller than variant size
      if (metadata.width && metadata.width < size.width) {
        continue;
      }

      try {
        // Resize image
        const resized = await sharp(buffer)
          .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Get resized image metadata
        const resizedMetadata = await sharp(resized).metadata();

        // Upload variant
        const uploadResult = await storageService.upload(
          {
            buffer: resized,
            originalname: originalFilename,
            mimetype: 'image/jpeg',
            size: resized.length,
          },
          workspaceId,
          `variants/${name}`,
        );

        variants[name as keyof ImageVariants] = {
          name,
          url: uploadResult.url,
          width: resizedMetadata.width || 0,
          height: resizedMetadata.height || 0,
          size: parseFloat((resized.length / 1024).toFixed(1)),
        };
      } catch (error) {
        console.error(`Failed to create ${name} variant:`, error);
      }
    }

    return variants;
  }
}
