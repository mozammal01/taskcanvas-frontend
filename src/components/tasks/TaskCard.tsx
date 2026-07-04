"use client";

import { useDraggable } from "@dnd-kit/core";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskPriority } from "@/types/task";

const PRIORITY_BADGE_VARIANT: Record<
  TaskPriority,
  "destructive" | "default" | "secondary"
> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { status: task.status } });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick(task)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "z-10 opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]}>
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarIcon className="size-3" />
        {format(parseISO(task.dueDate), "MMM d, yyyy")}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}