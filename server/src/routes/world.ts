// World entry routes — /api/stories/:storyId/world and /api/world/:id
import { Router, Request, Response } from 'express';
import { WorldEntry } from '../models/WorldEntry';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

async function verifyStoryOwnership(storyId: string, userId: string): Promise<Story | null> {
  const story = await Story.findByPk(storyId);
  if (!story || story.userId !== userId) return null;
  return story;
}

// GET /api/stories/:storyId/world
// Optionally filter by ?category=location
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const where: Record<string, unknown> = { storyId: req.params.storyId };
    if (req.query.category) where.category = req.query.category;

    const entries = await WorldEntry.findAll({ where, order: [['name', 'ASC']] });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stories/:storyId/world
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { name, category, description } = req.body;
    if (!name || !category) {
      res.status(400).json({ error: 'name and category are required' });
      return;
    }

    const entry = await WorldEntry.create({
      storyId: req.params.storyId,
      name,
      category,
      description: description || null,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// ── Standalone world entry routes (/api/world/:id) ─────────────────────────

export const worldEntryRouter = Router();

async function verifyEntryOwnership(id: string, userId: string): Promise<WorldEntry | null> {
  const entry = await WorldEntry.findByPk(id);
  if (!entry) return null;
  const story = await Story.findByPk(entry.storyId);
  if (!story || story.userId !== userId) return null;
  return entry;
}

// GET /api/world/:id
worldEntryRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await verifyEntryOwnership(req.params.id, req.user!.id);
    if (!entry) { res.status(404).json({ error: 'World entry not found' }); return; }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/world/:id
worldEntryRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await verifyEntryOwnership(req.params.id, req.user!.id);
    if (!entry) { res.status(404).json({ error: 'World entry not found' }); return; }

    const { name, category, description } = req.body;
    await entry.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
    });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/world/:id
worldEntryRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await verifyEntryOwnership(req.params.id, req.user!.id);
    if (!entry) { res.status(404).json({ error: 'World entry not found' }); return; }
    await entry.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
