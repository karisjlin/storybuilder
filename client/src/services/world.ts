import api from './api';
import { WorldEntry, WorldCategory } from '../types';

export async function getWorldEntries(storyId: string, category?: WorldCategory): Promise<WorldEntry[]> {
  const params = category ? { category } : {};
  const res = await api.get<WorldEntry[]>(`/stories/${storyId}/world`, { params });
  return res.data;
}

export async function createWorldEntry(
  storyId: string,
  data: { name: string; category: WorldCategory; description?: string }
): Promise<WorldEntry> {
  const res = await api.post<WorldEntry>(`/stories/${storyId}/world`, data);
  return res.data;
}

export async function updateWorldEntry(
  id: string,
  data: Partial<Pick<WorldEntry, 'name' | 'category' | 'description'>>
): Promise<WorldEntry> {
  const res = await api.put<WorldEntry>(`/world/${id}`, data);
  return res.data;
}

export async function deleteWorldEntry(id: string): Promise<void> {
  await api.delete(`/world/${id}`);
}
