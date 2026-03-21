// TagsPanel — create and manage tags; assign them to chapters, characters, and world entries.
// Tags are coloured labels that can be applied to any entity across the story.
import { useState, useEffect } from 'react';
import { getTags, createTag, updateTag, deleteTag, assignTag, unassignTag } from '../../services/tags';
import { getChapters } from '../../services/chapters';
import { getCharacters } from '../../services/characters';
import { getWorldEntries } from '../../services/world';
import { Tag, TagAssignment, TaggableType, Chapter, Character, WorldEntry } from '../../types';

interface Props {
  storyId: string;
}

const PRESET_COLORS = [
  '#FF6B35', '#E63946', '#6B7280', '#10B981', '#3B82F6',
  '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#EF4444',
];

export default function TagsPanel({ storyId }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldEntries, setWorldEntries] = useState<WorldEntry[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [t, ch, chars, world] = await Promise.all([
        getTags(storyId),
        getChapters(storyId),
        getCharacters(storyId),
        getWorldEntries(storyId),
      ]);
      setTags(t);
      setChapters(ch);
      setCharacters(chars);
      setWorldEntries(world);
      setLoading(false);
    }
    load();
  }, [storyId]);

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const tag = await createTag(storyId, newTagName.trim(), newTagColor);
    setTags(prev => [...prev, { ...tag, assignments: [] }]);
    setNewTagName('');
    setNewTagColor(PRESET_COLORS[0]);
    setShowCreate(false);
  }

  async function handleDeleteTag(id: string) {
    await deleteTag(id);
    setTags(prev => prev.filter(t => t.id !== id));
    if (selectedTag?.id === id) setSelectedTag(null);
  }

  function isAssigned(tag: Tag, taggableId: string): boolean {
    return tag.assignments?.some(a => a.taggableId === taggableId) ?? false;
  }

  async function toggleAssignment(tag: Tag, taggableId: string, taggableType: TaggableType) {
    if (isAssigned(tag, taggableId)) {
      await unassignTag(tag.id, taggableId, taggableType);
      setTags(prev => prev.map(t =>
        t.id === tag.id
          ? { ...t, assignments: t.assignments?.filter(a => a.taggableId !== taggableId) ?? [] }
          : t
      ));
      // Keep selectedTag in sync
      setSelectedTag(prev => prev?.id === tag.id
        ? { ...prev, assignments: prev.assignments?.filter(a => a.taggableId !== taggableId) ?? [] }
        : prev
      );
    } else {
      const assignment = await assignTag(tag.id, taggableId, taggableType);
      setTags(prev => prev.map(t =>
        t.id === tag.id
          ? { ...t, assignments: [...(t.assignments ?? []), assignment] }
          : t
      ));
      setSelectedTag(prev => prev?.id === tag.id
        ? { ...prev, assignments: [...(prev.assignments ?? []), assignment] }
        : prev
      );
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Tag List */}
      <div className="w-64 border-r border-surface-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-surface-700 flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Tags</span>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="text-accent-green hover:text-green-400 text-xl leading-none transition-colors"
          >
            +
          </button>
        </div>

        {/* Create Tag Form */}
        {showCreate && (
          <form onSubmit={handleCreateTag} className="p-3 border-b border-surface-700">
            <input
              autoFocus
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="Tag name..."
              className="w-full bg-surface-700 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-green focus:outline-none font-body mb-2"
            />
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    newTagColor === color ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-accent-green text-white text-xs py-1.5 rounded-lg font-body hover:bg-green-600 transition-colors">
                Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-surface-600 text-text-muted text-xs py-1.5 rounded-lg font-body hover:bg-surface-500 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto py-2">
          {tags.length === 0 ? (
            <p className="text-text-muted text-xs text-center py-6 px-3 font-body">No tags yet.</p>
          ) : (
            tags.map(tag => (
              <div
                key={tag.id}
                onClick={() => setSelectedTag(tag)}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                  selectedTag?.id === tag.id
                    ? 'bg-surface-700 border-l-2 border-accent-green'
                    : 'hover:bg-surface-700/50 border-l-2 border-transparent'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="text-sm font-body text-text-primary flex-1 truncate">{tag.name}</span>
                <span className="text-xs text-text-muted font-mono">
                  {tag.assignments?.length ?? 0}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                  className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Assignment Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedTag ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="font-heading text-xl font-bold text-text-muted mb-1">Select a tag</p>
              <p className="text-text-muted text-sm font-body">Choose a tag from the left to manage its assignments.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedTag.color }} />
              <h2 className="font-heading font-bold text-text-primary text-xl">{selectedTag.name}</h2>
              <span className="text-sm text-text-muted font-mono">
                {selectedTag.assignments?.length ?? 0} assignment{(selectedTag.assignments?.length ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Chapters */}
            {chapters.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">Chapters</h3>
                <div className="space-y-2">
                  {chapters.map(ch => {
                    const assigned = isAssigned(selectedTag, ch.id);
                    return (
                      <label key={ch.id} className="flex items-center gap-3 p-3 bg-surface-700 rounded-lg border border-surface-600 cursor-pointer hover:border-surface-500 transition-colors">
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={() => toggleAssignment(selectedTag, ch.id, 'chapter')}
                          className="accent-accent-green"
                        />
                        <span className="text-sm font-body text-text-primary">{ch.title}</span>
                        {assigned && (
                          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: selectedTag.color + '33', color: selectedTag.color }}>
                            tagged
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Characters */}
            {characters.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">Characters</h3>
                <div className="space-y-2">
                  {characters.map(char => {
                    const assigned = isAssigned(selectedTag, char.id);
                    return (
                      <label key={char.id} className="flex items-center gap-3 p-3 bg-surface-700 rounded-lg border border-surface-600 cursor-pointer hover:border-surface-500 transition-colors">
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={() => toggleAssignment(selectedTag, char.id, 'character')}
                          className="accent-accent-green"
                        />
                        <span className="text-sm font-body text-text-primary">{char.name}</span>
                        {char.role && <span className="text-xs text-text-muted font-mono">{char.role}</span>}
                        {assigned && (
                          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: selectedTag.color + '33', color: selectedTag.color }}>
                            tagged
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            )}

            {/* World Entries */}
            {worldEntries.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">World Entries</h3>
                <div className="space-y-2">
                  {worldEntries.map(entry => {
                    const assigned = isAssigned(selectedTag, entry.id);
                    return (
                      <label key={entry.id} className="flex items-center gap-3 p-3 bg-surface-700 rounded-lg border border-surface-600 cursor-pointer hover:border-surface-500 transition-colors">
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={() => toggleAssignment(selectedTag, entry.id, 'worldEntry')}
                          className="accent-accent-green"
                        />
                        <span className="text-sm font-body text-text-primary">{entry.name}</span>
                        <span className="text-xs text-text-muted font-mono">{entry.category}</span>
                        {assigned && (
                          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: selectedTag.color + '33', color: selectedTag.color }}>
                            tagged
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            )}

            {chapters.length === 0 && characters.length === 0 && worldEntries.length === 0 && (
              <div className="text-center py-16">
                <p className="font-heading text-xl font-bold text-text-muted mb-1">Nothing to tag yet</p>
                <p className="text-text-muted text-sm font-body">Add chapters, characters, or world entries first.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
