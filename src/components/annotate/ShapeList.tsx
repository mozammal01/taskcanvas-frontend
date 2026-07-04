"use client";

import { Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Shape } from "@/types/annotation";

interface ShapeListProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onSelect: (shapeId: string) => void;
  onDelete: (shapeId: string) => void;
}

export function ShapeList({
  shapes,
  selectedShapeId,
  onSelect,
  onDelete,
}: ShapeListProps) {
  if (shapes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No shapes drawn on this image yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {shapes.map((shape, index) => (
        <li
          key={shape.id}
          className={cn(
            "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm",
            shape.id === selectedShapeId && "border-primary bg-primary/5"
          )}
        >
          <button
            type="button"
            className="flex-1 text-left"
            onClick={() => onSelect(shape.id)}
          >
            Polygon {index + 1}
            <span className="ml-1 text-xs text-muted-foreground">
              ({shape.points.length} points)
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete polygon ${index + 1}`}
            onClick={() => onDelete(shape.id)}
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
    </ul>
  );
}
