"use client";

import { useRef, useState } from "react";
import { Upload, Link2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string; // newline-separated URLs/data-URLs
  onChange: (v: string) => void;
  rows?: number;
}

/**
 * Image field that supports BOTH:
 *  - Pasting image URLs (one per line)
 *  - Uploading images from your computer (converted to base64 data URLs)
 *
 * Base64 data URLs work in the sandbox AND on Vercel (no filesystem needed).
 * For production with many large images, consider S3/Cloudinary instead.
 */
export function ImageUploader({ value, onChange, rows = 3 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
  const urlCount = lines.filter((l) => l.startsWith("http")).length;
  const uploadCount = lines.length - urlCount;

  const addImages = (newDataUrls: string[]) => {
    const existing = value.split("\n").map((l) => l.trim()).filter(Boolean);
    const combined = [...existing, ...newDataUrls];
    onChange(combined.join("\n"));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const promises = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, 8) // max 8 at a time
        .map((file) => readFileAsDataUrl(file));
      const dataUrls = await Promise.all(promises);
      addImages(dataUrls);
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) => {
    const next = lines.filter((_, i) => i !== idx);
    onChange(next.join("\n"));
  };

  return (
    <div className="space-y-2">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Upload className={cn("size-5", dragOver ? "text-primary" : "text-muted-foreground")} />
        <p className="mt-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-primary hover:underline"
          >
            Click to upload
          </button>{" "}
          or drag & drop
        </p>
        <p className="text-[11px] text-muted-foreground/70">PNG, JPG, WebP · up to 8 at once</p>
      </div>

      {/* URL textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={"Paste image URLs here (one per line)\nhttps://images.unsplash.com/photo-…"}
          className="pr-10"
        />
        <Link2 className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
      </div>

      {/* Count + upload button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {lines.length > 0
            ? `${lines.length} image${lines.length > 1 ? "s" : ""} (${urlCount} URL${urlCount !== 1 ? "s" : ""}, ${uploadCount} uploaded)`
            : "No images yet"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          Upload
        </Button>
      </div>

      {/* Thumbnails */}
      {lines.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {lines.map((src, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              { }
              <img
                src={src}
                alt={`Image ${idx + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white">
                {src.startsWith("http") ? <Link2 className="size-2.5" /> : <ImageIcon className="size-2.5" />}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Single image field — for destinations (one image).
 * Supports upload + URL paste + thumbnail preview.
 */
export function SingleImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          { }
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-2.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid h-16 w-20 shrink-0 place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </button>
      )}
      <div className="flex-1 space-y-1.5">
        <Input
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={value.startsWith("data:") ? "✓ Uploaded from computer" : "https://…"}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          Upload from computer
        </Button>
      </div>
    </div>
  );
}
