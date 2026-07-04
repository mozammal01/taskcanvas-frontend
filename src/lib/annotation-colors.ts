const CLASS_COLOR_PALETTE = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const FALLBACK_COLOR = "#6b7280";

export function colorForClass(label: string | undefined): string {
  if (!label) return FALLBACK_COLOR;
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return CLASS_COLOR_PALETTE[Math.abs(hash) % CLASS_COLOR_PALETTE.length];
}
