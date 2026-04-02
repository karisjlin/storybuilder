import request from 'supertest';
import app from '../src/app';
import { createUser, createStory, createChapter, bearer } from './helpers';

describe('Chapters API', () => {
  describe('GET /api/stories/:storyId/chapters', () => {
    it('returns empty list for a new story', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const res = await request(app)
        .get(`/api/stories/${story.id}/chapters`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns chapters sorted by order', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      await createChapter(token, story.id, 'Chapter One');
      await createChapter(token, story.id, 'Chapter Two');

      const res = await request(app)
        .get(`/api/stories/${story.id}/chapters`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Chapter One');
      expect(res.body[0].order).toBeLessThan(res.body[1].order);
    });

    it('returns 403 for another user\'s story', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);

      const res = await request(app)
        .get(`/api/stories/${story.id}/chapters`)
        .set(bearer(tokenB));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/stories/:storyId/chapters', () => {
    it('creates a chapter with incrementing order', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const ch1 = await createChapter(token, story.id, 'Chapter 1');
      const ch2 = await createChapter(token, story.id, 'Chapter 2');

      expect(ch2.order).toBe(ch1.order + 1);
    });

    it('rejects missing title', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const res = await request(app)
        .post(`/api/stories/${story.id}/chapters`)
        .set(bearer(token))
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 403 for another user\'s story', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);

      const res = await request(app)
        .post(`/api/stories/${story.id}/chapters`)
        .set(bearer(tokenB))
        .send({ title: 'Hacked Chapter' });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/stories/:storyId/chapters/reorder', () => {
    it('reorders chapters', async () => {
      const { token } = await createUser();
      const story = await createStory(token);
      const ch1 = await createChapter(token, story.id, 'First');
      const ch2 = await createChapter(token, story.id, 'Second');

      // Swap orders
      const res = await request(app)
        .put(`/api/stories/${story.id}/chapters/reorder`)
        .set(bearer(token))
        .send({ chapters: [{ id: ch1.id, order: 1 }, { id: ch2.id, order: 0 }] });

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get(`/api/stories/${story.id}/chapters`)
        .set(bearer(token));

      expect(listRes.body[0].id).toBe(ch2.id);
      expect(listRes.body[1].id).toBe(ch1.id);
    });

    it('rejects request without chapters array', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const res = await request(app)
        .put(`/api/stories/${story.id}/chapters/reorder`)
        .set(bearer(token))
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
