"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2, Play, Pause, Paperclip } from "lucide-react";

interface VoiceRecorderComposerProps {
  onSendAudio: (audioBlob: Blob, duration: number, fileName?: string) => Promise<void>;
  isPending: boolean;
  disabled?: boolean;
}

export default function VoiceRecorderComposer({
  onSendAudio,
  isPending,
  disabled = false,
}: VoiceRecorderComposerProps) {
  const [recorderState, setRecorderState] = useState<"idle" | "recording" | "preview">("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (disabled || isPending) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);

        // Apagar micrófono
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(200); // colectar chunks cada 200ms
      setRecorderState("recording");
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error al acceder al micrófono:", err);
      alert(
        "No se pudo acceder al micrófono. Por favor verifica los permisos en tu navegador."
      );
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecorderState("idle");
    setRecordSeconds(0);
    setIsPreviewPlaying(false);
  };

  const stopAndPreview = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecorderState("preview");
  };

  const handleSendRecorded = async () => {
    if (!audioBlob && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Si se presiona enviar directo mientras grababa
      if (timerRef.current) clearInterval(timerRef.current);
      
      const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
      mediaRecorderRef.current.onstop = async () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        await onSendAudio(finalBlob, Math.max(recordSeconds, 1));
        cancelRecording();
      };
      mediaRecorderRef.current.stop();
      return;
    }

    if (audioBlob) {
      await onSendAudio(audioBlob, Math.max(recordSeconds, 1));
      cancelRecording();
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsPreviewPlaying(true))
        .catch(() => setIsPreviewPlaying(false));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Calcular duración aproximada o enviar directamente
    onSendAudio(file, 0, file.name);
    e.target.value = "";
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ESTADO 1: Grabando actualmente
  if (recorderState === "recording") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          padding: "4px 8px",
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          borderRadius: "10px",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}
      >
        {/* Indicador parpadeante de grabación */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              boxShadow: "0 0 8px #ef4444",
              display: "inline-block",
              animation: "pulse 1.2s infinite ease-in-out",
            }}
          />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444" }}>
            Grabando nota de voz {formatSeconds(recordSeconds)}
          </span>
        </div>

        {/* Botón descartar grabación */}
        <button
          type="button"
          onClick={cancelRecording}
          title="Descartar nota"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            borderRadius: "6px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          <Trash2 size={18} />
        </button>

        {/* Botón pausar / escuchar preview */}
        <button
          type="button"
          onClick={stopAndPreview}
          title="Detener y escuchar"
          style={{
            background: "rgba(0, 0, 0, 0.05)",
            border: "1px solid var(--border-color, #cbd5e1)",
            color: "var(--text-color, #1e293b)",
            cursor: "pointer",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          <Square size={14} fill="currentColor" /> Escuchar
        </button>

        {/* Botón enviar nota directo */}
        <button
          type="button"
          onClick={handleSendRecorded}
          disabled={isPending}
          title="Enviar nota de voz"
          style={{
            backgroundColor: "#22c55e",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 700,
            boxShadow: "0 2px 6px rgba(34, 197, 94, 0.3)",
          }}
        >
          {isPending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
          <span>Enviar</span>
        </button>
      </div>
    );
  }

  // ESTADO 2: Preview antes de enviar
  if (recorderState === "preview") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          padding: "4px 8px",
          backgroundColor: "var(--surface-color, #ffffff)",
          borderRadius: "10px",
          border: "1px solid var(--border-color, #cbd5e1)",
        }}
      >
        {audioUrl && (
          <audio
            ref={previewAudioRef}
            src={audioUrl}
            onEnded={() => setIsPreviewPlaying(false)}
          />
        )}

        <button
          type="button"
          onClick={togglePreviewPlay}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "var(--primary, #0284c7)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {isPreviewPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: "2px" }} />}
        </button>

        <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>
          <span>Nota de voz ({formatSeconds(recordSeconds)})</span>
        </div>

        <button
          type="button"
          onClick={cancelRecording}
          title="Descartar nota"
          style={{
            background: "none",
            border: "none",
            color: "#ef4444",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={18} />
        </button>

        <button
          type="button"
          onClick={handleSendRecorded}
          disabled={isPending}
          title="Confirmar y Enviar"
          style={{
            backgroundColor: "#22c55e",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 700,
            boxShadow: "0 2px 6px rgba(34, 197, 94, 0.3)",
          }}
        >
          {isPending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
          <span>Enviar</span>
        </button>
      </div>
    );
  }

  // ESTADO 3: En reposo (Idle)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {/* Input oculto para adjuntar archivo de audio */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Botón adjuntar archivo de audio */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isPending}
        title="Adjuntar archivo de audio"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-color, #64748b)",
          opacity: 0.7,
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.7";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Paperclip size={18} />
      </button>

      {/* Botón Grabar con Micrófono */}
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || isPending}
        title="Grabar nota de voz"
        style={{
          background: "none",
          border: "none",
          color: "var(--primary, #0284c7)",
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(2, 132, 199, 0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Mic size={18} />
      </button>
    </div>
  );
}
