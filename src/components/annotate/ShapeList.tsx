"use client";

import { Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorForClass } from "@/lib/annotation-colors";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Shape } from "@/types/annotation";

interface ShapeListProps {
  shapes: Shape[];
  classes: string[];
  selectedShapeId: string | null;
  onSelect: (shapeId: string) => void;
  onDelete: (shapeId: string) => void;
  onLabelChange: (shapeId: string, label: string) => void;
}

export function ShapeList({
  shapes,
  classes,
  selectedShapeId,
  onSelect,
  onDelete,
  onLabelChange,
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
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm",
            shape.id === selectedShapeId && "border-primary bg-primary/5"
          )}
        >
          <button
            type="button"
            className="flex flex-1 items-center gap-1.5 text-left"
            onClick={() => onSelect(shape.id)}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorForClass(shape.label) }}
            />
            Polygon {index + 1}
            <span className="text-xs text-muted-foreground">
              ({shape.points.length} points)
            </span>
          </button>
          <Select
            value={shape.label ?? classes[0]}
            onValueChange={(label) => label && onLabelChange(shape.id, label)}
          >
            <SelectTrigger className="h-7 w-24 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
