import { create } from "zustand";
import * as annotateApi from "@/lib/api/annotate";
import type { ImageAsset, Point, Shape } from "@/types/annotation";

const DEFAULT_CLASSES = ["Class 1", "Class 2", "Class 3"];
const AUTO_SAVE_DELAY_MS = 800;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AnnotationState {
  images: ImageAsset[];
  activeImageId: string | null;
  shapesByImage: Record<string, Shape[]>;
  selectedShapeId: string | null;
  isLoading: boolean;
  error: string | null;
  classes: string[];
  activeClass: string;
  saveStatus: SaveStatus;

  fetchImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  setActiveImage: (imageId: string) => Promise<void>;
  addShape: (points: Point[]) => void;
  removeShape: (shapeId: string) => void;
  setShapeLabel: (shapeId: string, label: string) => void;
  selectShape: (shapeId: string | null) => void;
  addClass: (name: string) => void;
  setActiveClass: (name: string) => void;
  saveShapes: (imageId?: string) => Promise<void>;
}

const autoSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleAutoSave(get: () => AnnotationState, imageId: string) {
  const existingTimer = autoSaveTimers[imageId];
  if (existingTimer) clearTimeout(existingTimer);
  autoSaveTimers[imageId] = setTimeout(() => {
    delete autoSaveTimers[imageId];
    get().saveShapes(imageId);
  }, AUTO_SAVE_DELAY_MS);
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  images: [],
  activeImageId: null,
  shapesByImage: {},
  selectedShapeId: null,
  isLoading: false,
  error: null,
  classes: DEFAULT_CLASSES,
  activeClass: DEFAULT_CLASSES[0],
  saveStatus: "idle",

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
    const shape: Shape = {
      id: crypto.randomUUID(),
      imageId,
      points,
      label: get().activeClass,
    };
    const existing = get().shapesByImage[imageId] ?? [];
    set({
      shapesByImage: { ...get().shapesByImage, [imageId]: [...existing, shape] },
      saveStatus: "idle",
    });
    scheduleAutoSave(get, imageId);
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
      saveStatus: "idle",
    });
    scheduleAutoSave(get, imageId);
  },

  setShapeLabel: (shapeId, label) => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    const existing = get().shapesByImage[imageId] ?? [];
    set({
      shapesByImage: {
        ...get().shapesByImage,
        [imageId]: existing.map((s) =>
          s.id === shapeId ? { ...s, label } : s
        ),
      },
      saveStatus: "idle",
    });
    scheduleAutoSave(get, imageId);
  },

  selectShape: (shapeId) => set({ selectedShapeId: shapeId }),

  addClass: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => ({
      classes: state.classes.includes(trimmed)
        ? state.classes
        : [...state.classes, trimmed],
      activeClass: trimmed,
    }));
  },

  setActiveClass: (name) => set({ activeClass: name }),

  saveShapes: async (imageId) => {
    const targetImageId = imageId ?? get().activeImageId;
    if (!targetImageId) return;
    set({ saveStatus: "saving", error: null });
    try {
      const shapes = await annotateApi.saveShapes(
        targetImageId,
        get().shapesByImage[targetImageId] ?? []
      );
      set({
        shapesByImage: { ...get().shapesByImage, [targetImageId]: shapes },
        saveStatus: "saved",
      });
    } catch {
      set({ error: "Could not save shapes", saveStatus: "error" });
    }
  },
}));
