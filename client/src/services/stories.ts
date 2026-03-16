import api from './api';
import { Story } from '../types';

export async function getStories(): Promise<Story[]> {
  const response = await api.get<Story[]>('/stories');
  return response.data;
}

export async function getStory(id: string): Promise<Story> {
  const response = await api.get<Story>(`/stories/${id}`);
  return response.data;
}

export async function createStory(data: {
  title: string;
  description?: string;
  status?: Story['status'];
}): Promise<Story> {
  const response = await api.post<Story>('/stories', data);
  return response.data;
}

export async function updateStory(
  id: string,
  data: Partial<{ title: string; description: string; status: Story['status'] }>
): Promise<Story> {
  const response = await api.put<Story>(`/stories/${id}`, data);
  return response.data;
}

export async function deleteStory(id: string): Promise<void> {
  await api.delete(`/stories/${id}`);
}
