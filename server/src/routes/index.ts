// Root router — combines all sub-routers and mounts them under /api
import { Router } from 'express';
import authRouter from './auth';
import storiesRouter from './stories';
import chapterStoryRouter from './chapters';
import { Router as ExpressRouter, Request, Response } from 'express';
import { Chapter } from '../models/Chapter';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth routes: /api/auth/...
router.use('/auth', authRouter);

// Story routes: /api/stories/...
router.use('/stories', storiesRouter);

// Nested chapter routes: /api/stories/:storyId/chapters/...
router.use('/stories/:storyId/chapters', chapterStoryRouter);

// Standalone chapter routes (by chapter ID, not nested under story)
const chapterRouter = ExpressRouter();

// Helper: look up a chapter and confirm the requesting user owns the parent story.
// Returns null if the chapter doesn't exist or the user doesn't own the story.
async function verifyChapterOwnership(chapterId: string, userId: string) {
  const chapter = await Chapter.findByPk(chapterId, { include: [Story] });
  if (!chapter) return null;
  const story = await Story.findByPk(chapter.storyId);
  if (!story || story.userId !== userId) return null;
  return chapter;
}

// GET /api/chapters/:id
chapterRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.id, req.user!.id);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }
    res.json(chapter);
  } catch (err) {
    console.error('Get chapter error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chapters/:id
// Accepts partial updates: title, content (TipTap JSON), status, and wordCount.
chapterRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.id, req.user!.id);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    const { title, content, status, wordCount } = req.body;

    // Only update fields that were actually sent in the request body
    await chapter.update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(wordCount !== undefined && { wordCount }),
    });

    res.json(chapter);
  } catch (err) {
    console.error('Update chapter error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/chapters/:id
chapterRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.id, req.user!.id);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }
    await chapter.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Delete chapter error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chapter routes: /api/chapters/...
router.use('/chapters', chapterRouter);

export default router;
