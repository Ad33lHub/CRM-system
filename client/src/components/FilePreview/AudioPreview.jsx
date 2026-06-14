import React, { useRef, useState } from 'react';
import { Music, Play, Pause } from 'lucide-react';

export default function AudioPreview({ url, name, _size }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');
  const [progress, setProgress] = useState(0);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(formatTime(current));
      if (dur) {
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Get file format suffix
  const format = name ? name.split('.').pop().toUpperCase() : 'AUDIO';

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-lg select-none mx-auto my-6">
      <audio 
        ref={audioRef}
        src={url}
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      >
        <track kind="captions" />
      </audio>

      {/* Decorative CD/Music Icon */}
      <div className="relative p-5 bg-blue-500/10 text-blue-500 rounded-full mb-6 border border-blue-500/20 shadow-inner group">
        <Music className="h-10 w-10 animate-pulse" />
      </div>

      <h4 className="font-bold text-slate-100 text-center mb-1 truncate w-full px-2" title={name}>
        {name}
      </h4>
      <p className="text-xs text-slate-400 mb-6 font-medium tracking-wide uppercase">
        {format} Format
      </p>

      {/* Audio Waveform Placeholder (static) */}
      <div className="w-full flex items-center justify-between gap-1.5 h-16 mb-6 px-4">
        {[20, 30, 45, 25, 60, 40, 70, 50, 85, 30, 60, 45, 90, 75, 50, 40, 60, 35, 20, 45, 60, 30, 55, 40, 75, 50, 65, 40, 25, 45, 20].map((h, i) => {
          // Highlight bar based on current audio playback progress
          const isActive = (i / 31) * 100 <= progress;
          return (
            <div 
              key={i} 
              className={`flex-1 rounded-full transition-all duration-150 ${
                isActive ? 'bg-blue-500' : 'bg-slate-700'
              }`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      {/* Native-style Audio Player controls */}
      <div className="w-full space-y-4">
        {/* Progress Slider */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{currentTime}</span>
          <div className="flex-1 mx-3 bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer relative">
            <div 
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{duration}</span>
        </div>

        {/* Play/Pause Button */}
        <div className="flex items-center justify-center pt-2">
          <button 
            onClick={togglePlay}
            className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-md active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
