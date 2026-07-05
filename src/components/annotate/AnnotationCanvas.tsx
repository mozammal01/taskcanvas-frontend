"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import type Konva from "konva";
import {
  EyeIcon,
  EyeOffIcon,
  ZoomInIcon,
  ZoomOutIcon,
  PlusIcon,
} from "lucide-react";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { colorForClass } from "@/lib/annotation-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    addClass(newClassName);
    setNewClassName("");
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Click to place polygon points, double-click to close the shape. Select
        a shape and press Delete to remove it, or Escape to cancel drawing.
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
        <span className="text-xs font-medium text-muted-foreground">Class</span>
        <Select
          value={activeClass}
          onValueChange={(value) => value && setActiveClass(value)}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue>
              {(value: string) => (
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
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
        <Input
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddClass();
            }
          }}
          placeholder="New class name"
          className="h-8 w-32"
        />
        <Button variant="outline" size="icon-sm" aria-label="Add class" onClick={handleAddClass}>
          <PlusIcon />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
        >
          <ZoomOutIcon />
        </Button>
        <span className="w-10 text-center text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
        >
          <ZoomInIcon />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShapesVisible((v) => !v)}
        >
          {shapesVisible ? <EyeIcon /> : <EyeOffIcon />}
          {shapesVisible ? "Hide annotations" : "Show annotations"}
        </Button>
      </div>

      <div className="relative w-fit max-w-full overflow-auto rounded-lg border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-size-[16px_16px] p-2">
        {!htmlImage && (
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/40 text-sm text-muted-foreground"
            style={{ width: stageWidth + 16, height: stageHeight + 16 }}
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
        >
          <Layer>
            {htmlImage && (
              <KonvaImage image={htmlImage} width={stageWidth} height={stageHeight} />
            )}

            {shapesVisible &&
              shapes.map((shape) => {
                const color =
                  shape.id === selectedShapeId
                    ? "#ef4444"
                    : colorForClass(shape.label);
                return (
                  <Line
                    key={shape.id}
                    points={shape.points.flatMap((p) => [p.x * scale, p.y * scale])}
                    closed
                    stroke={color}
                    strokeWidth={2}
                    fill={color + "33"}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      selectShape(shape.id);
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
    </div>
  );
}
