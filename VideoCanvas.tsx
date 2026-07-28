import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { VideoConfig, Slide } from '../types';
import { synthesizer } from '../utils/audio';

// Helper function to render a crisp vector heart shape at given coordinates on Canvas
const drawTinyHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.beginPath();
  const d = size * 1.35; // optimal scaling factor for lovely resolution
  ctx.moveTo(x, y + d * 0.3);
  // Elegant parametric bezier curve paths mapping a classic solid heart
  ctx.bezierCurveTo(x, y - d * 0.45, x - d * 0.95, y - d * 0.45, x - d * 0.95, y + d * 0.2);
  ctx.bezierCurveTo(x - d * 0.95, y + d * 0.7, x - d * 0.45, y + d * 1.05, x, y + d * 1.4);
  ctx.bezierCurveTo(x + d * 0.45, y + d * 1.05, x + d * 0.95, y + d * 0.7, x + d * 0.95, y + d * 0.2);
  ctx.bezierCurveTo(x + d * 0.95, y - d * 0.45, x, y - d * 0.45, x, y + d * 0.3);
  ctx.closePath();
  ctx.fill();
};

interface VideoCanvasProps {
  config: VideoConfig;
  onTimelineUpdate?: (currentSlideIdx: number, elapsed: number, totalDuration: number) => void;
  onPlaybackComplete?: () => void;
  isFullscreen?: boolean;
}

export interface VideoCanvasRef {
  play: () => void;
  pause: () => void;
  restart: () => void;
  seekToSlide: (index: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  isPlaying: boolean;
  currentSlideIndex: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  originalTargetX: number;
  originalTargetY: number;
  size: number;
  baseSize: number;
  alpha: number;
  color: string;
  isSpare: boolean;
  angle: number;
  speed: number;
}

export const VideoCanvas = forwardRef<VideoCanvasRef, VideoCanvasProps>(
  ({ config, onTimelineUpdate, onPlaybackComplete, isFullscreen = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    // Playback state
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentSlideIdx, setCurrentSlideIdx] = useState(-1);
    const [isRecording, setIsRecording] = useState(false);
    
    const stateRef = useRef({
      isPlaying: true,
      currentSlideIdx: -1,
      elapsedInSlide: 0,
      globalTime: 0,
      entranceTime: 0,
      mouse: { x: -1000, y: -1000 },
      lastFrameTime: 0,
      recordingChunks: [] as Blob[],
      mediaRecorder: null as MediaRecorder | null,
    });

    // Handle incoming config updates
    useEffect(() => {
      // Trigger update of state indices or particle counts if needed
    }, [config]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      play: () => {
        setIsPlaying(true);
        stateRef.current.isPlaying = true;
      },
      pause: () => {
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
      },
      restart: () => {
        setCurrentSlideIdx(-1);
        stateRef.current.currentSlideIdx = -1;
        stateRef.current.elapsedInSlide = 0;
        stateRef.current.globalTime = 0;
        stateRef.current.entranceTime = 0;
        setIsPlaying(true);
        stateRef.current.isPlaying = true;
        reinitializeParticles();
        if (config.enableSoundEffects) {
          synthesizer.playTick(500, 0.15);
        }
      },
      seekToSlide: (index: number) => {
        if (index >= -1 && index <= config.slides.length) {
          setCurrentSlideIdx(index);
          stateRef.current.currentSlideIdx = index;
          stateRef.current.elapsedInSlide = 0;
          stateRef.current.entranceTime = 0;
          reinitializeParticles();
        }
      },
      startRecording: () => {
        startCanvasRecording();
      },
      stopRecording: () => {
        stopCanvasRecording();
      },
      isRecording,
      isPlaying,
      currentSlideIndex: currentSlideIdx,
    }));

    // Matrix Rain State with Motherboard Traces support
    const matrixState = useRef<{
      columns: number[];
      charSizes: number[];
      speeds: number[];
      charsList: string[];
      traces: {
        points: { x: number; y: number }[];
        nodes: { y: number; size: number }[];
      }[];
    }>({
      columns: [],
      charSizes: [],
      speeds: [],
      charsList: [],
      traces: [],
    });

    // Particles Pool
    const particles = useRef<Particle[]>([]);
    
    // Interactive Floating Hearts click burst pool
    const clickHearts = useRef<any[]>([]);

    // Ambient floating rose petals/hearts pool
    const rosePetals = useRef<any[]>([]);

    // Beautiful floating romantic words that fade, merge, and dissolve
    const floatingWords = useRef<any[]>([]);

