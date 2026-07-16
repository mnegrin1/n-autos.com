"use client";

import React, { useState, useRef } from "react";
import styles from "./MediaUpload.module.css";

// Unified media item: uploaded file, YouTube URL, or existing server image/video
export interface MediaItem {
  kind: "file" | "youtube" | "existing";
  file?: File;
  youtubeUrl?: string;
  youtubeEmbedId?: string;
  url?: string; // For existing server images/videos
  isVideo?: boolean; // For existing server videos
}

function getYoutubeEmbedId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function getYoutubeThumbnail(embedId: string): string {
  return `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`;
}

interface MediaUploadProps {
  items: MediaItem[];
  setItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  accept: string;
  label: string;
  placeholder: string;
}

export default function MediaUpload({
  items,
  setItems,
  accept,
  label,
  placeholder,
}: MediaUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFiles = (newFiles: FileList) => {
    const validItems: MediaItem[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      const acceptsImg = accept.includes("image");
      const acceptsVid = accept.includes("video");

      if ((isImg && acceptsImg) || (isVid && acceptsVid)) {
        validItems.push({ kind: "file", file });
      }
    }
    setItems((prev) => [...prev, ...validItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleRemove = (indexToRemove: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddYoutube = () => {
    const urls = youtubeInput.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    const newItems: MediaItem[] = [];

    for (const url of urls) {
      const embedId = getYoutubeEmbedId(url);
      if (embedId) {
        // Avoid duplicates
        const alreadyExists = items.some(
          (item) => item.kind === "youtube" && item.youtubeEmbedId === embedId
        );
        if (!alreadyExists) {
          newItems.push({ kind: "youtube", youtubeUrl: url, youtubeEmbedId: embedId });
        }
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
    setYoutubeInput("");
  };

  const handleYoutubeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddYoutube();
    }
  };

  // ── Live reorder drag & drop ──
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make the ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.4";
    }
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedIndex(null);
    dragOverIndex.current = null;
  };

  const handleItemDragEnter = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    if (dragOverIndex.current === targetIndex) return;
    dragOverIndex.current = targetIndex;

    // Perform the live reorder
    setItems((prev) => {
      const reordered = [...prev];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, removed);
      return reordered;
    });
    setDraggedIndex(targetIndex);
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleItemDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={styles.uploadContainer}>
      <label className={styles.label}>{label}</label>
      
      {/* Drop Zone for files */}
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.active : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div className={styles.dropZoneContent}>
          <span className={styles.icon}>📥</span>
          <p>{placeholder}</p>
          <span className={styles.browseBtn}>Seleccionar archivos</span>
        </div>
      </div>

      {/* YouTube URL inline input */}
      <div className={styles.youtubeInputRow}>
        <div className={styles.youtubeIconWrapper}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </div>
        <input
          type="text"
          value={youtubeInput}
          onChange={(e) => setYoutubeInput(e.target.value)}
          onKeyDown={handleYoutubeKeyDown}
          placeholder="Pegar link de YouTube y presionar Enter o Agregar"
          className={styles.youtubeInput}
        />
        <button
          type="button"
          onClick={handleAddYoutube}
          disabled={!youtubeInput.trim()}
          className={styles.youtubeAddBtn}
        >
          Agregar
        </button>
      </div>

      {/* Unified Previews Grid */}
      {items.length > 0 && (
        <div className={styles.previewsGrid}>
          {items.map((item, idx) => {
            const isYoutube = item.kind === "youtube";
            const isFile = item.kind === "file";
            const isExisting = item.kind === "existing";
            const isVideo = (isFile && item.file?.type.startsWith("video/")) || (isExisting && item.isVideo);

            let previewSrc = "";
            if (isFile && item.file) {
              previewSrc = URL.createObjectURL(item.file);
            } else if (isYoutube && item.youtubeEmbedId) {
              previewSrc = getYoutubeThumbnail(item.youtubeEmbedId);
            } else if (isExisting && item.url) {
              previewSrc = item.url;
            }

            // Derive a stable key
            const itemKey = isYoutube
              ? `yt-${item.youtubeEmbedId}`
              : isExisting
              ? `ex-${item.url}`
              : `file-${item.file?.name}-${idx}`;

            // Derive label
            const labelName = isYoutube
              ? "YouTube"
              : isExisting
              ? (item.url?.split("/").pop()?.substring(0, 15) || "Imagen")
              : (item.file?.name.substring(0, 15) + "...");

            const labelSize = isYoutube
              ? "Video"
              : isExisting
              ? "Guardada"
              : `(${((item.file?.size || 0) / 1024 / 1024).toFixed(2)} MB)`;

            return (
              <div
                key={itemKey}
                className={`${styles.previewCard} ${draggedIndex === idx ? styles.dragging : ""}`}
                draggable
                onDragStart={(e) => handleItemDragStart(e, idx)}
                onDragEnd={handleItemDragEnd}
                onDragEnter={(e) => handleItemDragEnter(e, idx)}
                onDragOver={handleItemDragOver}
                onDrop={handleItemDrop}
              >
                <div className={styles.dragHandle}>⠿</div>
                <div className={styles.mediaWrapper}>
                  {isVideo && !isYoutube && previewSrc ? (
                    <video src={previewSrc} className={styles.mediaPreview} draggable={false} />
                  ) : (
                    <img src={previewSrc} alt="preview" className={styles.mediaPreview} draggable={false} />
                  )}

                  {/* YouTube play badge */}
                  {isYoutube && (
                    <div className={styles.ytBadge}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                  )}

                  {/* Native video badge */}
                  {isVideo && !isYoutube && (
                    <div className={styles.ytBadge}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <span className={styles.fileName}>{labelName}</span>
                  <span className={styles.fileSize}>{labelSize}</span>
                </div>

                {/* Remove button - visible on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className={styles.removeBtn}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
