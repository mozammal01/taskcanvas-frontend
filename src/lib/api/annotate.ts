import { apiClient } from "@/lib/api/client";
import type { ImageAsset, Shape } from "@/types/annotation";

export async function fetchImages() {
  const { data } = await apiClient.get<ImageAsset[]>("/annotate/images/");
  return data;
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<ImageAsset>(
    "/annotate/images/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function fetchShapes(imageId: string) {
  const { data } = await apiClient.get<Shape[]>("/annotate/shapes/", {
    params: { image: imageId },
  });
  return data;
}

export async function saveShapes(imageId: string, shapes: Shape[]) {
  const { data } = await apiClient.put<Shape[]>(
    `/annotate/images/${imageId}/shapes/`,
    { shapes },
  );
  return data;
}

export async function deleteImage(imageId: string) {
  await apiClient.delete(`/annotate/images/${imageId}/`);
}
