import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStories, createStory, deleteStory } from '../../services/stories';
import { logout } from '../../services/auth';
import { Story } from '../../types';
import StoryCard from './StoryCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SkeletonCard = () => (
  <div className="bg-surface-700 rounded-xl border border-surface-600 overflow-hidden animate-pulse">
    <div className="h-1 bg-surface-600 w-full" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-surface-600 rounded w-3/4" />
      <div className="h-4 bg-surface-600 rounded w-full" />
      <div className="h-4 bg-surface-600 rounded w-2/3" />
      <div className="flex justify-between pt-2 border-t border-surface-600 mt-2">
        <div className="h-6 bg-surface-600 rounded-full w-20" />
        <div className="h-4 bg-surface-600 rounded w-24" />
      </div>
    </div>
  </div>
);

interface NewStoryForm {
  title: string;
  description: string;
  status: Story['status'];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewStoryForm>({
    title: '',
    description: '',
    status: 'draft',
  });

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    setLoading(true);
    try {
      const data = await getStories();
      setStories(data);
    } catch {
      // If auth fails, the interceptor redirects to /login
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function openModal() {
    setForm({ title: '', description: '', status: 'draft' });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError('');
  }

  async function handleCreateStory(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const story = await createStory({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
      });
      setStories((prev) => [story, ...prev]);
      closeModal();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create story.';
      setFormError(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStory(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Failed to delete story. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Top bar */}
      <header className="bg-surface-800 border-b border-surface-600 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-black text-text-primary tracking-tight">
            Story<span className="text-accent-green">Forge</span>
          </h1>

          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-text-muted font-body hidden sm:block">
                {user.username}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>
              Account
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-text-primary">
              My Stories
            </h2>
            <p className="text-text-muted font-body text-sm mt-1">
              {loading ? '' : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
            </p>
          </div>

          <Button variant="primary" size="md" onClick={openModal}>
            <PlusIcon />
            New Story
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && stories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
              No stories yet
            </h3>
            <p className="text-text-muted font-body text-sm mb-6 max-w-sm">
              Start writing your first story. Every great novel begins with a single idea.
            </p>
            <Button variant="primary" size="md" onClick={openModal}>
              <PlusIcon />
              Start writing
            </Button>
          </div>
        )}

        {/* Story grid */}
        {!loading && stories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={handleDelete}
                onUpdate={(updated) => setStories((prev) => prev.map((s) => s.id === updated.id ? updated : s))}
              />
            ))}
          </div>
        )}
      </main>

      {/* New Story Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-surface-800 rounded-2xl border border-surface-600 p-6 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-text-primary mb-5">
              New Story
            </h3>

            {formError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm font-body">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStory} className="space-y-4">
              <Input
                label="Title"
                type="text"
                placeholder="My epic novel..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary font-body">
                  Description{' '}
                  <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="A brief description of your story..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-body bg-surface-700 border border-surface-600 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors duration-150 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary font-body">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Story['status'] })
                  }
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-body bg-surface-700 border border-surface-600 text-text-primary focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors duration-150"
                >
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={creating}
                  className="flex-1"
                >
                  Create Story
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
