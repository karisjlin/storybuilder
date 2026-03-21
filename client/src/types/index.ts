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

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string | null;
  order: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  role: string | null;
  age: number | null;
  bio: string | null;
  imageUrl: string | null;
  traits: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRelationship {
  id: string;
  storyId: string;
  characterAId: string;
  characterBId: string;
  type: string;
  description: string | null;
  characterA?: Pick<Character, 'id' | 'name' | 'imageUrl'>;
  characterB?: Pick<Character, 'id' | 'name' | 'imageUrl'>;
  createdAt: string;
  updatedAt: string;
}

export type WorldCategory = 'location' | 'lore' | 'item' | 'faction' | 'event' | 'condition' | 'other';

export interface WorldEntry {
  id: string;
  storyId: string;
  name: string;
  category: WorldCategory;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaggableType = 'chapter' | 'character' | 'worldEntry';

export interface TagAssignment {
  id: string;
  tagId: string;
  taggableId: string;
  taggableType: TaggableType;
}

export interface Tag {
  id: string;
  storyId: string;
  name: string;
  color: string;
  assignments?: TagAssignment[];
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
