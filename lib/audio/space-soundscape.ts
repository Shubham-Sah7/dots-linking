// Procedural Cinematic Space Ambience Engine via Web Audio API
// Generates a deep, calming, futuristic space soundscape with zero external audio assets.

class SpaceSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Master Gain & Volume
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private shimmerGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // State
  public isMuted: boolean = true;
  public volume: number = 0.45;
  private isPlaying: boolean = false;

  // Listeners for UI reactivity
  private stateChangeListeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      // Restore persisted session preferences
      const savedMute = sessionStorage.getItem("maximem_space_audio_muted");
      const savedVol = sessionStorage.getItem("maximem_space_audio_volume");

      // Default to muted until user interacts (to comply with browser autoplay policy)
      this.isMuted = savedMute !== null ? savedMute === "true" : true;
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          this.volume = v;
        }
      }

      // Prepare interaction listener to unlock audio context smoothly
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

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();

      // Master output node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0.0001 : this.volume * 0.4,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      this.droneGain.connect(this.masterGain);

      this.padGain = this.ctx.createGain();
      this.padGain.gain.setValueAtTime(0.40, this.ctx.currentTime);
      this.padGain.connect(this.masterGain);

      this.shimmerGain = this.ctx.createGain();
      this.shimmerGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.shimmerGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.60, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupGenerators();
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SYNTHESIS GENERATORS (Sub-bass Drone, Ethereal Pad, Interstellar Shimmer)
  // ───────────────────────────────────────────────────────────────────────────
  private setupGenerators() {
    if (!this.ctx || !this.droneGain || !this.padGain || !this.shimmerGain) return;
    const now = this.ctx.currentTime;

    // 1. SUB-HARMONIC SPACE DRONE (D1 = 36.7Hz + A1 = 55.0Hz)
    // Deep, grounding cosmic warmth
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.setValueAtTime(140, now);
    droneFilter.Q.setValueAtTime(2.5, now);
    droneFilter.connect(this.droneGain);

    // Drone LFO to breathe cutoff frequency slowly (0.07Hz ~ 14s cycle)
    const droneLfo = this.ctx.createOscillator();
    const droneLfoGain = this.ctx.createGain();
    droneLfo.frequency.setValueAtTime(0.07, now);
    droneLfoGain.gain.setValueAtTime(45, now); // Sweeps 95Hz - 185Hz
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneFilter.frequency);
    droneLfo.start(now);

    const subOsc1 = this.ctx.createOscillator();
    subOsc1.type = "sine";
    subOsc1.frequency.setValueAtTime(36.7, now); // D1
    subOsc1.connect(droneFilter);
    subOsc1.start(now);

    const subOsc2 = this.ctx.createOscillator();
    subOsc2.type = "triangle";
    subOsc2.frequency.setValueAtTime(55.0, now); // A1 (Fifth)
    subOsc2.connect(droneFilter);
    subOsc2.start(now);

    // 2. CELESTIAL SPACE PAD (Dmaj9 / Dsus2 celestial harmony)
    // D3 (146.8Hz), F#3 (185.0Hz), A3 (220.0Hz), C#4 (277.2Hz), E4 (329.6Hz)
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = "bandpass";
    padFilter.frequency.setValueAtTime(420, now);
    padFilter.Q.setValueAtTime(1.8, now);
    padFilter.connect(this.padGain);

    // Slow celestial pad filter sweep (0.04Hz ~ 25s cycle)
    const padLfo = this.ctx.createOscillator();
    const padLfoGain = this.ctx.createGain();
    padLfo.frequency.setValueAtTime(0.04, now);
    padLfoGain.gain.setValueAtTime(220, now); // Sweeps 200Hz - 640Hz
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start(now);

    const chordFreqs = [146.83, 185.0, 220.0, 277.18, 329.63];
    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      // Slight detune for analog warmth
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
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
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
    noiseLfoGain.gain.setValueAtTime(900, now); // Sweeps 700Hz - 2500Hz
    noiseLfo.connect(noiseLfoGain);
    noiseLfoGain.connect(noiseFilter.frequency);
    noiseLfo.start(now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(this.shimmerGain);
    noiseSource.start(now);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUBLIC CONTROLS
  // ───────────────────────────────────────────────────────────────────────────
  public startAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.isMuted = false;
    this.isPlaying = true;
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
    this.isPlaying = !this.isMuted;
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

  // Dynamic Camera Zoom Cutoff Adaptation
  public setZoomAtmosphere(zoomFactor: number) {
    if (!this.ctx || !this.padGain) return;
    // zoomFactor: 0.0 (zoomed in close) -> 1.0 (zoomed out far)
    // When zoomed in, pad reveals slightly brighter overtones
    try {
      const now = this.ctx.currentTime;
      const targetGain = 0.35 + (1.0 - zoomFactor) * 0.22;
      this.padGain.gain.linearRampToValueAtTime(targetGain, now + 0.1);
    } catch {
      // ignore
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SYNCHRONIZED INTERACTIVE SOUND FX (Pentatonic Celestial Chimes & Sweeps)
  // ───────────────────────────────────────────────────────────────────────────

  // Subtle crystal chime pulse when node is hovered, clicked, or excited
  public playNodePulse(clusterIndex = 0, pitchOffset = 0) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;

      // Pythagorean celestial pentatonic scale in D:
      // D4(293.66), E4(329.63), F#4(369.99), A4(440.0), B4(493.88), D5(587.33)
      const scale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33];
      const baseFreq = scale[(clusterIndex + pitchOffset) % scale.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, now);

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);

      // Soft attack & exponentially decaying tail
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {
      // ignore
    }
  }

  // Velvety low-frequency sweep when recall shockwave or ingestion occurs
  public playShockwaveWhoosh() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, now);

      osc.type = "sine";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.20 * this.volume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.35);
    } catch {
      // ignore
    }
  }

  // Delicate ethereal glide when camera glides into deep focus or changes view
  public playGlideTransition() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [293.66, 369.99, 440.0]; // D, F#, A major triad

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.08 * this.volume, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.5);
      });
    } catch {
      // ignore
    }
  }
}

export const spaceSoundscape = new SpaceSoundscapeEngine();
