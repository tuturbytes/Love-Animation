import React, { useState, useRef, useEffect } from 'react';
import { VideoConfig, PRESET_THEMES } from './types';
import { VideoCanvas, VideoCanvasRef } from './components/VideoCanvas';
import { Controls } from './components/Controls';
import { synthesizer } from './utils/audio';
import { 
  Sparkles, Heart, Play, Pause, RotateCcw, Video, 
  Settings, HelpCircle, Laptop, Download, Globe, Volume2, X
} from 'lucide-react';

const DEFAULT_CONFIG: VideoConfig = {
  themeName: 'Pink Magenta (Original)',
  backgroundColor: '#050206',
  matrixColor: 'rgba(255, 30, 130, 0.45)',
  particleColor: '#ffffff',
  glowColor: 'rgba(255, 50, 150, 0.95)',
  heartColor: 'rgba(255, 20, 120, 1)',
  
  // Matrix rain parameters
  matrixDensity: 0.6,
  matrixSpeed: 1.5,
  matrixChars: 'romantic',
  matrixCharSize: 13,

  // Particle properties
  particleSize: 1.8,
  particleCount: 1300,
  glowStrength: 15,
  interactiveForce: 'repel',
  interactiveRadius: 85,
  heartPulseRate: 1.0,

  // Sequences
  slides: [
    { id: 's_1', text: '3', duration: 1.0 },
    { id: 's_2', text: '2', duration: 1.0 },
    { id: 's_3', text: '1', duration: 1.0 },
    { id: 's_4', text: 'You', duration: 1.8 },
    { id: 's_5', text: 'Are', duration: 1.8 },
    { id: 's_6', text: 'My', duration: 1.8 },
    { id: 's_7', text: 'Love', duration: 2.4 },
  ],
  heartText: 'I Love ❤️ You',
  heartSubText: 'Always & Forever',
  useCursiveFont: false,

  enableSoundEffects: true,
  enableBackgroundMusic: true,
  enableHeartbeat: true,
};

