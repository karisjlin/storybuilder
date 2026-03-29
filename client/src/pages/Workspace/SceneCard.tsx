// SceneCard — draggable sticky note card for a single scene.
// Shows assigned characters as initials circles and world entries as category pills.
// A "+" button opens an inline picker to assign/remove items from both lists.
import { useRef, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Scene, Character, WorldEntry } from '../../types';
import { assignCharacter, removeCharacter, assignWorldEntry, removeWorldEntry } from '../../services/scenes';

interface Props {
  scene: Scene;
  allCharacters: Character[];
  allWorldEntries: WorldEntry[];
  onUpdate: (updated: Scene) => void;
  onDelete: () => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string, wordCount: number) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  location: '📍', lore: '📖', item: '⚔️',
  faction: '🏛', event: '📅', condition: '🌡', other: '📌',
};

// Generate a consistent background color for a character circle from their name
const CHAR_COLORS = [
  'bg-purple-800', 'bg-blue-800', 'bg-teal-800',
  'bg-indigo-800', 'bg-rose-800', 'bg-amber-800',
];
function charColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return CHAR_COLORS[hash % CHAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function SceneCard({
  scene, allCharacters, allWorldEntries,
  onUpdate, onDelete, onTitleChange, onContentChange,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState(scene.title);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'characters' | 'world'>('characters');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Clear pending save timer on unmount to avoid calling onContentChange after removal
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  function handleContentInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onContentChange(text, countWords(text));
    }, 1000);
  }

  async function toggleCharacter(char: Character) {
    const isAssigned = scene.characters.some(c => c.id === char.id);
    const updated = isAssigned
      ? await removeCharacter(scene.id, char.id)
      : await assignCharacter(scene.id, char.id);
    onUpdate(updated);
  }

  async function toggleWorldEntry(entry: WorldEntry) {
    const isAssigned = scene.worldEntries.some(w => w.id === entry.id);
    const updated = isAssigned
      ? await removeWorldEntry(scene.id, entry.id)
      : await assignWorldEntry(scene.id, entry.id);
    onUpdate(updated);
  }

  const hasAssignments = scene.characters.length > 0 || scene.worldEntries.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-56 flex flex-col rounded-lg shadow-lg bg-[#161e17] border border-[#2a3d2c]"
    >
      {/* Drag handle / header bar */}
      <div
        {...attributes}
        {...listeners}
        className="h-7 flex items-center justify-between px-3 rounded-t-lg bg-[#1c261d] border-b border-[#2a3d2c] cursor-grab active:cursor-grabbing group"
      >
        <span className="text-[#3d5440] text-xs select-none">⠿⠿</span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="text-[#3d5440] hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100"
          title="Delete scene"
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={() => onTitleChange(title)}
        className="bg-transparent px-3 pt-2.5 pb-1 text-sm font-heading font-bold text-[#c8e6ca] outline-none placeholder:text-[#3d5440]"
        placeholder="Scene title..."
      />

      {/* Content textarea */}
      <textarea
        defaultValue={scene.content ?? ''}
        onChange={handleContentInput}
        placeholder="Write your scene..."
        className="flex-1 bg-transparent px-3 pb-3 text-xs font-body text-[#a5c9a8] resize-none outline-none placeholder:text-[#3d5440] leading-relaxed min-h-36"
      />

      {/* Assigned chips */}
      {hasAssignments && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {scene.characters.map(c => (
            <span
              key={c.id}
              title={c.name}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0 ${charColor(c.name)}`}
            >
              {initials(c.name)}
            </span>
          ))}
          {scene.worldEntries.map(w => (
            <span
              key={w.id}
              title={w.name}
              className="flex items-center gap-0.5 bg-[#1c261d] border border-[#2a3d2c] text-[#a5c9a8] text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            >
              <span>{CATEGORY_ICONS[w.category] ?? '📌'}</span>
              <span className="max-w-[60px] truncate">{w.name}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer: word count + picker button */}
      <div className="px-3 pb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#3d5440]">
          {scene.wordCount > 0 ? `${scene.wordCount.toLocaleString()}w` : ''}
        </span>
        <div className="relative" ref={pickerRef}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setPickerOpen(v => !v)}
            className="text-[#3d5440] hover:text-[#a5c9a8] transition-colors text-xs font-mono"
            title="Add character or world entry"
          >
            + assign
          </button>

          {/* Picker dropdown */}
          {pickerOpen && (
            <div className="absolute bottom-7 right-0 w-52 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-surface-600">
                <button
                  onClick={() => setPickerTab('characters')}
                  className={`flex-1 py-1.5 text-xs font-mono transition-colors ${pickerTab === 'characters' ? 'text-text-primary bg-surface-700' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Characters
                </button>
                <button
                  onClick={() => setPickerTab('world')}
                  className={`flex-1 py-1.5 text-xs font-mono transition-colors ${pickerTab === 'world' ? 'text-text-primary bg-surface-700' : 'text-text-muted hover:text-text-primary'}`}
                >
                  World
                </button>
              </div>

              {/* List */}
              <div className="max-h-44 overflow-y-auto py-1">
                {pickerTab === 'characters' && (
                  allCharacters.length === 0
                    ? <p className="text-text-muted text-xs px-3 py-2">No characters yet.</p>
                    : allCharacters.map(char => {
                        const assigned = scene.characters.some(c => c.id === char.id);
                        return (
                          <button
                            key={char.id}
                            onClick={() => toggleCharacter(char)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-700 transition-colors text-left"
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${charColor(char.name)}`}>
                              {initials(char.name)}
                            </span>
                            <span className="text-xs font-body text-text-primary truncate flex-1">{char.name}</span>
                            {assigned && <span className="text-accent-green text-xs">✓</span>}
                          </button>
                        );
                      })
                )}
                {pickerTab === 'world' && (
                  allWorldEntries.length === 0
                    ? <p className="text-text-muted text-xs px-3 py-2">No world entries yet.</p>
                    : allWorldEntries.map(entry => {
                        const assigned = scene.worldEntries.some(w => w.id === entry.id);
                        return (
                          <button
                            key={entry.id}
                            onClick={() => toggleWorldEntry(entry)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-700 transition-colors text-left"
                          >
                            <span className="text-xs shrink-0">{CATEGORY_ICONS[entry.category] ?? '📌'}</span>
                            <span className="text-xs font-body text-text-primary truncate flex-1">{entry.name}</span>
                            {assigned && <span className="text-accent-green text-xs">✓</span>}
                          </button>
                        );
                      })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
