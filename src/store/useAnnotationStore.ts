import { create } from "zustand";
import * as annotateApi from "@/lib/api/annotate";
import type { ImageAsset, Point, Shape, ShapeStatus } from "@/types/annotation";

const DEFAULT_CLASSES = ["Class 1", "Class 2", "Class 3"];
const AUTO_SAVE_DELAY_MS = 800;
const MAX_HISTORY = 20;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AnnotationState {
  images: ImageAsset[];
  activeImageId: string | null;
  shapesByImage: Record<string, Shape[]>;
  historyByImage: Record<string, Shape[][]>;
  futureByImage: Record<string, Shape[][]>;
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
  setShapeStatus: (shapeId: string, status: ShapeStatus) => void;
  copyShapeToNextImage: (shapeId: string) => void;
  undo: (imageId?: string) => void;
  redo: (imageId?: string) => void;
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

/** Snapshots the pre-mutation shapes for `imageId` onto the undo stack and clears its redo stack. */
function recordHistory(
  get: () => AnnotationState,
  set: (partial: Partial<AnnotationState>) => void,
  imageId: string
) {
  const current = get().shapesByImage[imageId] ?? [];
  const stack = get().historyByImage[imageId] ?? [];
  set({
    historyByImage: {
      ...get().historyByImage,
      [imageId]: [...stack, current].slice(-MAX_HISTORY),
    },
    futureByImage: { ...get().futureByImage, [imageId]: [] },
  });
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  images: [],
  activeImageId: null,
  shapesByImage: {},
  historyByImage: {},
  futureByImage: {},
  selectedShapeId: null,
  isLoading: false,
  error: null,
  classes: DEFAULT_CLASSES,
  activeClass: DEFAULT_CLASSES[0],
  saveStatus: "idle",

  fetchImages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await annotateApi.fetchImages();
      const images = Array.isArray(response) ? response : [];
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
      const response = await annotateApi.fetchShapes(imageId);
      const shapes = Array.isArray(response) ? response : [];
      set({ shapesByImage: { ...get().shapesByImage, [imageId]: shapes } });
    } catch {
      set({ error: "Could not load shapes for this image" });
    }
  },

  addShape: (points) => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    recordHistory(get, set, imageId);
    const shape: Shape = {
      id: crypto.randomUUID(),
      imageId,
      points,
      label: get().activeClass,
      status: "draft",
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
    recordHistory(get, set, imageId);
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
    recordHistory(get, set, imageId);
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

  setShapeStatus: (shapeId, status) => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    recordHistory(get, set, imageId);
    const existing = get().shapesByImage[imageId] ?? [];
    set({
      shapesByImage: {
        ...get().shapesByImage,
        [imageId]: existing.map((s) =>
          s.id === shapeId ? { ...s, status } : s
        ),
      },
      saveStatus: "idle",
    });
    scheduleAutoSave(get, imageId);
  },

  copyShapeToNextImage: (shapeId) => {
    const imageId = get().activeImageId;
    if (!imageId) return;
    const images = get().images;
    const currentIndex = images.findIndex((img) => img.id === imageId);
    const nextImage = images[currentIndex + 1];
    if (!nextImage) return;
    const shape = (get().shapesByImage[imageId] ?? []).find((s) => s.id === shapeId);
    if (!shape) return;

    const newShape: Shape = {
      ...shape,
      id: crypto.randomUUID(),
      imageId: nextImage.id,
      status: "draft",
    };

    get().setActiveImage(nextImage.id).then(() => {
      recordHistory(get, set, nextImage.id);
      const existing = get().shapesByImage[nextImage.id] ?? [];
      set({
        shapesByImage: {
          ...get().shapesByImage,
          [nextImage.id]: [...existing, newShape],
        },
        selectedShapeId: newShape.id,
        saveStatus: "idle",
      });
      scheduleAutoSave(get, nextImage.id);
    });
  },

  undo: (imageId) => {
    const targetId = imageId ?? get().activeImageId;
    if (!targetId) return;
    const stack = get().historyByImage[targetId] ?? [];
    if (stack.length === 0) return;
    const previous = stack[stack.length - 1];
    const current = get().shapesByImage[targetId] ?? [];
    set({
      shapesByImage: { ...get().shapesByImage, [targetId]: previous },
      historyByImage: { ...get().historyByImage, [targetId]: stack.slice(0, -1) },
      futureByImage: {
        ...get().futureByImage,
        [targetId]: [...(get().futureByImage[targetId] ?? []), current],
      },
      saveStatus: "idle",
    });
    scheduleAutoSave(get, targetId);
  },

  redo: (imageId) => {
    const targetId = imageId ?? get().activeImageId;
    if (!targetId) return;
    const stack = get().futureByImage[targetId] ?? [];
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    const current = get().shapesByImage[targetId] ?? [];
    set({
      shapesByImage: { ...get().shapesByImage, [targetId]: next },
      futureByImage: { ...get().futureByImage, [targetId]: stack.slice(0, -1) },
      historyByImage: {
        ...get().historyByImage,
        [targetId]: [...(get().historyByImage[targetId] ?? []), current],
      },
      saveStatus: "idle",
    });
    scheduleAutoSave(get, targetId);
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
    const localShapes = get().shapesByImage[targetImageId] ?? [];
    set({ saveStatus: "saving", error: null });
    try {
      const response = await annotateApi.saveShapes(targetImageId, localShapes);
      // Only trust the server's shape list if it actually returned one; an
      // unexpected response shape (empty body, error page, etc.) should not
      // wipe out shapes the user just drew.
      const shapes = Array.isArray(response) ? response : localShapes;
      set({
        shapesByImage: { ...get().shapesByImage, [targetImageId]: shapes },
        saveStatus: "saved",
      });
    } catch {
      set({ error: "Could not save shapes", saveStatus: "error" });
    }
  },
}));
