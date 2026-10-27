/**
 * Procedural Web Audio API Sound Synthesizer & Bengali Street Voice System
 * Generates crisp, realistic arcade sound effects with zero external audio assets.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private lastSpeechTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('dhaka_snack_sound_muted');
      if (saved !== null) {
        this.isMuted = JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('dhaka_snack_sound_muted', JSON.stringify(this.isMuted));
    } catch {
      // Ignore
    }
    return this.isMuted;
  }

  /**
   * Authentic Bengali Voice Lines (TTS / Formant)
   */
  public speakBengali(phrase: string, pitch = 1.05) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Rate-limit speech so it doesn't overlap excessively
    const now = performance.now();
    if (now - this.lastSpeechTime < 2400) return;
    this.lastSpeechTime = now;

    try {
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'bn-BD';
      utterance.pitch = pitch;
      utterance.rate = 1.15;
      utterance.volume = 0.85;

      // Check if Bengali voice is installed, else use default
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find((v) => v.lang.includes('bn') || v.lang.includes('IN'));
      if (bnVoice) utterance.voice = bnVoice;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback if speech synthesis is disabled on device
    }
  }

  /**
   * Stacking Pop Sound
   * Pitch dynamically increases with each stacked item (like Pizza Ready!)
   */
  public playStackPop(stackHeight: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 340;
    const clampedHeight = Math.min(stackHeight, 20);
    const targetFreq = baseFreq * Math.pow(1.08, clampedHeight);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(targetFreq * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Cash Collection Ka-Ching (৳ Taka)
   */
  public playCash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(1800, now + 0.04);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2200, now + 0.05);
    gain2.gain.setValueAtTime(0.18, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.35);
  }

  /**
   * Food Served to Customer
   */
  public playDeliver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.04;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  /**
   * Hot Oil Frying Sizzle
   */
  public playFrySizzle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  /**
   * Customer Eating Chomp & "বাহ!"
   */
  public playEatChomp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);

    // Random Bengali compliment
    if (Math.random() > 0.6) {
      this.speakBengali('বাহ! খাসা হইছে!');
    }
  }

  /**
   * Standing Upgrade Pad Ticking Deposit
   */
  public playUpgradeTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Station or Table Unlocked Fanfare
   */
  public playUnlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Rickshaw Double Bell Tring-Tring + Dhaka Rickshaw Horn!
   */
  public playRickshawBell() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.1].forEach((delay) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });

    // Voice callout
    setTimeout(() => {
      this.speakBengali('এই রিকশা! মামা সাইড দেন!');
    }, 200);
  }
}

export const sounds = new SoundManager();
