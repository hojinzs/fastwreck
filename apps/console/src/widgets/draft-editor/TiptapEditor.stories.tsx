import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TiptapEditor } from './TiptapEditor';

/**
 * TiptapEditor is a rich text editor built with Tiptap
 *
 * Features:
 * - Rich text formatting (bold, italic, headings, lists, blockquotes)
 * - Image upload with captions
 * - Double-click images to edit captions
 * - Character and word count
 * - Auto-save support
 */
const meta = {
  title: 'Widgets/DraftEditor/TiptapEditor',
  component: TiptapEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A powerful rich text editor with image support and caption editing.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TiptapEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive wrapper to handle state in Storybook
 */
function EditorWrapper({
  initialContent,
  editable = true,
}: {
  initialContent?: any;
  editable?: boolean;
}) {
  const [content, setContent] = useState(initialContent || { type: 'doc', content: [] });

  return (
    <div className="max-w-4xl mx-auto">
      <TiptapEditor
        content={content}
        onChange={setContent}
        editable={editable}
      />

      <details className="mt-4 p-4 bg-gray-50 rounded">
        <summary className="cursor-pointer font-semibold">
          📄 View JSON Content
        </summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/**
 * Empty editor - start typing to see it in action!
 */
export const Empty: Story = {
  render: () => <EditorWrapper />,
};

/**
 * Editor with sample content showing various formatting options
 */
export const WithContent: Story = {
  render: () => (
    <EditorWrapper
      initialContent={{
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Welcome to Fastwreck Editor' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a powerful rich text editor built with ',
              },
              { type: 'text', marks: [{ type: 'bold' }], text: 'Tiptap' },
              { type: 'text', text: '. You can format text in many ways:' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Text Formatting' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Bold text' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'italic' }], text: 'Italic text' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Lists and Quotes' }],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  { type: 'paragraph', content: [{ type: 'text', text: 'First item' }] },
                ],
              },
              {
                type: 'listItem',
                content: [
                  { type: 'paragraph', content: [{ type: 'text', text: 'Second item' }] },
                ],
              },
              {
                type: 'listItem',
                content: [
                  { type: 'paragraph', content: [{ type: 'text', text: 'Third item' }] },
                ],
              },
            ],
          },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'This is a blockquote. Great for highlighting important information.',
                  },
                ],
              },
            ],
          },
        ],
      }}
    />
  ),
};

/**
 * Read-only mode - useful for displaying published content
 */
export const ReadOnly: Story = {
  render: () => (
    <EditorWrapper
      editable={false}
      initialContent={{
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Read-Only Mode' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This editor is in read-only mode. You cannot edit the content.',
              },
            ],
          },
        ],
      }}
    />
  ),
};

/**
 * Editor with image (without upload functionality)
 *
 * Note: In Storybook, image upload requires a workspaceId.
 * You can still paste images or use the toolbar after providing a workspace context.
 */
export const WithImage: Story = {
  render: () => (
    <EditorWrapper
      initialContent={{
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Image Example' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Double-click on the image below to add or edit a caption:',
              },
            ],
          },
          {
            type: 'imageWithCaption',
            attrs: {
              src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              alt: 'Beautiful mountain landscape',
              caption: 'A stunning view of mountains at sunset',
            },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '💡 Try double-clicking the image to see the caption editor!',
              },
            ],
          },
        ],
      }}
    />
  ),
};

/**
 * Multiple images with different caption states
 */
export const MultipleImages: Story = {
  render: () => (
    <EditorWrapper
      initialContent={{
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Image Gallery' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Image with caption:' }],
          },
          {
            type: 'imageWithCaption',
            attrs: {
              src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              alt: 'Nature',
              caption: 'Beautiful nature landscape with trees and sky',
            },
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Image without caption:' }],
          },
          {
            type: 'imageWithCaption',
            attrs: {
              src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
              alt: 'Lake',
            },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '💡 You can add captions by double-clicking any image!',
              },
            ],
          },
        ],
      }}
    />
  ),
};

/**
 * Long form article example with mixed content
 */
export const LongArticle: Story = {
  render: () => (
    <EditorWrapper
      initialContent={{
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'The Future of Content Creation' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Content creation is evolving rapidly. In this article, we explore the trends and tools shaping the industry.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Introduction' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'The landscape of digital content creation has transformed dramatically over the past decade. ',
              },
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'Creators now have unprecedented tools',
              },
              {
                type: 'text',
                text: ' at their disposal to bring their visions to life.',
              },
            ],
          },
          {
            type: 'imageWithCaption',
            attrs: {
              src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
              alt: 'Workspace',
              caption: 'A modern content creator workspace',
            },
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Key Trends' }],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'AI-Assisted Creation' },
                      { type: 'text', text: ' - Tools that augment human creativity' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Multi-Platform Publishing' },
                      { type: 'text', text: ' - Reach audiences everywhere' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', marks: [{ type: 'bold' }], text: 'Workflow Automation' },
                      { type: 'text', text: ' - Streamline repetitive tasks' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'The best tools are those that preserve the creator\'s thought flow, not those that replace human creativity.',
                  },
                ],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Conclusion' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'As we look to the future, the role of technology in content creation will continue to grow. The key is to ',
              },
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: 'embrace these tools while maintaining authentic human connection',
              },
              { type: 'text', text: '.' },
            ],
          },
        ],
      }}
    />
  ),
};
