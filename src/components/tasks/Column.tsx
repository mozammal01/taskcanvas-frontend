"use client";

import { useDroppable } from "@dnd-kit/core";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Task, TaskStatus } from "@/types/task";

interface ColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function Column({ status, label, tasks, onAddTask, onEditTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-full min-w-64 flex-1 flex-col rounded-xl bg-muted/50">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Add task to ${label}`}
          onClick={() => onAddTask(status)}
        >
          <PlusIcon />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-xl p-3 pt-0 transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            No tasks for this day
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onEditTask} />
        ))}
      </div>
    </div>
  );
}