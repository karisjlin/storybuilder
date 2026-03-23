// RichTextEditor — TipTap-powered rich text editor component.
// Supports headings, bold, italic, lists, blockquotes, and code blocks via StarterKit.
// Calls onChange with the TipTap JSON document and a live word count after each keystroke.
// Auto-syncs content when the active chapter changes (keyed by chapter ID in the parent).
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  content: object | null;       // TipTap JSON document from the database
  onChange: (content: object, wordCount: number) => void;
  editable?: boolean;
  placeholder?: string;
}

// Count words by splitting on whitespace — returns 0 for blank content
function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function RichTextEditor({ content, onChange, editable = true, placeholder = 'Write your scene...' }: RichTextEditorProps) {
  // Stable callback so the editor doesn't re-initialise on every render
  const handleUpdate = useCallback(
    ({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      onChange(json, countWords(text));
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    editable,
    onUpdate: handleUpdate,
  });

  // When the parent switches to a different chapter, replace the editor content.
  // The key prop on RichTextEditor in Workspace.tsx ensures a fresh instance per chapter,
  // but this effect also guards against stale content if the key approach changes.
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentJson = JSON.stringify(editor.getJSON());
      const newJson = JSON.stringify(content);
      if (currentJson !== newJson) {
        editor.commands.setContent(content || '');
      }
    }
  }, [editor, content]);

  // Keep the editable flag in sync if it changes at runtime
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return (
    <EditorContent
      editor={editor}
      className="min-h-full outline-none"
    />
  );
}
