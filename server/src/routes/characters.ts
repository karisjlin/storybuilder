// Character routes — mounted at /api/stories/:storyId/characters
// and /api/characters/:id for standalone operations.
import { Router, Request, Response } from 'express';
import { Character } from '../models/Character';
import { CharacterRelationship } from '../models/CharacterRelationship';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

async function verifyStoryOwnership(storyId: string, userId: string): Promise<Story | null> {
  const story = await Story.findByPk(storyId);
  if (!story || story.userId !== userId) return null;
  return story;
}

// GET /api/stories/:storyId/characters
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const characters = await Character.findAll({
      where: { storyId: req.params.storyId },
      order: [['name', 'ASC']],
    });
    res.json(characters);
  } catch (err) {
    console.error('Get characters error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stories/:storyId/characters
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { name, role, age, bio, imageUrl, traits } = req.body;
    if (!name) { res.status(400).json({ error: 'Name is required' }); return; }

    const character = await Character.create({
      storyId: req.params.storyId,
      name,
      role: role || null,
      age: age != null ? Number(age) : null,
      bio: bio || null,
      imageUrl: imageUrl || null,
      traits: traits || [],
    });
    res.status(201).json(character);
  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stories/:storyId/relationships
router.get('/relationships', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const relationships = await CharacterRelationship.findAll({
      where: { storyId: req.params.storyId },
      include: [
        { model: Character, as: 'characterA', attributes: ['id', 'name', 'imageUrl'] },
        { model: Character, as: 'characterB', attributes: ['id', 'name', 'imageUrl'] },
      ],
    });
    res.json(relationships);
  } catch (err) {
    console.error('Get relationships error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stories/:storyId/relationships
router.post('/relationships', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await verifyStoryOwnership(req.params.storyId, req.user!.id);
    if (!story) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { characterAId, characterBId, type, description } = req.body;
    if (!characterAId || !characterBId || !type) {
      res.status(400).json({ error: 'characterAId, characterBId, and type are required' });
      return;
    }

    const relationship = await CharacterRelationship.create({
      storyId: req.params.storyId,
      characterAId,
      characterBId,
      type,
      description: description || null,
    });

    // Re-fetch with character names included
    const full = await CharacterRelationship.findByPk(relationship.id, {
      include: [
        { model: Character, as: 'characterA', attributes: ['id', 'name', 'imageUrl'] },
        { model: Character, as: 'characterB', attributes: ['id', 'name', 'imageUrl'] },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    console.error('Create relationship error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// ── Standalone character routes (/api/characters/:id) ──────────────────────

export const characterRouter = Router();

async function verifyCharacterOwnership(id: string, userId: string): Promise<Character | null> {
  const character = await Character.findByPk(id);
  if (!character) return null;
  const story = await Story.findByPk(character.storyId);
  if (!story || story.userId !== userId) return null;
  return character;
}

// GET /api/characters/:id
characterRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const character = await verifyCharacterOwnership(req.params.id, req.user!.id);
    if (!character) { res.status(404).json({ error: 'Character not found' }); return; }
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/characters/:id
characterRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const character = await verifyCharacterOwnership(req.params.id, req.user!.id);
    if (!character) { res.status(404).json({ error: 'Character not found' }); return; }

    const { name, role, age, bio, imageUrl, traits } = req.body;
    await character.update({
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(age !== undefined && { age: age != null ? Number(age) : null }),
      ...(bio !== undefined && { bio }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(traits !== undefined && { traits }),
    });
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/characters/:id
characterRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const character = await verifyCharacterOwnership(req.params.id, req.user!.id);
    if (!character) { res.status(404).json({ error: 'Character not found' }); return; }
    await character.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Standalone relationship routes (/api/relationships/:id) ────────────────

export const relationshipRouter = Router();

async function verifyRelationshipOwnership(id: string, userId: string): Promise<CharacterRelationship | null> {
  const rel = await CharacterRelationship.findByPk(id);
  if (!rel) return null;
  const story = await Story.findByPk(rel.storyId);
  if (!story || story.userId !== userId) return null;
  return rel;
}

// PUT /api/relationships/:id
relationshipRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const rel = await verifyRelationshipOwnership(req.params.id, req.user!.id);
    if (!rel) { res.status(404).json({ error: 'Relationship not found' }); return; }

    const { type, description } = req.body;
    await rel.update({
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
    });
    res.json(rel);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/relationships/:id
relationshipRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const rel = await verifyRelationshipOwnership(req.params.id, req.user!.id);
    if (!rel) { res.status(404).json({ error: 'Relationship not found' }); return; }
    await rel.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
