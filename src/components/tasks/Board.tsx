"use client";

import { useEffect } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Column } from "@/components/tasks/Column";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types/task";

interface BoardProps {
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function Board({ onAddTask, onEditTask }: BoardProps) {
  const { tasks, isLoading, error, fetchTasks, moveTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto">
          {TASK_STATUSES.map(({ id, label }) => (
            <Column
              key={id}
              status={id}
              label={label}
              tasks={tasks.filter((t) => t.status === id)}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      </DndContext>
      {isLoading && (
        <p className="text-center text-xs text-muted-foreground">Loading tasks...</p>
      )}
    </div>
  );
}