export default function App() {
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_CONFIG);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Default to false so envelope starts paused
  const [isRecording, setIsRecording] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUI, setShowUI] = useState(false);
  
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const canvasRef = useRef<VideoCanvasRef | null>(null);

  // Synchronize ambient background synthesizer melody with playback state
  useEffect(() => {
    if (envelopeOpened && isPlaying && config.enableBackgroundMusic) {
      synthesizer.startBackgroundMusic();
    } else {
      synthesizer.stopBackgroundMusic();
    }
    return () => {
      synthesizer.stopBackgroundMusic();
    };
  }, [envelopeOpened, isPlaying, config.enableBackgroundMusic]);

  // Playback handlers
  const handlePlay = () => {
    setIsPlaying(true);
    canvasRef.current?.play();
  };

  const handlePause = () => {
    setIsPlaying(false);
    canvasRef.current?.pause();
  };

  const handleRestart = () => {
    setIsPlaying(true);
    canvasRef.current?.restart();
  };

  const handleStartRecord = () => {
    setIsRecording(true);
    canvasRef.current?.startRecording();
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    canvasRef.current?.stopRecording();
  };

  // Skip timeline to slide
  const handleSeek = (index: number) => {
    setCurrentSlideIndex(index);
    canvasRef.current?.seekToSlide(index);
  };

  // Realtime Timeline Tracker
  const handleTimelineUpdate = (currentIdx: number, elapsed: number, totalDuration: number) => {
    setCurrentSlideIndex(currentIdx);
    const percentage = Math.min(100, (elapsed / totalDuration) * 100);
    setTimelineProgress(percentage);
  };

  // Change default sequence using preset message buttons
  const applyMessagePreset = (presetType: 'bengali' | 'anniversary' | 'classic' | 'retro') => {
    let slides = [...DEFAULT_CONFIG.slides];
    let heartText = 'I Love ❤️ You';
    let heartSubText = 'Always & Forever';

    if (presetType === 'bengali') {
      slides = [
        { id: 'b_1', text: '3', duration: 1.2 },
        { id: 'b_2', text: '2', duration: 1.2 },
        { id: 'b_3', text: '1', duration: 1.2 },
        { id: 'b_4', text: 'তুমি', duration: 1.8 },
        { id: 'b_5', text: 'আমার', duration: 1.8 },
        { id: 'b_6', text: 'সবটুকু', duration: 1.8 },
        { id: 'b_7', text: 'ভালোবাসা', duration: 2.4 },
      ];
      heartText = 'আমি তোমাকে ভালোবাসি';
      heartSubText = 'চিরদিনের জন্য তোমার';
    } else if (presetType === 'anniversary') {
      slides = [
        { id: 'a_1', text: '3', duration: 1.2 },
        { id: 'a_2', text: '2', duration: 1.2 },
        { id: 'a_3', text: '1', duration: 1.2 },
        { id: 'a_4', text: 'Another', duration: 1.8 },
        { id: 'a_5', text: 'Beautiful', duration: 1.8 },
        { id: 'a_6', text: 'Year', duration: 1.8 },
        { id: 'a_7', text: 'Together', duration: 2.4 },
      ];
      heartText = 'Happy Anniversary! 🎉';
      heartSubText = 'To the absolute love of my life';
    } else if (presetType === 'retro') {
      slides = [
        { id: 'r_1', text: 'INIT', duration: 1.2 },
        { id: 'r_2', text: 'LOAD_LOVE', duration: 1.2 },
        { id: 'r_3', text: 'RUN_MAIN', duration: 1.2 },
        { id: 'r_4', text: 'while(true)', duration: 1.8 },
        { id: 'r_5', text: '{\n  love(You);\n}', duration: 2.2 },
      ];
      heartText = 'SYSTEM_SECURE_HEART';
      heartSubText = 'Status: Infinite Loops of Love';
    }

    setConfig({
      ...config,
      slides,
      heartText,
      heartSubText,
    });

    setTimeout(() => {
      canvasRef.current?.restart();
    }, 50);
  };

  const handleOpenEnvelope = () => {
    setIsOpening(true);
    if (config.enableSoundEffects) {
      synthesizer.playSparkle();
    }
    setTimeout(() => {
      setEnvelopeOpened(true);
      setIsPlaying(true);
      canvasRef.current?.play();
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-rose-500/30 selection:text-white relative overflow-hidden">
      
      {/* 100% Pure Full Screen Video Stage */}
      <div className="fixed inset-0 w-screen h-screen z-0 overflow-hidden bg-black select-none">
        <VideoCanvas
          ref={canvasRef}
          config={config}
          isFullscreen={true}
          onTimelineUpdate={handleTimelineUpdate}
          onPlaybackComplete={() => setIsPlaying(false)}
        />
      </div>

      {/* 💌 Interactive Love Letter Envelope Opening Intro */}
      {!envelopeOpened && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-radial from-[#0f040d] to-[#050206] transition-all duration-1000 ${
            isOpening ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          {/* Decorative glowing particles */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* Floating Message */}
          <div className="text-center mb-10 z-10 px-6">
            <span className="text-[10px] font-mono tracking-[0.2em] text-rose-500 uppercase font-bold block mb-3 animate-pulse">
              💖 A SURPRISE LOVE NOTE 💖
            </span>
            <h1 className="text-2xl md:text-3xl font-serif italic text-white font-medium tracking-wide">
              You have received a magical love letter...
            </h1>
            <p className="text-xs text-neutral-400 font-sans mt-2 tracking-wider">
              Tap the wax seal below to unlock the magic inside
            </p>
          </div>

          {/* Envelope Card */}
          <div 
            onClick={handleOpenEnvelope}
            className={`relative w-80 h-52 bg-[#140b17] border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(244,63,94,0.25)] flex items-center justify-center cursor-pointer transition-all duration-500 hover:scale-105 hover:border-rose-500/40 group ${
              isOpening ? 'translate-y-[-100px] opacity-0 rotate-12 scale-90' : ''
            }`}
          >
            {/* Triangular Top Flap Accent */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#1c1021] to-[#140b17] rounded-t-2xl border-b border-white/5 pointer-events-none group-hover:from-[#25152c]" 
                 style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }} />

            {/* Glowing Aura inside */}
            <div className="absolute w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500" />

            {/* Glowing Red Wax Seal Pulsing Heart */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-700 to-red-500 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.6)] border border-rose-400/30 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-rose-400 uppercase font-bold mt-4 group-hover:text-rose-300">
                TAP TO OPEN
              </span>
            </div>

            {/* Ribbon accents */}
            <div className="absolute left-0 bottom-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 rounded-b-2xl opacity-60" />
          </div>

          <p className="text-[10px] font-mono text-neutral-600 mt-12 tracking-widest uppercase">
            Designed with absolute love &bull; Web Synthesis
          </p>
        </div>
      )}

    </div>
  );
}
