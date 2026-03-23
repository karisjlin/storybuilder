// Scene routes — nested under /api/chapters/:chapterId/scenes
// and standalone /api/scenes/:id for updates, deletes, and association management.
// Ownership is verified by walking: Scene → Chapter → Story → User.
import { Router, Request, Response } from 'express';
import { Scene } from '../models/Scene';
import { Chapter } from '../models/Chapter';
import { Story } from '../models/Story';
import { Character } from '../models/Character';
import { WorldEntry } from '../models/WorldEntry';
import { SceneCharacter } from '../models/SceneCharacter';
import { SceneWorldEntry } from '../models/SceneWorldEntry';
import { authenticate } from '../middleware/auth';

// Fields returned for characters embedded in a scene response
const CHARACTER_ATTRS = ['id', 'name', 'role'];
// Fields returned for world entries embedded in a scene response
const WORLD_ENTRY_ATTRS = ['id', 'name', 'category'];

// ── Nested routes (/api/chapters/:chapterId/scenes) ─────────────────────────

const router = Router({ mergeParams: true });

async function verifyChapterOwnership(chapterId: string, userId: string): Promise<Chapter | null> {
  const chapter = await Chapter.findByPk(chapterId);
  if (!chapter) return null;
  const story = await Story.findByPk(chapter.storyId);
  if (!story || story.userId !== userId) return null;
  return chapter;
}

// GET /api/chapters/:chapterId/scenes
// Returns all scenes with their associated characters and world entries.
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.chapterId, req.user!.id);
    if (!chapter) { res.status(403).json({ error: 'Forbidden' }); return; }

    const scenes = await Scene.findAll({
      where: { chapterId: req.params.chapterId },
      order: [['order', 'ASC']],
      include: [
        { model: Character, attributes: CHARACTER_ATTRS, through: { attributes: [] } },
        { model: WorldEntry, attributes: WORLD_ENTRY_ATTRS, through: { attributes: [] } },
      ],
    });
    res.json(scenes);
  } catch (err) {
    console.error('Get scenes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chapters/:chapterId/scenes
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

    // Return with empty associations so the client shape is consistent
    const full = await Scene.findByPk(scene.id, {
      include: [
        { model: Character, attributes: CHARACTER_ATTRS, through: { attributes: [] } },
        { model: WorldEntry, attributes: WORLD_ENTRY_ATTRS, through: { attributes: [] } },
      ],
    });

    res.status(201).json(full);
  } catch (err) {
    console.error('Create scene error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chapters/:chapterId/scenes/reorder
router.put('/reorder', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await verifyChapterOwnership(req.params.chapterId, req.user!.id);
    if (!chapter) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { scenes } = req.body as { scenes: { id: string; order: number }[] };
    if (!Array.isArray(scenes)) { res.status(400).json({ error: 'scenes array is required' }); return; }

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

// Helper: re-fetch a scene with its associations for a consistent response shape
async function sceneWithAssociations(id: string) {
  return Scene.findByPk(id, {
    include: [
      { model: Character, attributes: CHARACTER_ATTRS, through: { attributes: [] } },
      { model: WorldEntry, attributes: WORLD_ENTRY_ATTRS, through: { attributes: [] } },
    ],
  });
}

// GET /api/scenes/:id
sceneRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }
    res.json(await sceneWithAssociations(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/scenes/:id
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

    res.json(await sceneWithAssociations(req.params.id));
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

// POST /api/scenes/:id/characters/:characterId — assign a character to a scene
sceneRouter.post('/:id/characters/:characterId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }

    // Avoid duplicate assignments
    const existing = await SceneCharacter.findOne({
      where: { sceneId: req.params.id, characterId: req.params.characterId },
    });
    if (!existing) {
      await SceneCharacter.create({ sceneId: req.params.id, characterId: req.params.characterId });
    }

    res.json(await sceneWithAssociations(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/scenes/:id/characters/:characterId — remove a character from a scene
sceneRouter.delete('/:id/characters/:characterId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }

    await SceneCharacter.destroy({
      where: { sceneId: req.params.id, characterId: req.params.characterId },
    });

    res.json(await sceneWithAssociations(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/scenes/:id/world/:worldEntryId — assign a world entry to a scene
sceneRouter.post('/:id/world/:worldEntryId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }

    const existing = await SceneWorldEntry.findOne({
      where: { sceneId: req.params.id, worldEntryId: req.params.worldEntryId },
    });
    if (!existing) {
      await SceneWorldEntry.create({ sceneId: req.params.id, worldEntryId: req.params.worldEntryId });
    }

    res.json(await sceneWithAssociations(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/scenes/:id/world/:worldEntryId — remove a world entry from a scene
sceneRouter.delete('/:id/world/:worldEntryId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const scene = await verifySceneOwnership(req.params.id, req.user!.id);
    if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }

    await SceneWorldEntry.destroy({
      where: { sceneId: req.params.id, worldEntryId: req.params.worldEntryId },
    });

    res.json(await sceneWithAssociations(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
