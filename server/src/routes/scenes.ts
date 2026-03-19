// Scene routes — nested under /api/chapters/:chapterId/scenes
// and standalone /api/scenes/:id for updates and deletes.
// Ownership is verified by walking: Scene → Chapter → Story → User.
import { Router, Request, Response } from 'express';
import { Scene } from '../models/Scene';
import { Chapter } from '../models/Chapter';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

// ── Nested routes (/api/chapters/:chapterId/scenes) ─────────────────────────

const router = Router({ mergeParams: true });

// Verify the requesting user owns the story that contains this chapter.
async function verifyChapterOwnership(chapterId: string, userId: string): Promise<Chapter | null> {
  const chapter = await Chapter.findByPk(chapterId);
  if (!chapter) return null;
  const story = await Story.findByPk(chapter.storyId);
  if (!story || story.userId !== userId) return null;
  return chapter;
}

// GET /api/chapters/:chapterId/scenes
// Returns all scenes for a chapter sorted by order ascending.
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.chapterId, req.user!.id);
    if (!chapter) { res.status(403).json({ error: 'Forbidden' }); return; }

    const scenes = await Scene.findAll({
      where: { chapterId: req.params.chapterId },
      order: [['order', 'ASC']],
    });
    res.json(scenes);
  } catch (err) {
    console.error('Get scenes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chapters/:chapterId/scenes
// Creates a new scene appended at the end (max order + 1).
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.chapterId, req.user!.id);
    if (!chapter) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { title } = req.body;
    if (!title) { res.status(400).json({ error: 'Title is required' }); return; }

    const maxOrder = await Scene.max<number, Scene>('order', {
      where: { chapterId: req.params.chapterId },
    });

    const scene = await Scene.create({
      chapterId: req.params.chapterId,
      title,
      content: null,
      order: typeof maxOrder === 'number' ? maxOrder + 1 : 0,
      wordCount: 0,
    });

    res.status(201).json(scene);
  } catch (err) {
    console.error('Create scene error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chapters/:chapterId/scenes/reorder
// Accepts { scenes: [{ id, order }] } and bulk-updates scene positions.
router.put('/reorder', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.chapterId, req.user!.id);
    if (!chapter) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { scenes } = req.body as { scenes: { id: string; order: number }[] };
    if (!Array.isArray(scenes)) {
      res.status(400).json({ error: 'scenes array is required' });
      return;
    }

    await Promise.all(
      scenes.map(({ id, order }) =>
        Scene.update({ order }, { where: { id, chapterId: req.params.chapterId } })
      )
    );

    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    console.error('Reorder scenes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// ── Standalone scene routes (/api/scenes/:id) ────────────────────────────────

export const sceneRouter = Router();

async function verifySceneOwnership(id: string, userId: string): Promise<Scene | null> {
  const scene = await Scene.findByPk(id);
  if (!scene) return null;
  const chapter = await Chapter.findByPk(scene.chapterId);
  if (!chapter) return null;
  const story = await Story.findByPk(chapter.storyId);
  if (!story || story.userId !== userId) return null;
  return scene;
}

// GET /api/scenes/:id
sceneRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }
    res.json(scene);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/scenes/:id
// Accepts partial updates: title, content (TipTap JSON), wordCount.
sceneRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }

    const { title, content, wordCount } = req.body;
    await scene.update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(wordCount !== undefined && { wordCount }),
    });

    res.json(scene);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/scenes/:id
sceneRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }
    await scene.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
