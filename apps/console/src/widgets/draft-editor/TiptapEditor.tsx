import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { ImageWithCaption } from './extensions/ImageWithCaption';
import { mediaApi, Media } from '@shared/api/media';
import { MediaSelector } from '@features/media/components/MediaSelector';
import './editor-styles.css';

interface TiptapEditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
  workspaceId?: string;
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  workspaceId,
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageWithCaption.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Reset input so the same file can be selected again
    e.target.value = '';

    // Check if workspaceId is available
    if (!workspaceId) {
      alert('Workspace context is required for media upload');
      return;
    }

    try {
      setIsUploading(true);

      // Create temporary local URL for immediate preview
      const tempUrl = URL.createObjectURL(file);

      // Insert image immediately with local URL
      const tempPos = editor.state.selection.from;
      editor.commands.setImage({
        src: tempUrl,
        alt: file.name,
      });

      // Upload to server
      const media = await mediaApi.upload(file, workspaceId);

      // Get the permanent URL
      const permanentUrl = mediaApi.getMediaUrl(media.storagePath);

      // Find and update the image node with the permanent URL
      const { state } = editor;
      const { doc } = state;

      doc.descendants((node, pos) => {
        if (node.type.name === 'imageWithCaption' && node.attrs.src === tempUrl) {
          editor
            .chain()
            .setTextSelection(pos)
            .updateAttributes('imageWithCaption', {
              src: permanentUrl,
              mediaId: media.id,
              alt: media.originalName,
            })
            .run();

          // Clean up temporary URL
          URL.revokeObjectURL(tempUrl);
          return false; // Stop iteration
        }
      });
    } catch (error) {
      console.error('Failed to upload media:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaSelect = (media: Media) => {
    if (!editor) return;

    const url = mediaApi.getMediaUrl(media.storagePath);

    editor.commands.setImage({
      src: url,
      alt: media.originalName,
      mediaId: media.id,
    });

    setShowMediaSelector(false);
  };

  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor">
      {editable && (
        <>
          <div className="editor-toolbar">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'is-active' : ''}
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
              Bullet List
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'is-active' : ''}
            >
              Ordered List
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'is-active' : ''}
            >
              Blockquote
            </button>
            <button
              type="button"
              onClick={handleImageUpload}
              title="Upload new image"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            {workspaceId && (
              <button
                type="button"
                onClick={() => setShowMediaSelector(true)}
                title="Select from media library"
              >
                Media Library
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      )}
      <EditorContent editor={editor} />
      {editable && (
        <div className="editor-stats">
          <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
          <span>Words: {editor.storage.characterCount?.words() || 0}</span>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && workspaceId && (
        <MediaSelector
          workspaceId={workspaceId}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </div>
  );
}
