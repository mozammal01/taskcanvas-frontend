export interface Point {
  x: number;
  y: number;
}

export interface ImageAsset {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
}

export type ShapeStatus = "draft" | "reviewed";

export interface Shape {
  id: string;
  imageId: string;
  points: Point[];
  label?: string;
  status?: ShapeStatus;
}