import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const BackgroundMusic: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50); // 0-100

  // We use a hidden iframe approach. 
  // Note: Modern browsers require user interaction to play audio.
  // The Admin Dashboard will have a button to toggle this.
  
  const videoId = "eOHR6WL8dqU"; 

  // Toggle function just updates state, the effect updates the iframe source
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 bg-black/80 backdrop-blur border border-gray-700 p-2 rounded-full shadow-lg">
        <button 
          onClick={togglePlay}
          className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-imf-cyan text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          title={isPlaying ? "Mute BGM" : "Play BGM"}
        >
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        {isPlaying && (
           <div className="text-[10px] text-imf-cyan font-mono pr-2 animate-pulse">
             AUDIO LINK ACTIVE
           </div>
        )}
      </div>

      {/* Hidden YouTube Embed */}
      {isPlaying && (
        <div className="w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
          <iframe 
            width="560" 
            height="315" 
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0`} 
            title="BGM" 
            allow="autoplay; encrypted-media" 
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default BackgroundMusic;