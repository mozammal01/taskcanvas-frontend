"use client";

import { useEffect } from "react";
import { ImagePlusIcon } from "lucide-react";
import { ImageUploader } from "@/components/annotate/ImageUploader";
import { ImageStrip } from "@/components/annotate/ImageStrip";
import { AnnotationCanvas } from "@/components/annotate/AnnotationCanvas";
import { ShapeList } from "@/components/annotate/ShapeList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
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
    setShapeStatus,
    copyShapeToNextImage,
    saveShapes,
  } = useAnnotationStore();

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const activeImage = images.find((img) => img.id === activeImageId) ?? null;
  const activeIndex = images.findIndex((img) => img.id === activeImageId);
  const canCopyToNext = activeIndex >= 0 && activeIndex < images.length - 1;
  const shapes = activeImageId ? shapesByImage[activeImageId] ?? [] : [];

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-muted/20 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Annotate</h1>
          <p className="text-sm text-muted-foreground">
            Upload images, draw polygons, and label your annotations.
          </p>
        </div>
        <ImageUploader />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading && images.length === 0 ? (
        <div className="flex h-24 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
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
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <AnnotationCanvas image={activeImage} />

          <div className="flex w-full shrink-0 flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm lg:w-72">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold">Shapes</h2>
                <Badge variant="secondary">{shapes.length}</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveShapes()}
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" && <Spinner size="sm" />}
                Save now
              </Button>
            </div>

            <div
              className={cn(
                "flex items-center gap-1.5 text-xs",
                saveStatus === "error"
                  ? "text-destructive"
                  : saveStatus === "saved"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  saveStatus === "saving" && "animate-pulse bg-amber-500",
                  saveStatus === "saved" && "bg-emerald-500",
                  saveStatus === "error" && "bg-destructive",
                  saveStatus === "idle" && "bg-muted-foreground/40"
                )}
              />
              {SAVE_STATUS_LABEL[saveStatus]}
            </div>

            <ShapeList
              shapes={shapes}
              classes={classes}
              selectedShapeId={selectedShapeId}
              canCopy={canCopyToNext}
              onSelect={selectShape}
              onDelete={removeShape}
              onLabelChange={setShapeLabel}
              onStatusChange={setShapeStatus}
              onCopy={copyShapeToNextImage}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <ImagePlusIcon className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No image selected</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Upload an image above to start drawing polygon annotations.
          </p>
        </div>
      )}
    </div>
  );
}
