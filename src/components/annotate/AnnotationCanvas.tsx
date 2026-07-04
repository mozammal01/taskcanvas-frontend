"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle } from "react-konva";
import type Konva from "konva";
import { useAnnotationStore } from "@/store/useAnnotationStore";
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

  const [draftPoints, setDraftPoints] = useState<Point[]>([]);

  const scale = Math.min(1, STAGE_MAX_WIDTH / image.width);
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

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Click to place polygon points, double-click to close the shape. Select
        a shape and press Delete to remove it, or Escape to cancel drawing.
      </p>
      <div className="w-fit overflow-auto rounded-lg border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-size-[16px_16px] p-2">
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

            {shapes.map((shape) => (
              <Line
                key={shape.id}
                points={shape.points.flatMap((p) => [p.x * scale, p.y * scale])}
                closed
                stroke={shape.id === selectedShapeId ? "#ef4444" : "#22c55e"}
                strokeWidth={2}
                fill={
                  shape.id === selectedShapeId
                    ? "rgba(239,68,68,0.2)"
                    : "rgba(34,197,94,0.2)"
                }
                onClick={(e) => {
                  e.cancelBubble = true;
                  selectShape(shape.id);
                }}
              />
            ))}

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
