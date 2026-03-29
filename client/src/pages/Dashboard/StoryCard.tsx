import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Story } from '../../types';
import { exportStoryToPdf } from '../../utils/exportPdf';
import { updateStory } from '../../services/stories';

interface StoryCardProps {
  story: Story;
  onDelete: (id: string) => void;
  onUpdate: (updated: Story) => void;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    classes: 'bg-surface-600 text-text-muted',
    accentColor: 'bg-text-muted',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-accent-green/20 text-accent-green',
    accentColor: 'bg-accent-green',
  },
  complete: {
    label: 'Complete',
    classes: 'bg-green-500/20 text-green-400',
    accentColor: 'bg-green-400',
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWordCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const GoalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function StoryCard({ story, onDelete, onUpdate }: StoryCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[story.status];
  const [exporting, setExporting] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(story.wordCountGoal?.toString() ?? '');

  const progress = story.wordCountGoal
    ? Math.min((story.totalWordCount / story.wordCountGoal) * 100, 100)
    : null;

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Delete "${story.title}"? This action cannot be undone.`)) {
      onDelete(story.id);
    }
  }

  async function handleExport(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (exporting) return;
    setExporting(true);
    try {
      const stored = localStorage.getItem('user');
      const authorName = stored ? JSON.parse(stored).username : 'Unknown Author';
      await exportStoryToPdf(story, authorName);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function openGoalEditor(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setGoalInput(story.wordCountGoal?.toString() ?? '');
    setEditingGoal(true);
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const val = parseInt(goalInput);
    const goal = isNaN(val) || val <= 0 ? null : val;
    try {
      const updated = await updateStory(story.id, { wordCountGoal: goal });
      onUpdate({ ...story, wordCountGoal: updated.wordCountGoal });
      setEditingGoal(false);
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
  }

  function handleGoalKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditingGoal(false);
  }

  return (
    <div onClick={() => navigate(`/stories/${story.id}`)} className="block group cursor-pointer">
      <div className="relative bg-surface-700 hover:bg-surface-600 rounded-xl border border-surface-600 hover:border-surface-500 transition-all duration-200 overflow-hidden h-full">
        {/* Top accent bar */}
        <div className={`h-1 w-full ${status.accentColor}`} />

        <div className="p-5 flex flex-col gap-3 h-full">
          {/* Title */}
          <h3 className="font-heading text-lg font-bold text-text-primary leading-snug group-hover:text-accent-green transition-colors duration-150 line-clamp-2">
            {story.title}
          </h3>

          {/* Description */}
          {story.description && (
            <p className="text-sm text-text-muted font-body line-clamp-2 flex-1">
              {story.description}
            </p>
          )}
          {!story.description && <div className="flex-1" />}

          {/* Word count progress */}
          {story.wordCountGoal && progress !== null ? (
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center text-xs font-mono text-text-muted">
                <span>{story.totalWordCount.toLocaleString()} words</span>
                <span>{formatWordCount(story.wordCountGoal)} goal</span>
              </div>
              <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-green rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : story.totalWordCount > 0 ? (
            <p className="text-xs font-mono text-text-muted">
              {story.totalWordCount.toLocaleString()} words
            </p>
          ) : null}

          {/* Goal editor */}
          {editingGoal && (
            <form
              onSubmit={saveGoal}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                min="1"
                placeholder="e.g. 80000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={handleGoalKeyDown}
                autoFocus
                className="flex-1 rounded-lg px-3 py-1.5 text-xs font-body bg-surface-600 border border-surface-500 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-accent-green text-white text-xs font-body hover:brightness-110"
              >
                Save
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingGoal(false); }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-600 text-text-muted text-xs font-body hover:text-text-primary"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-600">
            {/* Status badge */}
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-body ${status.classes}`}>
              {status.label}
            </span>

            <div className="flex items-center gap-1">
              {/* Date */}
              <span className="text-xs font-mono text-text-muted mr-1">
                {formatDate(story.createdAt)}
              </span>

              {/* Set goal button */}
              <button
                onClick={openGoalEditor}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-green hover:bg-accent-green/10 transition-colors duration-150"
                title={story.wordCountGoal ? 'Edit word count goal' : 'Set word count goal'}
              >
                <GoalIcon />
              </button>

              {/* Export PDF button */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-green hover:bg-accent-green/10 transition-colors duration-150 disabled:opacity-50"
                title="Export to PDF"
              >
                {exporting ? (
                  <div className="h-4 w-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExportIcon />
                )}
              </button>

              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors duration-150"
                title="Delete story"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
