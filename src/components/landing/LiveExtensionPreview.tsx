'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ScannedUser {
  id: string;
  name: string;
  role: string;
  status: 'Đã gửi lời mời' | 'Đã lưu UID' | 'Đang xử lý';
  time: string;
}

export default function LiveExtensionPreview() {
  const [isRunning, setIsRunning] = useState(true);
  const [scannedCount, setScannedCount] = useState(148);
  const [delayCountdown, setDelayCountdown] = useState(14);
  const [logs, setLogs] = useState<ScannedUser[]>([
    { id: '10008492019', name: 'Nguyễn Hoàng Long', role: 'Chủ Shop Thời Trang Nữ', status: 'Đã gửi lời mời', time: '12s trước' },
    { id: '10007281940', name: 'Trần Thuý Vi', role: 'Kinh Doanh Mỹ Phẩm Sỉ', status: 'Đã gửi lời mời', time: '28s trước' },
    { id: '10009182371', name: 'Phạm Minh Tuấn', role: 'Admin Hội Dropship VN', status: 'Đã lưu UID', time: '45s trước' },
  ]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDelayCountdown((prev) => {
        if (prev <= 1) {
          // Add a new mock scanned user
          const mockNames = ['Lê Thanh Tâm', 'Đặng Thảo Trang', 'Vũ Quốc Bảo', 'Hoàng Ánh Tuyết'];
          const mockRoles = ['Chủ Tiệm Nail - Spa', 'Sỉ Đồ Gia Dụng', 'Kinh Doanh Bất Động Sản', 'Phụ Kiện Điện Thoại'];
          const randomIdx = Math.floor(Math.random() * mockNames.length);
          
          setScannedCount((c) => c + 1);
          setLogs((prevLogs) => [
            {
              id: '1000' + Math.floor(1000000 + Math.random() * 9000000),
              name: mockNames[randomIdx],
              role: mockRoles[randomIdx],
              status: 'Đã gửi lời mời',
              time: 'Vừa xong'
            },
            prevLogs[0],
            prevLogs[1],
          ]);

          return 16; // Reset delay between 15-20s
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="w-full bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] shadow-fha-overlay overflow-hidden select-none">
      {/* Chrome Window Header */}
      <div className="bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)] px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        <div className="flex-1 min-w-0 mx-1.5 sm:mx-3 bg-white border border-[var(--fha-border)] rounded-md px-2 sm:px-3 py-0.5 sm:py-1 flex items-center justify-between gap-2 text-xs text-[var(--fha-text-muted)] font-mono">
          <span className="truncate text-[10px] sm:text-xs">facebook.com/groups/chu-shop-online</span>
          <span className="text-[10px] text-[var(--fha-success)] font-semibold flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-success)] animate-pulse" />
            <span className="hidden xs:inline sm:inline">Connected</span>
          </span>
        </div>

        <div className="w-6 h-6 rounded bg-white border border-[var(--fha-border)] flex items-center justify-center p-0.5 shrink-0">
          <Image src="/logo.png" alt="Extension" width={16} height={16} className="rounded-sm" />
        </div>
      </div>

      {/* Extension Simulator Body */}
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 bg-white">
        
        {/* Extension Toolbar */}
        <div className="flex items-center justify-between border-b border-[var(--fha-border)] pb-2.5 sm:pb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-[var(--fha-brand-soft)] border border-[var(--fha-brand)] flex items-center justify-center text-[var(--fha-brand)] shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-[var(--fha-text)] truncate">Fairy House AutoData</div>
              <div className="text-[10px] text-[var(--fha-text-muted)] truncate">Chế độ: Human-Emulation 2.0</div>
            </div>
          </div>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shrink-0 ${
              isRunning 
                ? 'bg-[var(--fha-success-bg)] text-[var(--fha-success)] border border-[var(--fha-success)]' 
                : 'bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)] border border-[var(--fha-border)]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[var(--fha-success)] animate-ping' : 'bg-gray-400'}`} />
            <span>{isRunning ? 'Đang chạy' : 'Đã tạm dừng'}</span>
          </button>
        </div>

        {/* Real-time Metric Bar */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="p-2 sm:p-2.5 bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)] text-center min-w-0">
            <div className="text-[9px] sm:text-[10px] font-semibold uppercase text-[var(--fha-text-muted)] truncate">Đã Quét</div>
            <div className="text-xs sm:text-base font-bold font-mono text-[var(--fha-brand)] mt-0.5 truncate">{scannedCount} UID</div>
          </div>
          <div className="p-2 sm:p-2.5 bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)] text-center min-w-0">
            <div className="text-[9px] sm:text-[10px] font-semibold uppercase text-[var(--fha-text-muted)] truncate">Giãn Cách</div>
            <div className="text-xs sm:text-base font-bold font-mono text-[var(--fha-warning)] mt-0.5 truncate">{delayCountdown}s</div>
          </div>
          <div className="p-2 sm:p-2.5 bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)] text-center min-w-0">
            <div className="text-[9px] sm:text-[10px] font-semibold uppercase text-[var(--fha-text-muted)] truncate">Checkpoint</div>
            <div className="text-xs sm:text-base font-bold font-mono text-[var(--fha-success)] mt-0.5 truncate">0% An toàn</div>
          </div>
        </div>

        {/* Live Scanned Items Stream */}
        <div className="space-y-2">
          <div className="text-[10px] sm:text-[11px] font-bold text-[var(--fha-text-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Dữ liệu thời gian thực</span>
            <span className="text-[9px] sm:text-[10px] text-[var(--fha-brand)] font-semibold">Tự động kết bạn ON</span>
          </div>

          <div className="space-y-1.5">
            {logs.map((item, idx) => (
              <div 
                key={idx} 
                className="p-1.5 sm:p-2 bg-[var(--fha-surface-2)]/60 hover:bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)] flex items-center justify-between gap-2 text-xs transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-full bg-white border border-[var(--fha-border-strong)] flex items-center justify-center font-bold text-[10px] text-[var(--fha-brand)] shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[var(--fha-text)] text-[11px] sm:text-xs truncate">{item.name}</div>
                    <div className="text-[9px] sm:text-[10px] text-[var(--fha-text-muted)] truncate">{item.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 bg-[var(--fha-success-bg)] text-[var(--fha-success)] text-[9px] sm:text-[10px] font-semibold rounded border border-[var(--fha-success-border)] whitespace-nowrap">
                    {item.status}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[var(--fha-text-faint)] font-mono whitespace-nowrap">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footprint inside widget */}
        <div className="pt-2 flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between gap-2 border-t border-[var(--fha-border)] text-xs">
          <div className="text-[10px] sm:text-[11px] text-[var(--fha-text-muted)] font-medium">
            Hạn mức: <strong className="text-[var(--fha-text)] font-semibold">1.000 UID/ngày</strong>
          </div>
          <button 
            type="button"
            onClick={() => alert('Xuất dữ liệu 148 khách hàng ra định dạng Excel thành công!')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-[var(--fha-text)] border border-[var(--fha-border-strong)] hover:border-[var(--fha-brand)] hover:text-[var(--fha-brand)] transition-colors flex items-center gap-1 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Xuất Excel</span>
          </button>
        </div>

      </div>
    </div>
  );
}
