// CharactersPanel — shows a grid of character cards for the story.
// Clicking a card opens an inline detail/edit view.
// The Relationships tab shows all character connections and allows adding new ones.
import { useState, useEffect } from 'react';
import {
  getCharacters, createCharacter, updateCharacter, deleteCharacter,
  getRelationships, createRelationship, deleteRelationship,
} from '../../services/characters';
import { Character, CharacterRelationship } from '../../types';

interface Props {
  storyId: string;
}

const INITIAL_FORM = { name: '', role: '', bio: '', imageUrl: '', traits: '' };

export default function CharactersPanel({ storyId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [selected, setSelected] = useState<Character | null>(null);
  const [tab, setTab] = useState<'cards' | 'relationships'>('cards');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [relForm, setRelForm] = useState({ characterAId: '', characterBId: '', type: '', description: '' });
  const [showRelForm, setShowRelForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [chars, rels] = await Promise.all([
        getCharacters(storyId),
        getRelationships(storyId),
      ]);
      setCharacters(chars);
      setRelationships(rels);
      setLoading(false);
    }
    load();
  }, [storyId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const traits = form.traits.split(',').map(t => t.trim()).filter(Boolean);
    const char = await createCharacter(storyId, {
      name: form.name,
      role: form.role || null,
      bio: form.bio || null,
      imageUrl: form.imageUrl || null,
      traits,
    });
    setCharacters(prev => [...prev, char]);
    setForm(INITIAL_FORM);
    setShowForm(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const traits = form.traits.split(',').map(t => t.trim()).filter(Boolean);
    const updated = await updateCharacter(selected.id, {
      name: form.name,
      role: form.role || null,
      bio: form.bio || null,
      imageUrl: form.imageUrl || null,
      traits,
    });
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
    setEditMode(false);
  }

  async function handleDelete(id: string) {
    await deleteCharacter(id);
    setCharacters(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function openEdit(char: Character) {
    setSelected(char);
    setForm({
      name: char.name,
      role: char.role || '',
      bio: char.bio || '',
      imageUrl: char.imageUrl || '',
      traits: char.traits.join(', '),
    });
    setEditMode(true);
  }

  async function handleCreateRelationship(e: React.FormEvent) {
    e.preventDefault();
    const rel = await createRelationship(storyId, {
      characterAId: relForm.characterAId,
      characterBId: relForm.characterBId,
      type: relForm.type,
      description: relForm.description || undefined,
    });
    setRelationships(prev => [...prev, rel]);
    setRelForm({ characterAId: '', characterBId: '', type: '', description: '' });
    setShowRelForm(false);
  }

  async function handleDeleteRelationship(id: string) {
    await deleteRelationship(id);
    setRelationships(prev => prev.filter(r => r.id !== id));
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tabs: Cards / Relationships */}
      <div className="px-6 pt-5 pb-0 border-b border-surface-700 flex items-center gap-6">
        {(['cards', 'relationships'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-body capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-accent-orange text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t === 'cards' ? 'Characters' : 'Relationships'}
          </button>
        ))}
        <div className="ml-auto pb-3">
          {tab === 'cards' ? (
            <button
              onClick={() => { setShowForm(true); setForm(INITIAL_FORM); }}
              className="text-sm bg-accent-orange text-white px-3 py-1 rounded-lg font-body hover:bg-orange-500 transition-colors"
            >
              + Add Character
            </button>
          ) : (
            <button
              onClick={() => setShowRelForm(true)}
              className="text-sm bg-accent-orange text-white px-3 py-1 rounded-lg font-body hover:bg-orange-500 transition-colors"
            >
              + Add Relationship
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'cards' ? (
          <>
            {/* Create / Edit Form */}
            {(showForm || editMode) && (
              <form
                onSubmit={editMode ? handleUpdate : handleCreate}
                className="mb-6 bg-surface-700 rounded-xl p-5 border border-surface-600"
              >
                <h3 className="font-heading font-bold text-text-primary mb-4">
                  {editMode ? 'Edit Character' : 'New Character'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-text-muted font-mono mb-1">Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-text-muted font-mono mb-1">Role</label>
                    <input
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      placeholder="e.g. Protagonist, Villain"
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-text-muted font-mono mb-1">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body resize-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-text-muted font-mono mb-1">Image URL</label>
                    <input
                      value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-text-muted font-mono mb-1">Traits (comma-separated)</label>
                    <input
                      value={form.traits}
                      onChange={e => setForm(f => ({ ...f, traits: e.target.value }))}
                      placeholder="brave, stubborn, witty"
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="bg-accent-orange text-white text-sm px-4 py-2 rounded-lg font-body hover:bg-orange-500 transition-colors">
                    {editMode ? 'Save Changes' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditMode(false); setSelected(null); }}
                    className="bg-surface-600 text-text-muted text-sm px-4 py-2 rounded-lg font-body hover:bg-surface-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Character Cards Grid */}
            {characters.length === 0 && !showForm ? (
              <div className="text-center py-16">
                <p className="font-heading text-xl font-bold text-text-muted mb-1">No characters yet</p>
                <p className="text-text-muted text-sm font-body">Add your first character to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map(char => (
                  <div
                    key={char.id}
                    className="bg-surface-700 rounded-xl border border-surface-600 overflow-hidden hover:border-surface-500 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="h-32 bg-surface-800 flex items-center justify-center overflow-hidden">
                      {char.imageUrl ? (
                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl text-surface-600 font-heading font-bold select-none">
                          {char.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-heading font-bold text-text-primary">{char.name}</h3>
                          {char.role && (
                            <p className="text-xs text-accent-orange font-mono mt-0.5">{char.role}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(char)}
                            className="text-text-muted hover:text-text-primary text-xs px-2 py-1 rounded bg-surface-600 hover:bg-surface-500 transition-colors font-body"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(char.id)}
                            className="text-text-muted hover:text-accent-red text-xs px-2 py-1 rounded bg-surface-600 hover:bg-surface-500 transition-colors font-body"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {char.bio && (
                        <p className="text-sm text-text-muted font-body mt-2 line-clamp-2">{char.bio}</p>
                      )}

                      {char.traits.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {char.traits.map(trait => (
                            <span
                              key={trait}
                              className="text-xs bg-surface-800 text-text-muted px-2 py-0.5 rounded-full font-mono border border-surface-600"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Relationships Tab ── */
          <>
            {showRelForm && (
              <form
                onSubmit={handleCreateRelationship}
                className="mb-6 bg-surface-700 rounded-xl p-5 border border-surface-600"
              >
                <h3 className="font-heading font-bold text-text-primary mb-4">New Relationship</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted font-mono mb-1">Character A *</label>
                    <select
                      required
                      value={relForm.characterAId}
                      onChange={e => setRelForm(f => ({ ...f, characterAId: e.target.value }))}
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    >
                      <option value="">Select character...</option>
                      {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted font-mono mb-1">Character B *</label>
                    <select
                      required
                      value={relForm.characterBId}
                      onChange={e => setRelForm(f => ({ ...f, characterBId: e.target.value }))}
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    >
                      <option value="">Select character...</option>
                      {characters.filter(c => c.id !== relForm.characterAId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted font-mono mb-1">Relationship Type *</label>
                    <input
                      required
                      value={relForm.type}
                      onChange={e => setRelForm(f => ({ ...f, type: e.target.value }))}
                      placeholder="rivals, siblings, mentor/student..."
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted font-mono mb-1">Description</label>
                    <input
                      value={relForm.description}
                      onChange={e => setRelForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Optional note..."
                      className="w-full bg-surface-800 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="bg-accent-orange text-white text-sm px-4 py-2 rounded-lg font-body hover:bg-orange-500 transition-colors">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowRelForm(false)} className="bg-surface-600 text-text-muted text-sm px-4 py-2 rounded-lg font-body hover:bg-surface-500 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {relationships.length === 0 && !showRelForm ? (
              <div className="text-center py-16">
                <p className="font-heading text-xl font-bold text-text-muted mb-1">No relationships yet</p>
                <p className="text-text-muted text-sm font-body">Map out connections between your characters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relationships.map(rel => (
                  <div
                    key={rel.id}
                    className="bg-surface-700 rounded-xl border border-surface-600 p-4 flex items-center gap-4 group"
                  >
                    {/* Character A */}
                    <div className="text-center w-24 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-1 text-text-muted font-heading font-bold text-lg border border-surface-600">
                        {rel.characterA?.name.charAt(0) ?? '?'}
                      </div>
                      <p className="text-xs font-body text-text-primary truncate">{rel.characterA?.name}</p>
                    </div>

                    {/* Relationship type */}
                    <div className="flex-1 text-center">
                      <span className="text-sm font-mono text-accent-orange bg-surface-800 px-3 py-1 rounded-full border border-surface-600">
                        {rel.type}
                      </span>
                      {rel.description && (
                        <p className="text-xs text-text-muted font-body mt-1">{rel.description}</p>
                      )}
                    </div>

                    {/* Character B */}
                    <div className="text-center w-24 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-1 text-text-muted font-heading font-bold text-lg border border-surface-600">
                        {rel.characterB?.name.charAt(0) ?? '?'}
                      </div>
                      <p className="text-xs font-body text-text-primary truncate">{rel.characterB?.name}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteRelationship(rel.id)}
                      className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
