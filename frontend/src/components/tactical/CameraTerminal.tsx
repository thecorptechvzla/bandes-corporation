'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, ChevronDown } from 'lucide-react';

interface CameraTerminalProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

export function CameraTerminal({ onCapture, onClose }: CameraTerminalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(d =>
      setDevices(d.filter(d => d.kind === 'videoinput')),
    );
  }, []);

  useEffect(() => {
    let active = true;
    const constraints: MediaStreamConstraints = {
      video: selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: facing },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(s => { if (active) { setStream(s); setError(null); } })
      .catch(() => setError('Permiso de cámara denegado o no disponible'));
    return () => { active = false; };
  }, [selectedDeviceId, facing]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(b => { if (b) onCapture(b); }, 'image/jpeg', 0.85);
  }, [onCapture]);

  const toggleCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setSelectedDeviceId('');
    setFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="space-y-3">
      {/* Camera selector */}
      {devices.length > 1 && (
        <div className="relative">
          <select
            value={selectedDeviceId}
            onChange={e => { setSelectedDeviceId(e.target.value); setFacing('user'); }}
            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-accent-cyan)]/30 rounded-lg px-3 py-2 text-[10px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-cyan)] appearance-none cursor-pointer"
          >
            <option value="">Cámara frontal/posterior</option>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Cámara ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--pm-text-dim)] pointer-events-none" />
        </div>
      )}

      {/* Viewfinder */}
      <div className="relative rounded-xl overflow-hidden bg-black border-2 border-[var(--pm-accent-cyan)]/30 aspect-[4/3] flex items-center justify-center">
        {error ? (
          <div className="text-center p-6">
            <Camera className="w-8 h-8 text-[var(--pm-accent-red)]/50 mx-auto mb-2" />
            <p className="text-[11px] font-mono text-[var(--pm-accent-red)]">{error}</p>
            <p className="text-[9px] font-mono text-[var(--pm-text-dim)] mt-1">
              Verifica los permisos de cámara en tu navegador
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[15%] border border-[var(--pm-accent-cyan)]/40 rounded-lg">
                {/* Corner accents */}
                <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[var(--pm-accent-cyan)] rounded-tl" />
                <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[var(--pm-accent-cyan)] rounded-tr" />
                <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[var(--pm-accent-cyan)] rounded-bl" />
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[var(--pm-accent-cyan)] rounded-br" />
                {/* Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-0.5 h-8 bg-[var(--pm-accent-cyan)]/20" />
                  <div className="w-8 h-0.5 bg-[var(--pm-accent-cyan)]/20 -mt-0.5 ml-[-14px]" />
                </div>
              </div>
              {/* Scanning line animation */}
              <div className="absolute left-[15%] right-[15%] h-px bg-[var(--pm-accent-cyan)]/30 animate-pulse" style={{ top: '35%' }} />
            </div>
            {/* Loading indicator */}
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-8 h-8 border-2 border-[var(--pm-accent-cyan)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={capture}
          disabled={!stream || !!error}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.08))',
            border: '2px solid rgba(0,229,255,0.5)',
            boxShadow: '0 0 20px rgba(0,229,255,0.15)',
          }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-[var(--pm-accent-cyan)] flex items-center justify-center">
            <Camera className="w-5 h-5 text-[var(--pm-accent-cyan)]" />
          </div>
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          disabled={!stream || !!error}
          className="px-4 py-2 rounded-lg border border-[var(--pm-accent-cyan)]/30 text-[var(--pm-accent-cyan)] hover:bg-[var(--pm-accent-cyan)]/10 text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" /> Girar
        </button>
      </div>
    </div>
  );
}
