import request from 'supertest';
import app from '../src/app';
import { createUser, bearer } from './helpers';

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', email: 'bob@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob2', email: 'bob@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects duplicate username', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'charlie', email: 'charlie@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'charlie', email: 'charlie2@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/username/i);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dave', email: 'dave@example.com', password: '123' });

    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'eve' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'loginuser', email: 'login@example.com', password: 'password123' });
  });

  it('returns token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const { token } = await createUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.email).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/email', () => {
  it('updates email with correct password', async () => {
    const { token } = await createUser({ password: 'password123' });

    const res = await request(app)
      .put('/api/auth/email')
      .set(bearer(token))
      .send({ email: 'newemail@example.com', currentPassword: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('newemail@example.com');
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong current password', async () => {
    const { token } = await createUser({ password: 'password123' });

    const res = await request(app)
      .put('/api/auth/email')
      .set(bearer(token))
      .send({ email: 'another@example.com', currentPassword: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/password', () => {
  it('updates password with correct current password', async () => {
    const { token } = await createUser({ password: 'password123' });

    const res = await request(app)
      .put('/api/auth/password')
      .set(bearer(token))
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('rejects short new password', async () => {
    const { token } = await createUser({ password: 'password123' });

    const res = await request(app)
      .put('/api/auth/password')
      .set(bearer(token))
      .send({ currentPassword: 'password123', newPassword: '123' });

    expect(res.status).toBe(400);
  });

  it('rejects wrong current password', async () => {
    const { token } = await createUser({ password: 'password123' });

    const res = await request(app)
      .put('/api/auth/password')
      .set(bearer(token))
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword456' });

    expect(res.status).toBe(401);
  });
});
