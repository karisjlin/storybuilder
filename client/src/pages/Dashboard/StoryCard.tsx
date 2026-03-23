import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../../types';
import { exportStoryToPdf } from '../../utils/exportPdf';

interface StoryCardProps {
  story: Story;
  onDelete: (id: string) => void;
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

export default function StoryCard({ story, onDelete }: StoryCardProps) {
  const status = statusConfig[story.status];
  const [exporting, setExporting] = useState(false);

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

  return (
    <Link to={`/stories/${story.id}`} className="block group">
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
    </Link>
  );
}
