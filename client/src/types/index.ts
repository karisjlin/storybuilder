export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'complete';
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: object | null;
  order: number;
  status: 'todo' | 'active' | 'done';
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}
