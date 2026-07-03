"use client";

import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useAnnotationStore((state) => state.uploadImage);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadImage(file);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <UploadIcon />
        Upload images
      </Button>
    </div>
  );
}