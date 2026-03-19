import api from './api';
import { Character, CharacterRelationship } from '../types';

export async function getCharacters(storyId: string): Promise<Character[]> {
  const res = await api.get<Character[]>(`/stories/${storyId}/characters`);
  return res.data;
}

export async function createCharacter(
  storyId: string,
  data: Partial<Omit<Character, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>>
): Promise<Character> {
  const res = await api.post<Character>(`/stories/${storyId}/characters`, data);
  return res.data;
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<Character, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>>
): Promise<Character> {
  const res = await api.put<Character>(`/characters/${id}`, data);
  return res.data;
}

export async function deleteCharacter(id: string): Promise<void> {
  await api.delete(`/characters/${id}`);
}

export async function getRelationships(storyId: string): Promise<CharacterRelationship[]> {
  const res = await api.get<CharacterRelationship[]>(`/stories/${storyId}/characters/relationships`);
  return res.data;
}

export async function createRelationship(
  storyId: string,
  data: { characterAId: string; characterBId: string; type: string; description?: string }
): Promise<CharacterRelationship> {
  const res = await api.post<CharacterRelationship>(`/stories/${storyId}/characters/relationships`, data);
  return res.data;
}

export async function updateRelationship(
  id: string,
  data: { type?: string; description?: string }
): Promise<CharacterRelationship> {
  const res = await api.put<CharacterRelationship>(`/relationships/${id}`, data);
  return res.data;
}

export async function deleteRelationship(id: string): Promise<void> {
  await api.delete(`/relationships/${id}`);
}
