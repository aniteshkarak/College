import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { api } from '../../services/api';

export const VoicePlayer = ({
  duration = 24,
  isSender = false,
  audioUrl = null,
  conversationId = null,
  messageId = null,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSource, setAudioSource] = useState(audioUrl);
  const audioRef = useRef(null);
  const fallbackIntervalRef = useRef(null);

  // Initialize or fetch authenticated audio blob if not already a blob URL
  useEffect(() => {
    let active = true;

    async function loadAudio() {
      if (audioUrl) {
        setAudioSource(audioUrl);
        return;
      }

      if (conversationId && messageId) {
        try {
          const endpointUrl = api.chat.getAudioUrl(conversationId, messageId);
          const blobUrl = await api.chat.fetchAudioBlob(endpointUrl);
          if (active) {
            setAudioSource(blobUrl);
          }
        } catch (err) {
          // If fetching fails or offline, audioSource stays null, fallback to simulated
          console.warn('Could not stream audio blob, fallback to simulation:', err.message);
        }
      }
    }

    loadAudio();

    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, [audioUrl, conversationId, messageId]);

  // Set up real HTML5 Audio element when audioSource is set
  useEffect(() => {
    if (!audioSource) return;

    const audio = new Audio(audioSource);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      console.warn('Audio playback error, falling back to simulated playback');
      audioRef.current = null;
    };

    return () => {
      audio.pause();
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
    };
  }, [audioSource]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            startSimulatedPlayback();
          });
      }
    } else {
      startSimulatedPlayback();
    }
  };

  const startSimulatedPlayback = () => {
    if (isPlaying) {
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const totalSecs = duration || 24;
    fallbackIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(fallbackIntervalRef.current);
          setIsPlaying(false);
          setCurrentTime(0);
          return 0;
        }
        const next = prev + 100 / totalSecs;
        setCurrentTime(Math.round((next / 100) * totalSecs));
        return next;
      });
    }, 1000);
  };

  const formatTime = (sec) => {
    const s = Math.round(sec || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
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
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Waveform & Progress */}
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
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default VoicePlayer;
