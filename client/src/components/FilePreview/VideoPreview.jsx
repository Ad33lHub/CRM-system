import React from 'react';

export default function VideoPreview({ url, name }) {
  return (
    <div className="w-full flex justify-center bg-slate-950 rounded-lg overflow-hidden shadow-md">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video 
        src={url} 
        controls 
        className="w-full max-h-[70vh] object-contain"
        title={name}
      />
    </div>
  );
}
