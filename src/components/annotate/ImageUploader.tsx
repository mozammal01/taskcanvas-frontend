"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useAnnotationStore((state) => state.uploadImage);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadImage(file);
      }
    } finally {
      setIsUploading(false);
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
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? <Spinner size="sm" /> : <UploadIcon />}
        {isUploading ? "Uploading..." : "Upload images"}
      </Button>
    </div>
  );
}
