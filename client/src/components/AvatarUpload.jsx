import React, { useState, useRef, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth.js';
import { Camera, X, Loader2, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { Button } from './ui/button.jsx';

export default function AvatarUpload({ currentAvatar, userId, size = '120px', onSuccess }) {
  const { user: loggedInUser, role, accessToken } = useAuth();
  const fileInputRef = useRef(null);
  
  // States
  const [imageSrc, setImageSrc] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const sizeStyle = { width: size, height: size };

  // Check permissions
  const canEdit = loggedInUser && (
    loggedInUser._id === userId ||
    loggedInUser.id === userId ||
    ['super_admin', 'admin', 'manager'].includes(role)
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB size limit.");
      return;
    }

    // Validate MIME type on client side (JPEG, PNG, WebP only. Reject GIF, SVG)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP formats are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (canEdit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling to fill canvas maintaining aspect ratio
    const canvasSize = 400;
    const imgRatio = img.width / img.height;
    
    let drawWidth, drawHeight;
    if (imgRatio > 1) {
      drawHeight = canvasSize;
      drawWidth = canvasSize * imgRatio;
    } else {
      drawWidth = canvasSize;
      drawHeight = canvasSize / imgRatio;
    }

    // Apply zoom
    drawWidth *= zoom;
    drawHeight *= zoom;

    // Center image + apply manual pan offset
    const x = (canvasSize - drawWidth) / 2 + position.x;
    const y = (canvasSize - drawHeight) / 2 + position.y;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);

    // Draw circular mask helper overlay for user preview
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(200, 200, 198, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }, [zoom, position]);

  // Canvas drawing on Zoom/Pan changes
  useEffect(() => {
    if (!modalOpen || !imageSrc || !canvasRef.current) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [modalOpen, imageSrc, drawCanvas]);

  // Dragging event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    setUploading(true);
    setUploadProgress(10);

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Draw cropped region matching preview onto the output canvas
    const canvasSize = 400;
    const imgRatio = img.width / img.height;
    
    let drawWidth, drawHeight;
    if (imgRatio > 1) {
      drawHeight = canvasSize;
      drawWidth = canvasSize * imgRatio;
    } else {
      drawWidth = canvasSize;
      drawHeight = canvasSize / imgRatio;
    }

    drawWidth *= zoom;
    drawHeight *= zoom;

    const x = (canvasSize - drawWidth) / 2 + position.x;
    const y = (canvasSize - drawHeight) / 2 + position.y;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);

    setUploadProgress(40);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Failed to process image.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');
      
      // If uploading for another employee
      if (userId && userId !== loggedInUser?._id && userId !== loggedInUser?.id) {
        // Query database or pass employeeId if needed.
        // Wait, the API supports req.body.employeeId for manager updating employee profile
        // Let's assume userId passed might be the employeeId
        formData.append('employeeId', userId);
      }

      try {
        setUploadProgress(60);
        const response = await fetch('/api/upload/profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        });

        const data = await response.json();
        setUploadProgress(100);

        if (response.ok) {
          if (onSuccess) {
            onSuccess(data.avatarUrl);
          }
          setModalOpen(false);
        } else {
          setError(data.message || "Failed to upload image.");
        }
      } catch (err) {
        setError("Network error occurred during upload.");
      } finally {
        setUploading(false);
      }
    }, 'image/webp', 0.85);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        type="button"
        style={sizeStyle} 
        className={`relative rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden group select-none ${
          canEdit ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={triggerFileInput}
        disabled={!canEdit}
      >
        {/* Avatar image */}
        {currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt="Profile Avatar" 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-2xl uppercase">
            {loggedInUser?.name?.slice(0, 2) || 'US'}
          </div>
        )}

        {/* Hover overlay */}
        {canEdit && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1">
            <Camera className="h-5 w-5" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Change Photo</span>
          </div>
        )}
      </button>

      {/* Error alert */}
      {error && (
        <p className="text-xs text-rose-500 font-medium text-center max-w-[200px] mt-1">
          {error}
        </p>
      )}

      {/* Hidden input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        id="avatar-file-input"
        accept="image/jpeg,image/png,image/webp" 
        onChange={handleFileChange}
      />

      {/* Crop modal dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Crop Profile Picture</h3>
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Crop Area */}
            <div className="p-6 flex flex-col items-center gap-4">
              <div 
                className="relative w-[280px] h-[280px] bg-slate-950 rounded-full border-4 border-slate-200 dark:border-slate-800 overflow-hidden cursor-move select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                role="presentation"
              >
                <canvas 
                  ref={canvasRef} 
                  width="400" 
                  height="400"
                  className="w-full h-full"
                />
              </div>

              <p className="text-xs text-slate-400 text-center">
                Drag to position, use the slider to zoom
              </p>

              {/* Slider zoom */}
              <div className="w-full flex items-center gap-3 px-4">
                <ZoomOut className="h-4 w-4 text-slate-400" />
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.05" 
                  value={zoom} 
                  aria-label="Zoom level"
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600"
                  disabled={uploading}
                />
                <ZoomIn className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
                <div 
                  className="bg-blue-600 h-1 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Crop & Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

