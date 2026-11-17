import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export const VoicePlayer = ({ duration = 24, isSender = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 100 / duration;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (progress >= 100) setProgress(0);
    setIsPlaying(!isPlaying);
  };

  const currentSeconds = Math.round((progress / 100) * duration);
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 py-1">
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
          isSender
            ? 'bg-white text-rose-600 shadow'
            : 'bg-rose-600 text-white shadow'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Simulated Waveform & Progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
        <div className="flex items-center gap-0.5 h-6">
          {[25, 60, 40, 80, 50, 90, 70, 30, 85, 45, 65, 35, 95, 55, 40, 70].map((h, i) => {
            const barProgress = (i / 16) * 100;
            const isFilled = progress >= barProgress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isFilled
                    ? isSender ? 'bg-white' : 'bg-rose-600'
                    : isSender ? 'bg-white/40' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] opacity-80 font-medium">
          <span>{formatTime(currentSeconds)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default VoicePlayer;
