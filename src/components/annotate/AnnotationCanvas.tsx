"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import type Konva from "konva";
import {
  EyeIcon,
  EyeOffIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  PlusIcon,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ImageAsset, Point, Shape } from "@/types/annotation";

const EMPTY_SHAPES: Shape[] = [];

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

function ToolbarIconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" {...props} />}>
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
    (state) => state.shapesByImage[image.id] ?? EMPTY_SHAPES
  );
  const selectedShapeId = useAnnotationStore((state) => state.selectedShapeId);
  const addShape = useAnnotationStore((state) => state.addShape);
  const removeShape = useAnnotationStore((state) => state.removeShape);
  const selectShape = useAnnotationStore((state) => state.selectShape);
  const classes = useAnnotationStore((state) => state.classes);
  const activeClass = useAnnotationStore((state) => state.activeClass);
  const setActiveClass = useAnnotationStore((state) => state.setActiveClass);
  const addClass = useAnnotationStore((state) => state.addClass);

  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(1);
  const [shapesVisible, setShapesVisible] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);

  const baseScale = Math.min(1, STAGE_MAX_WIDTH / image.width);
  const scale = baseScale * zoom;
  const stageWidth = Math.round(image.width * scale);
  const stageHeight = Math.round(image.height * scale);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraftPoints([]);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        removeShape(selectedShapeId);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, removeShape]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    setDraftPoints((prev) => [...prev, { x: pos.x / scale, y: pos.y / scale }]);
  };

  const handleStageDblClick = () => {
    if (draftPoints.length >= 3) {
      addShape(draftPoints);
    }
    setDraftPoints([]);
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    addClass(newClassName);
    setNewClassName("");
    setIsAddClassOpen(false);
  };

  const setCursor = (cursor: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = cursor;
  };

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
            render={<Button variant="ghost" size="icon-sm" aria-label="Add class" />}
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
          label="Zoom out"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
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
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
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
          label={shapesVisible ? "Hide annotations" : "Show annotations"}
          aria-label={shapesVisible ? "Hide annotations" : "Show annotations"}
          onClick={() => setShapesVisible((v) => !v)}
        >
          {shapesVisible ? <EyeIcon /> : <EyeOffIcon />}
        </ToolbarIconButton>
      </div>

      <div className="relative w-fit max-w-full overflow-auto rounded-xl border bg-[repeating-conic-gradient(#eef0f2_0%_25%,transparent_0%_50%)] bg-size-[16px_16px] p-3 shadow-sm">
        {draftPoints.length > 0 && (
          <div className="absolute top-4 left-4 z-10 rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-sm">
            Drawing... {draftPoints.length} point{draftPoints.length === 1 ? "" : "s"}
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
          className="rounded-lg"
        >
          <Layer>
            {htmlImage && (
              <KonvaImage image={htmlImage} width={stageWidth} height={stageHeight} />
            )}

            {shapesVisible &&
              shapes.map((shape) => {
                const isSelected = shape.id === selectedShapeId;
                const isHovered = shape.id === hoveredShapeId;
                const color = isSelected ? "#ef4444" : colorForClass(shape.label);
                return (
                  <Line
                    key={shape.id}
                    points={shape.points.flatMap((p) => [p.x * scale, p.y * scale])}
                    closed
                    stroke={color}
                    strokeWidth={isSelected || isHovered ? 3 : 2}
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
                      setCursor("pointer")(e);
                    }}
                    onMouseLeave={(e) => {
                      setHoveredShapeId(null);
                      setCursor("crosshair")(e);
                    }}
                  />
                );
              })}

            {draftPoints.length > 0 && (
              <>
                <Line
                  points={draftPoints.flatMap((p) => [p.x * scale, p.y * scale])}
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
        Click to place polygon points, double-click to close the shape. Select
        a shape and press <kbd className="rounded border px-1 py-0.5 text-[10px]">Delete</kbd> to
        remove it, or <kbd className="rounded border px-1 py-0.5 text-[10px]">Esc</kbd> to cancel.
      </p>
    </div>
  );
}
