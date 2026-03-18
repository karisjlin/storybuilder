// Workspace — the main story editing page.
// Layout: fixed top bar + collapsible sidebar (chapter list) + editor area.
//
// Key behaviours:
//  - Loads the story and its chapters on mount; redirects to dashboard on error.
//  - Selecting a chapter in the sidebar opens it in the TipTap editor.
//  - Content changes trigger a 1.5s debounced auto-save to the server.
//  - Chapter order can be changed by dragging rows in the sidebar (dnd-kit).
//  - Chapter title is edited inline in the editor header and saved on blur.
//  - Chapter status can be changed from both the sidebar and the editor header.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { getStory } from '../../services/stories';
import {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} from '../../services/chapters';
import { Story, Chapter } from '../../types';
import SortableChapterItem from './SortableChapterItem';
import RichTextEditor from '../../components/editor/RichTextEditor';

// Maps status values to display labels and Tailwind colour classes
const STATUS_LABELS = { todo: 'To Do', active: 'In Progress', done: 'Done' };
const STATUS_COLORS = {
  todo: 'text-text-muted',
  active: 'text-accent-orange',
  done: 'text-green-400',
};

export default function Workspace() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Refs used by the debounced auto-save so closures always see the latest values
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<{ content: object; wordCount: number } | null>(null);

  // dnd-kit sensors: mouse/touch pointer + keyboard accessibility
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load story metadata and chapter list on mount
  useEffect(() => {
    if (!storyId) return;
    async function load() {
      try {
        const [s, chs] = await Promise.all([getStory(storyId!), getChapters(storyId!)]);
        setStory(s);
        setChapters(chs);
        // Auto-select the first chapter so the editor isn't empty
        if (chs.length > 0) setActiveChapter(chs[0]);
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [storyId, navigate]);

  // Auto-save handler — debounced 1.5s so we don't hammer the API on every keystroke.
  // Stores the latest content in a ref so the timeout always saves the most recent version.
  const handleContentChange = useCallback(
    (content: object, wordCount: number) => {
      if (!activeChapter) return;
      pendingContentRef.current = { content, wordCount };

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!pendingContentRef.current || !activeChapter) return;
        setSaving(true);
        try {
          const updated = await updateChapter(activeChapter.id, pendingContentRef.current);
          setActiveChapter(updated);
          // Keep the sidebar word count in sync
          setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        } finally {
          setSaving(false);
          pendingContentRef.current = null;
        }
      }, 1500);
    },
    [activeChapter]
  );

  // Add a new chapter and immediately open it in the editor
  async function handleAddChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!newChapterTitle.trim() || !storyId) return;
    const chapter = await createChapter(storyId, newChapterTitle.trim());
    setChapters((prev) => [...prev, chapter]);
    setActiveChapter(chapter);
    setNewChapterTitle('');
    setAddingChapter(false);
  }

  // Delete a chapter and fall back to the first remaining chapter (or null if none left)
  async function handleDeleteChapter(id: string) {
    await deleteChapter(id);
    setChapters((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeChapter?.id === id) {
        setActiveChapter(updated[0] ?? null);
      }
      return updated;
    });
  }

  async function handleStatusChange(chapter: Chapter, status: Chapter['status']) {
    const updated = await updateChapter(chapter.id, { status });
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (activeChapter?.id === updated.id) setActiveChapter(updated);
  }

  // Called by dnd-kit after a drag ends — reorders the local array optimistically
  // then persists the new order to the server.
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !storyId) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);

    // Reassign order values to match the new visual positions
    const reordered = arrayMove(chapters, oldIndex, newIndex).map((c, i) => ({
      ...c,
      order: i,
    }));

    setChapters(reordered);
    await reorderChapters(storyId, reordered.map((c) => ({ id: c.id, order: c.order })));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
        <h1 className="font-heading font-bold text-text-primary truncate">
          {story?.title}
        </h1>
        <div className="ml-auto flex items-center gap-3">
          {/* Auto-save indicator */}
          {saving && (
            <span className="text-xs text-text-muted font-mono animate-pulse">Saving...</span>
          )}
          {/* Live word count for the active chapter */}
          {!saving && activeChapter && (
            <span className="text-xs text-text-muted font-mono">
              {activeChapter.wordCount.toLocaleString()} words
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            {sidebarOpen ? '← Hide' : '→ Chapters'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside className="w-64 bg-surface-800 border-r border-surface-600 flex flex-col shrink-0">
            <div className="p-4 border-b border-surface-600 flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                Chapters
              </span>
              <button
                onClick={() => setAddingChapter(true)}
                className="text-accent-orange hover:text-orange-400 text-xl leading-none transition-colors"
                title="Add chapter"
              >
                +
              </button>
            </div>

            {/* Inline new-chapter form */}
            {addingChapter && (
              <form onSubmit={handleAddChapter} className="p-3 border-b border-surface-600">
                <input
                  autoFocus
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter title..."
                  className="w-full bg-surface-700 text-text-primary text-sm px-3 py-2 rounded-lg border border-surface-500 focus:border-accent-orange focus:outline-none font-body"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-accent-orange text-white text-xs py-1.5 rounded-lg font-body hover:bg-orange-500 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingChapter(false); setNewChapterTitle(''); }}
                    className="flex-1 bg-surface-600 text-text-muted text-xs py-1.5 rounded-lg font-body hover:bg-surface-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Draggable chapter list */}
            <div className="flex-1 overflow-y-auto py-2">
              {chapters.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8 px-4 font-body">
                  No chapters yet. Add one above.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={chapters.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {chapters.map((chapter) => (
                      <SortableChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        isActive={activeChapter?.id === chapter.id}
                        onSelect={() => setActiveChapter(chapter)}
                        onDelete={() => handleDeleteChapter(chapter.id)}
                        onStatusChange={(status) => handleStatusChange(chapter, status)}
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

        {/* ── Editor Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeChapter ? (
            <>
              {/* Chapter title (inline editable) + status selector */}
              <div className="px-8 py-5 border-b border-surface-700 flex items-center gap-4 shrink-0">
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    // Optimistic local update while typing
                    setActiveChapter((prev) => prev ? { ...prev, title } : prev);
                  }}
                  onBlur={async (e) => {
                    // Persist the title change when the input loses focus
                    const updated = await updateChapter(activeChapter.id, { title: e.target.value });
                    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                  }}
                  className="font-heading text-2xl font-bold text-text-primary bg-transparent border-none outline-none flex-1"
                />
                <select
                  value={activeChapter.status}
                  onChange={(e) => handleStatusChange(activeChapter, e.target.value as Chapter['status'])}
                  className={`text-sm font-mono bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent-orange ${STATUS_COLORS[activeChapter.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* TipTap editor — keyed by chapter ID so a fresh instance mounts per chapter */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <RichTextEditor
                  key={activeChapter.id}
                  content={activeChapter.content}
                  onChange={handleContentChange}
                />
              </div>
            </>
          ) : (
            // Empty state when no chapters exist yet
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="font-heading text-2xl font-bold text-text-muted mb-2">No chapter selected</p>
                <p className="text-text-muted font-body text-sm">Add a chapter from the sidebar to get started.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
