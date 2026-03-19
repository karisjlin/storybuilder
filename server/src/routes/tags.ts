// Tag routes — /api/stories/:storyId/tags, /api/tags/:id, and /api/tags/:id/assign
import { Router, Request, Response } from 'express';
import { Tag } from '../models/Tag';
import { TagAssignment } from '../models/TagAssignment';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

async function verifyStoryOwnership(storyId: string, userId: string): Promise<Story | null> {
  const story = await Story.findByPk(storyId);
  if (!story || story.userId !== userId) return null;
  return story;
}

// GET /api/stories/:storyId/tags
// Returns all tags, each with their assignments included
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const tags = await Tag.findAll({
      where: { storyId: req.params.storyId },
      include: [{ model: TagAssignment }],
      order: [['name', 'ASC']],
    });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stories/:storyId/tags
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { name, color } = req.body;
    if (!name) { res.status(400).json({ error: 'name is required' }); return; }

    const tag = await Tag.create({
      storyId: req.params.storyId,
      name,
      color: color || '#6B7280',
    });
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// ── Standalone tag routes (/api/tags/:id) ──────────────────────────────────

export const tagRouter = Router();

async function verifyTagOwnership(id: string, userId: string): Promise<Tag | null> {
  const tag = await Tag.findByPk(id);
  if (!tag) return null;
  const story = await Story.findByPk(tag.storyId);
  if (!story || story.userId !== userId) return null;
  return tag;
}

// PUT /api/tags/:id
tagRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await verifyTagOwnership(req.params.id, req.user!.id);
    if (!tag) { res.status(404).json({ error: 'Tag not found' }); return; }

    const { name, color } = req.body;
    await tag.update({
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
    });
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id — also deletes all assignments via cascade
tagRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await verifyTagOwnership(req.params.id, req.user!.id);
    if (!tag) { res.status(404).json({ error: 'Tag not found' }); return; }

    // Remove all assignments before deleting the tag
    await TagAssignment.destroy({ where: { tagId: tag.id } });
    await tag.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags/:id/assign — add tag to an entity
tagRouter.post('/:id/assign', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await verifyTagOwnership(req.params.id, req.user!.id);
    if (!tag) { res.status(404).json({ error: 'Tag not found' }); return; }

    const { taggableId, taggableType } = req.body;
    if (!taggableId || !taggableType) {
      res.status(400).json({ error: 'taggableId and taggableType are required' });
      return;
    }

    // Prevent duplicate assignments
    const [assignment] = await TagAssignment.findOrCreate({
      where: { tagId: tag.id, taggableId, taggableType },
      defaults: { tagId: tag.id, taggableId, taggableType },
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id/assign — remove tag from an entity
tagRouter.delete('/:id/assign', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await verifyTagOwnership(req.params.id, req.user!.id);
    if (!tag) { res.status(404).json({ error: 'Tag not found' }); return; }

    const { taggableId, taggableType } = req.body;
    await TagAssignment.destroy({ where: { tagId: tag.id, taggableId, taggableType } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tags/:id/entities — get all entities assigned to a tag
tagRouter.get('/:id/entities', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await verifyTagOwnership(req.params.id, req.user!.id);
    if (!tag) { res.status(404).json({ error: 'Tag not found' }); return; }

    const assignments = await TagAssignment.findAll({ where: { tagId: tag.id } });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
