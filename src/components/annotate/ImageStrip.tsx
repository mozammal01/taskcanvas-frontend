"use client";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ImageAsset } from "@/types/annotation";

interface ImageStripProps {
  images: ImageAsset[];
  activeImageId: string | null;
  onSelect: (imageId: string) => void;
}

export function ImageStrip({ images, activeImageId, onSelect }: ImageStripProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Upload an image to get started
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
      <div className="flex gap-2 p-2">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => onSelect(image.id)}
            className={cn(
              "shrink-0 overflow-hidden rounded-md border-2 transition-colors",
              image.id === activeImageId ? "border-primary" : "border-transparent"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary backend-hosted URLs */}
            <img
              src={image.url}
              alt={image.name}
              className="h-20 w-28 object-cover"
            />
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}