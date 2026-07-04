"use client";

import { useEffect } from "react";
import { ImageUploader } from "@/components/annotate/ImageUploader";
import { ImageStrip } from "@/components/annotate/ImageStrip";
import { AnnotationCanvas } from "@/components/annotate/AnnotationCanvas";
import { ShapeList } from "@/components/annotate/ShapeList";
import { Button } from "@/components/ui/button";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export default function AnnotatePage() {
  const {
    images,
    activeImageId,
    shapesByImage,
    selectedShapeId,
    isLoading,
    error,
    fetchImages,
    setActiveImage,
    removeShape,
    selectShape,
    saveShapes,
  } = useAnnotationStore();

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const activeImage = images.find((img) => img.id === activeImageId) ?? null;
  const shapes = activeImageId ? shapesByImage[activeImageId] ?? [] : [];

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Annotate</h1>
        <ImageUploader />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ImageStrip
        images={images}
        activeImageId={activeImageId}
        onSelect={setActiveImage}
      />

      {activeImage ? (
        <div className="flex flex-1 gap-4">
          <AnnotationCanvas image={activeImage} />
          <div className="flex w-64 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Shapes</h2>
              <Button size="sm" onClick={() => saveShapes()} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
            <ShapeList
              shapes={shapes}
              selectedShapeId={selectedShapeId}
              onSelect={selectShape}
              onDelete={removeShape}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Upload an image to start annotating.
        </div>
      )}
    </div>
  );
}
