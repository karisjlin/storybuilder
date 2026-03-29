// Workspace — the main story editing page.
// Layout: top bar + tab nav + left sidebar (chapters) + main content area.
//
// Chapters tab:
//  - Sidebar: draggable chapter list
//  - Main area: scenes for the active chapter displayed as sticky note cards
//  - Cards can be dragged to reorder; each saves independently on content change
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { getStory } from '../../services/stories';
import { getChapters, createChapter, updateChapter, deleteChapter, reorderChapters } from '../../services/chapters';
import { getScenes, createScene, updateScene, deleteScene, reorderScenes } from '../../services/scenes';
import { getCharacters } from '../../services/characters';
import { getWorldEntries } from '../../services/world';
import { Story, Chapter, Scene, Character, WorldEntry } from '../../types';
import SortableChapterItem from './SortableChapterItem';
import SceneCard from './SceneCard';
import RichTextEditor from '../../components/editor/RichTextEditor';
import CharactersPanel from './CharactersPanel';
import WorldPanel from './WorldPanel';
import TagsPanel from './TagsPanel';

type WorkspaceTab = 'chapters' | 'characters' | 'world' | 'tags';

const STATUS_LABELS = { todo: 'To Do', active: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'text-text-muted', active: 'text-accent-green', done: 'text-green-400' };

const TABS: { id: WorkspaceTab; label: string; icon: string }[] = [
  { id: 'chapters',   label: 'Chapters',   icon: '✍' },
  { id: 'characters', label: 'Characters', icon: '👤' },
  { id: 'world',      label: 'World',      icon: '🌍' },
  { id: 'tags',       label: 'Tags',       icon: '🏷' },
];

