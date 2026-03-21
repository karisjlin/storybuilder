// SortableChapterItem — a single draggable chapter row in the sidebar.
// Uses dnd-kit's useSortable hook to provide drag handles and transform styles.
// Displays the chapter title, status selector, word count, and a delete button.
// The drag handle and delete button are hidden until the row is hovered.
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Chapter } from '../../types';

interface Props {
  chapter: Chapter;
  isActive: boolean;                                      // Highlights the currently open chapter
  onSelect: () => void;                                   // Opens this chapter in the editor
  onDelete: () => void;
  onStatusChange: (status: Chapter['status']) => void;
  statusColors: Record<string, string>;                   // Tailwind classes keyed by status value
  statusLabels: Record<string, string>;                   // Human-readable labels keyed by status value
}

export default function SortableChapterItem({
  chapter,
  isActive,
  onSelect,
  onDelete,
  onStatusChange,
  statusColors,
  statusLabels,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  // Apply dnd-kit's CSS transform during drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1, // Fade the original while dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
        isActive
          ? 'bg-surface-700 border-l-2 border-accent-green'
          : 'hover:bg-surface-700/50 border-l-2 border-transparent'
      }`}
      onClick={onSelect}
    >
      {/* Drag handle — visible on hover only; stopPropagation prevents triggering onSelect */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-surface-500 hover:text-text-muted cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ⠿
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-text-primary truncate">{chapter.title}</p>

        <div className="flex items-center gap-2 mt-0.5">
          {/* Inline status selector — stopPropagation prevents row click from firing */}
          <select
            value={chapter.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(e.target.value as Chapter['status']);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`text-xs font-mono bg-transparent border-none outline-none cursor-pointer ${statusColors[chapter.status]}`}
          >
            {Object.entries(statusLabels).map(([val, label]) => (
              <option key={val} value={val} className="bg-surface-800 text-text-primary">
                {label}
              </option>
            ))}
          </select>

          {/* Word count badge — only shown when chapter has content */}
          {chapter.wordCount > 0 && (
            <span className="text-xs font-mono text-surface-500">
              {chapter.wordCount.toLocaleString()}w
            </span>
          )}
        </div>
      </div>

      {/* Delete button — visible on hover only */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="text-surface-500 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-sm"
        title="Delete chapter"
      >
        ✕
      </button>
    </div>
  );
}
