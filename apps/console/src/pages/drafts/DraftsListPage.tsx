import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { draftsApi, Draft } from '@shared/api/drafts';
import { Link } from '@tanstack/react-router';

export function DraftsListPage() {
  const [workspaceId, setWorkspaceId] = useState(() => {
    return localStorage.getItem('currentWorkspaceId') || '';
  });

  const queryClient = useQueryClient();

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['drafts', workspaceId],
    queryFn: () => draftsApi.findAll(workspaceId),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => draftsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (!workspaceId) {
    return (
      <div className="p-8">
        <p>Please select a workspace first.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Drafts</h1>
        <Link
          to="/drafts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Draft
        </Link>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : drafts && drafts.length > 0 ? (
        <div className="grid gap-4">
          {drafts.map((draft: Draft) => (
            <div
              key={draft.id}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to={`/drafts/${draft.id}`}
                    className="text-xl font-semibold text-blue-600 hover:underline"
                  >
                    {draft.title}
                  </Link>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>
                      Status:{' '}
                      <span className="font-medium">{draft.status}</span>
                    </p>
                    <p>Version: {draft.currentVersion}</p>
                    <p>Created by: {draft.createdBy.name || draft.createdBy.email}</p>
                    <p>
                      Updated: {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/drafts/${draft.id}`}
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No drafts yet</p>
          <Link
            to="/drafts/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Create your first draft
          </Link>
        </div>
      )}
    </div>
  );
}
