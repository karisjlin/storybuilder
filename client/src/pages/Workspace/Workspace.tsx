// Workspace — the main story editing page.
// Layout: fixed top bar + left tab nav + panel content area.
//
// Tabs:
//  - Chapters: chapter list → scene list → TipTap scene editor
//  - Characters: character profile cards + relationship map
//  - World: world-building entries with category filtering
//  - Tags: tag management + entity assignment
//
// Scene editing flow:
//  1. Select a chapter in the sidebar → scenes load below it
//  2. Select a scene → TipTap editor opens for that scene
//  3. Content changes trigger 1.5s debounced auto-save
//  4. Scenes can be reordered by dragging within the chapter
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { getStory } from '../../services/stories';
import { getChapters, createChapter, updateChapter, deleteChapter, reorderChapters } from '../../services/chapters';
import { getScenes, createScene, updateScene, deleteScene, reorderScenes } from '../../services/scenes';
import { Story, Chapter, Scene } from '../../types';
import SortableChapterItem from './SortableChapterItem';
import SortableSceneItem from './SortableSceneItem';
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
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chapters');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [addingScene, setAddingScene] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<{ content: object; wordCount: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load story + chapters on mount
  useEffect(() => {
    if (!storyId) return;
    async function load() {
      try {
        const [s, chs] = await Promise.all([getStory(storyId!), getChapters(storyId!)]);
        setStory(s);
        setChapters(chs);
        if (chs.length > 0) {
          setActiveChapter(chs[0]);
        }
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [storyId, navigate]);

  // Load scenes whenever the active chapter changes
  useEffect(() => {
    if (!activeChapter) { setScenes([]); setActiveScene(null); return; }
    getScenes(activeChapter.id).then(s => {
      setScenes(s);
      setActiveScene(s.length > 0 ? s[0] : null);
    });
  }, [activeChapter?.id]);

  // Debounced auto-save — saves scene content 1.5s after the last keystroke
  const handleContentChange = useCallback(
    (content: object, wordCount: number) => {
      if (!activeScene) return;
      pendingContentRef.current = { content, wordCount };

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!pendingContentRef.current || !activeScene) return;
        setSaving(true);
        try {
          const updated = await updateScene(activeScene.id, pendingContentRef.current);
          setActiveScene(updated);
          setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
        } finally {
          setSaving(false);
          pendingContentRef.current = null;
        }
      }, 1500);
    },
    [activeScene]
  );

  // ── Chapter handlers ────────────────────────────────────────────────────────

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

  // ── Scene handlers ──────────────────────────────────────────────────────────

  async function handleAddScene(e: React.FormEvent) {
    e.preventDefault();
    if (!newSceneTitle.trim() || !activeChapter) return;
    const scene = await createScene(activeChapter.id, newSceneTitle.trim());
    setScenes(prev => [...prev, scene]);
    setActiveScene(scene);
    setNewSceneTitle('');
    setAddingScene(false);
  }

  async function handleDeleteScene(id: string) {
    await deleteScene(id);
    setScenes(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (activeScene?.id === id) setActiveScene(updated[0] ?? null);
      return updated;
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Total word count across all scenes in the active chapter
  const chapterWordCount = scenes.reduce((sum, s) => sum + s.wordCount, 0);

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
          {saving && <span className="text-xs text-text-muted font-mono animate-pulse">Saving...</span>}
          {!saving && activeTab === 'chapters' && activeChapter && chapterWordCount > 0 && (
            <span className="text-xs text-text-muted font-mono">{chapterWordCount.toLocaleString()} words</span>
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
        {/* ── Sidebar (chapters tab only) ── */}
        {activeTab === 'chapters' && sidebarOpen && (
          <aside className="w-64 bg-surface-800 border-r border-surface-600 flex flex-col shrink-0 overflow-hidden">
            {/* Chapters header */}
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

            {/* New chapter form */}
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

            <div className="flex-1 overflow-y-auto">
              {chapters.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8 px-4 font-body">No chapters yet.</p>
              ) : (
                /* Chapters drag context */
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
                  <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {chapters.map(chapter => (
                      <div key={chapter.id}>
                        {/* Chapter row */}
                        <SortableChapterItem
                          chapter={chapter}
                          isActive={activeChapter?.id === chapter.id}
                          onSelect={() => setActiveChapter(chapter)}
                          onDelete={() => handleDeleteChapter(chapter.id)}
                          onStatusChange={status => handleChapterStatusChange(chapter, status)}
                          statusColors={STATUS_COLORS}
                          statusLabels={STATUS_LABELS}
                        />

                        {/* Scene list — shown only under the active chapter */}
                        {activeChapter?.id === chapter.id && (
                          <div className="bg-surface-800/50">
                            {/* Scenes drag context — separate from chapters to avoid nesting conflicts */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
                              <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {scenes.map(scene => (
                                  <SortableSceneItem
                                    key={scene.id}
                                    scene={scene}
                                    isActive={activeScene?.id === scene.id}
                                    onSelect={() => setActiveScene(scene)}
                                    onDelete={() => handleDeleteScene(scene.id)}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>

                            {/* Add scene form / button */}
                            {addingScene ? (
                              <form onSubmit={handleAddScene} className="pl-8 pr-3 py-2">
                                <input
                                  autoFocus
                                  value={newSceneTitle}
                                  onChange={e => setNewSceneTitle(e.target.value)}
                                  placeholder="Scene title..."
                                  className="w-full bg-surface-700 text-text-primary text-xs px-2 py-1.5 rounded border border-surface-500 focus:border-accent-green focus:outline-none font-body"
                                />
                                <div className="flex gap-1 mt-1.5">
                                  <button type="submit" className="flex-1 bg-accent-green text-white text-xs py-1 rounded font-body hover:bg-green-600 transition-colors">Add</button>
                                  <button type="button" onClick={() => { setAddingScene(false); setNewSceneTitle(''); }} className="flex-1 bg-surface-600 text-text-muted text-xs py-1 rounded font-body hover:bg-surface-500 transition-colors">Cancel</button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setAddingScene(true)}
                                className="w-full pl-8 pr-3 py-2 text-left text-xs text-surface-500 hover:text-accent-green transition-colors font-body"
                              >
                                + Add scene
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
            <>
              {activeScene ? (
                <>
                  {/* Header: chapter name (read-only label) + scene title (editable) + chapter status */}
                  <div className="px-8 py-5 border-b border-surface-700 shrink-0">
                    <p className="text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                      {activeChapter?.title}
                    </p>
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={activeScene.title}
                        onChange={e => {
                          const title = e.target.value;
                          setActiveScene(prev => prev ? { ...prev, title } : prev);
                        }}
                        onBlur={async e => {
                          const updated = await updateScene(activeScene.id, { title: e.target.value });
                          setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
                        }}
                        className="font-heading text-2xl font-bold text-text-primary bg-transparent border-none outline-none flex-1"
                      />
                      {/* Chapter status selector */}
                      {activeChapter && (
                        <select
                          value={activeChapter.status}
                          onChange={e => handleChapterStatusChange(activeChapter, e.target.value as Chapter['status'])}
                          className={`text-sm font-mono bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent-green ${STATUS_COLORS[activeChapter.status]}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* TipTap editor — keyed by scene ID so a fresh instance mounts per scene */}
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <RichTextEditor
                      key={activeScene.id}
                      content={activeScene.content}
                      onChange={handleContentChange}
                    />
                  </div>
                </>
              ) : activeChapter ? (
                /* Chapter selected but no scenes yet */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-text-muted mb-2">{activeChapter.title}</p>
                    <p className="text-text-muted font-body text-sm mb-4">No scenes yet. Add a scene in the sidebar to start writing.</p>
                    <button
                      onClick={() => setAddingScene(true)}
                      className="bg-accent-green text-white text-sm px-4 py-2 rounded-lg font-body hover:bg-green-600 transition-colors"
                    >
                      + Add First Scene
                    </button>
                  </div>
                </div>
              ) : (
                /* No chapter selected */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-text-muted mb-2">No chapter selected</p>
                    <p className="text-text-muted font-body text-sm">Add a chapter from the sidebar to get started.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'characters' && storyId && <CharactersPanel storyId={storyId} />}
          {activeTab === 'world'      && storyId && <WorldPanel storyId={storyId} />}
          {activeTab === 'tags'       && storyId && <TagsPanel storyId={storyId} />}
        </main>
      </div>
    </div>
  );
}
