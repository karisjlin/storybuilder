import request from 'supertest';
import app from '../src/app';
import { createUser, createStory, createChapter, createScene, bearer } from './helpers';

describe('Scenes API', () => {
  describe('GET /api/chapters/:chapterId/scenes', () => {
    it('returns empty list for a new chapter', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);

      const res = await request(app)
        .get(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns scenes sorted by order', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);
      await createScene(token, chapter.id, 'Scene One');
      await createScene(token, chapter.id, 'Scene Two');

      const res = await request(app)
        .get(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Scene One');
      expect(res.body[0].order).toBeLessThan(res.body[1].order);
    });

    it('includes characters and worldEntries arrays', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);
      await createScene(token, chapter.id);

      const res = await request(app)
        .get(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(token));

      expect(res.body[0]).toHaveProperty('characters');
      expect(res.body[0]).toHaveProperty('worldEntries');
    });

    it('returns 403 for another user\'s chapter', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);
      const chapter = await createChapter(tokenA, story.id);

      const res = await request(app)
        .get(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(tokenB));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/chapters/:chapterId/scenes', () => {
    it('creates a scene with incrementing order', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);

      const s1 = await createScene(token, chapter.id, 'Scene 1');
      const s2 = await createScene(token, chapter.id, 'Scene 2');

      expect(s2).toHaveProperty('id');
      expect((s2 as any).order).toBeGreaterThan((s1 as any).order);
    });

    it('rejects missing title', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);

      const res = await request(app)
        .post(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(token))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/scenes/:id', () => {
    it('updates scene content', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);
      const scene = await createScene(token, chapter.id);

      const res = await request(app)
        .put(`/api/scenes/${scene.id}`)
        .set(bearer(token))
        .send({ title: 'Updated Scene', content: '<p>Hello world</p>', wordCount: 2 });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Scene');
      expect(res.body.content).toBe('<p>Hello world</p>');
      expect(res.body.wordCount).toBe(2);
    });

    it('returns 404 for another user\'s scene', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);
      const chapter = await createChapter(tokenA, story.id);
      const scene = await createScene(tokenA, chapter.id);

      const res = await request(app)
        .put(`/api/scenes/${scene.id}`)
        .set(bearer(tokenB))
        .send({ title: 'Hacked' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/scenes/:id', () => {
    it('deletes a scene', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);
      const scene = await createScene(token, chapter.id);

      const deleteRes = await request(app)
        .delete(`/api/scenes/${scene.id}`)
        .set(bearer(token));

      expect(deleteRes.status).toBe(204);

      const listRes = await request(app)
        .get(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(token));

      expect(listRes.body).toHaveLength(0);
    });

    it('returns 404 for another user\'s scene', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);
      const chapter = await createChapter(tokenA, story.id);
      const scene = await createScene(tokenA, chapter.id);

      const res = await request(app)
        .delete(`/api/scenes/${scene.id}`)
        .set(bearer(tokenB));

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/chapters/:chapterId/scenes/reorder', () => {
    it('reorders scenes', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);
      const s1 = await createScene(token, chapter.id, 'First');
      const s2 = await createScene(token, chapter.id, 'Second');

      const res = await request(app)
        .put(`/api/chapters/${chapter.id}/scenes/reorder`)
        .set(bearer(token))
        .send({ scenes: [{ id: s1.id, order: 1 }, { id: s2.id, order: 0 }] });

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get(`/api/chapters/${chapter.id}/scenes`)
        .set(bearer(token));

      expect(listRes.body[0].id).toBe(s2.id);
      expect(listRes.body[1].id).toBe(s1.id);
    });
  });

  describe('GET /api/scenes/:id', () => {
    it('returns a scene by id', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const chapter = await createChapter(token, story.id);
      const scene = await createScene(token, chapter.id);

      const res = await request(app)
        .get(`/api/scenes/${scene.id}`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(scene.id);
    });

    it('returns 404 for non-existent scene', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .get('/api/scenes/00000000-0000-0000-0000-000000000000')
        .set(bearer(token));

      expect(res.status).toBe(404);
    });
  });
});
