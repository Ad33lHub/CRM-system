import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { Button } from '../ui/button.jsx';

export default function ImagePreview({ url, name, _size }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Reset zoom and position on url change
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [url]);

  const handleImageLoad = (e) => {
    setDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom using mouse wheel
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.1, 3));
    } else {
      setZoom(prev => Math.max(prev - 0.1, 0.5));
    }
  };

  // Dragging event handlers for panning
  const handleMouseDown = (e) => {
    if (zoom <= 1) return; // Only pan when zoomed in
    e.preventDefault();
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

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'image';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center w-full h-full relative" onWheel={handleWheel}>
      {/* Zoom controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-1.5 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset} title="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button onClick={handleDownload} className="gap-2 h-8" size="sm">
          <Download className="h-4 w-4" />
          Download Original
        </Button>
      </div>

      {/* Image container */}
      <div 
        ref={containerRef}
        className={`w-full flex-1 flex items-center justify-center overflow-hidden min-h-[50vh] max-h-[70vh] bg-slate-950 rounded-lg select-none relative ${
          zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        role="presentation"
      >
        <img 
          ref={imgRef}
          src={url} 
          alt={name} 
          onLoad={handleImageLoad}
          className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
        />
      </div>

      {/* Footer info */}
      <div className="w-full flex items-center justify-between mt-3 px-1 text-xs text-slate-400">
        <div>
          {dimensions.width > 0 && (
            <span>Dimensions: {dimensions.width} × {dimensions.height}px</span>
          )}
        </div>
        <div>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
