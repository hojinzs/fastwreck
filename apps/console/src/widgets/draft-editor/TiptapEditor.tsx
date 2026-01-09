import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { ImageWithCaption } from './extensions/ImageWithCaption';
import { mediaApi, Media } from '@shared/api/media';
import { MediaSelector } from '@features/media/components/MediaSelector';
import { ImageCaptionModal } from './components/ImageCaptionModal';
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [captionModal, setCaptionModal] = useState<{
    show: boolean;
    currentCaption?: string;
    nodePos?: number;
  }>({ show: false });

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

  // Add double-click handler for images
  useEffect(() => {
    if (!editor || !editorRef.current) return;

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if double-clicked on an image
      if (target.tagName === 'IMG') {
        e.preventDefault();

        // Find the node position
        const pos = editor.view.posAtDOM(target, 0);
        const node = editor.state.doc.nodeAt(pos);

        if (node && node.type.name === 'imageWithCaption') {
          setCaptionModal({
            show: true,
            currentCaption: node.attrs.caption || '',
            nodePos: pos,
          });
        }
      }
    };

    const editorElement = editorRef.current;
    editorElement.addEventListener('dblclick', handleDoubleClick);

    return () => {
      editorElement.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [editor]);

  const handleSaveCaption = (caption: string) => {
    if (!editor || captionModal.nodePos === undefined) return;

    editor
      .chain()
      .focus()
      .setTextSelection(captionModal.nodePos)
      .updateAttributes('imageWithCaption', {
        caption: caption || undefined,
      })
      .run();

    setCaptionModal({ show: false });
  };

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
    <div className="tiptap-editor" ref={editorRef}>
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
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: Double-click on images to add/edit captions
          </p>
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

      {/* Image Caption Modal */}
      {captionModal.show && (
        <ImageCaptionModal
          currentCaption={captionModal.currentCaption}
          onSave={handleSaveCaption}
          onClose={() => setCaptionModal({ show: false })}
        />
      )}
    </div>
  );
}
