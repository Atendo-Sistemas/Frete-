import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  Check, 
  RotateCcw, 
  Upload, 
  AlertCircle, 
  Zap, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { compressImage, compressImageFile } from '../../utils/imageCompression';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
  preferredFacingMode?: 'environment' | 'user';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Câmera ao Vivo',
  subtitle = 'Posicione o documento, comprovante ou veículo no enquadramento',
  preferredFacingMode = 'environment'
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(preferredFacingMode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopStream();
    setCameraError(null);
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sem suporte a captura de câmera direta.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check if torch is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Erro ao inicializar câmera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão de acesso à câmera negada. Ative a permissão no navegador ou escolha da galeria.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        setCameraError('Não foi possível inicializar a câmera ao vivo. Você pode tirar foto pelo app nativo ou anexar da galeria.');
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedPhoto(null);
      setCameraError(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, facingMode]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && (track as any).applyConstraints) {
      try {
        const newTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorch }]
        });
        setTorchOn(newTorch);
      } catch (err) {
        console.warn('Torch constraint error:', err);
      }
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    
    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user facing mode (front camera), flip horizontally for natural mirror look
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Compress captured photo for optimal bandwidth and storage
      compressImage(rawDataUrl, { quality: 0.8, maxWidth: 1600, maxHeight: 1600 })
        .then(res => setCapturedPhoto(res.dataUrl))
        .catch(() => setCapturedPhoto(rawDataUrl));
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopStream();
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (videoRef.current && stream) {
      videoRef.current.play().catch(() => {});
    } else {
      startCamera(facingMode);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedUrl = await compressImageFile(file, { quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
        onCapture(compressedUrl);
        stopStream();
        onClose();
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            onCapture(reader.result as string);
            stopStream();
            onClose();
          }
        };
        reader.readAsDataURL(file);
      }
    }
    if (e.target) e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400 leading-tight">{subtitle}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[320px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          
          {/* Flash Effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-40 pointer-events-none animate-out fade-out duration-200" />
          )}

          {/* Captured Preview */}
          {capturedPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Foto Capturada"
                className="max-h-[70vh] w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Foto Capturada</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Fallback state */
            <div className="p-6 text-center space-y-4 max-w-md text-slate-200">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Acesso à Câmera</h4>
                <p className="text-xs text-slate-400">{cameraError}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>Câmera do Celular</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Escolher da Galeria</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover max-h-[70vh] ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Framing Guidelines */}
              <div className="absolute inset-4 pointer-events-none border-2 border-emerald-500/40 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                </div>
                <div className="text-center">
                  <span className="bg-black/60 backdrop-blur-xs text-slate-300 text-[11px] font-medium px-3 py-1 rounded-full border border-white/10">
                    Centralize o item e toque no botão abaixo
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                </div>
              </div>

              {/* Quick Controls overlay (Torch / Flip) */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      torchOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                    title={torchOn ? 'Desligar Lanterna' : 'Ligar Lanterna'}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition-all cursor-pointer"
                  title="Alternar Câmera (Traseira / Frontal)"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hidden Fallback Inputs */}
        <input
          ref={fileFallbackRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedPhoto ? (
            /* Review & Confirm controls */
            <div className="flex items-center justify-between w-full gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Usar Esta Foto</span>
              </button>
            </div>
          ) : (
            /* Live Camera Capture Controls */
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="py-2 px-3 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Escolher imagem salva no dispositivo"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Galeria / Arquivo</span>
                <span className="sm:hidden">Galeria</span>
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!cameraError || !stream}
                className={`w-14 h-14 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-all cursor-pointer ${
                  cameraError || !stream
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20'
                }`}
                title="Capturar Foto"
              >
                <div className="w-full h-full bg-emerald-500 hover:bg-emerald-400 rounded-full transition-colors" />
              </button>

              <button
                type="button"
                onClick={toggleFacingMode}
                className="py-2 px-3 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Alternar câmera"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Girar Câmera</span>
                <span className="sm:hidden">Girar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
