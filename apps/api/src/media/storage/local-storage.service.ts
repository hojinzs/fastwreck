import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  IStorageService,
  StorageFile,
  StorageUploadResult,
} from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly uploadPath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('MEDIA_LOCAL_STORAGE_PATH') || './uploads';
  }

  async upload(
    file: StorageFile,
    workspaceId: string,
    folder?: string,
  ): Promise<StorageUploadResult> {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;

    // Build storage path: uploads/{workspaceId}/{folder}/{filename}
    const relativePath = path.join(
      workspaceId,
      folder || 'media',
      filename,
    );
    const fullPath = path.join(this.uploadPath, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file.buffer);

    // Return result
    return {
      filename,
      storagePath: relativePath,
      url: `/uploads/${relativePath}`,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadPath, storagePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getUrl(storagePath: string): string {
    return `/uploads/${storagePath}`;
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.uploadPath, storagePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
