// Procedural Cinematic Space Ambience & 3D Spatial Audio Engine via Web Audio API
// Generates deep, peaceful cosmic drones, celestial pads, stellar wind, and spatial localized interactions
// 100% synthesized in Web Audio API with zero external audio assets or network requests.

class SpaceSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Master Gain & Sub-busses
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private shimmerGain: GainNode | null = null;
  private microGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Spatial Convolution Reverb
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;

  // Dynamic Atmospheric State
  public isMuted: boolean = true;
  public volume: number = 0.45;
  private currentAltitude: number = 145;
  private lastWhooshTime: number = 0;

  // UI Change Listeners
  private stateChangeListeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      // Restore persisted session preferences
      const savedMute = sessionStorage.getItem("maximem_space_audio_muted");
      const savedVol = sessionStorage.getItem("maximem_space_audio_volume");

      // Default to muted until user explicitly unmutes (autoplay compliance)
      this.isMuted = savedMute !== null ? savedMute === "true" : true;
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          this.volume = v;
        }
      }

      // Smoothly unlock audio context on initial user gesture if unmuted
      const unlockAudio = () => {
        if (!this.ctx && !this.isMuted) {
          this.startAudio();
        } else if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume();
        }
      };

      window.addEventListener("pointerdown", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  private notify() {
    this.stateChangeListeners.forEach((l) => l());
  }

  // Algorithmic Space Impulse Response (2.4s cosmic decay, stereo diffusion)
  private createSpaceReverbBuffer(ctx: AudioContext): AudioBuffer {
    const rate = ctx.sampleRate;
    const duration = 2.4;
    const length = Math.floor(rate * duration);
    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Soft exponential decay envelope
      const env = Math.exp(-t * 3.8);
      // Gentle high-frequency damping factor over time
      const damping = 1.0 - t * 0.4;

      left[i] = (Math.random() * 2 - 1) * env * damping;
      right[i] = (Math.random() * 2 - 1) * env * damping;
    }

    return buffer;
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();

      // Master output node
      this.masterGain = this.ctx.createGain();
      const initialTarget = this.isMuted ? 0.0001 : this.volume * 0.42;
      this.masterGain.gain.setValueAtTime(initialTarget, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Algorithmic Spatial Reverb Bus
      try {
        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = this.createSpaceReverbBuffer(this.ctx);
        this.reverbWetGain = this.ctx.createGain();
        this.reverbWetGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
        this.reverbNode.connect(this.reverbWetGain);
        this.reverbWetGain.connect(this.masterGain);
      } catch {
        // Convolver fallback
      }

      // Sub-busses
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      this.droneGain.connect(this.masterGain);

      this.padGain = this.ctx.createGain();
      this.padGain.gain.setValueAtTime(0.40, this.ctx.currentTime);
      this.padGain.connect(this.masterGain);

      this.shimmerGain = this.ctx.createGain();
      this.shimmerGain.gain.setValueAtTime(0.20, this.ctx.currentTime);
      this.shimmerGain.connect(this.masterGain);

      this.microGain = this.ctx.createGain();
      this.microGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.microGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupGenerators();
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SYNTHESIS GENERATORS (Drone, Pad, Wind, Micro-Shimmer)
  // ───────────────────────────────────────────────────────────────────────────
  private setupGenerators() {
    if (!this.ctx || !this.droneGain || !this.padGain || !this.shimmerGain || !this.microGain) return;
    const now = this.ctx.currentTime;

    // 1. SUB-HARMONIC SPACE DRONE (D1 = 36.7Hz + A1 = 55.0Hz)
    // Deep, grounding cosmic warmth with subtle 14s breathing LFO
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.setValueAtTime(140, now);
    droneFilter.Q.setValueAtTime(2.2, now);
    droneFilter.connect(this.droneGain);

    const droneLfo = this.ctx.createOscillator();
    const droneLfoGain = this.ctx.createGain();
    droneLfo.frequency.setValueAtTime(0.07, now);
    droneLfoGain.gain.setValueAtTime(45, now);
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneFilter.frequency);
    droneLfo.start(now);

    const subOsc1 = this.ctx.createOscillator();
    subOsc1.type = "sine";
    subOsc1.frequency.setValueAtTime(36.7, now);
    subOsc1.connect(droneFilter);
    subOsc1.start(now);

    const subOsc2 = this.ctx.createOscillator();
    subOsc2.type = "triangle";
    subOsc2.frequency.setValueAtTime(55.0, now);
    subOsc2.connect(droneFilter);
    subOsc2.start(now);

    // 2. CELESTIAL SPACE PAD (Dmaj9 / Dsus2 celestial harmony)
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = "bandpass";
    padFilter.frequency.setValueAtTime(420, now);
    padFilter.Q.setValueAtTime(1.8, now);
    padFilter.connect(this.padGain);

    const padLfo = this.ctx.createOscillator();
    const padLfoGain = this.ctx.createGain();
    padLfo.frequency.setValueAtTime(0.04, now);
    padLfoGain.gain.setValueAtTime(220, now);
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start(now);

    const chordFreqs = [146.83, 185.0, 220.0, 277.18, 329.63];
    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.4, now);
      pGain.gain.setValueAtTime(0.12, now);
      osc.connect(pGain);
      pGain.connect(padFilter);
      osc.start(now);
    });

    // 3. INTERSTELLAR SHIMMER / STELLAR WIND (Filtered Pink Noise with Slow Sweep)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1600, now);
    noiseFilter.Q.setValueAtTime(3.2, now);

    const noiseLfo = this.ctx.createOscillator();
    const noiseLfoGain = this.ctx.createGain();
    noiseLfo.frequency.setValueAtTime(0.05, now);
    noiseLfoGain.gain.setValueAtTime(900, now);
    noiseLfo.connect(noiseLfoGain);
    noiseLfoGain.connect(noiseFilter.frequency);
    noiseLfo.start(now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(this.shimmerGain);
    noiseSource.start(now);

    // 4. INTIMATE MICRO-SHIMMER (High Crystalline Harmonics for Deep Zoom)
    const microFilter = this.ctx.createBiquadFilter();
    microFilter.type = "highpass";
    microFilter.frequency.setValueAtTime(800, now);
    microFilter.connect(this.microGain);

    const microFreqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    microFreqs.forEach((mf) => {
      if (!this.ctx) return;
      const mOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      mOsc.type = "sine";
      mOsc.frequency.setValueAtTime(mf + (Math.random() - 0.5) * 0.6, now);
      mGain.gain.setValueAtTime(0.04, now);
      mOsc.connect(mGain);
      mGain.connect(microFilter);
      mOsc.start(now);
    });
  }

  // Backward-compatible zoom atmosphere adaptation
  public setZoomAtmosphere(zoomFactor: number) {
    if (!this.ctx || !this.padGain) return;
    try {
      const now = this.ctx.currentTime;
      const targetGain = 0.35 + (1.0 - Math.min(1.0, Math.max(0.0, zoomFactor))) * 0.22;
      this.padGain.gain.linearRampToValueAtTime(targetGain, now + 0.1);
    } catch {
      // ignore
    }
  }

  // Velvety low-frequency sweep when recall shockwave or ingestion occurs
  public playShockwaveWhoosh() {
    this.playZoomSweep("in");
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DYNAMIC ZOOM & ALTITUDE LAYER CROSSFADING
  // ───────────────────────────────────────────────────────────────────────────
  public updateAltitude(radius: number, deltaRadius: number = 0) {
    if (!this.ctx || this.isMuted) return;
    this.currentAltitude = radius;
    const now = this.ctx.currentTime;

    try {
      // 1. Crossfade ambient layers based on camera radius
      if (this.droneGain && this.padGain && this.microGain && this.shimmerGain) {
        // Drone: loudest at macro zoom, softly drops down as we go inside
        const droneFactor = Math.min(1.0, Math.max(0.18, radius / 120.0));
        this.droneGain.gain.setTargetAtTime(0.55 * droneFactor, now, 0.12);

        // Pad: swells in mid-field (radius ~ 40-100)
        const padFactor = radius > 15 ? Math.min(1.0, (radius / 70.0) * 0.9) : 0.22;
        this.padGain.gain.setTargetAtTime(0.38 * padFactor, now, 0.15);

        // Micro-shimmer: silent at macro, rises as radius drops below 35
        const microFactor = radius < 35 ? Math.min(1.0, (35 - radius) / 32) : 0.0;
        this.microGain.gain.setTargetAtTime(0.32 * microFactor, now, 0.18);

        // Stellar wind: prominent at wide galaxy overview
        const shimmerFactor = Math.min(1.0, Math.max(0.15, radius / 80.0));
        this.shimmerGain.gain.setTargetAtTime(0.22 * shimmerFactor, now, 0.15);
      }

      // 2. Velocity-based Zoom Whooshes & Atmospheric Sweeps
      const nowMs = performance.now();
      if (Math.abs(deltaRadius) > 2.0 && nowMs - this.lastWhooshTime > 1100) {
        this.lastWhooshTime = nowMs;
        if (deltaRadius < -2.0) {
          this.playZoomSweep("in");
        } else if (deltaRadius > 2.0) {
          this.playZoomSweep("out");
        }
      }
    } catch {
      // ignore automation errors
    }
  }

  // Rising or Descending Zoom Atmospheric Sweep
  public playZoomSweep(direction: "in" | "out") {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.Q.setValueAtTime(2.4, now);

      osc.type = "sine";

      if (direction === "in") {
        // Ascending whoosh: 180Hz -> 540Hz
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.65);
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.exponentialRampToValueAtTime(880, now + 0.65);
      } else {
        // Descending sweep: 540Hz -> 140Hz
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.75);
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(220, now + 0.75);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09 * this.volume, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      if (this.reverbNode) {
        gain.connect(this.reverbNode);
      }

      osc.start(now);
      osc.stop(now + 0.75);
    } catch {
      // ignore
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SPATIAL POSITIONED INTERACTIVE SOUND FX
  // ───────────────────────────────────────────────────────────────────────────

  // Subtle crystal chime pulse when node is hovered, clicked, or excited
  // screenX: -1.0 (left) to +1.0 (right) for authentic 3D spatial panning
  public playNodePulse(clusterIndex = 0, screenX = 0, isMajor = false) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;

      // Pythagorean celestial pentatonic scale in D:
      const scale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 739.99];
      const baseFreq = scale[clusterIndex % scale.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(isMajor ? 3200 : 2400, now);

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);

      const amp = (isMajor ? 0.15 : 0.09) * this.volume;
      const duration = isMajor ? 0.85 : 0.55;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);

      // 3D Spatial Stereo Panning
      let lastNode: AudioNode = gain;
      if (typeof this.ctx.createStereoPanner === "function") {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, screenX)), now);
        gain.connect(panner);
        lastNode = panner;
      }

      lastNode.connect(this.sfxGain);

      if (this.reverbNode) {
        lastNode.connect(this.reverbNode);
      }

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  // Constellation Cluster Bloom (Harmonic celestial arpeggio chord)
  public playClusterBloom(clusterIndex = 0, screenX = 0) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const chordOffsets = [0, 2, 4, 7];
      const rootNotes = [293.66, 329.63, 369.99, 440.0, 493.88];
      const base = rootNotes[clusterIndex % rootNotes.length];

      chordOffsets.forEach((semitones, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const noteFreq = base * Math.pow(2, semitones / 12);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(noteFreq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.07 * this.volume, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.65);

        osc.connect(gain);

        if (typeof this.ctx.createStereoPanner === "function") {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, screenX)), now);
          gain.connect(panner);
          panner.connect(this.sfxGain);
          if (this.reverbNode) panner.connect(this.reverbNode);
        } else {
          gain.connect(this.sfxGain);
          if (this.reverbNode) gain.connect(this.reverbNode);
        }

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.7);
      });
    } catch {
      // ignore
    }
  }

  // Delicate Harmonic Glissando when hovering or discovering gravitational filaments
  public playFilamentResonance(screenX = 0) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440.0, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.28);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06 * this.volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);

      if (typeof this.ctx.createStereoPanner === "function") {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, screenX)), now);
        gain.connect(panner);
        panner.connect(this.sfxGain);
        if (this.reverbNode) panner.connect(this.reverbNode);
      } else {
        gain.connect(this.sfxGain);
        if (this.reverbNode) gain.connect(this.reverbNode);
      }

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  // Delicate ethereal glide when camera glides into deep focus or resets to overview
  public playGlideTransition(direction: "in" | "out" | "neutral" = "neutral") {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes =
        direction === "out"
          ? [440.0, 369.99, 293.66]
          : [293.66, 369.99, 440.0];

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.08 * this.volume, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        if (this.reverbNode) gain.connect(this.reverbNode);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.6);
      });
    } catch {
      // ignore
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUBLIC AUDIO CONTROLS & STATE
  // ───────────────────────────────────────────────────────────────────────────
  public startAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.isMuted = false;
    this.updateMasterVolume();
    sessionStorage.setItem("maximem_space_audio_muted", "false");
    this.notify();
  }

  public toggleMute() {
    this.initContext();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    this.updateMasterVolume();
    sessionStorage.setItem("maximem_space_audio_muted", String(this.isMuted));
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    sessionStorage.setItem("maximem_space_audio_volume", String(this.volume));
    if (!this.isMuted) {
      this.updateMasterVolume();
    }
    this.notify();
  }

  private updateMasterVolume() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this.isMuted ? 0.0001 : this.volume * 0.42;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.15);
  }
}

export const spaceSoundscape = new SpaceSoundscapeEngine();
