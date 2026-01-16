import React, { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@shared/ui/page-header";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { ideasApi } from "@shared/api/ideas";

export function IdeaEditorPage() {
  const { workspaceId } = useParams({
    from: "/workspace/$workspaceId/ideas/new",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      ideasApi.create({
        title,
        description: description || undefined,
        workspaceId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", workspaceId] });
      navigate({
        to: "/workspace/$workspaceId/ideas",
        params: { workspaceId },
      });
    },
  });

  if (!workspaceId) {
    return <div className="p-8">Please select a workspace first.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Idea"
        description="Capture a new idea for this workspace"
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(event.target.value)
            }
            placeholder="Idea title"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(event.target.value)
            }
            placeholder="Optional description"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            Create Idea
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              navigate({
                to: "/workspace/$workspaceId/ideas",
                params: { workspaceId },
              })
            }
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
