// 배경음 · 라디오 · 날씨 사운드
    // ==================== Web Audio API: 오리지널 BGM 4곡 + 빗소리 + 겨울 종소리 ====================
    // 곡 파일은 assets/audio/*.mp3 (가사 없는 연주곡). 파일을 못 불러오면 예전 신스 코드음으로 자동 대체됩니다.
    const BGM_TRACKS = [
      { id: "morning", name: "Morning Cafe",   icon: "☀️", file: "assets/audio/morning-cafe.mp3",   mood: "기타·전기피아노의 산뜻한 아침",   when: "아침 06~12시" },
      { id: "rainy",   name: "Rainy Day",      icon: "🌧️", file: "assets/audio/rainy-day.mp3",      mood: "느리고 포근한 로파이 피아노",     when: "비 오는 날" },
      { id: "dessert", name: "Sweet Dessert",  icon: "🍰", file: "assets/audio/sweet-dessert.mp3",  mood: "마림바가 통통 튀는 달콤한 오후",  when: "낮·저녁 12~21시" },
      { id: "jazz",    name: "Midnight Jazz",  icon: "🎷", file: "assets/audio/midnight-jazz.mp3",  mood: "브러시 드럼과 스윙, 깊은 밤",     when: "밤 21~06시" }
    ];
    const RADIO_PREF_KEY = "metroCafeRadioPref";
    const BGM_FADE_SEC = 1.4;
    const BGM_BUS_GAIN = 1.35;

    const SoundEngine = {
      ctx: null,
      masterGain: null,
      musicBus: null,
      isPlaying: false,
      volume: 0.6,
      rainGain: null,

      mode: "auto",          // "auto"(날씨·시간대 추천) | "manual"(직접 선택)
      currentId: null,       // 지금 재생 중인 곡 id
      manualId: "morning",   // 직접 고른 곡
      loading: false,
      fallback: false,       // MP3 로드 실패 → 신스 코드음으로 대체 중
      buffers: {},           // id -> AudioBuffer
      pending: {},           // id -> Promise
      voice: null,           // { src, gain }
      playToken: 0,
      chordTimer: null,
      bellTimer: null,
      chordIndex: 0,

      init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = BGM_BUS_GAIN;
        this.musicBus.connect(this.masterGain);
        this.setupRainGenerator();
        this.loadPrefs();
      },

      // ---------- 설정 저장 (게임 저장 데이터와 분리) ----------
      loadPrefs() {
        try {
          const p = JSON.parse(localStorage.getItem(RADIO_PREF_KEY) || "null");
          if (p && (p.mode === "auto" || p.mode === "manual")) this.mode = p.mode;
          if (p && BGM_TRACKS.some(t => t.id === p.trackId)) this.manualId = p.trackId;
        } catch (e) { /* 저장소 사용 불가 시 기본값 */ }
      },
      savePrefs() {
        try {
          localStorage.setItem(RADIO_PREF_KEY, JSON.stringify({ mode: this.mode, trackId: this.manualId }));
        } catch (e) { /* 무시 */ }
      },

      getTrack(id) { return BGM_TRACKS.find(t => t.id === id) || null; },

      // 날씨·시간대에 어울리는 곡
      recommendTrackId() {
        if (state.weather === "rain") return "rainy";
        const h = Math.floor((((Number(state.minuteOfDay) || 0) % 1440) + 1440) % 1440 / 60);
        if (h >= 21 || h < 6) return "jazz";
        if (h < 12) return "morning";
        return "dessert";
      },
      wantedTrackId() { return this.mode === "auto" ? this.recommendTrackId() : this.manualId; },

      // ---------- 빗소리 ----------
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

      // ---------- MP3 불러오기 (한 번만 내려받고 캐시) ----------
      loadBuffer(id) {
        if (this.buffers[id]) return Promise.resolve(this.buffers[id]);
        if (this.pending[id]) return this.pending[id];
        const track = this.getTrack(id);
        if (!track) return Promise.resolve(null);
        this.pending[id] = fetch(track.file)
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
          .then(ab => new Promise((resolve, reject) => this.ctx.decodeAudioData(ab, resolve, reject)))
          .then(buf => { this.buffers[id] = buf; return buf; })
          .catch(err => { console.warn(`BGM 로드 실패 (${id}):`, err); return null; })
          .finally(() => { delete this.pending[id]; });
        return this.pending[id];
      },

      // ---------- 곡 재생 (크로스페이드) ----------
      async playTrack(id) {
        if (!this.ctx) return;
        const token = ++this.playToken;
        this.currentId = id;
        this.loading = !this.buffers[id];
        updateAudioUI();

        const buf = await this.loadBuffer(id);
        if (token !== this.playToken || !this.isPlaying) return; // 그새 다른 곡/정지로 바뀜
        this.loading = false;

        this.stopVoice(BGM_FADE_SEC);
        this.stopFallback();

        if (!buf) {
          this.startFallback();
        } else {
          this.fallback = false;
          const now = this.ctx.currentTime;
          const src = this.ctx.createBufferSource();
          const gain = this.ctx.createGain();
          src.buffer = buf;
          src.loop = true;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(1.0, now + BGM_FADE_SEC);
          src.connect(gain);
          gain.connect(this.musicBus);
          src.start(now);
          this.voice = { src, gain };
        }
        updateAudioUI();
        // 다음 곡을 미리 받아 두면 전환이 빨라집니다
        this.prefetchNext();
      },

      prefetchNext() {
        BGM_TRACKS.forEach(t => { if (t.id !== this.currentId) this.loadBuffer(t.id); });
      },

      stopVoice(fadeSec) {
        const v = this.voice;
        if (!v) return;
        this.voice = null;
        const now = this.ctx.currentTime;
        try {
          v.gain.gain.cancelScheduledValues(now);
          v.gain.gain.setValueAtTime(v.gain.gain.value, now);
          v.gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
          v.src.stop(now + fadeSec + 0.05);
        } catch (e) { /* 이미 멈춘 경우 */ }
      },

      // ---------- 파일을 못 불러왔을 때의 예비 신스 코드음 ----------
      startFallback() {
        this.fallback = true;
        this.playWarmChord();
        this.chordTimer = setInterval(() => this.playWarmChord(), 3800);
      },
      stopFallback() {
        clearInterval(this.chordTimer);
        this.chordTimer = null;
        this.fallback = false;
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
      },

      // ---------- 눈 오는 날 은은한 종소리 (곡 위에 살짝 얹힘) ----------
      playSnowBell() {
        if (!this.isPlaying || !this.ctx || state.weather !== "snow") return;
        const bellNotes = [1046.5, 1174.66, 1318.5, 1567.98];
        const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.9);
      },

      // ---------- 날씨 / 자동 추천 동기화 ----------
      syncWeatherAudio() {
        if (!this.ctx || !this.rainGain) return;
        const now = this.ctx.currentTime;
        if (this.isPlaying && state.weather === "rain") {
          this.rainGain.gain.setTargetAtTime(0.28, now, 0.8);
        } else {
          this.rainGain.gain.setTargetAtTime(0.0, now, 0.8);
        }
        this.syncAuto();
      },

      // 자동 모드: 날씨·시간대가 바뀌면 어울리는 곡으로 부드럽게 전환
      syncAuto() {
        if (!this.isPlaying || this.mode !== "auto" || this.loading) return;
        const want = this.recommendTrackId();
        if (want !== this.currentId) this.playTrack(want);
      },

      // ---------- 라디오 조작 ----------
      start() {
        this.isPlaying = true;
        clearInterval(this.bellTimer);
        this.bellTimer = setInterval(() => this.playSnowBell(), 7000);
        this.playTrack(this.wantedTrackId());
        this.syncWeatherAudio();
      },
      stop() {
        this.isPlaying = false;
        this.playToken++;
        this.loading = false;
        clearInterval(this.bellTimer);
        this.stopFallback();
        this.stopVoice(0.6);
        this.syncWeatherAudio();
      },

      toggle() {
        this.init();
        if (this.ctx.state === "suspended") this.ctx.resume();
        if (this.isPlaying) this.stop(); else this.start();
        updateAudioUI();
      },

      selectTrack(id) {
        if (!this.getTrack(id)) return;
        this.init();
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.mode = "manual";
        this.manualId = id;
        this.savePrefs();
        if (!this.isPlaying) {
          this.start();                      // 곡을 고르면 바로 재생 시작
        } else if (id !== this.currentId) {
          this.playTrack(id);
        }
        updateAudioUI();
      },

      setAuto() {
        this.init();
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.mode = "auto";
        this.savePrefs();
        if (!this.isPlaying) this.start();
        else if (this.recommendTrackId() !== this.currentId) this.playTrack(this.recommendTrackId());
        updateAudioUI();
      },

      step(dir) {
        const base = this.currentId || this.manualId;
        const idx = BGM_TRACKS.findIndex(t => t.id === base);
        const next = BGM_TRACKS[(idx + dir + BGM_TRACKS.length) % BGM_TRACKS.length];
        this.selectTrack(next.id);
      },

      setVolume(val) {
        this.volume = val / 100;
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
        }
      }
    };

    // ---------- 화면 갱신 (HUD 버튼 + 라디오 모달) ----------
    function updateAudioUI() {
      const icon = document.getElementById("bgmIcon");
      const label = document.getElementById("bgmLabel");
      const radioBtn = document.getElementById("radioPowerBtn");
      const track = SoundEngine.getTrack(SoundEngine.currentId);
      const on = SoundEngine.isPlaying;

      if (on) {
        if (icon) icon.textContent = "🔊";
        if (label) label.textContent = track ? `♪ ${track.name}` : "BGM 켜짐";
        if (radioBtn) radioBtn.textContent = "🔇 배경음 끄기";
      } else {
        if (icon) icon.textContent = "🔇";
        if (label) label.textContent = "BGM 켜기";
        if (radioBtn) radioBtn.textContent = "🔊 배경음 켜기";
      }

      const nowTitle = document.getElementById("radioNowTitle");
      const nowSub = document.getElementById("radioNowSub");
      const eq = document.getElementById("radioEq");
      const nowIcon = document.getElementById("radioNowIcon");
      if (nowTitle && nowSub) {
        if (!on) {
          nowTitle.textContent = "라디오가 꺼져 있어요";
          nowSub.textContent = "아래에서 곡을 고르면 바로 재생됩니다";
          if (nowIcon) nowIcon.textContent = "📻";
        } else if (SoundEngine.loading) {
          nowTitle.textContent = track ? track.name : "불러오는 중";
          nowSub.textContent = "음악을 불러오는 중…";
          if (nowIcon) nowIcon.textContent = track ? track.icon : "📻";
        } else if (SoundEngine.fallback) {
          nowTitle.textContent = "기본 배경음";
          nowSub.textContent = "음원 파일을 불러오지 못해 기본 신스음으로 재생 중 (Live Server로 실행해 주세요)";
          if (nowIcon) nowIcon.textContent = "🎹";
        } else {
          nowTitle.textContent = track ? track.name : "-";
          nowSub.textContent = (track ? track.mood : "") + (SoundEngine.mode === "auto" ? " · 자동 추천 중" : "");
          if (nowIcon) nowIcon.textContent = track ? track.icon : "📻";
        }
      }
      if (eq) eq.classList.toggle("eq-paused", !on || SoundEngine.loading);

      const list = document.getElementById("radioTrackList");
      if (list) {
        const rec = on || SoundEngine.mode === "auto" ? SoundEngine.recommendTrackId() : null;
        list.innerHTML = BGM_TRACKS.map(t => {
          const active = on && t.id === SoundEngine.currentId && !SoundEngine.fallback;
          const picked = SoundEngine.mode === "manual" && t.id === SoundEngine.manualId;
          const cls = active
            ? "border-amber-400 bg-amber-900/40"
            : "border-stone-700 bg-stone-950 hover:border-amber-600/60 hover:bg-stone-900";
          const badge = active ? '<span class="text-[10px] font-extrabold text-amber-300">▶ 재생 중</span>'
            : (t.id === rec && SoundEngine.mode === "auto" ? '<span class="text-[10px] font-bold text-emerald-300">추천</span>'
              : (picked ? '<span class="text-[10px] font-bold text-sky-300">선택됨</span>' : ""));
          return `<button type="button" onclick="selectRadioTrack('${t.id}')" aria-pressed="${active}"
            class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border ${cls} transition">
            <span class="text-xl shrink-0">${t.icon}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-extrabold text-amber-100 truncate">${t.name}</span>
              <span class="block text-[10px] text-stone-400 truncate">${t.mood} · ${t.when}</span>
            </span>
            ${badge}
          </button>`;
        }).join("");
      }

      const autoBtn = document.getElementById("radioAutoBtn");
      if (autoBtn) {
        const auto = SoundEngine.mode === "auto";
        autoBtn.className = "flex-1 py-2 rounded-xl border text-xs font-extrabold transition " +
          (auto ? "border-emerald-400 bg-emerald-900/50 text-emerald-200" : "border-stone-700 bg-stone-950 text-stone-300 hover:border-emerald-500/60");
        autoBtn.textContent = auto ? "🎯 자동 추천 켜짐" : "🎯 자동 추천";
        autoBtn.setAttribute("aria-pressed", auto ? "true" : "false");
      }
    }

    window.toggleAudio = () => SoundEngine.toggle();
    window.selectRadioTrack = (id) => SoundEngine.selectTrack(id);
    window.setRadioAuto = () => SoundEngine.setAuto();
    window.radioNext = () => SoundEngine.step(1);
    window.radioPrev = () => SoundEngine.step(-1);
    window.updateMasterVolume = (val) => {
      document.getElementById("volPercentText").textContent = `${val}%`;
      SoundEngine.setVolume(val);
    };
    // 모달을 처음 열기 전에도 곡 목록이 보이도록 초기 렌더 (저장된 선택도 반영)
    SoundEngine.loadPrefs();
    document.addEventListener("DOMContentLoaded", () => updateAudioUI());
    if (document.readyState !== "loading") updateAudioUI();
