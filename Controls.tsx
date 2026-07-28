import React, { useState } from 'react';
import { VideoConfig, PRESET_THEMES, Slide } from '../types';
import { 
  Play, Pause, RotateCcw, Sparkles, Heart, Sliders, Volume2, 
  VolumeX, Video, CircleDot, HelpCircle, FileText, ChevronRight, 
  Plus, Trash2, Layers, Music, Settings
} from 'lucide-react';

interface ControlsProps {
  config: VideoConfig;
  onChange: (newConfig: VideoConfig) => void;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  isPlaying: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  isRecording: boolean;
  currentSlideIdx: number;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  onChange,
  onPlay,
  onPause,
  onRestart,
  isPlaying,
  onStartRecord,
  onStopRecord,
  isRecording,
  currentSlideIdx,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'visuals' | 'audio' | 'presets'>('presets');
  
  // Update helpers
  const setConfigValue = <K extends keyof VideoConfig>(key: K, value: VideoConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const applyPreset = (themeKey: string) => {
    const preset = PRESET_THEMES[themeKey];
    if (preset) {
      onChange({
        ...config,
        ...preset,
      });
    }
  };

  // Add a slide to the animation list
  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      text: 'New Text',
      duration: 1.8,
    };
    setConfigValue('slides', [...config.slides, newSlide]);
  };

  // Delete a slide from the list
  const deleteSlide = (id: string) => {
    if (config.slides.length <= 1) return; // Maintain at least one slide
    const updated = config.slides.filter(s => s.id !== id);
    setConfigValue('slides', updated);
  };

  // Update a specific slide parameter
  const updateSlideText = (id: string, text: string) => {
    const updated = config.slides.map(s => {
      if (s.id === id) {
        return { ...s, text };
      }
      return s;
    });
    setConfigValue('slides', updated);
  };

  const updateSlideDuration = (id: string, duration: number) => {
    const updated = config.slides.map(s => {
      if (s.id === id) {
        return { ...s, duration: Math.max(0.5, duration) };
      }
      return s;
    });
    setConfigValue('slides', updated);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-white border-opacity-10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
      {/* Title Header */}
      <div className="p-5 border-b border-white border-opacity-10 bg-neutral-950/90 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Heart className="w-4 h-4 text-orange-500 fill-orange-500/10 animate-pulse" />
          <div>
            <h2 className="text-xs font-serif italic tracking-wider text-neutral-100">LOVE VIDEO SYSTEM</h2>
            <p className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase mt-0.5">Customizer & Engine</p>
          </div>
        </div>

        {/* Quick Recording Toggle */}
        <button
          onClick={isRecording ? onStopRecord : onStartRecord}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition ${
            isRecording 
              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
              : 'bg-neutral-900 text-orange-400 hover:bg-neutral-800 border border-white border-opacity-5'
          }`}
        >
          {isRecording ? (
            <>
              <CircleDot className="w-3 h-3 text-white fill-white animate-spin" />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <Video className="w-3 h-3 text-orange-400" />
              <span>Record WebM</span>
            </>
          )}
        </button>
      </div>

      {/* Main Playback Row */}
      <div className="p-4 bg-neutral-950/40 border-b border-white border-opacity-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white border-opacity-5 transition"
              title="Pause Animation"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white border border-orange-500/20 transition shadow-[0_0_15px_rgba(234,88,12,0.3)]"
              title="Play Animation"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
            </button>
          )}
          <button
            onClick={onRestart}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-white border-opacity-5 transition"
            title="Restart Animation Sequence"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current slide tag */}
        <div className="text-right">
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">Live Beats</span>
          <p className="text-[11px] font-serif italic text-orange-400">
            {currentSlideIdx === -1 ? 'Scanner Intro' : currentSlideIdx === config.slides.length ? 'Heart Pulse' : `Scene ${currentSlideIdx + 1}/${config.slides.length}`}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-4 border-b border-white border-opacity-10 text-center text-xs font-mono bg-neutral-950/20">
        <button
          onClick={() => setActiveTab('presets')}
          className={`py-3 flex flex-col items-center justify-center space-y-1 border-b-2 transition ${
            activeTab === 'presets' ? 'border-orange-500 text-orange-400 bg-orange-500/[0.02]' : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider">Themes</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`py-3 flex flex-col items-center justify-center space-y-1 border-b-2 transition ${
            activeTab === 'text' ? 'border-orange-500 text-orange-400 bg-orange-500/[0.02]' : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider">Text</span>
        </button>
        <button
          onClick={() => setActiveTab('visuals')}
          className={`py-3 flex flex-col items-center justify-center space-y-1 border-b-2 transition ${
            activeTab === 'visuals' ? 'border-orange-500 text-orange-400 bg-orange-500/[0.02]' : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider">Visuals</span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`py-3 flex flex-col items-center justify-center space-y-1 border-b-2 transition ${
            activeTab === 'audio' ? 'border-orange-500 text-orange-400 bg-orange-500/[0.02]' : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider">Effects</span>
        </button>
      </div>

      {/* Scrollable Settings Panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Select Theme Preset</label>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.keys(PRESET_THEMES).map((key) => {
                  const theme = PRESET_THEMES[key];
                  const isSelected = config.glowColor === theme.glowColor;
                  return (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                        isSelected 
                          ? 'bg-rose-500/10 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                          : 'bg-neutral-900/40 border-neutral-900/80 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/20" 
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.glowColor || '#ff3296'}, ${theme.matrixColor || '#ff1e82'})` 
                          }}
                        />
                        <div className="font-sans">
                          <p className="text-xs font-bold">{theme.themeName}</p>
                          <p className="text-[9px] text-neutral-500 font-mono mt-0.5">Matrix: {theme.matrixChars}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/20 text-[11px] text-rose-300/80 font-sans space-y-2 leading-relaxed">
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-400 fill-rose-400/20" /> How to use:
              </span>
              <p>Customize the texts in the <strong>Slide Text</strong> tab, change visual density/speeds in the <strong>Visuals</strong> tab, then hit <strong>Record WebM</strong> to download a beautiful animated video directly to your computer! No external software required.</p>
            </div>
          </div>
        )}

        {/* TEXT SEQUENCE TAB */}
        {activeTab === 'text' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Text Sequence Slides</label>
              <button
                onClick={addSlide}
                className="flex items-center space-x-1 text-[10px] text-rose-400 hover:text-rose-300 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.slides.map((slide, idx) => (
                <div 
                  key={slide.id}
                  className={`p-3.5 rounded-xl border transition ${
                    currentSlideIdx === idx 
                      ? 'bg-rose-950/15 border-rose-500/30' 
                      : 'bg-neutral-900/40 border-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-neutral-500">SLIDE #{idx + 1}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0.5"
                        step="0.1"
                        value={slide.duration}
                        onChange={(e) => updateSlideDuration(slide.id, parseFloat(e.target.value))}
                        className="w-14 bg-neutral-950 border border-neutral-800 text-neutral-300 text-center rounded py-0.5 text-[10px] font-mono"
                        title="Display duration (seconds)"
                      />
                      <span className="text-[9px] font-mono text-neutral-500">sec</span>
                      
                      {config.slides.length > 1 && (
                        <button
                          onClick={() => deleteSlide(slide.id)}
                          className="p-1 hover:text-red-400 text-neutral-600 transition"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={slide.text}
                    onChange={(e) => updateSlideText(slide.id, e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-1.5 text-xs font-sans focus:border-rose-500/50 outline-none"
                    placeholder="Enter words..."
                  />
                </div>
              ))}
            </div>

            {/* Heart Message configuration */}
            <div className="pt-4 border-t border-neutral-900 space-y-3.5">
              <label className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase block">Heart Centerpiece Text</label>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-neutral-400">Main Message (Inside Heart)</span>
                  <input
                    type="text"
                    value={config.heartText}
                    onChange={(e) => setConfigValue('heartText', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-sans focus:border-rose-500/50 outline-none"
                    placeholder="E.g. I Love You Sayang"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-neutral-400">Sub-caption (Underneath)</span>
                  <input
                    type="text"
                    value={config.heartSubText}
                    onChange={(e) => setConfigValue('heartSubText', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-sans focus:border-rose-500/50 outline-none"
                    placeholder="E.g. Happy Anniversary"
                  />
                </div>


              </div>
            </div>
          </div>
        )}

        {/* VISUALS TAB */}
        {activeTab === 'visuals' && (
          <div className="space-y-5">
            {/* Particles Group */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-b border-neutral-900 pb-1.5">Particle System Settings</h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Particle Max Count (Density)</span>
                  <span className="text-rose-500">{config.particleCount}</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="2000"
                  step="100"
                  value={config.particleCount}
                  onChange={(e) => setConfigValue('particleCount', parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Particle Base Size</span>
                  <span className="text-rose-500">{config.particleSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={config.particleSize}
                  onChange={(e) => setConfigValue('particleSize', parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Particle Glow Strength</span>
                  <span className="text-rose-500">{config.glowStrength}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={config.glowStrength}
                  onChange={(e) => setConfigValue('glowStrength', parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Interactive Mouse Force</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['none', 'repel', 'attract'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setConfigValue('interactiveForce', f as any)}
                      className={`py-1.5 rounded-lg border text-center font-mono text-[10px] uppercase transition ${
                        config.interactiveForce === f 
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix Digital Rain Group */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-b border-neutral-900 pb-1.5">Digital Rain (Matrix Background)</h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Rain Stream Density</span>
                  <span className="text-rose-500">{Math.floor(config.matrixDensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.matrixDensity}
                  onChange={(e) => setConfigValue('matrixDensity', parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Falling Speed</span>
                  <span className="text-rose-500">{config.matrixSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.25"
                  value={config.matrixSpeed}
                  onChange={(e) => setConfigValue('matrixSpeed', parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Code Character Set</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {['romantic', 'binary', 'code', 'standard'].map((set) => (
                    <button
                      key={set}
                      onClick={() => setConfigValue('matrixChars', set as any)}
                      className={`py-1 rounded border text-center font-mono text-[9px] uppercase transition ${
                        config.matrixChars === set 
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {set}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIO EFFECTS TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-5">
            <h3 className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-b border-neutral-900 pb-1.5">Procedural Sound Synthesizer</h3>
            
            <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
              Synthesizes real-time soundscapes entirely in the browser using the Web Audio API on transition beats and heartbeats.
            </p>

            <div className="space-y-4 pt-2">
              {/* Toggle Audio Entirely */}
              <button
                onClick={() => setConfigValue('enableSoundEffects', !config.enableSoundEffects)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  config.enableSoundEffects 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {config.enableSoundEffects ? (
                    <Volume2 className="w-4 h-4 text-rose-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-neutral-600" />
                  )}
                  <span className="text-xs font-sans font-bold">Synthesizer Master Switch</span>
                </div>
                <span className="text-[10px] font-mono uppercase">
                  {config.enableSoundEffects ? 'ACTIVE' : 'MUTED'}
                </span>
              </button>

              {/* Romantic Background Music toggle */}
              <button
                onClick={() => setConfigValue('enableBackgroundMusic', !config.enableBackgroundMusic)}
                disabled={!config.enableSoundEffects}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  !config.enableSoundEffects 
                    ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950/20 text-neutral-700' 
                    : config.enableBackgroundMusic 
                    ? 'bg-neutral-900 border-neutral-800 text-white shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                    : 'bg-neutral-950 border-neutral-900 text-neutral-500'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Music className={`w-4 h-4 ${config.enableBackgroundMusic && config.enableSoundEffects ? 'text-rose-500 animate-pulse' : ''}`} />
                  <span className="text-xs font-sans">Romantic Music-Box BGM</span>
                </div>
                <span className="text-[10px] font-mono uppercase">
                  {config.enableBackgroundMusic ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Heartbeat feedback sound trigger */}
              <button
                onClick={() => setConfigValue('enableHeartbeat', !config.enableHeartbeat)}
                disabled={!config.enableSoundEffects}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  !config.enableSoundEffects 
                    ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950/20 text-neutral-700' 
                    : config.enableHeartbeat 
                    ? 'bg-neutral-900 border-neutral-800 text-white' 
                    : 'bg-neutral-950 border-neutral-900 text-neutral-500'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Heart className={`w-4 h-4 ${config.enableHeartbeat && config.enableSoundEffects ? 'text-rose-500 fill-rose-500/10' : ''}`} />
                  <span className="text-xs font-sans">Heartbeat Pulse Beat</span>
                </div>
                <span className="text-[10px] font-mono uppercase">
                  {config.enableHeartbeat ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Heart Beat Rate (Pulse Interval)</span>
                  <span className="text-rose-500">{config.heartPulseRate}s</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.1"
                  disabled={!config.enableSoundEffects}
                  value={config.heartPulseRate}
                  onChange={(e) => setConfigValue('heartPulseRate', parseFloat(e.target.value))}
                  className="w-full accent-rose-500 disabled:opacity-35"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Credit */}
      <div className="p-4 border-t border-neutral-900 bg-neutral-950 text-center text-[9px] font-mono text-neutral-600 tracking-wider">
        DEVELOPED FOR LOVE ANIMATIONS &bull; 2026
      </div>
    </div>
  );
};
