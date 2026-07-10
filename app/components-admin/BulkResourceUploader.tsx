'use client';

import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, RotateCcw, Check, ImagePlus, Film } from 'lucide-react';

const token = () =>
  (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');

interface Task {
  id: string;
  file: File;
  kind: 'image' | 'video';
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface Props {
  /** called once per uploaded image with its public VPS URL */
  onImageUploaded: (url: string) => void;
  /** called once per uploaded video with its public VPS URL */
  onVideoUploaded: (url: string) => void;
  /** VPS subfolder for images (videos always route to 'videos' server-side) */
  folder?: string;
  className?: string;
}

/** Small circular progress ring with a centered percentage label. */
function ProgressRing({ progress }: { progress: number }) {
  const r = 24, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
      <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={4} />
      <circle
        cx={28} cy={28} r={r} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (progress / 100) * c}
        style={{ transition: 'stroke-dashoffset 150ms linear' }}
      />
    </svg>
  );
}

export default function BulkResourceUploader({ onImageUploaded, onVideoUploaded, folder, className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const removeTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const startUpload = useCallback((task: Task) => {
    const fd = new FormData();
    fd.append('file', task.file);
    if (task.kind === 'image' && folder) fd.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token()}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) updateTask(task.id, { progress: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success) {
          updateTask(task.id, { status: 'done', progress: 100 });
          if (res.kind === 'video') onVideoUploaded(res.url);
          else onImageUploaded(res.url);
          setTimeout(() => removeTask(task.id), 1100);
        } else {
          updateTask(task.id, { status: 'error', error: res.message || 'Upload failed' });
        }
      } catch {
        updateTask(task.id, { status: 'error', error: 'Upload failed' });
      }
    };
    xhr.onerror = () => updateTask(task.id, { status: 'error', error: 'Network error' });
    xhr.send(fd);
  }, [folder, onImageUploaded, onVideoUploaded]);

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const newTasks: Task[] = files.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      kind: f.type.startsWith('video/') ? 'video' : 'image',
      previewUrl: URL.createObjectURL(f),
      progress: 0,
      status: 'uploading',
    }));
    if (newTasks.length === 0) return;
    setTasks(prev => [...prev, ...newTasks]);
    newTasks.forEach(startUpload);
  }, [startUpload]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const retry = (task: Task) => {
    updateTask(task.id, { status: 'uploading', progress: 0, error: undefined });
    startUpload(task);
  };

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UploadCloud size={18} />
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <ImagePlus size={14} className="text-gray-400" /> Upload Resources <Film size={14} className="text-gray-400" />
        </span>
        <span className="text-[11px] text-gray-400 text-center">
          Click or drag &amp; drop — select multiple photos and videos at once
        </span>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={onPick} className="hidden" />
      </div>

      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {tasks.map((t) => (
            <div key={t.id} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-black flex-shrink-0" title={t.file.name}>
              {t.kind === 'image' ? (
                <img src={t.previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={t.previewUrl} muted className="w-full h-full object-cover" />
              )}

              {t.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <ProgressRing progress={t.progress} />
                  <span className="relative text-white text-[10px] font-bold">{t.progress}%</span>
                </div>
              )}

              {t.status === 'done' && (
                <div className="absolute inset-0 bg-emerald-600/70 flex items-center justify-center">
                  <Check size={18} className="text-white" strokeWidth={3} />
                </div>
              )}

              {t.status === 'error' && (
                <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center gap-0.5 p-0.5">
                  <button type="button" onClick={(e) => { e.stopPropagation(); retry(t); }} className="text-white hover:scale-110 transition-transform">
                    <RotateCcw size={14} />
                  </button>
                  <span className="text-white text-[8px] leading-none text-center line-clamp-2">{t.error}</span>
                </div>
              )}

              {t.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center text-gray-500 hover:text-red-500"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
