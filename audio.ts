// Client-side Web Audio API synthesizer for transitions, heartbeats, and ticks
export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private bgmIntervalId: any = null;
  private bgmStep = 0;
  private bgmPlaying = false;

  // A beautiful romantic chord progression in Fmaj7 - G6 - Am7 - Em7 (Keys that feel deeply romantic and peaceful)
  private melodyNotes = [
    // Fmaj7 (F, A, C, E)
    174.61, 220.00, 261.63, 329.63, 440.00, 523.25,
    // G6 (G, B, D, E)
    196.00, 246.94, 293.66, 329.63, 392.00, 493.88,
    // Am7 (A, C, E, G)
    220.00, 261.63, 329.63, 392.00, 440.00, 523.25,
    // Em7 (E, G, B, D)
    164.81, 196.00, 246.94, 293.66, 329.63, 392.00
  ];

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick(frequency = 600, duration = 0.1) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  }

  playHeartbeat() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Double thump
      [0, 0.18].forEach((delay) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now + delay);
        osc.frequency.exponentialRampToValueAtTime(20, now + delay + 0.15);

        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  }

  playTransitionChord() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord chimes

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        
        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 1.2);
      });
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  }

  playSparkle() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = 800 + Math.random() * 600; // sweet high notes
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, now + 0.3);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  }

  playEnvelopeOpen() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [220.00, 277.18, 329.63, 440.00, 554.37]; // Beautiful soft warm rising chord
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now + idx * 0.1);
        filter.frequency.exponentialRampToValueAtTime(300, now + idx * 0.1 + 1.5);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.1 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.6);
      });
    } catch (e) {
      console.warn("Audio Context failed:", e);
    }
  }

  playMusicBoxNote(freq: number, duration = 2.5) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft triangle wave for music box feel
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass filter for warm, cozy sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + duration);

      // Smooth release envelope
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.05); // quick soft attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn(e);
    }
  }

  startBackgroundMusic() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.initCtx();
    
    // Play a note every 0.8 seconds in a warm arpeggiated romantic pattern
    this.bgmStep = 0;
    this.bgmIntervalId = setInterval(() => {
      if (!this.bgmPlaying) return;
      
      const chordIndex = Math.floor(this.bgmStep / 8) % 4; // 4 chords
      const chordNotesOffset = chordIndex * 6;
      
      // Determine which note of the chord to play
      let noteIndex = 0;
      const stepInChord = this.bgmStep % 8;
      
      if (stepInChord === 0) noteIndex = 0; // Bass note
      else if (stepInChord === 1) noteIndex = 2;
      else if (stepInChord === 2) noteIndex = 4;
      else if (stepInChord === 3) noteIndex = 3;
      else if (stepInChord === 4) noteIndex = 5;
      else if (stepInChord === 5) noteIndex = 4;
      else if (stepInChord === 6) noteIndex = 2;
      else noteIndex = 1;

      const freq = this.melodyNotes[chordNotesOffset + noteIndex];
      // Occasional sweet melody transposition up an octave
      const octaveMultiplier = (Math.random() < 0.25 && stepInChord > 2) ? 2 : 1;
      
      this.playMusicBoxNote(freq * octaveMultiplier, 2.2);
      this.bgmStep++;
    }, 850);
  }

  stopBackgroundMusic() {
    this.bgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  isBgmPlaying() {
    return this.bgmPlaying;
  }
}

export const synthesizer = new SoundSynthesizer();
