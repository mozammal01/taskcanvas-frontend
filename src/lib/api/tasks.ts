import { apiClient } from "@/lib/api/client";
import type { Task, TaskDraft } from "@/types/task";

export async function fetchTasksByDate(date: string) {
  const { data } = await apiClient.get<Task[]>("/tasks/", {
    params: { due_date: date },
  });
  return data;
}

export async function createTask(draft: TaskDraft) {
  const { data } = await apiClient.post<Task>("/tasks/", draft);
  return data;
}

export async function updateTask(id: string, draft: Partial<TaskDraft>) {
  const { data } = await apiClient.patch<Task>(`/tasks/${id}/`, draft);
  return data;
}

export async function deleteTask(id: string) {
  await apiClient.delete(`/tasks/${id}/`);
}