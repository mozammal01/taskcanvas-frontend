"use client";

import { useEffect, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Column } from "@/components/tasks/Column";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Spinner } from "@/components/ui/spinner";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types/task";

type ModalState =
  | { mode: "create"; status: TaskStatus }
  | { mode: "edit"; task: Task }
  | null;

export function Board() {
  const {
    tasks,
    selectedDate,
    isLoading,
    error,
    fetchTasks,
    addTask,
    editTask,
    removeTask,
    moveTask,
  } = useTaskStore();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalKey, setModalKey] = useState(0);

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
              onAddTask={(status) => {
                setModalKey((k) => k + 1);
                setModalState({ mode: "create", status });
              }}
              onEditTask={(task) => {
                setModalKey((k) => k + 1);
                setModalState({ mode: "edit", task });
              }}
            />
          ))}
        </div>
      </DndContext>
      {isLoading && (
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Spinner size="sm" />
          Loading tasks...
        </p>
      )}

      <TaskModal
        key={modalKey}
        open={modalState !== null}
        onOpenChange={(open) => !open && setModalState(null)}
        task={modalState?.mode === "edit" ? modalState.task : undefined}
        defaultStatus={modalState?.mode === "create" ? modalState.status : undefined}
        defaultDueDate={selectedDate}
        onSubmit={(draft) =>
          modalState?.mode === "edit"
            ? editTask(modalState.task.id, draft)
            : addTask(draft)
        }
        onDelete={removeTask}
      />
    </div>
  );
}