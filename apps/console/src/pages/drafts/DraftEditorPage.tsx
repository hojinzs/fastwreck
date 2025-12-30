import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { draftsApi, CreateDraftDto, UpdateDraftDto } from '@shared/api/drafts';
import { TiptapEditor } from '@widgets/draft-editor/TiptapEditor';

export function DraftEditorPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState({ type: 'doc', content: [] });
  const [status, setStatus] = useState<'DRAFT' | 'REVIEW' | 'READY' | 'PUBLISHED'>('DRAFT');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const workspaceId = localStorage.getItem('currentWorkspaceId') || '';

  const { data: draft, isLoading } = useQuery({
    queryKey: ['draft', id],
    queryFn: () => draftsApi.findOne(id!),
    enabled: !isNew && !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['draft-versions', id],
    queryFn: () => draftsApi.getVersions(id!),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setStatus(draft.status);
      if (draft.versions && draft.versions.length > 0) {
        setContent(draft.versions[0].content);
      }
    }
  }, [draft]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateDraftDto) => draftsApi.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      navigate({ to: `/drafts/${data.id}` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDraftDto }) =>
      draftsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setLastSaved(new Date());
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: ({ draftId, content }: { draftId: string; content: any }) =>
      draftsApi.createVersion(draftId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] });
      queryClient.invalidateQueries({ queryKey: ['draft-versions', id] });
      setLastSaved(new Date());
    },
  });

  const handleContentChange = useCallback((newContent: any) => {
    setContent(newContent);

    if (!isNew && id) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        createVersionMutation.mutate({ draftId: id, content: newContent });
      }, 3000);

      setAutoSaveTimer(timer);
    }
  }, [id, isNew, autoSaveTimer, createVersionMutation]);

  const handleSave = async () => {
    if (isNew) {
      await createMutation.mutateAsync({
        title,
        workspaceId,
        content,
      });
    } else if (id) {
      await updateMutation.mutateAsync({
        id,
        dto: { title, status },
      });
    }
  };

  const handleSaveVersion = async () => {
    if (!isNew && id) {
      await createVersionMutation.mutateAsync({
        draftId: id,
        content,
      });
    }
  };

  if (!isNew && isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate({ to: '/drafts' })}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Back to Drafts
        </button>
        <div className="flex gap-2 items-center">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!isNew && (
            <button
              onClick={handleSaveVersion}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              disabled={createVersionMutation.isPending}
            >
              Save Version
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isNew ? 'Create Draft' : 'Update Metadata'}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Draft title"
          className="w-full text-3xl font-bold border-none outline-none mb-4"
        />

        {!isNew && (
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg"
            >
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="READY">Ready</option>
              <option value="PUBLISHED">Published</option>
            </select>

            {draft && (
              <span className="text-sm text-gray-600">
                Version: {draft.currentVersion}
              </span>
            )}
          </div>
        )}
      </div>

      <TiptapEditor content={content} onChange={handleContentChange} />

      {versions && versions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Version History</h2>
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Version {version.version}</span>
                    <span className="text-sm text-gray-600 ml-4">
                      {new Date(version.createdAt).toLocaleString()}
                    </span>
                    {version.changeSummary && (
                      <p className="text-sm text-gray-600 mt-1">
                        {version.changeSummary}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      draftsApi.revertToVersion(id!, version.version).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['draft', id] });
                        queryClient.invalidateQueries({
                          queryKey: ['draft-versions', id],
                        });
                      })
                    }
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Revert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
