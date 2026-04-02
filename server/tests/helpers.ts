import request from 'supertest';
import app from '../src/app';

export interface AuthResult {
  token: string;
  userId: string;
}

let userCounter = 0;

/** Create a unique user and return their auth token + id. */
export async function createUser(overrides: { username?: string; email?: string; password?: string } = {}): Promise<AuthResult> {
  const n = ++userCounter;
  const username = overrides.username ?? `testuser${n}`;
  const email = overrides.email ?? `test${n}@example.com`;
  const password = overrides.password ?? 'password123';

  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email, password });

  if (res.status !== 201) {
    throw new Error(`createUser failed: ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, userId: res.body.user.id };
}

/** POST /api/stories — create a story for the given user token. */
export async function createStory(token: string, overrides: { title?: string; description?: string } = {}) {
  const res = await request(app)
    .post('/api/stories')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: overrides.title ?? 'Test Story', description: overrides.description });

  if (res.status !== 201) {
    throw new Error(`createStory failed: ${JSON.stringify(res.body)}`);
  }

  return res.body as { id: string; title: string; description: string | null; status: string };
}

/** POST /api/stories/:storyId/chapters — create a chapter. */
export async function createChapter(token: string, storyId: string, title = 'Test Chapter') {
  const res = await request(app)
    .post(`/api/stories/${storyId}/chapters`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  if (res.status !== 201) {
    throw new Error(`createChapter failed: ${JSON.stringify(res.body)}`);
  }

  return res.body as { id: string; title: string; storyId: string; order: number };
}

/** POST /api/chapters/:chapterId/scenes — create a scene. */
export async function createScene(token: string, chapterId: string, title = 'Test Scene') {
  const res = await request(app)
    .post(`/api/chapters/${chapterId}/scenes`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  if (res.status !== 201) {
    throw new Error(`createScene failed: ${JSON.stringify(res.body)}`);
  }

  return res.body as { id: string; title: string; chapterId: string };
}

/** Auth header shorthand. */
export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
