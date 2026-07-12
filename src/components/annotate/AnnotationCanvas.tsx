"use client";

import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line,
  Circle,
  Group,
} from "react-konva";
import type Konva from "konva";
import {
  EyeIcon,
  EyeOffIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  PlusIcon,
  PencilIcon,
  MousePointer2Icon,
  Undo2Icon,
  Redo2Icon,
  CheckCheckIcon,
} from "lucide-react";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { colorForClass } from "@/lib/annotation-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ImageAsset, Point, Shape } from "@/types/annotation";

const EMPTY_SHAPES: Shape[] = [];
const EMPTY_HISTORY: Shape[][] = [];

function useHtmlImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  return image;
}

const STAGE_MAX_WIDTH = 900;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  );
}

function ToolbarIconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" {...props} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface AnnotationCanvasProps {
  image: ImageAsset;
}

export function AnnotationCanvas({ image }: AnnotationCanvasProps) {
  const htmlImage = useHtmlImage(image.url);
  const shapes = useAnnotationStore(
    (state) => state.shapesByImage[image.id] ?? EMPTY_SHAPES,
  );
  const undoStack = useAnnotationStore(
    (state) => state.historyByImage[image.id] ?? EMPTY_HISTORY,
  );
  const redoStack = useAnnotationStore(
    (state) => state.futureByImage[image.id] ?? EMPTY_HISTORY,
  );
  const selectedShapeId = useAnnotationStore((state) => state.selectedShapeId);
  const addShape = useAnnotationStore((state) => state.addShape);
  const removeShape = useAnnotationStore((state) => state.removeShape);
  const selectShape = useAnnotationStore((state) => state.selectShape);
  const updateShapePoints = useAnnotationStore(
    (state) => state.updateShapePoints,
  );
  const undo = useAnnotationStore((state) => state.undo);
  const redo = useAnnotationStore((state) => state.redo);
  const classes = useAnnotationStore((state) => state.classes);
  const activeClass = useAnnotationStore((state) => state.activeClass);
  const setActiveClass = useAnnotationStore((state) => state.setActiveClass);
  const addClass = useAnnotationStore((state) => state.addClass);

  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isDrawMode, setIsDrawMode] = useState(true);
  const [showDraft, setShowDraft] = useState(true);
  const [showReviewed, setShowReviewed] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const panCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => panCleanupRef.current?.();
  }, []);

  const baseScale = Math.min(1, STAGE_MAX_WIDTH / image.width);
  const scale = baseScale * zoom;
  const stageWidth = Math.round(image.width * scale);
  const stageHeight = Math.round(image.height * scale);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      if (e.key === "Escape") {
        setDraftPoints([]);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        e.preventDefault();
        removeShape(selectedShapeId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, removeShape, undo, redo]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawMode) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    setDraftPoints((prev) => [...prev, { x: pos.x / scale, y: pos.y / scale }]);
  };

  const handleStageDblClick = () => {
    if (!isDrawMode) return;
    // Konva's own click/dblclick disambiguation forwards exactly one extra
    // "click" for the double-click gesture's first click before "dblclick"
    // fires (verified empirically — unlike raw DOM semantics, which fire
    // two), so handleStageClick already appended one redundant point at the
    // closing location. Drop it before closing the shape.
    const finalPoints = draftPoints.slice(0, -1);
    if (finalPoints.length >= 3) {
      addShape(finalPoints);
    }
    setDraftPoints([]);
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    addClass(newClassName);
    setNewClassName("");
    setIsAddClassOpen(false);
  };

  const setCursor =
    (cursor: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
      const container = e.target.getStage()?.container();
      if (container) container.style.cursor = cursor;
    };

  // Click-drag panning: only when clicking the empty canvas background in
  // select mode, so it doesn't fight with drawing new points or dragging a
  // shape/vertex (those are handled by Konva's own per-node drag).
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawMode) return;
    if (e.evt.button !== 0) return; // left click only, not middle/right
    const stage = e.target.getStage();
    const scrollEl = scrollContainerRef.current;
    if (!stage || !scrollEl) return;
    // The background image covers the whole stage, so e.target is that
    // Image node (not the Stage itself) for most clicks. Only bail out when
    // the click actually hit a shape outline or vertex handle.
    const targetClass = e.target.getClassName();
    if (targetClass === "Line" || targetClass === "Circle") return;

    // Defensively end any previous pan whose mouseup/blur we might have
    // missed, so listeners never stack.
    panCleanupRef.current?.();

    const startX = e.evt.clientX;
    const startY = e.evt.clientY;
    const startScrollLeft = scrollEl.scrollLeft;
    const startScrollTop = scrollEl.scrollTop;
    scrollEl.style.cursor = "grabbing";

    const handleMouseMove = (ev: MouseEvent) => {
      scrollEl.scrollLeft = startScrollLeft - (ev.clientX - startX);
      scrollEl.scrollTop = startScrollTop - (ev.clientY - startY);
    };
    const stopPanning = () => {
      scrollEl.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopPanning);
      window.removeEventListener("blur", stopPanning);
      panCleanupRef.current = null;
    };
    panCleanupRef.current = stopPanning;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopPanning);
    // If the window loses focus mid-drag (alt-tab, dragging the mouse
    // outside the OS window), no mouseup ever reaches us — end the pan here
    // too so the listeners and "grabbing" cursor don't get stuck forever.
    window.addEventListener("blur", stopPanning);
  };

  const isShapeVisible = (shape: Shape) =>
    (shape.status ?? "draft") === "reviewed" ? showReviewed : showDraft;

  const editableShape =
    !isDrawMode &&
    shapes.find((s) => s.id === selectedShapeId && isShapeVisible(s));

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-card p-2 shadow-sm">
        <span className="px-1.5 text-xs font-medium text-muted-foreground">
          Class
        </span>
        <Select
          value={activeClass}
          onValueChange={(value) => value && setActiveClass(value)}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue>
              {(value: string) => (
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForClass(value) }}
                  />
                  {value}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c} value={c}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: colorForClass(c) }}
                  />
                  {c}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Add class" />
            }
          >
            <PlusIcon />
          </PopoverTrigger>
          <PopoverContent className="flex w-56 flex-col gap-2" align="start">
            <p className="text-xs font-medium text-muted-foreground">
              New class name
            </p>
            <div className="flex gap-1.5">
              <Input
                autoFocus
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddClass();
                  }
                }}
                placeholder="e.g. Tumor"
                className="h-8"
              />
              <Button size="sm" className="h-8" onClick={handleAddClass}>
                Add
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="mx-1.5 h-6 w-px bg-border" />

        <ToolbarIconButton
          label={isDrawMode ? "Switch to select mode" : "Switch to draw mode"}
          aria-label={
            isDrawMode ? "Switch to select mode" : "Switch to draw mode"
          }
          className={isDrawMode ? "bg-primary/10 text-primary" : undefined}
          onClick={() => {
            setIsDrawMode((v) => !v);
            setDraftPoints([]);
          }}
        >
          {isDrawMode ? <PencilIcon /> : <MousePointer2Icon />}
        </ToolbarIconButton>

        <div className="mx-1.5 h-6 w-px bg-border" />

        <ToolbarIconButton
          label="Undo"
          aria-label="Undo"
          disabled={undoStack.length === 0}
          onClick={() => undo()}
        >
          <Undo2Icon />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Redo"
          aria-label="Redo"
          disabled={redoStack.length === 0}
          onClick={() => redo()}
        >
          <Redo2Icon />
        </ToolbarIconButton>

        <div className="mx-1.5 h-6 w-px bg-border" />

        <ToolbarIconButton
          label="Zoom out"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() =>
            setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
          }
        >
          <ZoomOutIcon />
        </ToolbarIconButton>
        <span className="w-11 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarIconButton
          label="Zoom in"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() =>
            setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
          }
        >
          <ZoomInIcon />
        </ToolbarIconButton>
        {zoom !== 1 && (
          <ToolbarIconButton
            label="Reset zoom"
            aria-label="Reset zoom"
            onClick={() => setZoom(1)}
          >
            <RotateCcwIcon />
          </ToolbarIconButton>
        )}

        <div className="mx-1.5 h-6 w-px bg-border" />

        <ToolbarIconButton
          label={
            showDraft ? "Hide draft annotations" : "Show draft annotations"
          }
          aria-label={
            showDraft ? "Hide draft annotations" : "Show draft annotations"
          }
          onClick={() => setShowDraft((v) => !v)}
        >
          {showDraft ? <EyeIcon /> : <EyeOffIcon />}
        </ToolbarIconButton>
        <ToolbarIconButton
          label={
            showReviewed
              ? "Hide reviewed annotations"
              : "Show reviewed annotations"
          }
          aria-label={
            showReviewed
              ? "Hide reviewed annotations"
              : "Show reviewed annotations"
          }
          className={showReviewed ? "text-emerald-600" : undefined}
          onClick={() => setShowReviewed((v) => !v)}
        >
          <CheckCheckIcon />
        </ToolbarIconButton>
      </div>

      <div
        ref={scrollContainerRef}
        className={cn(
          "relative w-fit max-w-full overflow-auto rounded-xl border bg-[repeating-conic-gradient(#eef0f2_0%_25%,transparent_0%_50%)] bg-size-[16px_16px] p-3 shadow-sm",
          isDrawMode ? "cursor-crosshair" : "cursor-grab",
        )}
      >
        {draftPoints.length > 0 && (
          <div className="absolute top-4 left-4 z-10 rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-sm">
            Drawing... {draftPoints.length} point
            {draftPoints.length === 1 ? "" : "s"}
          </div>
        )}
        {!isDrawMode && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-sm">
            <MousePointer2Icon className="size-3" />
            Select mode
          </div>
        )}

        {!htmlImage && (
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/40 text-sm text-muted-foreground"
            style={{ width: stageWidth + 24, height: stageHeight + 24 }}
          >
            <Spinner />
            Loading image...
          </div>
        )}
        <Stage
          width={stageWidth}
          height={stageHeight}
          onClick={handleStageClick}
          onDblClick={handleStageDblClick}
          onMouseDown={handleStageMouseDown}
          className="rounded-lg"
        >
          <Layer>
            {htmlImage && (
              <KonvaImage
                image={htmlImage}
                width={stageWidth}
                height={stageHeight}
              />
            )}

            {shapes.filter(isShapeVisible).map((shape) => {
              const isSelected = shape.id === selectedShapeId;
              const isHovered = shape.id === hoveredShapeId;
              const isReviewed = (shape.status ?? "draft") === "reviewed";
              const canEdit = !isDrawMode && isSelected;
              const color = isSelected ? "#ef4444" : colorForClass(shape.label);
              return (
                <Group
                  key={shape.id}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    setCursor("grabbing")(e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    const node = e.target;
                    const dx = node.x() / scale;
                    const dy = node.y() / scale;
                    if (dx !== 0 || dy !== 0) {
                      updateShapePoints(
                        shape.id,
                        shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                      );
                    }
                    node.position({ x: 0, y: 0 });
                    setCursor("grab")(e);
                  }}
                >
                  <Line
                    points={shape.points.flatMap((p) => [
                      p.x * scale,
                      p.y * scale,
                    ])}
                    closed
                    stroke={color}
                    strokeWidth={isSelected || isHovered ? 3 : 2}
                    dash={isReviewed ? undefined : [6, 3]}
                    fill={color + (isHovered && !isSelected ? "4d" : "33")}
                    shadowColor={isSelected ? color : undefined}
                    shadowBlur={isSelected ? 8 : 0}
                    shadowOpacity={isSelected ? 0.5 : 0}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      selectShape(shape.id);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredShapeId(shape.id);
                      setCursor(canEdit ? "move" : "pointer")(e);
                    }}
                    onMouseLeave={(e) => {
                      setHoveredShapeId(null);
                      setCursor(isDrawMode ? "crosshair" : "grab")(e);
                    }}
                  />
                </Group>
              );
            })}

            {/* Vertex handles for the selected, editable shape only. Rendered
                last (on top of every shape's Group) so a handle is never
                hidden behind a later-drawn, overlapping shape. */}
            {editableShape &&
              editableShape.points.map((p, i) => (
                <Circle
                  key={i}
                  x={p.x * scale}
                  y={p.y * scale}
                  radius={5}
                  fill="#ffffff"
                  stroke="#ef4444"
                  strokeWidth={2}
                  draggable
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    setCursor("grabbing")(e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    const node = e.target;
                    const newPoints = editableShape.points.map((pt, idx) =>
                      idx === i
                        ? { x: node.x() / scale, y: node.y() / scale }
                        : pt,
                    );
                    updateShapePoints(editableShape.id, newPoints);
                    setCursor("grab")(e);
                  }}
                  onMouseEnter={(e) => {
                    e.cancelBubble = true;
                    setCursor("grab")(e);
                  }}
                />
              ))}

            {draftPoints.length > 0 && (
              <>
                <Line
                  points={draftPoints.flatMap((p) => [
                    p.x * scale,
                    p.y * scale,
                  ])}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dash={[4, 4]}
                />
                {draftPoints.map((p, i) => (
                  <Circle
                    key={i}
                    x={p.x * scale}
                    y={p.y * scale}
                    radius={4}
                    fill="#3b82f6"
                  />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      </div>

      <p className="text-xs text-muted-foreground">
        {isDrawMode
          ? "Click to place polygon points, double-click to close the shape."
          : "Select a shape, then drag its outline to move it or drag a handle to reshape it. Drag empty canvas to pan."}{" "}
        Select a shape and press{" "}
        <kbd className="rounded border px-1 py-0.5 text-[10px]">Delete</kbd> to
        remove it,{" "}
        <kbd className="rounded border px-1 py-0.5 text-[10px]">Esc</kbd> to
        cancel, or{" "}
        <kbd className="rounded border px-1 py-0.5 text-[10px]">Ctrl+Z</kbd> to
        undo. Solid outlines are reviewed shapes, dashed are drafts.
      </p>
    </div>
  );
}
