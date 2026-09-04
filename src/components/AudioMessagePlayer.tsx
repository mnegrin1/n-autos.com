"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, AlertCircle } from "lucide-react";

interface AudioMessagePlayerProps {
  src: string;
  duration?: number;
  isAgent?: boolean;
}

export default function AudioMessagePlayer({
  src,
  duration: initialDuration,
  isAgent = false,
}: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio play prevented/error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    return `${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`;
  };

  if (hasError) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", opacity: 0.8 }}>
        <AlertCircle size={16} style={{ color: isAgent ? "#fee2e2" : "#ef4444" }} />
        <span>Audio no disponible</span>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: "220px",
        maxWidth: "280px",
        padding: "6px 2px",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Botón de Play / Pause */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: isAgent ? "rgba(255, 255, 255, 0.95)" : "var(--primary, #0284c7)",
          color: isAgent ? "var(--primary, #0284c7)" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          transition: "transform 0.1s ease, background-color 0.2s",
        }}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: "2px" }} />}
      </button>

      {/* Barra de progreso y tiempos */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ position: "relative", width: "100%", height: "6px", display: "flex", alignItems: "center" }}>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              appearance: "none",
              background: isAgent
                ? `linear-gradient(to right, rgba(255,255,255,0.95) ${progress}%, rgba(255,255,255,0.3) ${progress}%)`
                : `linear-gradient(to right, var(--primary, #0284c7) ${progress}%, var(--border-color, #e2e8f0) ${progress}%)`,
              cursor: "pointer",
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            opacity: isAgent ? 0.9 : 0.7,
            fontWeight: 500,
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Botón de Velocidad (1x, 1.5x, 2x) */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        title="Velocidad de reproducción"
        style={{
          background: isAgent ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)",
          color: "inherit",
          border: isAgent ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid var(--border-color, #cbd5e1)",
          borderRadius: "12px",
          padding: "2px 6px",
          fontSize: "0.68rem",
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {playbackRate}x
      </button>
    </div>
  );
}
