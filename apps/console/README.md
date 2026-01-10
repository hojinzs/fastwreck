# Console App

Frontend SPA for Fastwreck content creation platform.

## Tech Stack

- **Framework**: React 19.2
- **Build Tool**: Vite 6.0
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS 4.1
- **Editor**: Tiptap 3.x
- **Component Dev**: Storybook 8.6

## Development

### Running the App

```bash
# Start development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check-types

# Linting
pnpm lint
```

### Storybook

Storybook is set up for developing and testing components in isolation, especially the Tiptap editor and its extensions.

```bash
# Start Storybook (port 6006)
pnpm storybook

# Build Storybook for deployment
pnpm build-storybook
```

**Storybook URL**: http://localhost:6006

#### Available Stories

**TiptapEditor** (`src/widgets/draft-editor/TiptapEditor.stories.tsx`)
- **Empty**: Start with a blank editor
- **WithContent**: Pre-filled with formatted content (headings, lists, blockquotes)
- **ReadOnly**: Non-editable mode for displaying content
- **WithImage**: Example with image and caption
- **MultipleImages**: Gallery with multiple images (with and without captions)
- **LongArticle**: Full article example with mixed content

#### Testing the Editor in Storybook

1. **Typing**: Open any story and start typing directly in the editor
2. **Formatting**: Use the toolbar buttons to apply formatting (Bold, Italic, Headings, Lists, Blockquotes)
3. **Image Captions**: Double-click on any image to open the caption editor
4. **View JSON**: Expand the "📄 View JSON Content" section to see the editor's internal data structure

#### Editor Features

- ✅ Rich text formatting (bold, italic)
- ✅ Headings (H1, H2, H3)
- ✅ Bullet and ordered lists
- ✅ Blockquotes
- ✅ Image upload with captions
- ✅ Double-click images to edit captions
- ✅ Character and word count
- ✅ Auto-save support (in main app)

#### Image Upload in Storybook

Image upload in Storybook works without a backend using mock implementations:

- **Mock Media API**: Located in `src/widgets/draft-editor/__mocks__/mediaApiMock.ts`
- Uses Blob URLs for local image preview
- No actual server upload required for testing

**Note**: In the main app with a `workspaceId`, images are uploaded to the server. In Storybook, the upload button is hidden unless you provide a mock workspace context.

## Project Structure

```
src/
├── app/                 # Application setup, providers
├── pages/              # Page components (workspace, drafts, auth)
├── widgets/            # Feature widgets (draft-editor, layout, sidebar)
│   └── draft-editor/   # Tiptap editor implementation
│       ├── TiptapEditor.tsx
│       ├── TiptapEditor.stories.tsx  # Storybook stories
│       ├── extensions/               # Custom Tiptap extensions
│       │   └── ImageWithCaption.ts
│       ├── components/               # Editor components
│       │   └── ImageCaptionModal.tsx
│       └── __mocks__/               # Mock implementations for testing
│           └── mediaApiMock.ts
├── features/           # Feature modules (media selector)
├── entities/           # Domain entities
└── shared/             # Shared utilities and APIs
```

## Path Aliases

TypeScript path aliases are configured for cleaner imports:

```typescript
import { TiptapEditor } from '@widgets/draft-editor/TiptapEditor';
import { mediaApi } from '@shared/api/media';
import { MediaSelector } from '@features/media/components/MediaSelector';
```

Available aliases:
- `@/*` - src root
- `@app/*` - Application setup
- `@pages/*` - Page components
- `@widgets/*` - Feature widgets
- `@features/*` - Feature modules
- `@entities/*` - Domain entities
- `@shared/*` - Shared utilities

## Editor Development Guide

### Creating New Tiptap Extensions

1. Create extension in `src/widgets/draft-editor/extensions/`
2. Follow the pattern from `ImageWithCaption.ts`
3. Add to the editor's extensions array in `TiptapEditor.tsx`
4. Create a Storybook story to test the extension

### Adding New Editor Features

1. Implement the feature in `TiptapEditor.tsx`
2. Add toolbar button or UI control
3. Create a Storybook story demonstrating the feature
4. Update this README with the new feature

### Testing Editor Changes

Always test editor changes in Storybook before integrating into the main app:

```bash
pnpm storybook
# Navigate to Widgets > DraftEditor > TiptapEditor
# Test your changes in isolation
```

## Storybook Configuration

- **Main Config**: `.storybook/main.ts`
  - Vite integration
  - Path alias resolution
  - Addon configuration
- **Preview Config**: `.storybook/preview.ts`
  - Global decorators
  - Tailwind CSS import
  - Theme configuration

## Building for Production

```bash
# Build the app
pnpm build

# Build Storybook (optional, for documentation)
pnpm build-storybook
```

Build outputs:
- **App**: `dist/` directory
- **Storybook**: `storybook-static/` directory

## Contributing

When adding new components or features:

1. Create the component in the appropriate directory
2. Add TypeScript types
3. Create a `.stories.tsx` file for Storybook
4. Test thoroughly in Storybook
5. Integrate into the main app

## Related Documentation

- [Main Project README](../../README.md)
- [CLAUDE.md](../../CLAUDE.md) - Development guide for AI assistants
- [API Documentation](../api/README.md)
