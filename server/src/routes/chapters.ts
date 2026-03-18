// Chapter routes — mounted at /api/stories/:storyId/chapters
// All routes require authentication. Story ownership is verified before any operation.
import { Router, Request, Response } from 'express';
import { Chapter } from '../models/Chapter';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

// mergeParams: true gives access to :storyId from the parent router
const router = Router({ mergeParams: true });

// Helper: look up a story and confirm the requesting user owns it.
// Returns null if the story doesn't exist or belongs to someone else.
async function verifyStoryOwnership(storyId: string, userId: string): Promise<Story | null> {
  const story = await Story.findByPk(storyId);
  if (!story || story.userId !== userId) return null;
  return story;
}

// GET /api/stories/:storyId/chapters
// Returns all chapters for a story, sorted by their order field ascending.
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const chapters = await Chapter.findAll({
      where: { storyId: req.params.storyId },
      order: [['order', 'ASC']],
    });

    res.json(chapters);
  } catch (err) {
    console.error('Get chapters error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stories/:storyId/chapters
// Creates a new chapter appended at the end (max order + 1).
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Find the current highest order value so the new chapter goes to the bottom
    const maxOrder = await Chapter.max<number, Chapter>('order', {
      where: { storyId: req.params.storyId },
    });

    const chapter = await Chapter.create({
      storyId: req.params.storyId,
      title,
      content: null,
      order: typeof maxOrder === 'number' ? maxOrder + 1 : 0,
      status: 'todo',
      wordCount: 0,
    });

    res.status(201).json(chapter);
  } catch (err) {
    console.error('Create chapter error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/stories/:storyId/chapters/reorder
// Accepts an array of { id, order } pairs and bulk-updates chapter positions.
// Called by the client after a drag-and-drop reorder.
router.put('/reorder', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { chapters } = req.body as { chapters: { id: string; order: number }[] };
    if (!Array.isArray(chapters)) {
      res.status(400).json({ error: 'chapters array is required' });
      return;
    }

    // Run all order updates in parallel
    await Promise.all(
      chapters.map(({ id, order }) =>
        Chapter.update({ order }, { where: { id, storyId: req.params.storyId } })
      )
    );

    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    console.error('Reorder chapters error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
