import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { draftsApi, CreateDraftDto, UpdateDraftDto } from '@shared/api/drafts';
import { TiptapEditor } from '@widgets/draft-editor/TiptapEditor';

export function DraftEditorPage() {
  const params = useParams({ strict: false }) as { id?: string; workspaceId?: string };
  const { id, workspaceId } = params;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState({ type: 'doc', content: [] });
  const [status, setStatus] = useState<'DRAFT' | 'REVIEW' | 'READY' | 'PUBLISHED'>('DRAFT');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTempSaved, setLastTempSaved] = useState<Date | null>(null);
  const [hasTempContent, setHasTempContent] = useState(false);

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
      setHasTempContent(!!draft.tempContent);

      // Load temp content if available, otherwise load latest version
      if (draft.tempContent) {
        setContent(draft.tempContent);
        if (draft.tempContentSavedAt) {
          setLastTempSaved(new Date(draft.tempContentSavedAt));
        }
      } else if (draft.versions && draft.versions.length > 0) {
        setContent(draft.versions[0].content);
      }
    }
  }, [draft]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateDraftDto) => draftsApi.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      navigate({ to: '/workspace/$workspaceId/drafts/$id', params: { workspaceId: workspaceId!, id: data.id } });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDraftDto }) =>
      draftsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });

  const saveTempMutation = useMutation({
    mutationFn: ({ draftId, content }: { draftId: string; content: any }) =>
      draftsApi.saveTempContent(draftId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] });
      setLastTempSaved(new Date());
      setHasTempContent(true);
    },
  });

  const discardTempMutation = useMutation({
    mutationFn: (draftId: string) => draftsApi.discardTempContent(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] });
      setHasTempContent(false);
      setLastTempSaved(null);
      // Reload latest version content
      if (draft?.versions && draft.versions.length > 0) {
        setContent(draft.versions[0].content);
      }
    },
  });

  const commitTempMutation = useMutation({
    mutationFn: (draftId: string) => draftsApi.commitTempContent(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] });
      queryClient.invalidateQueries({ queryKey: ['draft-versions', id] });
      setHasTempContent(false);
      setLastTempSaved(null);
    },
  });

  const handleContentChange = useCallback((newContent: any) => {
    setContent(newContent);

    if (!isNew && id) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        saveTempMutation.mutate({ draftId: id, content: newContent });
      }, 3000);

      setAutoSaveTimer(timer);
    }
  }, [id, isNew, autoSaveTimer, saveTempMutation]);

  const handleSave = async () => {
    if (isNew) {
      await createMutation.mutateAsync({
        title,
        workspaceId: workspaceId!,
        content,
      });
    } else if (id) {
      await updateMutation.mutateAsync({
        id,
        dto: { title, status },
      });
    }
  };

  const handleCommitTempContent = async () => {
    if (!isNew && id && hasTempContent) {
      await commitTempMutation.mutateAsync(id);
    }
  };

  const handleDiscardTempContent = async () => {
    if (!isNew && id && hasTempContent) {
      if (confirm('임시 저장본을 삭제하고 마지막 버전으로 되돌리시겠습니까?')) {
        await discardTempMutation.mutateAsync(id);
      }
    }
  };

  const handleRevertToVersion = async (version: number) => {
    if (!id) return;

    await draftsApi.revertToVersion(id, version);
    queryClient.invalidateQueries({ queryKey: ['draft', id] });
    queryClient.invalidateQueries({ queryKey: ['draft-versions', id] });
  };

  if (!isNew && isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!workspaceId) {
    return <div className="p-8">Please select a workspace first.</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate({ to: '/workspace/$workspaceId/drafts', params: { workspaceId: workspaceId! } })}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Drafts
            </button>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft title"
              className="w-full text-3xl font-bold border-none outline-none mb-4"
            />

            {!isNew && hasTempContent && lastTempSaved && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  임시 저장됨: {lastTempSaved.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <TiptapEditor content={content} onChange={handleContentChange} />

          {isNew && (
            <div className="mt-6">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                Create Draft
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {!isNew && (
        <div className="w-80 border-l border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Draft Settings</h2>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="READY">Ready</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            {/* Version Info */}
            {draft && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Current Version: <span className="font-medium">{draft.currentVersion}</span>
                </p>
              </div>
            )}

            {/* Save Metadata Button */}
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mb-4"
              disabled={updateMutation.isPending}
            >
              Update Metadata
            </button>

            {/* Temp Content Actions */}
            {hasTempContent && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium mb-3">임시 저장본 관리</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleCommitTempContent}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={commitTempMutation.isPending}
                  >
                    새 버전 저장
                  </button>
                  <button
                    onClick={handleDiscardTempContent}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    disabled={discardTempMutation.isPending}
                  >
                    되돌리기
                  </button>
                </div>
              </div>
            )}

            {/* Version History */}
            <div>
              <h3 className="text-sm font-medium mb-3">Version History</h3>
              {versions && versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">v{version.version}</span>
                        <button
                          onClick={() => handleRevertToVersion(version.version)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Revert
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      {version.changeSummary && (
                        <p className="text-xs text-gray-600 mt-1">
                          {version.changeSummary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No version history</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
