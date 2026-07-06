"use client";

import { useState } from "react";
import { CheckIcon, ImageIcon } from "lucide-react";
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
        "group relative shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-background transition-all duration-150",
        isActive
          ? "ring-primary"
          : "ring-transparent hover:ring-border hover:scale-[1.03]"
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
          "h-20 w-28 object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
      {isActive && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <CheckIcon className="size-3" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/60 to-transparent px-1.5 pt-3 pb-1 text-left text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {image.name}
      </span>
    </button>
  );
}

export function ImageStrip({ images, activeImageId, onSelect }: ImageStripProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm text-muted-foreground">
        <ImageIcon className="size-5 text-muted-foreground/50" />
        Upload an image to get started
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-xl border bg-card shadow-sm">
      <div className="flex gap-2.5 p-2.5">
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
