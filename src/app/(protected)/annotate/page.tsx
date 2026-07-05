"use client";

import { useEffect } from "react";
import { ImageUploader } from "@/components/annotate/ImageUploader";
import { ImageStrip } from "@/components/annotate/ImageStrip";
import { AnnotationCanvas } from "@/components/annotate/AnnotationCanvas";
import { ShapeList } from "@/components/annotate/ShapeList";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAnnotationStore } from "@/store/useAnnotationStore";

const SAVE_STATUS_LABEL: Record<string, string> = {
  idle: "Unsaved changes",
  saving: "Saving...",
  saved: "Saved",
  error: "Save failed",
};

export default function AnnotatePage() {
  const {
    images,
    activeImageId,
    shapesByImage,
    selectedShapeId,
    classes,
    saveStatus,
    isLoading,
    error,
    fetchImages,
    setActiveImage,
    removeShape,
    selectShape,
    setShapeLabel,
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

      {isLoading && images.length === 0 ? (
        <div className="flex h-24 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
          <Spinner size="sm" />
          Loading images...
        </div>
      ) : (
        <ImageStrip
          images={images}
          activeImageId={activeImageId}
          onSelect={setActiveImage}
        />
      )}

      {activeImage ? (
        <div className="flex flex-1 gap-4">
          <AnnotationCanvas image={activeImage} />
          <div className="flex w-64 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Shapes</h2>
              <div className="flex items-center gap-2">
                <span
                  className={
                    saveStatus === "error"
                      ? "text-xs text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {SAVE_STATUS_LABEL[saveStatus]}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveShapes()}
                  disabled={saveStatus === "saving"}
                >
                  Save now
                </Button>
              </div>
            </div>
            <ShapeList
              shapes={shapes}
              classes={classes}
              selectedShapeId={selectedShapeId}
              onSelect={selectShape}
              onDelete={removeShape}
              onLabelChange={setShapeLabel}
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
