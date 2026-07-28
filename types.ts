export interface Slide {
  id: string;
  text: string;
  duration: number; // in seconds
  particleColor?: string;
  glowColor?: string;
}

export interface VideoConfig {
  themeName: string;
  backgroundColor: string;
  matrixColor: string;
  particleColor: string;
  glowColor: string;
  heartColor: string;
  
  // Matrix rain parameters
  matrixDensity: number; // 0.1 to 1.0
  matrixSpeed: number;   // 1 to 5
  matrixChars: 'binary' | 'standard' | 'romantic' | 'code';
  matrixCharSize: number;

  // Particle properties
  particleSize: number;
  particleCount: number; // Max active particles
  glowStrength: number;  // 5 to 30px
  interactiveForce: 'repel' | 'attract' | 'none';
  interactiveRadius: number; // Mouse reaction radius
  heartPulseRate: number; // seconds per pulse

  // Sequences
  slides: Slide[];
  heartText: string;
  heartSubText: string;
  useCursiveFont: boolean;

  // Sound settings
  enableSoundEffects: boolean;
  enableBackgroundMusic: boolean;
  enableHeartbeat: boolean;
}

export const PRESET_THEMES: Record<string, Partial<VideoConfig>> = {
  romanticPink: {
    themeName: 'Pink Magenta (Original)',
    backgroundColor: '#050206',
    matrixColor: 'rgba(255, 30, 130, 0.45)',
    particleColor: '#ffffff',
    glowColor: 'rgba(255, 50, 150, 0.95)',
    heartColor: 'rgba(255, 20, 120, 1)',
    matrixChars: 'romantic',
  },
  crimsonFire: {
    themeName: 'Crimson Passion',
    backgroundColor: '#060101',
    matrixColor: 'rgba(240, 20, 20, 0.45)',
    particleColor: '#fff5f5',
    glowColor: 'rgba(255, 40, 0, 0.9)',
    heartColor: 'rgba(230, 0, 10, 1)',
    matrixChars: 'binary',
  },
  neonViolet: {
    themeName: 'Cyber Purple',
    backgroundColor: '#020108',
    matrixColor: 'rgba(150, 30, 255, 0.45)',
    particleColor: '#fcf8ff',
    glowColor: 'rgba(180, 50, 255, 0.95)',
    heartColor: 'rgba(160, 40, 255, 1)',
    matrixChars: 'code',
  },
  emeraldAurora: {
    themeName: 'Emerald Dream',
    backgroundColor: '#010502',
    matrixColor: 'rgba(30, 220, 110, 0.4)',
    particleColor: '#f4fff8',
    glowColor: 'rgba(40, 255, 120, 0.9)',
    heartColor: 'rgba(20, 230, 100, 1)',
    matrixChars: 'standard',
  },
  goldenGlow: {
    themeName: 'Sunset Gold',
    backgroundColor: '#050401',
    matrixColor: 'rgba(230, 180, 20, 0.4)',
    particleColor: '#fffef0',
    glowColor: 'rgba(255, 200, 40, 0.9)',
    heartColor: 'rgba(255, 170, 0, 1)',
    matrixChars: 'romantic',
  }
};
