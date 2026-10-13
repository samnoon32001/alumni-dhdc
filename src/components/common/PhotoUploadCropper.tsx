'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Check,
  X,
  Trash2,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';

interface PhotoUploadCropperProps {
  photoUrl?: string | null;
  onPhotoChange: (newUrl: string | null) => void;
  name?: string;
  label?: string;
  helperText?: string;
}

export const PhotoUploadCropper: React.FC<PhotoUploadCropperProps> = ({
  photoUrl,
  onPhotoChange,
  name = 'Alumnus',
  label = 'Profile Photo',
  helperText = 'Upload a clear portrait. You can zoom and crop it into a circle.',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal & Image Loading State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Canvas & Transformation State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const CROP_SIZE = 280; // Diameter of the crop circle in px

  // 1. Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setRawImageSrc(src);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setErrorMessage(null);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so user can pick same file again if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Load Image Object when rawImageSrc changes
  useEffect(() => {
    if (!rawImageSrc) {
      imageObjRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      // Calculate initial zoom to fit nicely
      const minDim = Math.min(img.width, img.height);
      const initialScale = Math.max(CROP_SIZE / minDim, 1);
      setZoom(initialScale);
      setPan({ x: 0, y: 0 });
      drawCropCanvas();
    };
    img.src = rawImageSrc;
  }, [rawImageSrc]);

  // 3. Draw onto Main Canvas & Side Preview Canvas
  const drawCropCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid/checker pattern
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center transformations in the canvas
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw the image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Draw dark semi-transparent mask around the circular crop area
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, width, height);

    // Cut out the clear crop circle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw border ring around crop circle
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#117980';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle gold inner accent ring
    ctx.strokeStyle = '#aa762b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, CROP_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Update the live round preview canvas
    drawPreview(img);
  }, [zoom, rotation, pan]);

  // Draw small live preview
  const drawPreview = (img: HTMLImageElement) => {
    const pCanvas = previewCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    const pSize = pCanvas.width;
    pCtx.clearRect(0, 0, pSize, pSize);

    pCtx.save();
    // Circular clip
    pCtx.beginPath();
    pCtx.arc(pSize / 2, pSize / 2, pSize / 2, 0, Math.PI * 2);
    pCtx.clip();

    // Match transform from main canvas relative to CROP_SIZE
    const scaleFactor = pSize / CROP_SIZE;
    pCtx.translate(pSize / 2 + pan.x * scaleFactor, pSize / 2 + pan.y * scaleFactor);
    pCtx.rotate((rotation * Math.PI) / 180);
    pCtx.scale(zoom * scaleFactor, zoom * scaleFactor);
    pCtx.drawImage(img, -img.width / 2, -img.height / 2);
    pCtx.restore();
  };

  useEffect(() => {
    drawCropCanvas();
  }, [drawCropCanvas]);

  // Drag handlers for mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Drag handlers for touch screen
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Zoom controls
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    const img = imageObjRef.current;
    if (!img) return;
    const minDim = Math.min(img.width, img.height);
    const initialScale = Math.max(CROP_SIZE / minDim, 1);
    setZoom(initialScale);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // 4. Crop and Export
  const handleApplyCrop = async () => {
    const img = imageObjRef.current;
    if (!img) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Offscreen canvas at 400x400 for high DPI
      const exportCanvas = document.createElement('canvas');
      const EXPORT_SIZE = 400;
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;

      const eCtx = exportCanvas.getContext('2d');
      if (!eCtx) throw new Error('Could not initialize canvas context');

      // Fill white background just in case of transparent png
      eCtx.fillStyle = '#ffffff';
      eCtx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

      eCtx.save();
      const scaleFactor = EXPORT_SIZE / CROP_SIZE;
      eCtx.translate(EXPORT_SIZE / 2 + pan.x * scaleFactor, EXPORT_SIZE / 2 + pan.y * scaleFactor);
      eCtx.rotate((rotation * Math.PI) / 180);
      eCtx.scale(zoom * scaleFactor, zoom * scaleFactor);
      eCtx.drawImage(img, -img.width / 2, -img.height / 2);
      eCtx.restore();

      // Export as high quality JPEG
      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);

      // Upload via API
      const res = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });

      const result = await res.json();
      if (!res.ok || !result.url) {
        throw new Error(result.error || 'Failed to save cropped photo');
      }

      onPhotoChange(result.url);
      setIsCropModalOpen(false);
      setRawImageSrc(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      onPhotoChange(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
        id="profile-photo-file-input"
      />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar Display */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer relative rounded-2xl overflow-hidden ring-4 ring-[#117980]/20 hover:ring-[#117980]/40 transition-all shadow-md group-hover:scale-102"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#117980] via-[#1a8f98] to-[#aa762b] text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-inner">
                {name ? name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}

            {/* Hover overlay prompt */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[11px] font-semibold gap-1">
              <Camera className="w-5 h-5" />
              <span>Change</span>
            </div>
          </div>

          {/* Camera Button Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#117980] hover:bg-[#0e646a] text-white shadow-md ring-2 ring-white dark:ring-slate-900 transition-transform active:scale-95"
            title="Upload and crop new photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Text & Actions */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {label}
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {helperText}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#117980] hover:bg-[#0e646a] text-white text-xs font-semibold shadow-sm shadow-[#117980]/20 transition-all transform active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{photoUrl ? 'Upload & Crop New' : 'Upload Profile Photo'}</span>
            </button>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          INTERACTIVE PHOTO CROPPER MODAL
          ======================================================== */}
      <Modal
        isOpen={isCropModalOpen}
        onClose={() => {
          if (!isUploading) {
            setIsCropModalOpen(false);
            setRawImageSrc(null);
          }
        }}
        title={
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Camera className="w-5 h-5 text-[#117980]" />
            <span>Crop & Adjust Profile Photo</span>
          </div>
        }
        maxWidth="xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag the image to reposition it inside the circle. Use the slider below to zoom in or out.
          </p>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Interactive Canvas Viewport */}
          <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden select-none">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`rounded-xl touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ width: '340px', height: '340px' }}
            />

            {/* Helper drag tag */}
            <div className="absolute top-4 left-4 pointer-events-none px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white/80 font-medium flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>Drag to position</span>
            </div>

            {/* Live circular preview thumbnail */}
            <div className="absolute bottom-4 right-4 pointer-events-none p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 flex flex-col items-center gap-1 shadow-lg">
              <canvas
                ref={previewCanvasRef}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full ring-2 ring-[#aa762b]"
              />
              <span className="text-[9px] text-amber-200/90 font-bold tracking-wider uppercase">
                Preview
              </span>
            </div>
          </div>

          {/* Zoom and Transform Controls */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0.4"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={handleZoomChange}
                  className="w-full accent-[#117980] cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-semibold text-slate-500 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#117980] hover:underline"
              >
                Choose another file
              </button>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                setIsCropModalOpen(false);
                setRawImageSrc(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleApplyCrop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#117980] to-[#0e646a] hover:from-[#0e646a] hover:to-[#0b5156] text-white text-xs font-bold shadow-md shadow-[#117980]/20 disabled:opacity-50 transition-all transform active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving & Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Crop & Apply Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
