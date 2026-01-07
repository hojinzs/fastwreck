import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export interface ImageWithCaptionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        caption?: string;
        mediaId?: string;
      }) => ReturnType;
    };
  }
}

export const ImageWithCaption = Image.extend<ImageWithCaptionOptions>({
  name: 'imageWithCaption',

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-caption'),
        renderHTML: (attributes) => {
          if (!attributes.caption) {
            return {};
          }
          return {
            'data-caption': attributes.caption,
          };
        },
      },
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-media-id'),
        renderHTML: (attributes) => {
          if (!attributes.mediaId) {
            return {};
          }
          return {
            'data-media-id': attributes.mediaId,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const caption = HTMLAttributes['data-caption'];
    const { 'data-caption': _, ...imgAttributes } = HTMLAttributes;

    if (caption) {
      return [
        'figure',
        { class: 'image-with-caption' },
        ['img', mergeAttributes(this.options.HTMLAttributes, imgAttributes)],
        ['figcaption', {}, caption],
      ];
    }

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, imgAttributes),
    ];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