export default function Workspace() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [allWorldEntries, setAllWorldEntries] = useState<WorldEntry[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chapters');
  const [loading, setLoading] = useState(true);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [addingScene, setAddingScene] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draftMode, setDraftMode] = useState<'rough' | 'final'>('rough');
  const [finalSaving, setFinalSaving] = useState(false);

  const finalSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFinalRef = useRef<{ chapterId: string; content: object; wordCount: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load story + chapters on mount
  useEffect(() => {
    if (!storyId) return;
    async function load() {
      try {
        const [s, chs, chars, world] = await Promise.all([
          getStory(storyId!),
          getChapters(storyId!),
          getCharacters(storyId!),
          getWorldEntries(storyId!),
        ]);
        setStory(s);
        setChapters(chs);
        setAllCharacters(chars);
        setAllWorldEntries(world);
        if (chs.length > 0) setActiveChapter(chs[0]);
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [storyId, navigate]);

  // Load scenes when the active chapter changes
  useEffect(() => {
    if (!activeChapter) { setScenes([]); return; }
    getScenes(activeChapter.id).then(setScenes);
  }, [activeChapter?.id]);

  // ── Chapter handlers ──────────────────────────────────────────────────────

  async function handleAddChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!newChapterTitle.trim() || !storyId) return;
    const chapter = await createChapter(storyId, newChapterTitle.trim());
    setChapters(prev => [...prev, chapter]);
    setActiveChapter(chapter);
    setNewChapterTitle('');
    setAddingChapter(false);
  }

  async function handleDeleteChapter(id: string) {
    await deleteChapter(id);
    setChapters(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeChapter?.id === id) setActiveChapter(updated[0] ?? null);
      return updated;
    });
  }

  async function handleChapterStatusChange(chapter: Chapter, status: Chapter['status']) {
    const updated = await updateChapter(chapter.id, { status });
    setChapters(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (activeChapter?.id === updated.id) setActiveChapter(updated);
  }

  async function handleChapterDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !storyId) return;
    const oldIndex = chapters.findIndex(c => c.id === active.id);
    const newIndex = chapters.findIndex(c => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));
    setChapters(reordered);
    await reorderChapters(storyId, reordered.map(c => ({ id: c.id, order: c.order })));
  }

  // ── Scene handlers ────────────────────────────────────────────────────────

  async function handleAddScene(e: React.FormEvent) {
    e.preventDefault();
    if (!newSceneTitle.trim() || !activeChapter) return;
    const scene = await createScene(activeChapter.id, newSceneTitle.trim());
    setScenes(prev => [...prev, scene]);
    setNewSceneTitle('');
    setAddingScene(false);
  }

  async function handleDeleteScene(id: string) {
    await deleteScene(id);
    setScenes(prev => prev.filter(s => s.id !== id));
  }

  // Called by SceneCard after the card's own 1s debounce fires
  async function handleSceneContentChange(sceneId: string, content: string, wordCount: number) {
    const updated = await updateScene(sceneId, { content, wordCount });
    setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  async function handleSceneTitleChange(sceneId: string, title: string) {
    const updated = await updateScene(sceneId, { title });
    setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  async function handleSceneDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeChapter) return;
    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);
    const reordered = arrayMove(scenes, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    setScenes(reordered);
    await reorderScenes(activeChapter.id, reordered.map(s => ({ id: s.id, order: s.order })));
  }

  // Debounced auto-save for the final draft TipTap editor.
  // Chapter ID is stored in the ref so the timeout always saves to the correct chapter,
  // even if the user switches chapters before the 1.5s debounce fires.
  const handleFinalContentChange = useCallback((content: object, wordCount: number) => {
    if (!activeChapter) return;
    pendingFinalRef.current = { chapterId: activeChapter.id, content, wordCount };
    if (finalSaveTimer.current) clearTimeout(finalSaveTimer.current);
    finalSaveTimer.current = setTimeout(async () => {
      const pending = pendingFinalRef.current;
      if (!pending) return;
      setFinalSaving(true);
      try {
        const updated = await updateChapter(pending.chapterId, {
          finalContent: pending.content,
          finalWordCount: pending.wordCount,
        });
        setActiveChapter(prev => prev?.id === updated.id ? updated : prev);
        setChapters(prev => prev.map(c => c.id === updated.id ? updated : c));
      } finally {
        setFinalSaving(false);
        pendingFinalRef.current = null;
      }
    }, 1500);
  }, [activeChapter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* ── Top Bar ── */}
      <header className="h-14 bg-surface-800 border-b border-surface-600 flex items-center px-4 gap-4 shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-text-muted hover:text-text-primary transition-colors text-sm font-body"
        >
          ← Dashboard
        </button>
        <div className="w-px h-5 bg-surface-600" />
        <h1 className="font-heading font-bold text-text-primary truncate">{story?.title}</h1>

        {/* Tab nav */}
        <div className="hidden sm:flex items-center gap-1 ml-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface-700 text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/account')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm font-body"
          >
            Account
          </button>
          {activeTab === 'chapters' && finalSaving && (
            <span className="text-xs text-text-muted font-mono animate-pulse">Saving...</span>
          )}
          {activeTab === 'chapters' && !finalSaving && draftMode === 'rough' && totalWords > 0 && (
            <span className="text-xs text-text-muted font-mono">{totalWords.toLocaleString()} words</span>
          )}
          {activeTab === 'chapters' && !finalSaving && draftMode === 'final' && activeChapter && activeChapter.finalWordCount > 0 && (
            <span className="text-xs text-text-muted font-mono">{activeChapter.finalWordCount.toLocaleString()} words</span>
          )}
          {activeTab === 'chapters' && (
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="text-text-muted hover:text-text-primary transition-colors text-sm"
            >
              {sidebarOpen ? '← Hide' : '→ Chapters'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (chapters only) ── */}
        {activeTab === 'chapters' && sidebarOpen && (
          <aside className="w-64 bg-surface-800 border-r border-surface-600 flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-surface-600 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Chapters</span>
              <button
                onClick={() => setAddingChapter(true)}
                className="text-accent-green hover:text-green-400 text-xl leading-none transition-colors"
                title="Add chapter"
              >
                +
              </button>
            </div>

            {addingChapter && (
              <form onSubmit={handleAddChapter} className="p-3 border-b border-surface-600 shrink-0">
                <input
                  autoFocus
                  value={newChapterTitle}
                  onChange={e => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter title..."
                  className="w-full bg-surface-700 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-green focus:outline-none font-body"
                />
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="flex-1 bg-accent-green text-white text-xs py-1.5 rounded-lg font-body hover:bg-green-600 transition-colors">Add</button>
                  <button type="button" onClick={() => { setAddingChapter(false); setNewChapterTitle(''); }} className="flex-1 bg-surface-600 text-text-muted text-xs py-1.5 rounded-lg font-body hover:bg-surface-500 transition-colors">Cancel</button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto py-2">
              {chapters.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8 px-4 font-body">No chapters yet.</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
                  <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {chapters.map(chapter => (
                      <SortableChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        isActive={activeChapter?.id === chapter.id}
                        onSelect={() => setActiveChapter(chapter)}
                        onDelete={() => handleDeleteChapter(chapter.id)}
                        onStatusChange={status => handleChapterStatusChange(chapter, status)}
                        statusColors={STATUS_COLORS}
                        statusLabels={STATUS_LABELS}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </aside>
        )}

        {/* ── Main Content Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chapters' && (
            activeChapter ? (
              <>
                {/* Chapter header */}
                <div className="px-8 pt-5 pb-4 border-b border-surface-700 shrink-0">
                  {/* Top row: title + controls */}
                  <div className="flex items-center gap-4 mb-3">
                    <h2 className="font-heading text-xl font-bold text-text-primary flex-1">
                      {activeChapter.title}
                    </h2>

                    {/* Rough / Final draft toggle */}
                    <div className="flex items-center bg-surface-700 rounded-lg p-0.5 text-xs font-mono">
                      <button
                        onClick={() => setDraftMode('rough')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${draftMode === 'rough' ? 'bg-surface-600 text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                      >
                        Rough Draft
                      </button>
                      <button
                        onClick={() => setDraftMode('final')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${draftMode === 'final' ? 'bg-surface-600 text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                      >
                        Final Draft
                      </button>
                    </div>

                    <select
                      value={activeChapter.status}
                      onChange={e => handleChapterStatusChange(activeChapter, e.target.value as Chapter['status'])}
                      className={`text-sm font-mono bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent-green ${STATUS_COLORS[activeChapter.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>

                    {draftMode === 'rough' && (
                      <button
                        onClick={() => setAddingScene(true)}
                        className="bg-accent-green text-white text-sm px-4 py-1.5 rounded-lg font-body hover:bg-green-600 transition-colors"
                      >
                        + Add Scene
                      </button>
                    )}
                  </div>

                  {/* Chapter summary — editable, saved on blur */}
                  <textarea
                    key={activeChapter.id}
                    defaultValue={activeChapter.summary ?? ''}
                    onBlur={async e => {
                      const summary = e.target.value.trim() || null;
                      const updated = await updateChapter(activeChapter.id, { summary });
                      setActiveChapter(updated);
                      setChapters(prev => prev.map(c => c.id === updated.id ? updated : c));
                    }}
                    placeholder="Chapter summary — what happens in this chapter?"
                    rows={2}
                    className="w-full bg-transparent text-sm font-body text-text-muted placeholder:text-surface-500 resize-none outline-none leading-relaxed"
                  />
                </div>

                {/* Inline add scene form — rough draft only */}
                {draftMode === 'rough' && addingScene && (
                  <form onSubmit={handleAddScene} className="px-8 py-3 border-b border-surface-700 flex items-center gap-3 shrink-0 bg-surface-800/50">
                    <input
                      autoFocus
                      value={newSceneTitle}
                      onChange={e => setNewSceneTitle(e.target.value)}
                      placeholder="Scene title..."
                      className="bg-surface-700 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-green focus:outline-none font-body w-64"
                    />
                    <button type="submit" className="bg-accent-green text-white text-sm px-4 py-2 rounded-lg font-body hover:bg-green-600 transition-colors">Add</button>
                    <button type="button" onClick={() => { setAddingScene(false); setNewSceneTitle(''); }} className="bg-surface-600 text-text-muted text-sm px-4 py-2 rounded-lg font-body hover:bg-surface-500 transition-colors">Cancel</button>
                  </form>
                )}

                {/* ── Rough Draft: sticky note grid ── */}
                {draftMode === 'rough' && (
                  <div className="flex-1 overflow-y-auto p-8">
                    {scenes.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="font-heading text-xl font-bold text-text-muted mb-2">No scenes yet</p>
                          <p className="text-text-muted font-body text-sm mb-4">Add a scene to start writing.</p>
                          <button
                            onClick={() => setAddingScene(true)}
                            className="bg-accent-green text-white text-sm px-4 py-2 rounded-lg font-body hover:bg-green-600 transition-colors"
                          >
                            + Add First Scene
                          </button>
                        </div>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
                        <SortableContext items={scenes.map(s => s.id)} strategy={rectSortingStrategy}>
                          <div className="flex flex-wrap gap-5">
                            {scenes.map(scene => (
                              <SceneCard
                                key={scene.id}
                                scene={scene}
                                allCharacters={allCharacters}
                                allWorldEntries={allWorldEntries}
                                onUpdate={updated => setScenes(prev => prev.map(s => s.id === updated.id ? updated : s))}
                                onDelete={() => handleDeleteScene(scene.id)}
                                onTitleChange={title => handleSceneTitleChange(scene.id, title)}
                                onContentChange={(content, wordCount) => handleSceneContentChange(scene.id, content, wordCount)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                )}

                {/* ── Final Draft: full TipTap editor ── */}
                {draftMode === 'final' && (
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <RichTextEditor
                      key={activeChapter.id}
                      content={activeChapter.finalContent}
                      onChange={handleFinalContentChange}
                      placeholder="Start your chapter..."
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-text-muted mb-2">No chapter selected</p>
                  <p className="text-text-muted font-body text-sm">Add a chapter from the sidebar to get started.</p>
                </div>
              </div>
            )
          )}

          {activeTab === 'characters' && storyId && <CharactersPanel storyId={storyId} />}
          {activeTab === 'world'      && storyId && <WorldPanel storyId={storyId} />}
          {activeTab === 'tags'       && storyId && <TagsPanel storyId={storyId} />}
        </main>
      </div>
    </div>
  );
}
