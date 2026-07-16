"use client";

import { useState, useEffect, useCallback } from "react";

export interface UnifiedMediaItem {
  type: "image" | "video" | "youtube";
  src: string;
  embedId?: string;
}

function getYoutubeThumbnail(embedId: string): string {
  return `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`;
}

export default function VehicleGallery({
  media,
  title,
}: {
  media: UnifiedMediaItem[];
  title: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalItems = media.length;

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxOpen, goNext, goPrev]);

  if (!media || media.length === 0) return null;

  const activeItem = media[activeIndex];
  const gridImages = media.slice(0, 5);
  const remaining = totalItems - 5;

  return (
    <>
      {/* ═══════════════ GALLERY GRID ═══════════════ */}
      <div style={gridStyles.container}>
        {/* Main hero tile */}
        <div
          style={{ ...gridStyles.heroTile, cursor: "pointer" }}
          onClick={() => openLightbox(0)}
        >
          {media[0]?.type === "image" ? (
            <img
              src={media[0].src}
              alt={title}
              style={gridStyles.img}
            />
          ) : media[0]?.type === "youtube" && media[0].embedId ? (
            <div style={gridStyles.ytThumb}>
              <img
                src={getYoutubeThumbnail(media[0].embedId)}
                alt="Video"
                style={gridStyles.img}
              />
              <div style={gridStyles.playOverlay}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
          ) : media[0]?.type === "video" ? (
            <div style={gridStyles.ytThumb}>
              <video
                src={media[0].src}
                style={gridStyles.img}
                muted
                playsInline
              />
              <div style={gridStyles.playOverlay}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
          ) : null}
        </div>

        {/* Secondary tiles */}
        <div style={gridStyles.secondaryGrid}>
          {gridImages.slice(1, 5).map((item, idx) => (
            <div
              key={idx}
              style={{ ...gridStyles.tile, cursor: "pointer", position: "relative" }}
              onClick={() => openLightbox(idx + 1)}
            >
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={`${title} - ${idx + 2}`}
                  style={gridStyles.img}
                />
              ) : item.type === "youtube" && item.embedId ? (
                <div style={gridStyles.ytThumb}>
                  <img
                    src={getYoutubeThumbnail(item.embedId)}
                    alt="Video"
                    style={gridStyles.img}
                  />
                  <div style={gridStyles.playOverlaySmall}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                </div>
              ) : item.type === "video" ? (
                <div style={gridStyles.ytThumb}>
                  <video
                    src={item.src}
                    style={gridStyles.img}
                    muted
                    playsInline
                  />
                  <div style={gridStyles.playOverlaySmall}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                </div>
              ) : null}

              {/* "+N more" badge on last visible tile */}
              {idx === 3 && remaining > 0 && (
                <div style={gridStyles.moreBadge}>
                  +{remaining} más
                </div>
              )}
            </div>
          ))}
        </div>

        {/* "Ver todas" button */}
        <button
          onClick={() => openLightbox(0)}
          style={gridStyles.viewAllBtn}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Ver {totalItems} elementos
        </button>
      </div>

      {/* ═══════════════ LIGHTBOX ═══════════════ */}
      {lightboxOpen && (
        <div
          style={lbStyles.overlay}
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            style={lbStyles.closeBtn}
            type="button"
            aria-label="Cerrar"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Counter */}
          <div style={lbStyles.counter}>
            {activeIndex + 1} / {totalItems}
          </div>

          {/* Prev Button */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            style={{ ...lbStyles.navBtn, left: "1rem" }}
            type="button"
            aria-label="Anterior"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            style={{ ...lbStyles.navBtn, right: "1rem" }}
            type="button"
            aria-label="Siguiente"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

          {/* Main Media Display */}
          <div
            style={lbStyles.mediaContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {activeItem?.type === "image" ? (
              <img
                src={activeItem.src}
                alt={`${title} - ${activeIndex + 1}`}
                style={lbStyles.mediaImg}
              />
            ) : activeItem?.type === "youtube" && activeItem.embedId ? (
              <div style={lbStyles.ytContainer}>
                <iframe
                  src={`https://www.youtube.com/embed/${activeItem.embedId}?autoplay=1`}
                  title={`YouTube video - ${activeIndex + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={lbStyles.ytIframe}
                />
              </div>
            ) : activeItem?.type === "video" ? (
              <div style={lbStyles.ytContainer}>
                <video
                  src={activeItem.src}
                  controls
                  autoPlay
                  style={lbStyles.ytIframe}
                />
              </div>
            ) : null}
          </div>

          {/* Thumbnail Strip */}
          <div
            style={lbStyles.thumbStrip}
            onClick={(e) => e.stopPropagation()}
          >
            {media.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  ...lbStyles.thumb,
                  border: idx === activeIndex ? "2px solid white" : "2px solid transparent",
                  opacity: idx === activeIndex ? 1 : 0.5,
                }}
                type="button"
              >
                {item.type === "image" ? (
                  <img src={item.src} alt="" style={lbStyles.thumbImg} />
                ) : item.type === "youtube" && item.embedId ? (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <img src={getYoutubeThumbnail(item.embedId)} alt="" style={lbStyles.thumbImg} />
                    <div style={lbStyles.thumbPlay}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                  </div>
                ) : item.type === "video" ? (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <video src={item.src} style={lbStyles.thumbImg} muted />
                    <div style={lbStyles.thumbPlay}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════ INLINE STYLES ═══════════════ */

const gridStyles: Record<string, React.CSSProperties> = {
  container: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "0.5rem",
    borderRadius: "16px",
    overflow: "hidden",
    position: "relative",
    maxHeight: "480px",
  },
  heroTile: {
    overflow: "hidden",
    position: "relative",
  },
  secondaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "0.5rem",
  },
  tile: {
    overflow: "hidden",
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s ease",
  },
  ytThumb: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: "50%",
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "4px",
  },
  playOverlaySmall: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "2px",
  },
  moreBadge: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1.25rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    pointerEvents: "none",
  },
  viewAllBtn: {
    position: "absolute",
    bottom: "1rem",
    right: "1rem",
    backgroundColor: "rgba(255,255,255,0.95)",
    color: "#111",
    border: "none",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 2,
    fontFamily: "inherit",
  },
};

const lbStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    zIndex: 10,
    padding: "0.5rem",
    borderRadius: "50%",
    transition: "background 0.2s",
  },
  counter: {
    position: "absolute",
    top: "1.25rem",
    left: "50%",
    transform: "translateX(-50%)",
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.9rem",
    fontWeight: 600,
    zIndex: 10,
    fontFamily: "inherit",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    transition: "background 0.2s",
  },
  mediaContainer: {
    maxWidth: "85vw",
    maxHeight: "72vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaImg: {
    maxWidth: "100%",
    maxHeight: "72vh",
    objectFit: "contain",
    borderRadius: "8px",
    userSelect: "none",
  },
  ytContainer: {
    width: "80vw",
    maxWidth: "960px",
    aspectRatio: "16/9",
  },
  ytIframe: {
    width: "100%",
    height: "100%",
    border: 0,
    borderRadius: "8px",
  },
  thumbStrip: {
    position: "absolute",
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: "12px",
    maxWidth: "90vw",
    overflowX: "auto",
    zIndex: 10,
  },
  thumb: {
    width: "60px",
    height: "42px",
    borderRadius: "6px",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
    background: "none",
    padding: 0,
    transition: "opacity 0.2s, border-color 0.2s",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  thumbPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "1px",
  },
};
