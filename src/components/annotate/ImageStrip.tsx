"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { ImageAsset } from "@/types/annotation";

interface ImageStripProps {
  images: ImageAsset[];
  activeImageId: string | null;
  onSelect: (imageId: string) => void;
}

function Thumbnail({
  image,
  isActive,
  onSelect,
}: {
  image: ImageAsset;
  isActive: boolean;
  onSelect: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border-2 transition-colors",
        isActive ? "border-primary" : "border-transparent"
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Spinner size="sm" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary backend-hosted URLs */}
      <img
        src={image.url}
        alt={image.name}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-20 w-28 object-cover transition-opacity",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
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
          <Thumbnail
            key={image.id}
            image={image}
            isActive={image.id === activeImageId}
            onSelect={() => onSelect(image.id)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
