import { Router, Request, Response } from 'express';
import { Story } from '../models/Story';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/stories
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const stories = await Story.findAll({
      where: { userId: req.user!.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(stories);
  } catch (err) {
    console.error('Get stories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stories
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const story = await Story.create({
      userId: req.user!.id,
      title,
      description: description || null,
      status: status || 'draft',
    });

    res.status(201).json(story);
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stories/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await Story.findByPk(req.params.id);

    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    if (story.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(story);
  } catch (err) {
    console.error('Get story error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/stories/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await Story.findByPk(req.params.id);

    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    if (story.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { title, description, status } = req.body;

    await story.update({
      title: title !== undefined ? title : story.title,
      description: description !== undefined ? description : story.description,
      status: status !== undefined ? status : story.status,
    });

    res.json(story);
  } catch (err) {
    console.error('Update story error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/stories/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const story = await Story.findByPk(req.params.id);

    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    if (story.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await story.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Delete story error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
