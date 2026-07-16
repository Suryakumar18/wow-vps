'use client';

import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, Loader2, X, Film, Image as ImageIcon, AlertCircle } from 'lucide-react';

const token = () =>
  (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');

type Accept = 'image' | 'video' | 'both';

interface Props {
  /** current value (URL) — shows a preview if set */
  value?: string;
  /** called with the uploaded file's public URL */
  onUploaded: (url: string, meta?: { kind: 'image' | 'video'; name: string }) => void;
  /** which media types to allow */
  accept?: Accept;
  /** compact icon-button style (for inline rows) vs full dropzone */
  variant?: 'dropzone' | 'compact';
  /** which VPS subfolder to store the file in (e.g. 'products', 'brands', 'banners') — images only, defaults to 'products' server-side */
  folder?: string;
  label?: string;
  className?: string;
}

const acceptAttr = (a: Accept) =>
  a === 'image' ? 'image/*' : a === 'video' ? 'video/*' : 'image/*,video/*';

export default function MediaUploader({
  value, onUploaded, accept = 'image', variant = 'dropzone', folder, label, className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback((file: File) => {
    setError('');
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (accept === 'image' && !isImage) return setError('Please select an image file.');
    if (accept === 'video' && !isVideo) return setError('Please select a video file.');
    if (accept === 'both' && !isImage && !isVideo) return setError('Only images or videos are allowed.');

    const fd = new FormData();
    fd.append('file', file);
    if (folder) fd.append('folder', folder);

    // XHR so we can show upload progress (important for large videos)
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token()}`);
    setUploading(true);
    setProgress(0);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success) {
          onUploaded(res.url, { kind: res.kind, name: res.name });
        } else {
          setError(res.message || 'Upload failed.');
        }
      } catch {
        setError('Upload failed.');
      }
    };
    xhr.onerror = () => { setUploading(false); setError('Network error during upload.'); };
    xhr.send(fd);
  }, [accept, folder, onUploaded]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = '';
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const isVideoValue = value && /\.(mp4|webm|ogv|mov|mkv|avi)(\?|$)/i.test(value);
  const Icon = accept === 'video' ? Film : ImageIcon;

  /* Compact inline button (used next to URL fields) */
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title={`Upload ${accept === 'both' ? 'media' : accept}`}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors ${className}`}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {uploading ? `${progress}%` : (label || 'Upload')}
        </button>
        <input ref={inputRef} type="file" accept={acceptAttr(accept)} onChange={onPick} className="hidden" />
        {error && <span className="text-[11px] text-red-500 ml-1">{error}</span>}
      </>
    );
  }

  /* Full dropzone */
  return (
    <div className={className}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        {value ? (
          <div className="relative w-full flex flex-col items-center gap-2">
            {isVideoValue ? (
              <video src={value} className="max-h-40 rounded-lg" controls />
            ) : (
              <img src={value} alt="preview" className="max-h-40 rounded-lg object-contain" />
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUploaded('', undefined); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-500"
            >
              <X size={13} />
            </button>
            <span className="text-[11px] text-gray-400">Click to replace</span>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 py-3 w-full">
            <Loader2 size={22} className="animate-spin text-indigo-600" />
            <div className="w-full max-w-[180px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-500">Uploading… {progress}%</span>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Icon size={18} />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {label || `Upload ${accept === 'both' ? 'image or video' : accept}`}
            </span>
            <span className="text-[11px] text-gray-400">Click or drag &amp; drop · {accept === 'video' ? 'MP4, WebM up to 70MB' : accept === 'both' ? 'image or video up to 70MB' : 'JPG, PNG, WebP up to 70MB'}</span>
          </>
        )}
        <input ref={inputRef} type="file" accept={acceptAttr(accept)} onChange={onPick} className="hidden" />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-500">
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}
