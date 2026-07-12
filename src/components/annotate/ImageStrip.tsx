"use client";

import { useState } from "react";
import {
  CheckIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { ImageAsset } from "@/types/annotation";

interface ImageStripProps {
  images: ImageAsset[];
  activeImageId: string | null;
  onSelect: (imageId: string) => void;
  onDelete: (imageId: string) => void;
}

function Thumbnail({
  image,
  isActive,
  onSelect,
  onDelete,
}: {
  image: ImageAsset;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-background transition-all duration-150",
        isActive
          ? "ring-primary"
          : "ring-transparent hover:ring-border hover:scale-[1.03]",
      )}
    >
      <button type="button" onClick={onSelect} className="block">
        {!loaded && !failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Spinner size="sm" />
          </div>
        )}
        {failed ? (
          <div className="flex h-20 w-28 flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
            <ImageIcon className="size-4" />
            <span className="text-[10px]">Failed to load</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary backend-hosted URLs
          <img
            src={image.url}
            alt={image.name}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "h-20 w-28 object-cover transition-opacity duration-200",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        {isActive && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <CheckIcon className="size-3" />
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/60 to-transparent px-1.5 pt-3 pb-1 text-left text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {image.name}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Delete ${image.name}`}
        onClick={(e) => {
          e.stopPropagation();
          if (
            window.confirm(
              `Delete "${image.name}"? This also removes its annotations.`,
            )
          ) {
            onDelete();
          }
        }}
        className="absolute top-1 left-1 flex size-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
      >
        <XIcon className="size-2.5" />
      </button>
    </div>
  );
}

export function ImageStrip({
  images,
  activeImageId,
  onSelect,
  onDelete,
}: ImageStripProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm text-muted-foreground">
        <ImageIcon className="size-5 text-muted-foreground/50" />
        Upload an image to get started
      </div>
    );
  }

  const activeIndex = images.findIndex((img) => img.id === activeImageId);
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < images.length - 1;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-medium text-muted-foreground">
          {activeIndex >= 0
            ? `Image ${activeIndex + 1} / ${images.length}`
            : `${images.length} image${images.length === 1 ? "" : "s"}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous image"
            disabled={!hasPrev}
            onClick={() => hasPrev && onSelect(images[activeIndex - 1].id)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next image"
            disabled={!hasNext}
            onClick={() => hasNext && onSelect(images[activeIndex + 1].id)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-xl border bg-card shadow-sm">
        <div className="flex gap-2.5 p-2.5">
          {images.map((image) => (
            <Thumbnail
              key={image.id}
              image={image}
              isActive={image.id === activeImageId}
              onSelect={() => onSelect(image.id)}
              onDelete={() => onDelete(image.id)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
