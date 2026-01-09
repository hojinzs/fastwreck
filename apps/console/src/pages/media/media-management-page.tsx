import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useDropzone } from 'react-dropzone';
import { mediaApi, Media, MediaQueryParams } from '@shared/api/media';

export function MediaManagementPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string };
  const { workspaceId } = params;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'IMAGE' | 'VIDEO' | undefined>();
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  const queryParams: MediaQueryParams = {
    workspaceId: workspaceId!,
    search: search || undefined,
    type: typeFilter,
    page,
    limit: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['media', queryParams],
    queryFn: () => mediaApi.getAll(queryParams),
    enabled: !!workspaceId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload(file, workspaceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { description?: string; tags?: string[] } }) =>
      mediaApi.update(id, workspaceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setSelectedMedia(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id, workspaceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setSelectedMedia(null);
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': [],
    },
    onDrop: async (files) => {
      for (const file of files) {
        await uploadMutation.mutateAsync(file);
      }
    },
  });

  if (!workspaceId) {
    return <div className="p-8">Please select a workspace first.</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold mb-4">Media Library</h1>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={typeFilter || ''}
            onChange={(e) => {
              setTypeFilter(e.target.value as any || undefined);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Upload Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop files here...'
                : 'Drag & drop images/videos here, or click to select files'}
            </p>
            {uploadMutation.isPending && (
              <p className="text-blue-600 mt-2">Uploading...</p>
            )}
          </div>

          {/* Media Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-600">Loading media...</p>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.data.map((media) => (
                  <div
                    key={media.id}
                    onClick={() => setSelectedMedia(media)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                      selectedMedia?.id === media.id
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {media.type === 'IMAGE' ? (
                      <img
                        src={mediaApi.getMediaUrl(media.storagePath)}
                        alt={media.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <div className="text-white text-center">
                          <svg
                            className="w-16 h-16 mx-auto mb-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          <p className="text-xs">VIDEO</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white px-2 py-1">
                      <p className="text-xs truncate">{media.originalName}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {data.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page === data.meta.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No media found. Upload some files to get started!</p>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        {selectedMedia && (
          <div className="w-96 border-l border-gray-200 overflow-y-auto bg-gray-50 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Media Details</h2>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6">
              {selectedMedia.type === 'IMAGE' ? (
                <img
                  src={mediaApi.getMediaUrl(selectedMedia.storagePath)}
                  alt={selectedMedia.originalName}
                  className="w-full rounded-lg"
                />
              ) : (
                <video
                  src={mediaApi.getMediaUrl(selectedMedia.storagePath)}
                  controls
                  className="w-full rounded-lg"
                />
              )}
            </div>

            {/* Metadata Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: selectedMedia.id,
                  data: {
                    description: formData.get('description') as string,
                    tags: (formData.get('tags') as string)
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Filename</label>
                <input
                  type="text"
                  value={selectedMedia.originalName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedMedia.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={selectedMedia.tags.join(', ')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this media?')) {
                      deleteMutation.mutate(selectedMedia.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </form>

            {/* File Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600 space-y-2">
              <p><strong>Type:</strong> {selectedMedia.type}</p>
              <p><strong>Size:</strong> {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Uploaded:</strong> {new Date(selectedMedia.createdAt).toLocaleString()}</p>
              <p><strong>By:</strong> {selectedMedia.uploadedBy?.name || selectedMedia.uploadedBy?.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
