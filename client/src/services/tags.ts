import api from './api';
import { Tag, TagAssignment, TaggableType } from '../types';

export async function getTags(storyId: string): Promise<Tag[]> {
  const res = await api.get<Tag[]>(`/stories/${storyId}/tags`);
  return res.data;
}

export async function createTag(storyId: string, name: string, color: string): Promise<Tag> {
  const res = await api.post<Tag>(`/stories/${storyId}/tags`, { name, color });
  return res.data;
}

export async function updateTag(id: string, data: { name?: string; color?: string }): Promise<Tag> {
  const res = await api.put<Tag>(`/tags/${id}`, data);
  return res.data;
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/tags/${id}`);
}

export async function assignTag(
  tagId: string,
  taggableId: string,
  taggableType: TaggableType
): Promise<TagAssignment> {
  const res = await api.post<TagAssignment>(`/tags/${tagId}/assign`, { taggableId, taggableType });
  return res.data;
}

export async function unassignTag(
  tagId: string,
  taggableId: string,
  taggableType: TaggableType
): Promise<void> {
  await api.delete(`/tags/${tagId}/assign`, { data: { taggableId, taggableType } });
}
