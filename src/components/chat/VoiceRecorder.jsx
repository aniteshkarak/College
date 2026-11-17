import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';

export const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const timerRef = useRef(null);

  // 60-second limit per PRD 4.5
  const MAX_DURATION = 60;

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_DURATION - 1) {
            handleStopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleStopRecording = () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    // Simulated recorded blob URL
    setAudioUrl('mock_voice_recording.webm');
  };

  const handleSend = () => {
    onSendVoice({
      message_type: 'voice',
      content: 'Audio Note',
      duration_seconds: seconds,
      audio_url: audioUrl
    });
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-rose-50/90 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-md animate-slide-up">
      
      {/* Recording status or preview */}
      <div className="flex items-center gap-3">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Recording Voice Note ({formatTime(seconds)} / 1:00)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingPreview(!isPlayingPreview)}
              className="p-1.5 rounded-full bg-rose-600 text-white"
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Preview Note ({formatTime(seconds)})
            </span>
          </div>
        )}
      </div>

      {/* Simulated Waveform Animation */}
      <div className="hidden sm:flex items-center gap-1 h-6">
        {[40, 70, 30, 90, 60, 45, 80, 55, 95, 35, 75, 50].map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-200 ${
              isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
            }`}
            style={{ height: isRecording ? `${h}%` : '40%' }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors"
          title="Discard recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {isRecording ? (
          <button
            onClick={handleStopRecording}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Square className="w-3 h-3 fill-white" /> Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="px-3.5 py-1.5 gradient-brand-bg text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow hover:brightness-105"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        )}
      </div>

    </div>
  );
};

export default VoiceRecorder;
