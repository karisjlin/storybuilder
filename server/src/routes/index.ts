// Root router — combines all sub-routers and mounts them under /api
import { Router, Request, Response } from 'express';
import authRouter from './auth';
import storiesRouter from './stories';
import chapterStoryRouter from './chapters';
import sceneChapterRouter, { sceneRouter } from './scenes';
import characterStoryRouter, { characterRouter, relationshipRouter } from './characters';
import worldStoryRouter, { worldEntryRouter } from './world';
import tagStoryRouter, { tagRouter } from './tags';
import { Chapter } from '../models/Chapter';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── Auth ────────────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ── Stories ─────────────────────────────────────────────────────────────────
router.use('/stories', storiesRouter);

// ── Chapters (nested + standalone) ──────────────────────────────────────────
router.use('/stories/:storyId/chapters', chapterStoryRouter);

const chapterRouter = Router();

async function verifyChapterOwnership(chapterId: string, userId: string) {
  const chapter = await Chapter.findByPk(chapterId);
  if (!chapter) return null;
  const story = await Story.findByPk(chapter.storyId);
  if (!story || story.userId !== userId) return null;
  return chapter;
}

chapterRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.id, req.user!.id);
    if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

chapterRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.id, req.user!.id);
    if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }

    const { title, content, status, wordCount } = req.body;
    await chapter.update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(wordCount !== undefined && { wordCount }),
    });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

chapterRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.id, req.user!.id);
    if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }
    await chapter.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use('/chapters', chapterRouter);

// ── Scenes (nested under chapters + standalone) ───────────────────────────────
router.use('/chapters/:chapterId/scenes', sceneChapterRouter);
router.use('/scenes', sceneRouter);

// ── Characters + Relationships (nested + standalone) ─────────────────────────
router.use('/stories/:storyId/characters', characterStoryRouter);
router.use('/characters', characterRouter);
router.use('/relationships', relationshipRouter);

// ── World Entries (nested + standalone) ──────────────────────────────────────
router.use('/stories/:storyId/world', worldStoryRouter);
router.use('/world', worldEntryRouter);

// ── Tags (nested + standalone + assign) ──────────────────────────────────────
router.use('/stories/:storyId/tags', tagStoryRouter);
router.use('/tags', tagRouter);

export default router;
