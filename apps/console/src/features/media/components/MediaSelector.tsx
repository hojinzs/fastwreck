import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { mediaApi, Media, MediaQueryParams } from '@shared/api/media';

interface MediaSelectorProps {
  workspaceId: string;
  onSelect: (media: Media) => void;
  onClose: () => void;
}

export function MediaSelector({ workspaceId, onSelect, onClose }: MediaSelectorProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'IMAGE' | 'VIDEO' | undefined>();
  const [page, setPage] = useState(1);

  const queryParams: MediaQueryParams = {
    workspaceId,
    search: search || undefined,
    type: typeFilter,
    page,
    limit: 12,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['media', queryParams],
    queryFn: () => mediaApi.getAll(queryParams),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select Media</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-600">Loading media...</p>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.data.map((media) => (
                  <button
                    key={media.id}
                    onClick={() => onSelect(media)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition cursor-pointer"
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
                            className="w-12 h-12 mx-auto mb-2"
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
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
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
              <p>No media found. Upload some files first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
