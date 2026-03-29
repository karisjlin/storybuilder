// exportPdf — generates a formatted PDF for a story's chapters.
// Content source priority per chapter:
//   1. finalContent (TipTap JSONB → plain text) if the author has written a final draft
//   2. Scene content (plain text sticky notes) concatenated in order
//   3. "[No content yet]" placeholder if neither exists
import jsPDF from 'jspdf';
import { getChapters } from '../services/chapters';
import { getScenes } from '../services/scenes';
import { Story } from '../types';

// Recursively extract plain text from a TipTap JSON document node.
// Adds newlines between paragraphs and headings for readability.
function tiptapToText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (!node.content) return '';

  const inner = node.content.map(tiptapToText).join('');

  switch (node.type) {
    case 'paragraph':   return inner + '\n\n';
    case 'heading':     return inner + '\n\n';
    case 'listItem':    return '• ' + inner.trimEnd() + '\n';
    case 'blockquote':  return inner;
    case 'codeBlock':   return inner + '\n\n';
    default:            return inner;
  }
}

export async function exportStoryToPdf(story: Story, authorName: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 22;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  let y = MARGIN;

  // ── Helper: add a new page and reset y ──────────────────────────────────────
  function addPage() {
    doc.addPage();
    y = MARGIN;
  }

  // ── Helper: write wrapped text, adding pages as needed ─────────────────────
  function writeText(text: string, fontSize: number, style: 'normal' | 'bold' = 'normal', color = '#e0e0e0') {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(color);

    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    const lineHeight = fontSize * 0.4; // approx mm per pt

    for (const line of lines) {
      if (y + lineHeight > PAGE_H - MARGIN) addPage();
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
  }

  // ── Helper: add vertical space, page-safe ──────────────────────────────────
  function space(mm: number) {
    if (y + mm > PAGE_H - MARGIN) addPage();
    else y += mm;
  }

  // ── Set dark background on every page ──────────────────────────────────────
  // jsPDF doesn't natively support dark backgrounds per page elegantly,
  // so we use a light-on-white style (standard for print PDFs).

  // ── Cover / Title section ───────────────────────────────────────────────────
  doc.setFillColor('#111111');

  // Story title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#111111');
  const titleLines = doc.splitTextToSize(story.title, CONTENT_W) as string[];
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 12;
  }

  // Author
  space(4);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#555555');
  doc.text(`by ${authorName}`, MARGIN, y);
  y += 6;

  // Description
  if (story.description) {
    space(6);
    doc.setFontSize(10);
    doc.setTextColor('#777777');
    const descLines = doc.splitTextToSize(story.description, CONTENT_W) as string[];
    for (const line of descLines) {
      doc.text(line, MARGIN, y);
      y += 5;
    }
  }

  // Divider line
  space(8);
  doc.setDrawColor('#cccccc');
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 2;

  // ── Chapters ────────────────────────────────────────────────────────────────
  const chapters = await getChapters(story.id);

  // Fetch scenes for all chapters that need them in parallel
  const chaptersNeedingScenes = chapters.filter(ch => !ch.finalContent);
  const scenesPerChapter = await Promise.all(
    chaptersNeedingScenes.map(ch => getScenes(ch.id))
  );
  const sceneMap = new Map(
    chaptersNeedingScenes.map((ch, i) => [ch.id, scenesPerChapter[i]])
  );

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];

    // Each chapter starts on a new page (except if we're right after the cover)
    if (i > 0 || y > MARGIN + 60) addPage();

    // Chapter number label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#999999');
    doc.text(`Chapter ${i + 1}`, MARGIN, y);
    y += 5;

    // Chapter title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#111111');
    const chTitleLines = doc.splitTextToSize(chapter.title, CONTENT_W) as string[];
    for (const line of chTitleLines) {
      doc.text(line, MARGIN, y);
      y += 9;
    }

    space(6);

    // ── Resolve content ──────────────────────────────────────────────────────

    let bodyText = '';

    if (chapter.finalContent) {
      // Preferred: use the polished final draft
      bodyText = tiptapToText(chapter.finalContent).trim();
    } else {
      // Fallback: concatenate rough draft scenes in order
      const scenes = sceneMap.get(chapter.id) ?? [];
      if (scenes.length > 0) {
        bodyText = scenes
          .map(s => {
            const title = s.title ? `— ${s.title} —\n\n` : '';
            const content = (s.content ?? '').trim();
            return title + content;
          })
          .filter(s => s.trim())
          .join('\n\n');
      }
    }

    if (!bodyText) bodyText = '[No content yet]';

    // Write body paragraphs
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#222222');

    // Split on double newlines to preserve paragraph spacing
    const paragraphs = bodyText.split(/\n{2,}/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      writeText(trimmed, 11, 'normal', '#222222');
      space(4);
    }
  }

  // ── Page numbers ─────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#aaaaaa');
    doc.text(`${p} / ${totalPages}`, PAGE_W / 2, PAGE_H - 10, { align: 'center' });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const filename = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
  doc.save(filename);
}
