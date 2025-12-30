import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCreateWorkspace } from '@entities/workspace/api/workspace-queries';
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormData,
} from '@entities/workspace/model/workspace.types';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { generateSlug } from '@shared/lib/slug';

export function CreateWorkspacePage() {
  const navigate = useNavigate();
  const createWorkspaceMutation = useCreateWorkspace();
  const [manualSlug, setManualSlug] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  // Auto-generate slug from name when name changes (unless manually edited)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);

    if (!manualSlug) {
      const generatedSlug = generateSlug(value);
      setValue('slug', generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualSlug(true);
    setValue('slug', e.target.value);
  };

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    try {
      const workspace = await createWorkspaceMutation.mutateAsync(data);
      navigate({ to: `/workspace/${workspace.id}` });
    } catch (error: any) {
      console.error('Failed to create workspace:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Workspace</CardTitle>
          <CardDescription>Create a new workspace to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="내 워크스페이스"
                {...register('name')}
                onChange={handleNameChange}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              <p className="text-xs text-muted-foreground">
                한글, 영문, 숫자 모두 사용 가능합니다
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Workspace Slug
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (자동 생성됨)
                </span>
              </Label>
              <Input
                id="slug"
                type="text"
                placeholder="workspace-slug"
                {...register('slug')}
                onChange={handleSlugChange}
                className="font-mono"
              />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">
                URL에 사용됩니다. 이름에서 자동 생성되며, 한글은 로마자로 변환됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                type="text"
                placeholder="A brief description of your workspace"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {createWorkspaceMutation.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {(createWorkspaceMutation.error as any)?.response?.data?.message ||
                  'Failed to create workspace. Please try again.'}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate({ to: '/workspaces' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createWorkspaceMutation.isPending}
              >
                {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
