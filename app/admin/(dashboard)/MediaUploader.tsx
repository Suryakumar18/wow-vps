"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { AlertCircle, Film, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";

type Accept = "image" | "video";

interface Props {
  /** Current URLs. Uploads append; the ✕ on a tile removes one. */
  values: string[];
  onChange: (next: string[]) => void;
  accept?: Accept;
  /** VPS subfolder for images (`products`, `banners`, …). Videos always go to `videos`. */
  folder?: string;
  label?: string;
  className?: string;
}

/**
 * Uploads media to the VPS via `/api/admin/upload` and hands back public URLs.
 *
 * Uses XHR rather than `fetch` purely for `upload.onprogress` — a 70MB video
 * needs a real progress bar, and fetch can't report request progress.
 */
export default function MediaUploader({
  values,
  onChange,
  accept = "image",
  folder,
  label,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const uploadOne = useCallback(
    (file: File) =>
      new Promise<string | null>((resolve) => {
        const fd = new FormData();
        fd.append("file", file);
        if (folder) fd.append("folder", folder);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && res.success) resolve(res.url as string);
            else {
              setError(res.message || "Upload failed.");
              resolve(null);
            }
          } catch {
            setError("Upload failed.");
            resolve(null);
          }
        };
        xhr.onerror = () => {
          setError("Network error during upload.");
          resolve(null);
        };
        xhr.send(fd);
      }),
    [folder],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError("");
      const wanted = files.filter((f) => f.type.startsWith(`${accept}/`));
      if (wanted.length === 0) {
        setError(`Please choose ${accept === "video" ? "a video" : "an image"} file.`);
        return;
      }

      setUploading(true);
      setProgress(0);
      const uploaded: string[] = [];
      // Sequential rather than parallel: each SFTP upload opens its own SSH
      // connection, and a batch of parallel 70MB writes starves the VPS.
      for (const file of wanted) {
        const url = await uploadOne(file);
        if (url) uploaded.push(url);
      }
      setUploading(false);
      setProgress(0);
      if (uploaded.length) onChange([...values, ...uploaded]);
    },
    [accept, onChange, uploadOne, values],
  );

  const removeAt = (index: number) => onChange(values.filter((_, i) => i !== index));

  const Icon = accept === "video" ? Film : ImageIcon;

  return (
    <div className={className}>
      {values.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {values.map((url, i) => (
            <li key={`${url}-${i}`} className="relative">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-line bg-mist">
                {accept === "video" ? (
                  <video src={url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" unoptimized />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${accept} ${i + 1}`}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-white text-slate-500 shadow-card transition-colors hover:text-[#B91C1C]"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(Array.from(e.dataTransfer.files ?? []));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors",
          dragOver ? "border-gold-500 bg-gold-50" : "border-line hover:border-gold-300 hover:bg-mist",
          uploading && "cursor-wait",
        )}
      >
        {uploading ? (
          <div className="flex w-full flex-col items-center gap-2 py-2">
            <Loader2 size={20} className="animate-spin text-gold-600" aria-hidden="true" />
            <div className="h-1.5 w-full max-w-[11rem] overflow-hidden rounded-full bg-mist">
              <div className="h-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-nano text-slate-500">Uploading… {progress}%</span>
          </div>
        ) : (
          <>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-50 text-gold-600">
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="text-micro font-semibold text-ink">
              {label || (accept === "video" ? "Upload videos" : "Upload images")}
            </span>
            <span className="text-nano text-slate-500">
              Click or drag &amp; drop ·{" "}
              {accept === "video" ? "MP4, WebM up to 70MB" : "JPG, PNG, WebP up to 70MB"}
            </span>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={`${accept}/*`}
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-nano text-[#B91C1C]">
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
