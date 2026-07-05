import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "default" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "size-3.5",
  default: "size-5",
  lg: "size-8",
};

export function Spinner({ className, size = "default" }: SpinnerProps) {
  return (
    <Loader2Icon
      className={cn("animate-spin text-muted-foreground", SIZE_CLASSES[size], className)}
      aria-hidden="true"
    />
  );
}
