"use client";

import { Trash2Icon, ShapesIcon, CopyIcon, CheckCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorForClass } from "@/lib/annotation-colors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Shape, ShapeStatus } from "@/types/annotation";

interface ShapeListProps {
  shapes: Shape[];
  classes: string[];
  selectedShapeId: string | null;
  canCopy: boolean;
  onSelect: (shapeId: string) => void;
  onDelete: (shapeId: string) => void;
  onLabelChange: (shapeId: string, label: string) => void;
  onStatusChange: (shapeId: string, status: ShapeStatus) => void;
  onCopy: (shapeId: string) => void;
}

export function ShapeList({
  shapes,
  classes,
  selectedShapeId,
  canCopy,
  onSelect,
  onDelete,
  onLabelChange,
  onStatusChange,
  onCopy,
}: ShapeListProps) {
  if (shapes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <ShapesIcon className="size-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No shapes drawn on this image yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {shapes.map((shape, index) => {
        const status: ShapeStatus = shape.status ?? "draft";
        const isReviewed = status === "reviewed";
        return (
          <li
            key={shape.id}
            className={cn(
              "flex flex-col gap-1.5 rounded-lg border px-2.5 py-2 text-sm transition-colors",
              shape.id === selectedShapeId
                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                : "border-transparent bg-muted/40 hover:bg-muted"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                onClick={() => onSelect(shape.id)}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorForClass(shape.label) }}
                />
                <span className="truncate font-medium">Polygon {index + 1}</span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete polygon ${index + 1}`}
                onClick={() => onDelete(shape.id)}
              >
                <Trash2Icon />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 pl-4">
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {shape.points.length} pts
              </span>
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
            </div>

            <div className="flex items-center justify-between gap-2 pl-4">
              <button type="button" onClick={() => onStatusChange(shape.id, isReviewed ? "draft" : "reviewed")}>
                <Badge
                  variant={isReviewed ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer gap-1",
                    isReviewed && "bg-emerald-600 hover:bg-emerald-600/80"
                  )}
                >
                  <CheckCheckIcon className="size-3" />
                  {isReviewed ? "Reviewed" : "Mark reviewed"}
                </Badge>
              </button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!canCopy}
                      aria-label="Copy to next image"
                      onClick={() => onCopy(shape.id)}
                    />
                  }
                >
                  <CopyIcon />
                </TooltipTrigger>
                <TooltipContent>Copy to next image</TooltipContent>
              </Tooltip>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
