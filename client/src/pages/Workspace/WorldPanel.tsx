// WorldPanel — CRUD for world-building entries with category filtering.
// Categories: location, lore, item, faction, event, condition, other.
import { useState, useEffect } from 'react';
import { getWorldEntries, createWorldEntry, updateWorldEntry, deleteWorldEntry } from '../../services/world';
import { WorldEntry, WorldCategory } from '../../types';

interface Props {
  storyId: string;
}

const CATEGORIES: { value: WorldCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all',       label: 'All',       icon: '◈' },
  { value: 'location',  label: 'Locations',  icon: '⌖' },
  { value: 'lore',      label: 'Lore',       icon: '✦' },
  { value: 'item',      label: 'Items',      icon: '◆' },
  { value: 'faction',   label: 'Factions',   icon: '⬡' },
  { value: 'event',     label: 'Events',     icon: '◉' },
  { value: 'condition', label: 'Conditions', icon: '◎' },
  { value: 'other',     label: 'Other',      icon: '○' },
];

const CATEGORY_COLORS: Record<WorldCategory, string> = {
  location:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  lore:      'text-purple-400 bg-purple-400/10 border-purple-400/30',
  item:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  faction:   'text-green-400 bg-green-400/10 border-green-400/30',
  event:     'text-pink-400 bg-pink-400/10 border-pink-400/30',
  condition: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  other:     'text-surface-400 bg-surface-400/10 border-surface-400/30',
};

const INITIAL_FORM = { name: '', category: 'location' as WorldCategory, description: '' };

export default function WorldPanel({ storyId }: Props) {
  const [entries, setEntries] = useState<WorldEntry[]>([]);
  const [filter, setFilter] = useState<WorldCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WorldEntry | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorldEntries(storyId).then(data => {
      setEntries(data);
      setLoading(false);
    });
  }, [storyId]);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.category === filter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const updated = await updateWorldEntry(editing.id, {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
      });
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEditing(null);
    } else {
      const entry = await createWorldEntry(storyId, {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
      });
      setEntries(prev => [...prev, entry]);
    }
    setForm(INITIAL_FORM);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await deleteWorldEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function openEdit(entry: WorldEntry) {
    setEditing(entry);
    setForm({ name: entry.name, category: entry.category, description: entry.description || '' });
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-surface-700 flex items-center justify-between">
        <h2 className="font-heading font-bold text-text-primary text-lg">World Building</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(INITIAL_FORM); }}
          className="text-sm bg-accent-green text-white px-3 py-1.5 rounded-lg font-body hover:bg-green-600 transition-colors"
        >
          + Add Entry
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-surface-700 shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-colors border ${
              filter === cat.value
                ? 'bg-accent-green text-white border-accent-green'
                : 'bg-surface-700 text-text-muted border-surface-600 hover:border-surface-400'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
            {cat.value !== 'all' && (
              <span className="opacity-60">
                ({entries.filter(e => e.category === cat.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Create / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-surface-700 rounded-xl p-5 border border-surface-600">
            <h3 className="font-heading font-bold text-text-primary mb-4">
              {editing ? 'Edit Entry' : 'New World Entry'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-text-muted font-mono mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-green focus:outline-none font-body"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-text-muted font-mono mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as WorldCategory }))}
                  className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-green focus:outline-none font-body"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-text-muted font-mono mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-green focus:outline-none font-body resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-accent-green text-white text-sm px-4 py-2 rounded-lg font-body hover:bg-green-600 transition-colors">
                {editing ? 'Save Changes' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="bg-surface-600 text-text-muted text-sm px-4 py-2 rounded-lg font-body hover:bg-surface-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Entries List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-heading text-xl font-bold text-text-muted mb-1">
              {filter === 'all' ? 'No world entries yet' : `No ${filter} entries`}
            </p>
            <p className="text-text-muted text-sm font-body">Add world-building notes to flesh out your story's universe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(entry => (
              <div
                key={entry.id}
                className="bg-surface-700 rounded-xl border border-surface-600 p-4 hover:border-surface-500 transition-colors group flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-text-primary truncate">{entry.name}</h3>
                    <span className={`inline-block text-xs font-mono mt-1 px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[entry.category]}`}>
                      {entry.category}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEdit(entry)}
                      className="text-text-muted hover:text-text-primary text-xs px-2 py-1 rounded bg-surface-600 hover:bg-surface-500 transition-colors font-body"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-text-muted hover:text-accent-red text-xs px-2 py-1 rounded bg-surface-600 hover:bg-surface-500 transition-colors font-body"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {entry.description && (
                  <p className="text-sm text-text-muted font-body line-clamp-3 flex-1">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
