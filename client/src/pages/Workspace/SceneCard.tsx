// SceneCard — a draggable sticky note card representing a single scene within a chapter.
// Uses dnd-kit's useSortable for drag-and-drop reordering in the main content grid.
// Title is saved on blur; content is auto-saved 1s after the user stops typing.
// The drag handle bar doubles as the card header (click-and-drag anywhere on it).
import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Scene } from '../../types';

interface Props {
  scene: Scene;
  onDelete: () => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string, wordCount: number) => void;
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function SceneCard({ scene, onDelete, onTitleChange, onContentChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  // Per-card debounce timer so each note saves independently
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleContentInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onContentChange(text, countWords(text));
    }, 1000);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-56 flex flex-col rounded-lg shadow-lg bg-[#161e17] border border-[#2a3d2c]"
    >
      {/* Drag handle / header bar — grab anywhere here to drag */}
      <div
        {...attributes}
        {...listeners}
        className="h-7 flex items-center justify-between px-3 rounded-t-lg bg-[#1c261d] border-b border-[#2a3d2c] cursor-grab active:cursor-grabbing group"
      >
        <span className="text-[#3d5440] text-xs select-none">⠿⠿</span>
        {/* Delete button — stopPointerDown so it doesn't trigger the drag */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="text-[#3d5440] hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100"
          title="Delete scene"
        >
          ✕
        </button>
      </div>

      {/* Title — saved on blur */}
      <input
        type="text"
        defaultValue={scene.title}
        onBlur={e => onTitleChange(e.target.value)}
        className="bg-transparent px-3 pt-2.5 pb-1 text-sm font-heading font-bold text-[#c8e6ca] outline-none placeholder:text-[#3d5440]"
        placeholder="Scene title..."
      />

      {/* Content textarea — auto-saved after 1s of inactivity */}
      <textarea
        defaultValue={scene.content ?? ''}
        onChange={handleContentInput}
        placeholder="Write your scene..."
        className="flex-1 bg-transparent px-3 pb-3 text-xs font-body text-[#a5c9a8] resize-none outline-none placeholder:text-[#3d5440] leading-relaxed min-h-36"
      />

      {/* Word count — shown only when there's content */}
      {scene.wordCount > 0 && (
        <div className="px-3 pb-2 text-right">
          <span className="text-xs font-mono text-[#3d5440]">{scene.wordCount.toLocaleString()}w</span>
        </div>
      )}
    </div>
  );
}
