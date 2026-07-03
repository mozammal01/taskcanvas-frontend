import { create } from "zustand";
import * as annotateApi from "@/lib/api/annotate";
import type { ImageAsset, Point, Shape } from "@/types/annotation";

interface AnnotationState {
  images: ImageAsset[];
  activeImageId: string | null;
  shapesByImage: Record<string, Shape[]>;
  selectedShapeId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  setActiveImage: (imageId: string) => Promise<void>;
  addShape: (points: Point[]) => void;
  removeShape: (shapeId: string) => void;
  selectShape: (shapeId: string | null) => void;
  saveShapes: () => Promise<void>;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  images: [],
  activeImageId: null,
  shapesByImage: {},
  selectedShapeId: null,
  isLoading: false,
  error: null,

  fetchImages: async () => {
    set({ isLoading: true, error: null });
    try {
      const images = await annotateApi.fetchImages();
      set({ images, isLoading: false });
      if (!get().activeImageId && images.length > 0) {
        get().setActiveImage(images[0].id);
      }
    } catch {
      set({ error: "Could not load images", isLoading: false });
    }
  },

  uploadImage: async (file) => {
    try {
      const image = await annotateApi.uploadImage(file);
      set({ images: [...get().images, image] });
      get().setActiveImage(image.id);
    } catch {
      set({ error: "Could not upload image" });
    }
  },

  setActiveImage: async (imageId) => {
    set({ activeImageId: imageId, selectedShapeId: null });
    if (get().shapesByImage[imageId]) return;
    try {
      const shapes = await annotateApi.fetchShapes(imageId);
      set({ shapesByImage: { ...get().shapesByImage, [imageId]: shapes } });
    } catch {
      set({ error: "Could not load shapes for this image" });
    }
  },

  addShape: (points) => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    const shape: Shape = { id: crypto.randomUUID(), imageId, points };
    const existing = get().shapesByImage[imageId] ?? [];
    set({
      shapesByImage: { ...get().shapesByImage, [imageId]: [...existing, shape] },
    });
  },

  removeShape: (shapeId) => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    const existing = get().shapesByImage[imageId] ?? [];
    set({
      shapesByImage: {
        ...get().shapesByImage,
        [imageId]: existing.filter((s) => s.id !== shapeId),
      },
      selectedShapeId:
        get().selectedShapeId === shapeId ? null : get().selectedShapeId,
    });
  },

  selectShape: (shapeId) => set({ selectedShapeId: shapeId }),

  saveShapes: async () => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    set({ isLoading: true, error: null });
    try {
      const shapes = await annotateApi.saveShapes(
        imageId,
        get().shapesByImage[imageId] ?? []
      );
      set({
        shapesByImage: { ...get().shapesByImage, [imageId]: shapes },
        isLoading: false,
      });
    } catch {
      set({ error: "Could not save shapes", isLoading: false });
    }
  },
}));