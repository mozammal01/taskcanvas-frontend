import { create } from "zustand";
import { format } from "date-fns";
import * as tasksApi from "@/lib/api/tasks";
import type { Task, TaskDraft, TaskStatus } from "@/types/task";

interface TaskState {
  selectedDate: Date;
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  setSelectedDate: (date: Date) => void;
  fetchTasks: () => Promise<void>;
  addTask: (draft: TaskDraft) => Promise<void>;
  editTask: (id: string, draft: Partial<TaskDraft>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  selectedDate: new Date(),
  tasks: [],
  isLoading: false,
  error: null,

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchTasks();
  },

  fetchTasks: async () => {
    const dateKey = format(get().selectedDate, "yyyy-MM-dd");
    set({ isLoading: true, error: null });
    try {
      const tasks = await tasksApi.fetchTasksByDate(dateKey);
      set({ tasks, isLoading: false });
    } catch {
      set({ error: "Could not load tasks for this day", isLoading: false });
    }
  },

  addTask: async (draft) => {
    const task = await tasksApi.createTask(draft);
    set({ tasks: [...get().tasks, task] });
  },

  editTask: async (id, draft) => {
    const updated = await tasksApi.updateTask(id, draft);
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
  },

  removeTask: async (id) => {
    await tasksApi.deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },

  moveTask: async (id, status) => {
    const previous = get().tasks;
    set({ tasks: previous.map((t) => (t.id === id ? { ...t, status } : t)) });
    try {
      await tasksApi.updateTask(id, { status });
    } catch {
      set({ tasks: previous, error: "Could not move task" });
    }
  },
}));