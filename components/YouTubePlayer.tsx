import React, { useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

/**
 * Beautiful glassmorphism YouTube video player
 * Extracts video ID from full URL or uses direct ID
 */
export default function YouTubePlayer({ 
  videoId, 
  title = 'Video Tutorial',
  className = '' 
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID if full URL is provided
  const extractVideoId = (id: string) => {
    // Handle youtu.be links
    if (id.includes('youtu.be/')) {
      const match = id.match(/youtu\.be\/([^?]+)/);
      return match ? match[1] : id;
    }
    // Handle youtube.com links
    if (id.includes('youtube.com')) {
      const match = id.match(/[?&]v=([^&]+)/);
      return match ? match[1] : id;
    }
    return id;
  };

  const cleanVideoId = extractVideoId(videoId);
  const thumbnailUrl = `https://img.youtube.com/vi/${cleanVideoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${cleanVideoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className={`youtube-player-wrapper ${className}`.trim()}>
      <div className="relative aspect-video rounded-2xl overflow-hidden glass-panel">
        {!isPlaying ? (
          <>
            {/* Thumbnail */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Play button */}
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group"
              aria-label="Play video"
            >
              <div className="video-play-button">
                <svg
                  className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-2xl"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" className="opacity-90" />
                  <polygon points="10,8 16,12 10,16" fill="rgba(0,0,0,0.8)" />
                </svg>
              </div>
            </button>

            {/* Video info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 px-2 py-1 rounded text-white text-xs font-bold">
                  VIDEO
                </div>
                <p className="text-white font-semibold text-sm md:text-base drop-shadow-lg">
                  {title}
                </p>
              </div>
            </div>
          </>
        ) : (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
