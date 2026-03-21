// SortableSceneItem — a single draggable scene row nested under a chapter in the sidebar.
// Uses dnd-kit's useSortable hook, same pattern as SortableChapterItem.
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Scene } from '../../types';

interface Props {
  scene: Scene;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function SortableSceneItem({ scene, isActive, onSelect, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 pl-8 pr-3 py-2 cursor-pointer transition-colors ${
        isActive
          ? 'bg-surface-600 border-l-2 border-accent-green'
          : 'hover:bg-surface-700/50 border-l-2 border-transparent'
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="text-surface-500 hover:text-text-muted cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
      >
        ⠿
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-body text-text-muted truncate">{scene.title}</p>
        {scene.wordCount > 0 && (
          <span className="text-xs font-mono text-surface-500">{scene.wordCount.toLocaleString()}w</span>
        )}
      </div>

      {/* Delete button — hover only */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="text-surface-500 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs"
        title="Delete scene"
      >
        ✕
      </button>
    </div>
  );
}