    // Flag to prevent double-initialization of particles on play/pause or config changes
    const particlesInitialized = useRef(false);

    // Offscreen Canvas for text scanning
    const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);

    // Track state of slide to detect changes for sound triggers
    const lastActiveSlideRef = useRef<number>(-1);

    // Helper to interpolate X along the pre-calculated motherboard trace points
    const getTraceXAtY = (traceIdx: number, y: number): number => {
      const trace = matrixState.current.traces[traceIdx];
      if (!trace || trace.points.length === 0) return 0;
      
      const pts = trace.points;
      if (y <= pts[0].y) return pts[0].x;
      if (y >= pts[pts.length - 1].y) return pts[pts.length - 1].x;
      
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        if (y >= p1.y && y <= p2.y) {
          const ratio = (y - p1.y) / (p2.y - p1.y);
          return p1.x + ratio * (p2.x - p1.x);
        }
      }
      return pts[pts.length - 1].x;
    };

    // Setup Matrix columns as motherboard paths
    const setupMatrixRain = (width: number) => {
      const charSize = config.matrixCharSize;
      const spacing = charSize * 1.6;
      const colsCount = Math.floor(width / spacing) + 1;
      const cols: number[] = [];
      const charSizes: number[] = [];
      const speeds: number[] = [];
      const traces: typeof matrixState.current.traces = [];
      const canvasHeight = canvasRef.current?.height || 600;

      for (let i = 0; i < colsCount; i++) {
        cols.push(Math.random() * -canvasHeight); // start scattered above
        charSizes.push(charSize * (0.8 + Math.random() * 0.4));
        speeds.push(config.matrixSpeed * (1.2 + Math.random() * 1.8));

        // Generate trace coordinates looking like computer board traces
        const startX = i * spacing + (Math.random() - 0.5) * 8;
        const points: { x: number; y: number }[] = [];
        const nodes: { y: number; size: number }[] = [];

        points.push({ x: startX, y: 0 });

        let currentY = 0;
        let currentX = startX;

        // Generate 1-2 random angled bends to mimic motherboard circuits (45-deg angles)
        const bendCount = Math.random() > 0.45 ? 2 : 1;
        const bendYs = [
          canvasHeight * 0.2 + Math.random() * canvasHeight * 0.2,
          canvasHeight * 0.6 + Math.random() * canvasHeight * 0.2,
        ].slice(0, bendCount);

        bendYs.forEach((bendY) => {
          points.push({ x: currentX, y: bendY });
          nodes.push({ y: bendY, size: 2.5 + Math.random() * 2.5 });

          const dir = Math.random() > 0.5 ? 1 : -1;
          const bendSize = 20 + Math.random() * 20;
          currentX = currentX + dir * bendSize;
          currentY = bendY + bendSize;
          points.push({ x: currentX, y: currentY });
          nodes.push({ y: currentY, size: 2 + Math.random() * 2 });
        });

        points.push({ x: currentX, y: canvasHeight });
        nodes.push({ y: canvasHeight - 15, size: 3 });

        traces.push({ points, nodes });
      }

      let chars: string[] = [];
      if (config.matrixChars === 'binary') {
        chars = ['0', '1'];
      } else if (config.matrixChars === 'romantic') {
        chars = ['♥', '💕', 'L', 'O', 'V', 'E', 'S', 'A', 'Y', 'A', 'N', 'G'];
      } else if (config.matrixChars === 'code') {
        chars = ['{', '}', ';', '=>', 'const', 'love', '[]', '<>'];
      } else {
        chars = '01'.split('');
      }

      matrixState.current = {
        columns: cols,
        charSizes,
        speeds,
        charsList: chars,
        traces,
      };
    };

    // Reinitialize Particles pool
    const reinitializeParticles = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const count = config.particleCount;
      const list: Particle[] = [];

      // Reset entrance scan timer
      stateRef.current.entranceTime = 0;

      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        // Start partially on-screen to be revealed seamlessly, and partially above the screen
        const y = Math.random() * canvas.height * 1.5 - canvas.height * 0.5;
        list.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.5 + Math.random() * 0.8, // gentle slow drift momentum for starting waterfall
          targetX: x,
          targetY: y,
          originalTargetX: x,
          originalTargetY: y,
          size: Math.random() * config.particleSize + 1,
          baseSize: Math.random() * config.particleSize + 1,
          alpha: 0.1 + Math.random() * 0.8,
          color: config.particleColor,
          isSpare: true,
          angle: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.8,
        });
      }

      particles.current = list;
      triggerSlideTransition(stateRef.current.currentSlideIdx);
    };

    // Sample coordinates for a text word
    const sampleTextPoints = (text: string, width: number, height: number): { x: number; y: number }[] => {
      const upperText = text.toUpperCase();
      if (!offscreenCanvas.current) {
        offscreenCanvas.current = document.createElement('canvas');
      }
      const off = offscreenCanvas.current;
      off.width = width;
      off.height = height;
      const oCtx = off.getContext('2d', { willReadFrequently: true });
      if (!oCtx) return [];

      oCtx.fillStyle = '#000000';
      oCtx.fillRect(0, 0, width, height);

      // Determine responsive size
      let fontSize = Math.floor(width * 0.18);
      // For longer words, scale down size
      if (upperText.length > 4) {
        fontSize = Math.floor(width * (0.8 / upperText.length));
      }
      // Limit bounds
      fontSize = Math.min(fontSize, Math.floor(height * 0.5));
      fontSize = Math.max(fontSize, 28);

      oCtx.font = `900 ${fontSize}px "Inter", "Space Grotesk", sans-serif`;
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';
      oCtx.fillStyle = '#ffffff';

      // Draw text
      oCtx.fillText(upperText, width / 2, height / 2);

      // Read pixels
      const imgData = oCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const points: { x: number; y: number }[] = [];

      // Determine step based on canvas size and density
      const step = Math.max(2, Math.floor((width * height) / 100000));

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          if (r > 128) {
            // Add some jitter for nicer visual dust organic styling
            points.push({
              x: x + (Math.random() - 0.5) * 1.5,
              y: y + (Math.random() - 0.5) * 1.5,
            });
          }
        }
      }

      return points;
    };

    // Generate coordinates for the Parametric Heart
    const sampleHeartPoints = (width: number, height: number, count: number, heartText: string = "I Love ❤️ You"): { x: number; y: number }[] => {
      const points: { x: number; y: number }[] = [];
      const centerX = width / 2;
      const centerY = height / 2 - height * 0.05; // Slightly higher
      
      // Responsive scale for the heart - adaptively scale up for longer text so it fits beautifully
      const textLen = heartText ? heartText.length : 12;
      let scale = Math.min(width, height) * 0.016;
      if (textLen > 12) {
        scale = Math.min(width, height) * (0.016 + Math.min(0.008, (textLen - 12) * 0.0011));
      }

      // Draw a thick, highly dense double outline of the heart for perfect contrast
      // and extremely clear letter-perfect outline formed by small loves!
      for (let layer = 0; layer < 2; layer++) {
        const currentScale = scale - layer * 0.6;
        for (let i = 0; i < count / 2; i++) {
          const t = (i / (count / 2)) * Math.PI * 2;
          // Heart parametric formula
          const xVal = 16 * Math.pow(Math.sin(t), 3);
          const yVal = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          
          points.push({
            x: centerX + xVal * currentScale,
            y: centerY + yVal * currentScale,
          });
        }
      }

      // We do NOT add filled interior points to keep the centerpiece heart interior completely clean, 
      // so the romantic message is extremely sharp, readable and stunning inside the glowing outline!
      return points;
    };

    // Transition particle targets to active slide
    const triggerSlideTransition = (slideIdx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let targets: { x: number; y: number }[] = [];
      const isHeartSlide = slideIdx === config.slides.length;
      const currentSlide = config.slides[slideIdx];
      const isCountdown = currentSlide && (currentSlide.text === '3' || currentSlide.text === '2' || currentSlide.text === '1');

      if (slideIdx === -1) {
        // Entrance Phase - no targets, let all particles drift
      } else if (isHeartSlide) {
        // Heart Slide target
        targets = sampleHeartPoints(canvas.width, canvas.height, Math.floor(config.particleCount * 0.65), config.heartText);
      } else if (currentSlide) {
        // Countdown and normal words are all formed by the particles!
        targets = sampleTextPoints(currentSlide.text, canvas.width, canvas.height);
      }

      // Play Sound Effects
      if (config.enableSoundEffects && lastActiveSlideRef.current !== slideIdx) {
        lastActiveSlideRef.current = slideIdx;
        if (slideIdx === -1) {
          // Play initial bootup sweep sound or chime
          synthesizer.playTick(500, 0.1);
        } else if (isHeartSlide) {
          synthesizer.playTransitionChord();
          if (config.enableHeartbeat) {
            synthesizer.playHeartbeat();
          }
        } else {
          const isNumeric = currentSlide && !isNaN(Number(currentSlide.text));
          if (isNumeric) {
            synthesizer.playTick(600 + slideIdx * 100, 0.12);
          } else {
            synthesizer.playTransitionChord();
          }
        }
      }

      const pList = particles.current;
      const targetCount = targets.length;

      // Assign targets to particles
      for (let i = 0; i < pList.length; i++) {
        const p = pList[i];
        if (targetCount > 0 && i < targetCount) {
          p.targetX = targets[i].x;
          p.targetY = targets[i].y;
          p.originalTargetX = targets[i].x;
          p.originalTargetY = targets[i].y;
          p.isSpare = false;
          p.color = isHeartSlide ? config.heartColor : '#ffffff';
        } else {
          // Spare particles float around as star background / falling rain
          p.isSpare = true;
          // Set falling speed for spare particles
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = 0.5 + Math.random() * 0.8;
          p.targetX = p.x;
          p.targetY = p.y;
          p.color = config.particleColor;
        }
      }
    };

    // Main Canvas Render and Update Loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const container = containerRef.current;
        if (container) {
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;
          if (canvas.width !== newWidth || canvas.height !== newHeight || !particlesInitialized.current) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            particlesInitialized.current = true;
            setupMatrixRain(newWidth);
            reinitializeParticles();
          }
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      let animId = 0;
      let heartbeatTimer = 0;

      const render = (timestamp: number) => {
        if (!stateRef.current.lastFrameTime) {
          stateRef.current.lastFrameTime = timestamp;
        }
        const delta = (timestamp - stateRef.current.lastFrameTime) / 1000; // in seconds
        stateRef.current.lastFrameTime = timestamp;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isEntrance = stateRef.current.currentSlideIdx === -1;
        const scanY = isEntrance 
          ? (Math.min(1.0, stateRef.current.elapsedInSlide / 2.0) * canvas.height) 
          : canvas.height;

        // 1. Draw Background trail effect for romantic falling hearts
        // Make sure to reset any active shadows so the background rectangle doesn't glow or blur!
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = config.backgroundColor + '1e'; // alpha for beautiful trailing hearts effect
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1b. Pulsing background radial glow (Aurora behind heart centerpiece)
        const currentIdxForBg = stateRef.current.currentSlideIdx;
        const isHeartSlideForBg = currentIdxForBg === config.slides.length;
        const timeValForBg = timestamp / 1000;

        if (isHeartSlideForBg) {
          ctx.save();
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2 - canvas.height * 0.05;
          const glowRadius = Math.min(canvas.width, canvas.height) * (0.35 + 0.05 * Math.sin(timeValForBg * 5));
          const bgGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, glowRadius);
          bgGlow.addColorStop(0, 'rgba(244, 63, 94, 0.16)'); // romantic pink aura
          bgGlow.addColorStop(0.5, 'rgba(236, 72, 153, 0.06)'); // pinkish violet dusk
          bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bgGlow;
          ctx.beginPath();
          ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 1c. Update and draw drifting background rose petals/hearts
        const petals = rosePetals.current;
        if (petals.length === 0) {
          // Initialize some gorgeous drifting rose petals/hearts
          for (let i = 0; i < 28; i++) {
            petals.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              size: 4 + Math.random() * 8,
              angle: Math.random() * Math.PI * 2,
              spin: (Math.random() - 0.5) * 0.015,
              speedY: 0.4 + Math.random() * 0.7,
              speedX: -0.3 + Math.random() * 0.5,
              opacity: 0.15 + Math.random() * 0.4
            });
          }
        }

        // Draw and update petals
        ctx.save();
        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          p.y += p.speedY;
          p.x += p.speedX;
          p.angle += p.spin;
          // Soft sway
          p.x += Math.sin(timeValForBg * 0.8 + i) * 0.22;

          if (p.y > canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
          if (p.x < -20) p.x = canvas.width + 20;
          if (p.x > canvas.width + 20) p.x = -20;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = `rgba(244, 63, 94, ${p.opacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
          drawTinyHeart(ctx, 0, 0, p.size);
          ctx.restore();
        }
        ctx.restore();

        // 2b. Draw horizontal line of love/hearts falling down from the top (Entrance Phase)
        if (isEntrance) {
          const progress = Math.min(1.0, stateRef.current.elapsedInSlide / 2.0);
          const currentScanY = progress * canvas.height;

          ctx.save();
          ctx.globalCompositeOperation = 'screen';

          // Soft neon rose/pink background ambient glow
          const grad = ctx.createLinearGradient(0, currentScanY - 30, 0, currentScanY + 30);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.28)'); // Rose-500 glow
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, currentScanY - 30, canvas.width, 60);

          // Render horizontal line of densely spaced, glowing white hearts
          const heartSpacing = 18; // gorgeous compact horizontal spacing
          const heartCount = Math.floor(canvas.width / heartSpacing) + 1;
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#f43f5e'; // gorgeous hot pink glow
          ctx.fillStyle = '#ffffff'; // brilliant bright white cores for perfect contrast

          for (let h = 0; h < heartCount; h++) {
            // Elegant slight sine wave vertical offsets for organic fluid feel
            const hx = h * heartSpacing + (Math.sin(stateRef.current.globalTime * 6 + h) * 3);
            const hy = currentScanY + (Math.cos(stateRef.current.globalTime * 4 + h) * 2);
            drawTinyHeart(ctx, hx, hy, 4.5);
          }

          ctx.restore();
        }

        // 3. Handle Timelines & Slide Progressing
        if (stateRef.current.isPlaying) {
          const currentIdx = stateRef.current.currentSlideIdx;
          const isHeartSlide = currentIdx === config.slides.length;

          // Calculate total duration for progress callback
          const totalDuration = config.slides.reduce((acc, s) => acc + s.duration, 0);

          if (currentIdx === -1) {
            // Entrance Phase (Scanline sweeps down for 2.0 seconds)
            stateRef.current.elapsedInSlide += delta;
            stateRef.current.globalTime += delta;

            if (onTimelineUpdate) {
              onTimelineUpdate(-1, stateRef.current.globalTime, totalDuration);
            }

            if (stateRef.current.elapsedInSlide >= 2.0) {
              // Transition to slide 0 ("3")
              stateRef.current.currentSlideIdx = 0;
              stateRef.current.elapsedInSlide = 0;
              setCurrentSlideIdx(0);
              triggerSlideTransition(0);
            }
          } else if (!isHeartSlide) {
            const currentSlide = config.slides[currentIdx];
            stateRef.current.elapsedInSlide += delta;
            stateRef.current.globalTime += delta;

            // Trigger timeline updates
            if (onTimelineUpdate) {
              onTimelineUpdate(currentIdx, stateRef.current.globalTime, totalDuration);
            }

            if (stateRef.current.elapsedInSlide >= currentSlide.duration) {
              // Proceed to next slide
              const nextIdx = currentIdx + 1;
              stateRef.current.currentSlideIdx = nextIdx;
              stateRef.current.elapsedInSlide = 0;
              setCurrentSlideIdx(nextIdx);
              triggerSlideTransition(nextIdx);
            }
          } else {
            // Heart heartbeat sound looped
            if (config.enableHeartbeat && config.enableSoundEffects) {
              heartbeatTimer += delta;
              if (heartbeatTimer >= config.heartPulseRate) {
                synthesizer.playHeartbeat();
                heartbeatTimer = 0;
              }
            }

            stateRef.current.elapsedInSlide += delta;
            stateRef.current.globalTime += delta;

            // Automatically loop back to the entrance scan phase after 10 seconds of centerpiece
            if (stateRef.current.elapsedInSlide >= 10.0) {
              setCurrentSlideIdx(-1);
              stateRef.current.currentSlideIdx = -1;
              stateRef.current.elapsedInSlide = 0;
              stateRef.current.globalTime = 0;
              stateRef.current.entranceTime = 0;
              reinitializeParticles();
              if (config.enableSoundEffects) {
                synthesizer.playTick(500, 0.15);
              }
            }

            // Timeline updates for completed loop
            if (onTimelineUpdate) {
              onTimelineUpdate(currentIdx, totalDuration, totalDuration);
            }
          }
        }

        // 4. Update and Draw Particles
        const pList = particles.current;
        const currentIdx = stateRef.current.currentSlideIdx;
        const isHeartSlide = currentIdx === config.slides.length;
        const timeVal = timestamp / 1000;

        // Dynamic Heart pulsing scale factor
        const pulseFactor = isHeartSlide
          ? 1.0 + 0.08 * Math.sin((timeVal * Math.PI * 2) / config.heartPulseRate)
          : 1.0;

        // Mouse references
        const mouseX = stateRef.current.mouse.x;
        const mouseY = stateRef.current.mouse.y;
        const radiusSq = config.interactiveRadius * config.interactiveRadius;

        ctx.save();
        if (isEntrance) {
          ctx.beginPath();
          ctx.rect(0, 0, canvas.width, scanY);
          ctx.clip();
        }
        // Setup Glow Effects
        ctx.shadowBlur = config.glowStrength;
        ctx.shadowColor = isHeartSlide ? config.glowColor : 'rgba(255, 255, 255, 0.95)';

        for (let i = 0; i < pList.length; i++) {
          const p = pList[i];

          if (p.isSpare) {
            // Romantic gentle rain falling physics
            p.angle += 0.015 * p.speed;
            p.y += p.vy;
            p.x += p.vx;

            // Soft floaty breeze sway
            p.x += Math.sin(p.angle + timeVal * 0.6) * 0.12;

            // Wrap bounds
            if (p.y > canvas.height) {
              p.y = -20;
              p.x = Math.random() * canvas.width;
              p.vy = 0.5 + Math.random() * 0.8; // extremely gentle slow romantic speed
              p.vx = (Math.random() - 0.5) * 0.3;
            }
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
          } else {
            // Target guidance physics (Spring Easing)
            let targetX = p.originalTargetX;
            let targetY = p.originalTargetY;

            // Apply pulse scale if Heart
            if (isHeartSlide) {
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2 - canvas.height * 0.05;
              targetX = centerX + (p.originalTargetX - centerX) * pulseFactor;
              targetY = centerY + (p.originalTargetY - centerY) * pulseFactor;
            }

            // Target attraction vectors
            let dx = targetX - p.x;
            let dy = targetY - p.y;

            // Ease towards targets
            p.vx += dx * 0.06;
            p.vy += dy * 0.06;

            // Apply friction damping
            p.vx *= 0.75;
            p.vy *= 0.75;

            // Apply Interactive mouse forces (Repulsion/Attraction)
            if (config.interactiveForce !== 'none' && mouseX > 0) {
              const mDx = p.x - mouseX;
              const mDy = p.y - mouseY;
              const distSq = mDx * mDx + mDy * mDy;

              if (distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                const force = (config.interactiveRadius - dist) / config.interactiveRadius;
                
                if (config.interactiveForce === 'repel') {
                  // Push away
                  p.vx += (mDx / dist) * force * 15;
                  p.vy += (mDy / dist) * force * 15;
                } else if (config.interactiveForce === 'attract') {
                  // Pull towards mouse
                  p.vx -= (mDx / dist) * force * 8;
                  p.vy -= (mDy / dist) * force * 8;
                }
              }
            }

            // Move particle
            p.x += p.vx;
            p.y += p.vy;
          }

          // Draw Particle as beautiful custom hearts!
          if (p.isSpare) {
            // Low-density filter: only draw a fraction of spare particles for a perfect subtle rain
            if (i % 10 === 0) {
              ctx.save();
              ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'; // beautiful translucent pink-rose falling drizzle
              ctx.shadowBlur = 4;
              ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
              drawTinyHeart(ctx, p.x, p.y, p.size * 0.85);
              ctx.restore();
            }
          } else {
            // Bright, solid, glowing active text forming hearts
            ctx.fillStyle = p.color;
            drawTinyHeart(ctx, p.x, p.y, p.size * 1.15);

            // Occasional beautiful fairy-dust/stardust sparkles on text particles
            if (Math.random() < 0.004) {
              ctx.save();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.0;
              ctx.globalAlpha = 0.95;
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(p.x - 5, p.y);
              ctx.lineTo(p.x + 5, p.y);
              ctx.moveTo(p.x, p.y - 5);
              ctx.lineTo(p.x, p.y + 5);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
        ctx.restore();

        // Update and Draw interactive clicked hearts
        const activeHearts = clickHearts.current;
        for (let i = activeHearts.length - 1; i >= 0; i--) {
          const h = activeHearts[i];
          h.life++;
          h.x += h.vx;
          h.y += h.vy;
          // Apply gentle gravity and air friction
          h.vy += 0.08;
          h.vx *= 0.98;
          h.alpha = Math.max(0, 1.0 - (h.life / h.maxLife));
          h.size = Math.max(0.1, h.size * 0.98);

          if (h.life >= h.maxLife || h.size <= 0.2) {
            activeHearts.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.fillStyle = h.color;
          ctx.globalAlpha = h.alpha;
          ctx.shadowBlur = 10;
          ctx.shadowColor = h.color;
          drawTinyHeart(ctx, h.x, h.y, h.size);
          ctx.restore();
        }

        // --- DISSOLVING FLOATING WORDS ("Kichu word asbe diye mise jabe") ---
        const activeWords = floatingWords.current;
        
        // Spawn a word occasionally
        if (activeWords.length < 5 && Math.random() < 0.008) {
          const vocabulary = ['LOVE', 'তুমি', 'ভালোবাসা', 'FOREVER', 'ALWAYS', 'HEART', 'SONA', 'হৃদয়', 'SMILE', 'JANU', 'BELOVED', 'পরান', 'SWEETHEART', 'MINE'];
          const word = vocabulary[Math.floor(Math.random() * vocabulary.length)].toUpperCase();
          activeWords.push({
            text: word,
            x: Math.random() * canvas.width,
            y: canvas.height + 40,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(0.5 + Math.random() * 0.8),
            size: 15 + Math.random() * 12,
            alpha: 0, // starts hidden and fades in
            life: 0,
            maxLife: 320 + Math.floor(Math.random() * 200),
            color: `rgba(244, 63, 94, ${0.45 + Math.random() * 0.4})`, // beautiful rose font
            glow: `rgba(236, 72, 153, 0.9)`,
            dissolving: false,
            dissolveProgress: 0,
            swaySpeed: 0.6 + Math.random() * 1.0,
            swayOffset: Math.random() * 100
          });
        }

        // Update and Draw floating words
        for (let i = activeWords.length - 1; i >= 0; i--) {
          const w = activeWords[i];
          w.life++;
          
          // Gentle wave/sway motion
          w.x += w.vx + Math.sin(timeVal * w.swaySpeed + w.swayOffset) * 0.15;
          w.y += w.vy;

          // Fade in at start, fade out at end
          if (w.life < 50) {
            w.alpha = w.life / 50;
          } else if (w.life > w.maxLife - 50) {
            w.alpha = (w.maxLife - w.life) / 50;
          } else {
            w.alpha = 1.0;
          }

          // Check if hovered/touched by mouse to trigger "instant gorgeous dissolution/mixing"
          const mouse = stateRef.current.mouse;
          const dx = mouse.x - w.x;
          const dy = mouse.y - w.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 45 && !w.dissolving) {
            w.dissolving = true;
            // Create a burst of sparkles/hearts at the word position when it dissolves!
            if (config.enableSoundEffects) {
              synthesizer.playSparkle();
            }
            // Spawn multiple dissolve star/heart particles
            const wordColor = w.color.includes('rgba') ? 'rgba(244, 63, 94, 0.9)' : w.color;
            for (let k = 0; k < 15; k++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.6 + Math.random() * 2.5;
              activeHearts.push({
                x: w.x + (Math.random() - 0.5) * 40,
                y: w.y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                size: 3 + Math.random() * 4.5,
                alpha: 1.0,
                color: wordColor,
                life: 0,
                maxLife: 45 + Math.floor(Math.random() * 35)
              });
            }
          }

          // If word is dissolving or reached the end of life, splice out
          if (w.dissolving || w.life >= w.maxLife || w.y < -40 || w.x < -100 || w.x > canvas.width + 100) {
            // If it naturally reached end of life, trigger small dissolution chimes
            if (!w.dissolving && w.life >= w.maxLife) {
              const wordColor = w.color.includes('rgba') ? 'rgba(244, 63, 94, 0.9)' : w.color;
              for (let k = 0; k < 6; k++) {
                const angle = Math.random() * Math.PI * 2;
                activeHearts.push({
                  x: w.x,
                  y: w.y,
                  vx: Math.cos(angle) * 0.8,
                  vy: Math.sin(angle) * 0.8 - 0.2,
                  size: 2.5 + Math.random() * 3,
                  alpha: 1.0,
                  color: wordColor,
                  life: 0,
                  maxLife: 30 + Math.floor(Math.random() * 20)
                });
              }
            }
            activeWords.splice(i, 1);
            continue;
          }

          // Draw the beautiful floating word
          ctx.save();
          ctx.globalAlpha = w.alpha * 0.85;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Beautiful drop shadow glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = w.glow;
          ctx.fillStyle = '#ffffff'; // White letters with glowing edges looks stunning
          
          ctx.font = `900 ${w.size}px "Space Grotesk", sans-serif`;
          
          ctx.fillText(w.text, w.x, w.y);
          ctx.restore();
        }

        // 5. Draw overlay text inside the pulsing Heart
        if (isHeartSlide) {
          ctx.save();
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2 - canvas.height * 0.05;

          // Text animation pulse offset
          const textPulse = 1.0 + 0.03 * Math.sin(timeVal * 4);

          // Configure typography
          ctx.shadowBlur = config.glowStrength;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Center text (Main Message) - adaptively scale down font size for longer messages
          const textLen = config.heartText.length;
          let fontSizeMultiplier = 1.0;
          if (textLen > 12) {
            fontSizeMultiplier = Math.max(0.62, 12 / textLen);
          }
          const fontSizeMain = Math.max(16, Math.floor(canvas.width * 0.038 * fontSizeMultiplier) * textPulse);
          ctx.font = `bold ${fontSizeMain}px "Space Grotesk", "Inter", sans-serif`;
          ctx.fillText(config.heartText, centerX, centerY);

          // Sub text (Underneath)
          if (config.heartSubText) {
            const fontSizeSub = Math.max(11, Math.floor(canvas.width * 0.02 * fontSizeMultiplier) * textPulse);
            ctx.font = `500 ${fontSizeSub}px monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(config.heartSubText, centerX, centerY + fontSizeMain * 1.45);
          }
          ctx.restore();
        }

        // Keep loop running
        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', resizeCanvas);
      };
    }, [config, isPlaying]);

    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      stateRef.current.mouse = { x: -1000, y: -1000 };
    };

    // Spawn lovely pink floating hearts on click/tap
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (config.enableSoundEffects) {
        synthesizer.playSparkle();
      }

      const heartColors = ['#ff2a6d', '#ff007f', '#f43f5e', '#ec4899', '#f472b6', '#ffffff'];
      for (let i = 0; i < 15; i++) {
        const angle = Math.PI * 1.25 + Math.random() * Math.PI * 0.5; // directed upwards and outwards
        const speed = 1.2 + Math.random() * 3.5;
        clickHearts.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 5,
          alpha: 1.0,
          color: heartColors[Math.floor(Math.random() * heartColors.length)],
          life: 0,
          maxLife: 60 + Math.floor(Math.random() * 40)
        });
      }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (config.enableSoundEffects) {
        synthesizer.playSparkle();
      }

      const heartColors = ['#ff2a6d', '#ff007f', '#f43f5e', '#ec4899', '#f472b6', '#ffffff'];
      for (let i = 0; i < 15; i++) {
        const angle = Math.PI * 1.25 + Math.random() * Math.PI * 0.5;
        const speed = 1.2 + Math.random() * 3.5;
        clickHearts.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 5,
          alpha: 1.0,
          color: heartColors[Math.floor(Math.random() * heartColors.length)],
          life: 0,
          maxLife: 60 + Math.floor(Math.random() * 40)
        });
      }
    };

    // --- HTML5 CANVAS VIDEO RECORDING ENGINE ---
    const startCanvasRecording = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      stateRef.current.recordingChunks = [];
      try {
        // Try to capture 30 frames per second
        const stream = canvas.captureStream(30);
        let options = { mimeType: 'video/webm;codecs=vp9' };
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm;codecs=vp8' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
        }

        const recorder = new MediaRecorder(stream, options);
        
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            stateRef.current.recordingChunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(stateRef.current.recordingChunks, {
            type: 'video/webm',
          });
          const url = URL.createObjectURL(blob);
          
          // Trigger download automatically
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `romantic_particles_${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          
          setIsRecording(false);
        };

        stateRef.current.mediaRecorder = recorder;
        recorder.start();
        setIsRecording(true);

        // Restart animation sequence to record from beginning
        stateRef.current.currentSlideIdx = 0;
        stateRef.current.elapsedInSlide = 0;
        stateRef.current.globalTime = 0;
        setCurrentSlideIdx(0);
        reinitializeParticles();

      } catch (err) {
        console.error('Failed to initialize canvas stream recording:', err);
        alert('Browser recording is not fully supported on this frame context. Try opening in a new tab.');
        setIsRecording(false);
      }
    };

    const stopCanvasRecording = () => {
      const recorder = stateRef.current.mediaRecorder;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    };

    return (
      <div
        ref={containerRef}
        className={
          isFullscreen
            ? "relative w-full h-full overflow-hidden bg-black"
            : "relative w-full h-full rounded-2xl overflow-hidden bg-black border border-neutral-900 shadow-2xl"
        }
        style={isFullscreen ? {} : { aspectRatio: '16/9' }}
        id="video-player-container"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          className="w-full h-full block cursor-crosshair"
          id="video-rendering-canvas"
        />

        {/* Bottom Recording overlay indicator */}
        {isRecording && (
          <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-red-950/80 border border-red-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-red-200">
              Recording Video
            </span>
          </div>
        )}
      </div>
    );
  }
);

VideoCanvas.displayName = 'VideoCanvas';
