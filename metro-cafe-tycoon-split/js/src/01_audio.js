// 배경음 · 날씨 사운드
    // ==================== Web Audio API BGM & 날씨 자동 사운드 ====================
    const SoundEngine = {
      ctx: null,
      masterGain: null,
      isPlaying: false,
      volume: 0.6,
      chordTimer: null,
      rainGain: null,
      chordIndex: 0,

      init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
        this.setupRainGenerator();
      },

      setupRainGenerator() {
        const bufferSize = this.ctx.sampleRate * 3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.04 * white)) / 1.04;
          lastOut = data[i];
          data[i] *= 2.5;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 650;
        filter.Q.value = 0.7;

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.value = 0.0;

        noise.connect(filter);
        filter.connect(this.rainGain);
        this.rainGain.connect(this.masterGain);
        noise.start();
      },

      playWarmChord() {
        if (!this.isPlaying || !this.ctx) return;
        const chords = [
          [261.63, 329.63, 392.00, 493.88],
          [220.00, 261.63, 329.63, 392.00],
          [174.61, 220.00, 261.63, 329.63],
          [196.00, 246.94, 293.66, 349.23]
        ];
        const chord = chords[this.chordIndex % chords.length];
        this.chordIndex++;

        const now = this.ctx.currentTime;
        chord.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.09);
          gain.gain.linearRampToValueAtTime(0.045, now + idx * 0.09 + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 3.6);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now + idx * 0.09);
          osc.stop(now + 3.8);
        });

        if (state.weather === "snow") {
          const bellNotes = [1046.5, 1174.66, 1318.5, 1567.98];
          const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note, now + 1.2);
          gain.gain.setValueAtTime(0.0001, now + 1.2);
          gain.gain.linearRampToValueAtTime(0.025, now + 1.25);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now + 1.2);
          osc.stop(now + 3.1);
        }
      },

      syncWeatherAudio() {
        if (!this.ctx || !this.rainGain) return;
        const now = this.ctx.currentTime;
        if (this.isPlaying && state.weather === "rain") {
          this.rainGain.gain.setTargetAtTime(0.28, now, 0.8);
        } else {
          this.rainGain.gain.setTargetAtTime(0.0, now, 0.8);
        }
      },

      toggle() {
        this.init();
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
          this.playWarmChord();
          this.chordTimer = setInterval(() => this.playWarmChord(), 3800);
        } else {
          clearInterval(this.chordTimer);
        }
        this.syncWeatherAudio();
        updateAudioUI();
      },

      setVolume(val) {
        this.volume = val / 100;
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
        }
      }
    };

    function updateAudioUI() {
      const icon = document.getElementById("bgmIcon");
      const label = document.getElementById("bgmLabel");
      const radioBtn = document.getElementById("radioPowerBtn");
      if (SoundEngine.isPlaying) {
        if (icon) icon.textContent = "🔊";
        if (label) label.textContent = "BGM 켜짐";
        if (radioBtn) radioBtn.textContent = "🔇 배경음 끄기";
      } else {
        if (icon) icon.textContent = "🔇";
        if (label) label.textContent = "BGM 켜기";
        if (radioBtn) radioBtn.textContent = "🔊 배경음 켜기";
      }
    }

    window.toggleAudio = () => SoundEngine.toggle();
    window.updateMasterVolume = (val) => {
      document.getElementById("volPercentText").textContent = `${val}%`;
      SoundEngine.setVolume(val);
    };

