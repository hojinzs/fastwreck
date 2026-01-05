export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StorageUploadResult {
  filename: string;
  storagePath: string;
  url: string;
}

export interface IStorageService {
  upload(
    file: StorageFile,
    workspaceId: string,
    folder?: string,
  ): Promise<StorageUploadResult>;

  delete(storagePath: string): Promise<void>;

  getUrl(storagePath: string): string;

  exists(storagePath: string): Promise<boolean>;
}
