/**
 * Mock implementation of mediaApi for Storybook
 * Uses Blob URLs for local image preview without backend
 */

export interface MockMedia {
  id: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  workspaceId: string;
  uploadedBy: string;
  createdAt: Date;
}

class MockMediaApi {
  private mockMediaStore: Map<string, MockMedia> = new Map();
  private idCounter = 1;

  async upload(file: File, workspaceId: string): Promise<MockMedia> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const id = `mock-media-${this.idCounter++}`;
    const storagePath = URL.createObjectURL(file);

    const mockMedia: MockMedia = {
      id,
      originalName: file.name,
      storagePath,
      mimeType: file.type,
      size: file.size,
      workspaceId,
      uploadedBy: 'storybook-user',
      createdAt: new Date(),
    };

    this.mockMediaStore.set(id, mockMedia);

    return mockMedia;
  }

  getMediaUrl(storagePath: string): string {
    // In mock mode, storage path is already a Blob URL
    return storagePath;
  }

  async list(workspaceId: string): Promise<MockMedia[]> {
    return Array.from(this.mockMediaStore.values()).filter(
      (m) => m.workspaceId === workspaceId
    );
  }

  reset(): void {
    // Revoke all blob URLs to prevent memory leaks
    this.mockMediaStore.forEach((media) => {
      if (media.storagePath.startsWith('blob:')) {
        URL.revokeObjectURL(media.storagePath);
      }
    });
    this.mockMediaStore.clear();
    this.idCounter = 1;
  }
}

export const mockMediaApi = new MockMediaApi();
