import api from './api';
import { Scene } from '../types';

export async function getScenes(chapterId: string): Promise<Scene[]> {
  const res = await api.get<Scene[]>(`/chapters/${chapterId}/scenes`);
  return res.data;
}

export async function createScene(chapterId: string, title: string): Promise<Scene> {
  const res = await api.post<Scene>(`/chapters/${chapterId}/scenes`, { title });
  return res.data;
}

export async function updateScene(
  id: string,
  data: Partial<Pick<Scene, 'title' | 'content' | 'wordCount'>>
): Promise<Scene> {
  const res = await api.put<Scene>(`/scenes/${id}`, data);
  return res.data;
}

export async function deleteScene(id: string): Promise<void> {
  await api.delete(`/scenes/${id}`);
}

export async function reorderScenes(
  chapterId: string,
  scenes: { id: string; order: number }[]
): Promise<void> {
  await api.put(`/chapters/${chapterId}/scenes/reorder`, { scenes });
}

export async function assignCharacter(sceneId: string, characterId: string): Promise<Scene> {
  const res = await api.post<Scene>(`/scenes/${sceneId}/characters/${characterId}`);
  return res.data;
}

export async function removeCharacter(sceneId: string, characterId: string): Promise<Scene> {
  const res = await api.delete<Scene>(`/scenes/${sceneId}/characters/${characterId}`);
  return res.data;
}

export async function assignWorldEntry(sceneId: string, worldEntryId: string): Promise<Scene> {
  const res = await api.post<Scene>(`/scenes/${sceneId}/world/${worldEntryId}`);
  return res.data;
}

export async function removeWorldEntry(sceneId: string, worldEntryId: string): Promise<Scene> {
  const res = await api.delete<Scene>(`/scenes/${sceneId}/world/${worldEntryId}`);
  return res.data;
}
