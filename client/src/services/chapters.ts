// Chapter service — API calls for chapter CRUD and reordering.
// All requests are authenticated via the axios interceptor in api.ts.
import api from './api';
import { Chapter } from '../types';

// Fetch all chapters for a story, sorted by order ascending
export async function getChapters(storyId: string): Promise<Chapter[]> {
  const response = await api.get<Chapter[]>(`/stories/${storyId}/chapters`);
  return response.data;
}

// Create a new chapter at the end of the chapter list
export async function createChapter(storyId: string, title: string): Promise<Chapter> {
  const response = await api.post<Chapter>(`/stories/${storyId}/chapters`, { title });
  return response.data;
}

// Fetch a single chapter by its ID
export async function getChapter(id: string): Promise<Chapter> {
  const response = await api.get<Chapter>(`/chapters/${id}`);
  return response.data;
}

// Partially update a chapter — used for auto-save (content + wordCount) and status changes
export async function updateChapter(
  id: string,
  data: Partial<Pick<Chapter, 'title' | 'content' | 'status' | 'wordCount'>>
): Promise<Chapter> {
  const response = await api.put<Chapter>(`/chapters/${id}`, data);
  return response.data;
}

export async function deleteChapter(id: string): Promise<void> {
  await api.delete(`/chapters/${id}`);
}

// Send the new order after a drag-and-drop reorder in the sidebar
export async function reorderChapters(
  storyId: string,
  chapters: { id: string; order: number }[]
): Promise<void> {
  await api.put(`/stories/${storyId}/chapters/reorder`, { chapters });
}
