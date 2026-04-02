import request from 'supertest';
import app from '../src/app';
import { createUser, createStory, bearer } from './helpers';

describe('Stories API', () => {
  describe('GET /api/stories', () => {
    it('returns empty list for new user', async () => {
      const { token } = await createUser();
      const res = await request(app).get('/api/stories').set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns only the authenticated user\'s stories', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();

      await createStory(tokenA, { title: 'Story A' });
      await createStory(tokenB, { title: 'Story B' });

      const res = await request(app).get('/api/stories').set(bearer(tokenA));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Story A');
    });

    it('includes totalWordCount in response', async () => {
      const { token } = await createUser();
      await createStory(token);

      const res = await request(app).get('/api/stories').set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('totalWordCount');
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/stories');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/stories', () => {
    it('creates a story', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .post('/api/stories')
        .set(bearer(token))
        .send({ title: 'My Novel', description: 'A great tale' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('My Novel');
      expect(res.body.description).toBe('A great tale');
      expect(res.body.status).toBe('draft');
    });

    it('rejects missing title', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .post('/api/stories')
        .set(bearer(token))
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/stories/:id', () => {
    it('returns the story for its owner', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const res = await request(app)
        .get(`/api/stories/${story.id}`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(story.id);
    });

    it('returns 403 for another user\'s story', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);

      const res = await request(app)
        .get(`/api/stories/${story.id}`)
        .set(bearer(tokenB));

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent story', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .get('/api/stories/00000000-0000-0000-0000-000000000000')
        .set(bearer(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/stories/:id', () => {
    it('updates a story', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const res = await request(app)
        .put(`/api/stories/${story.id}`)
        .set(bearer(token))
        .send({ title: 'Updated Title', status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in_progress');
    });

    it('updates wordCountGoal', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const res = await request(app)
        .put(`/api/stories/${story.id}`)
        .set(bearer(token))
        .send({ wordCountGoal: 80000 });

      expect(res.status).toBe(200);
      expect(res.body.wordCountGoal).toBe(80000);
    });

    it('returns 403 for another user\'s story', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);

      const res = await request(app)
        .put(`/api/stories/${story.id}`)
        .set(bearer(tokenB))
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/stories/:id', () => {
    it('deletes a story', async () => {
      const { token } = await createUser();
      const story = await createStory(token);

      const deleteRes = await request(app)
        .delete(`/api/stories/${story.id}`)
        .set(bearer(token));

      expect(deleteRes.status).toBe(204);

      const getRes = await request(app)
        .get(`/api/stories/${story.id}`)
        .set(bearer(token));

      expect(getRes.status).toBe(404);
    });

    it('returns 403 for another user\'s story', async () => {
      const { token: tokenA } = await createUser();
      const { token: tokenB } = await createUser();
      const story = await createStory(tokenA);

      const res = await request(app)
        .delete(`/api/stories/${story.id}`)
        .set(bearer(tokenB));

      expect(res.status).toBe(403);
    });
  });
});
