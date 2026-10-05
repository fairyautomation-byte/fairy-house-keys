'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function ProductVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Lắng nghe phím ESC để đóng Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <>
      {/* KHUNG TRÌNH DUYỆT CHROME CHỨA VIDEO TẠI HERO */}
      <div className="w-full rounded-fha-lg border-2 border-[var(--fha-border-strong)] bg-neutral-900 shadow-fha-overlay overflow-hidden select-none">
        
        {/* Chrome Bar / Window Header */}
        <div className="bg-neutral-800 border-b border-neutral-700 px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          {/* 3 nút điều khiển cửa sổ Mac/Chrome */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>

          {/* Thanh URL mô phỏng Facebook Group */}
          <div className="flex-1 min-w-0 mx-2 bg-neutral-900/80 border border-neutral-700 rounded-md px-2.5 py-0.5 flex items-center justify-between text-[11px] font-mono text-neutral-300">
            <span className="truncate">facebook.com/groups/tat-tan-tat-my-luong</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>

          {/* Nút Phóng to / Chi tiết */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            title="Xem toàn màn hình 1080p"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-700/60 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Video Player Box */}
        <div 
          onClick={togglePlay}
          className="relative aspect-video bg-black cursor-pointer group flex items-center justify-center overflow-hidden"
        >
          <video
            ref={videoRef}
            src="/video.mov"
            preload="metadata"
            muted={isMuted}
            playsInline
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />

          {/* Lớp phủ & Nút Play trung tâm khi video chưa chạy */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 flex flex-col items-center justify-center transition-all duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--fha-brand)] text-white flex items-center justify-center shadow-fha-overlay transform group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="mt-3 text-xs sm:text-sm font-bold text-white drop-shadow tracking-wide">
                Xem Video Quét Thật 1080p (4m36s)
              </p>
              <p className="text-[10px] sm:text-xs text-neutral-300 font-medium mt-0.5">
                Chạm để phát trực tiếp
              </p>
            </div>
          )}

          {/* Thanh công cụ nhỏ góc dưới khi đang rê chuột */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono tracking-wider">
              1080p Native • 30 Quét ra 9 SĐT
            </span>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Nút bật/tắt tiếng */}
              <button
                onClick={toggleMute}
                className="p-1 rounded bg-black/75 hover:bg-black text-white text-xs"
                title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {isMuted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>

              {/* Nút mở toàn màn hình */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="px-2 py-0.5 rounded bg-[var(--fha-brand)] hover:bg-[var(--fha-brand-hover)] text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm"
              >
                Phóng To 1080p
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX XEM VIDEO ĐỘ NÉT CAO 1080P */}
      {isLightboxOpen && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-neutral-900 border-2 border-neutral-700 rounded-fha-lg shadow-fha-overlay overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-xs sm:text-sm">Video Trực Quan: Fairy House AutoData V2.0 Quét Data Facebook</span>
              </div>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="w-7 h-7 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Video Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={modalVideoRef}
                src="/video.mov"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer Info */}
            <div className="bg-neutral-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
              <span className="font-mono text-[11px] text-neutral-400">
                Độ phân giải: 1914 × 1080 Native • Thời lượng: 04:36
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                ✓ Đã kiểm chứng: Ra 9 SĐT thật từ 30 UID thành viên nhóm
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
