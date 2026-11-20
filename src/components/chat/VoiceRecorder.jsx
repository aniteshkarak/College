import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';

export const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [micError, setMicError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);

  // 60-second limit per PRD 4.5
  const MAX_DURATION = 60;

  // Start recording on mount
  useEffect(() => {
    startRecording();

    return () => {
      cleanupMedia();
    };
  }, []);

  const cleanupMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const startRecording = async () => {
    try {
      setMicError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Cross-platform runtime MIME detection (Safari iOS, Android Chrome, Desktop)
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        ''
      ];

      let selectedMime = '';
      for (const candidate of candidateTypes) {
        if (!candidate) {
          selectedMime = '';
          break;
        }
        if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(candidate)) {
          selectedMime = candidate;
          break;
        }
      }

      const recorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMime = selectedMime || mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Stop microphone tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error:', err);
      setMicError(err.message || 'Microphone access denied or not available.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePreviewPlay = () => {
    if (!previewUrl) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(previewUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((e) => {
        console.warn('Audio play preview error:', e);
        setIsPlayingPreview(false);
      });
    }
  };

  const handleSend = () => {
    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    onSendVoice({
      message_type: 'voice',
      content: `Audio Note (${seconds}s)`,
      duration_seconds: seconds || 1,
      audio_blob: audioBlob,
      audio_url: previewUrl
    });
  };

  const handleCancelClick = () => {
    cleanupMedia();
    onCancel();
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (micError) {
    return (
      <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/60 rounded-2xl border border-rose-300 dark:border-rose-900 shadow-md">
        <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{micError} Please check browser microphone permissions.</span>
        </div>
        <button
          onClick={handleCancelClick}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

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
              onClick={togglePreviewPlay}
              className="p-1.5 rounded-full bg-rose-600 text-white hover:brightness-110 active:scale-95 transition-transform"
              title={isPlayingPreview ? 'Pause preview' : 'Play preview'}
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Preview Note ({formatTime(seconds)})
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Waveform Visualizer */}
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
          onClick={handleCancelClick}
          className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors"
          title="Discard recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {isRecording ? (
          <button
            onClick={stopRecording}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow active:scale-95 transition-transform"
          >
            <Square className="w-3 h-3 fill-white" /> Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="px-3.5 py-1.5 gradient-brand-bg text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow hover:brightness-105 active:scale-95 transition-transform"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
