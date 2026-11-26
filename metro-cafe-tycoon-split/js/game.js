// 초기화 · Firebase 연결 · 게임 데이터와 상태
import { createCafeRenderer } from "./graphics.js";
    import { createEconomySystem } from "./economy.js";

    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDummyKeyForCafegame303f0",
      authDomain: "cafegame-303f0.firebaseapp.com",
      projectId: "cafegame-303f0",
      storageBucket: "cafegame-303f0.appspot.com",
      messagingSenderId: "103948572910",
      appId: "1:103948572910:web:cafegame303f0"
    };

    let db = null;
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (e) {
      console.warn("Firebase init fallback:", e);
    }

    // ==================== 35개 수도권 상권 데이터 & 추천 4곳 ====================
    const RECOMMENDED_START_IDS = ["incheon_guwol", "incheon_bupyeong", "gg_suwon", "seoul_sillim"];

    const METRO_LOCATIONS = [
      { id: "incheon_guwol", region: "인천", name: "구월동 로데오", x: 265, y: 505, mult: 1.15, deposit: 4000000, rent: 900000, branchPrice: 18000000, buildingPrice: 95000000 },
      { id: "incheon_bupyeong", region: "인천", name: "부평 문화의거리", x: 325, y: 445, mult: 1.25, deposit: 4500000, rent: 1050000, branchPrice: 22000000, buildingPrice: 110000000 },
      { id: "incheon_songdo", region: "인천", name: "송도 센트럴파크", x: 235, y: 575, mult: 1.60, deposit: 9500000, rent: 2100000, branchPrice: 45000000, buildingPrice: 240000000 },
      { id: "incheon_cheongna", region: "인천", name: "청라 커낼웨이", x: 240, y: 380, mult: 1.35, deposit: 6000000, rent: 1350000, branchPrice: 28000000, buildingPrice: 145000000 },
      { id: "incheon_yeongjong", region: "인천", name: "영종도 을왕리", x: 135, y: 445, mult: 1.50, deposit: 7500000, rent: 1600000, branchPrice: 36000000, buildingPrice: 185000000 },
      { id: "incheon_ganghwa", region: "인천", name: "강화도 조양방직", x: 155, y: 245, mult: 1.40, deposit: 5800000, rent: 1200000, branchPrice: 29000000, buildingPrice: 140000000 },

      { id: "seoul_hongdae", region: "서울", name: "홍대·연남동", x: 455, y: 360, mult: 2.15, deposit: 18000000, rent: 3800000, branchPrice: 85000000, buildingPrice: 480000000 },
      { id: "seoul_seongsu", region: "서울", name: "성수동 카페거리", x: 605, y: 375, mult: 2.35, deposit: 22000000, rent: 4500000, branchPrice: 110000000, buildingPrice: 620000000 },
      { id: "seoul_gangnam", region: "서울", name: "강남역 테헤란로", x: 580, y: 465, mult: 2.60, deposit: 30000000, rent: 6200000, branchPrice: 150000000, buildingPrice: 880000000 },
      { id: "seoul_apgujeong", region: "서울", name: "압구정 로데오", x: 590, y: 412, mult: 2.50, deposit: 28000000, rent: 5800000, branchPrice: 140000000, buildingPrice: 820000000 },
      { id: "seoul_jamsil", region: "서울", name: "잠실 송리단길", x: 660, y: 435, mult: 2.10, deposit: 17500000, rent: 3600000, branchPrice: 82000000, buildingPrice: 460000000 },
      { id: "seoul_yeouido", region: "서울", name: "여의도 더현대", x: 460, y: 415, mult: 2.05, deposit: 16500000, rent: 3500000, branchPrice: 78000000, buildingPrice: 430000000 },
      { id: "seoul_itaewon", region: "서울", name: "이태원·한남동", x: 530, y: 405, mult: 2.20, deposit: 19500000, rent: 4100000, branchPrice: 92000000, buildingPrice: 520000000 },
      { id: "seoul_ikseon", region: "서울", name: "종로 익선동", x: 525, y: 345, mult: 1.95, deposit: 14500000, rent: 3100000, branchPrice: 68000000, buildingPrice: 370000000 },
      { id: "seoul_euljiro", region: "서울", name: "을지로 힙지로", x: 555, y: 372, mult: 1.90, deposit: 13500000, rent: 2900000, branchPrice: 64000000, buildingPrice: 350000000 },
      { id: "seoul_bukchon", region: "서울", name: "삼청동·북촌", x: 515, y: 310, mult: 1.85, deposit: 13000000, rent: 2750000, branchPrice: 60000000, buildingPrice: 330000000 },
      { id: "seoul_kondae", region: "서울", name: "건대입구", x: 645, y: 390, mult: 1.80, deposit: 12000000, rent: 2600000, branchPrice: 56000000, buildingPrice: 310000000 },
      { id: "seoul_sinchon", region: "서울", name: "신촌·이대", x: 485, y: 345, mult: 1.70, deposit: 10500000, rent: 2300000, branchPrice: 48000000, buildingPrice: 265000000 },
      { id: "seoul_magok", region: "서울", name: "마곡 식물원", x: 395, y: 375, mult: 1.65, deposit: 9500000, rent: 2050000, branchPrice: 44000000, buildingPrice: 240000000 },
      { id: "seoul_mokdong", region: "서울", name: "목동 오목교", x: 420, y: 425, mult: 1.60, deposit: 9000000, rent: 1950000, branchPrice: 42000000, buildingPrice: 225000000 },
      { id: "seoul_sillim", region: "서울", name: "신림 샤로수길", x: 495, y: 468, mult: 1.50, deposit: 5500000, rent: 1300000, branchPrice: 32000000, buildingPrice: 175000000 },
      { id: "seoul_nowon", region: "서울", name: "노원 문화의거리", x: 615, y: 280, mult: 1.45, deposit: 5200000, rent: 1200000, branchPrice: 29000000, buildingPrice: 155000000 },
      { id: "seoul_hyehwa", region: "서울", name: "대학로 혜화", x: 565, y: 322, mult: 1.75, deposit: 11000000, rent: 2400000, branchPrice: 50000000, buildingPrice: 280000000 },
      { id: "seoul_garosu", region: "서울", name: "신사 가로수길", x: 552, y: 432, mult: 2.30, deposit: 21000000, rent: 4400000, branchPrice: 105000000, buildingPrice: 590000000 },

      { id: "gg_suwon", region: "경기", name: "수원 행궁동", x: 540, y: 675, mult: 1.65, deposit: 5500000, rent: 1250000, branchPrice: 34000000, buildingPrice: 185000000 },
      { id: "gg_pangyo", region: "경기", name: "성남 판교", x: 625, y: 535, mult: 2.25, deposit: 20000000, rent: 4200000, branchPrice: 98000000, buildingPrice: 550000000 },
      { id: "gg_bundang", region: "경기", name: "분당 정자동", x: 645, y: 585, mult: 1.95, deposit: 15000000, rent: 3200000, branchPrice: 72000000, buildingPrice: 390000000 },
      { id: "gg_ilsan", region: "경기", name: "고양 일산호수", x: 385, y: 285, mult: 1.55, deposit: 7800000, rent: 1700000, branchPrice: 38000000, buildingPrice: 200000000 },
      { id: "gg_bucheon", region: "경기", name: "부천 상동", x: 375, y: 445, mult: 1.40, deposit: 6200000, rent: 1400000, branchPrice: 30000000, buildingPrice: 160000000 },
      { id: "gg_anyang", region: "경기", name: "안양 범계", x: 495, y: 535, mult: 1.45, deposit: 5000000, rent: 1150000, branchPrice: 28000000, buildingPrice: 150000000 },
      { id: "gg_hanam", region: "경기", name: "하남 미사", x: 735, y: 410, mult: 1.60, deposit: 8500000, rent: 1850000, branchPrice: 40000000, buildingPrice: 215000000 },
      { id: "gg_namyangju", region: "경기", name: "남양주 팔당", x: 785, y: 350, mult: 1.75, deposit: 10500000, rent: 2250000, branchPrice: 49000000, buildingPrice: 260000000 },
      { id: "gg_uijeongbu", region: "경기", name: "의정부 행복로", x: 585, y: 215, mult: 1.35, deposit: 5500000, rent: 1250000, branchPrice: 26000000, buildingPrice: 138000000 },
      { id: "gg_gimpo", region: "경기", name: "김포 라베니체", x: 315, y: 330, mult: 1.50, deposit: 7200000, rent: 1550000, branchPrice: 35000000, buildingPrice: 180000000 },
      { id: "gg_yongin", region: "경기", name: "용인 보정동", x: 635, y: 650, mult: 1.65, deposit: 8800000, rent: 1900000, branchPrice: 42000000, buildingPrice: 220000000 }
    ];

    const MENU_CATALOG = [
      { id: "americano", name: "하우스 아메리카노", price: 1200, cost: 0, unlocked: true, desc: "기본 원두로 내린 깔끔한 아메리카노" },
      { id: "latte", name: "고소한 카페라떼", price: 1800, cost: 350000, unlocked: false, desc: "스팀 밀크가 어우러진 부드러운 라떼" },
      { id: "vanilla", name: "마다가스카르 바닐라라떼", price: 2400, cost: 900000, unlocked: false, desc: "천연 바닐라빈 시럽으로 만든 인기 메뉴" },
      { id: "einspanner", name: "수제 크림 아인슈페너", price: 3200, cost: 2200000, unlocked: false, desc: "쫀쫀한 수제 크림이 올라간 시그니처" },
      { id: "pistachio", name: "피스타치오 크림 라떼", price: 4200, cost: 5000000, unlocked: false, desc: "SNS 인증샷 성지 프리미엄 메뉴" }
    ];

    const UPGRADE_CATALOG = [
      { id: "auto_drip", name: "소형 브루잉 머신 (자동 추출)", baseCost: 600000, level: 1, max: 10, desc: "주기적으로 자동 커피 추출 (100~1,000원 랜덤 매출)" },
      { id: "interior", name: "원목 감성 인테리어 & 좌석", baseCost: 800000, level: 0, max: 10, desc: "매장 평판 상승 및 손님 방문 빈도 증가" },
      { id: "grinder", name: "코니컬 버 정밀 그라인더", baseCost: 1200000, level: 0, max: 8, desc: "모든 메뉴 판매 단가 +10% 상승" },
      { id: "roaster", name: "자체 소형 로스터기", baseCost: 2500000, level: 0, max: 5, desc: "단골 승격 속도 및 분위기 보너스" }
    ];

    const VISITOR_POOL = [
      { id: "v_jihoon", name: "미대생 지훈", avatar: "🎨", hairStyle: "messy", hairColor: "#292524", skinColor: "#fed7aa", topColor: "#d97706", accessory: "beret", neededVisits: 3, fav: "수제 크림 아인슈페너", perk: "메뉴 판매 단가 +12%", bonusType: "price", bonusVal: 0.12 },
      { id: "v_seoyeon", name: "프리랜서 서연", avatar: "💻", hairStyle: "long", hairColor: "#451a03", skinColor: "#ffedd5", topColor: "#0284c7", accessory: "glasses", neededVisits: 4, fav: "고소한 카페라떼", perk: "손님 방문 속도 +15%", bonusType: "traffic", bonusVal: 0.15 },
      { id: "v_minsu", name: "동네 책방 주인 민수", avatar: "📚", hairStyle: "short", hairColor: "#1c1917", skinColor: "#fdba74", topColor: "#059669", accessory: "beard", neededVisits: 4, fav: "하우스 아메리카노", perk: "매장 평판 매월 +3 보너스", bonusType: "rep", bonusVal: 3 },
      { id: "v_yuna", name: "디저트 블로거 유나", avatar: "📷", hairStyle: "bob", hairColor: "#7c2d12", skinColor: "#ffedd5", topColor: "#db2777", accessory: "ribbon", neededVisits: 5, fav: "피스타치오 크림 라떼", perk: "SNS 바이럴 매출 +18%", bonusType: "price", bonusVal: 0.18 },
      { id: "v_park", name: "은퇴 바리스타 박선생", avatar: "☕", hairStyle: "silver", hairColor: "#d6d3d1", skinColor: "#fed7aa", topColor: "#6d28d9", accessory: "apron", neededVisits: 5, fav: "마다가스카르 바닐라라떼", perk: "자동 추출 수익 +250원 추가", bonusType: "auto", bonusVal: 250 }
    ];

    let state = {
      playerId: "",
      nickname: "",
      pin: "",
      cafeName: "",
      cash: 8000000,
      reputation: 10,
      stock: 35,
      maxStock: 100,
      hqLocationId: "incheon_guwol",
      branches: [],
      buildings: [],
      menus: JSON.parse(JSON.stringify(MENU_CATALOG)),
      upgrades: JSON.parse(JSON.stringify(UPGRADE_CATALOG)),
      visitorCounts: {},
      regulars: [],
      day: 1,
      minuteOfDay: 540,
      seasonIdx: 0,
      weather: "clear",
      stocks: [
        { code: "STAR", name: "별다방홀딩스", price: 42000, owned: 0, div: 0.015 },
        { code: "BEAN", name: "대한원두유통", price: 18500, owned: 0, div: 0.012 },
        { code: "HAN", name: "한강리츠부동산", price: 65000, owned: 0, div: 0.020 }
      ],
      coins: [
        { code: "BTC", name: "비트코인", price: 85000000, owned: 0 },
        { code: "CAFE", name: "카페토큰", price: 1200, owned: 0 },
        { code: "DOGE", name: "시바라떼코인", price: 340, owned: 0 }
      ],
      messages: [
        { sender: "부동산 김실장", time: "개업일", text: "사장님 개업 축하드립니다! 처음엔 동네 손님들이 한두 분씩 천천히 찾아오실 거예요. 메뉴를 개발하고 평판을 쌓아보세요!" }
      ],
      snsPosts: [
        { user: "@seoul_coffee_walk", tag: "#신상카페 #동네커피", text: "골목에 아늑한 통유리 카페가 새로 생겼네요! 창밖 풍경 보면서 커피 한잔하기 딱 좋아요 ☕", likes: 14, liked: false }
      ]
    };

    const SEASONS = [
      { name: "봄", icon: "🌸", color: "#f9a8d4" },
      { name: "여름", icon: "🌿", color: "#4ade80" },
      { name: "가을", icon: "🍁", color: "#fb923c" },
      { name: "겨울", icon: "❄️", color: "#7dd3fc" }
    ];

    let pendingRegularOffer = null;
    let activePosTab = "menu";
    let activePhoneApp = "market";
    let selectedMapLocId = "incheon_guwol";
    let isInitialLocationSelection = false;
    let pendingSignupData = null;

    // 캔버스 및 손님·날씨 파티클 초기화
    let scenicMode = false;
    let activeCustomers = [];
    const cafeRenderer = createCafeRenderer({
      canvas: document.getElementById("cafeSceneCanvas"),
      getState: () => state,
      getScenicMode: () => scenicMode,
      getCustomers: () => activeCustomers
    });



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



// 손님 생성 · 이동 · 주문 · 퇴장
    // ==================== 손님 출입·주문·착석·퇴장 동선 ====================
    function spawnCustomer() {
      if (activeCustomers.length >= 3) return;
      const unlockedMenus = state.menus.filter(m => m.unlocked);
      const chosenMenu = unlockedMenus[Math.floor(Math.random() * unlockedMenus.length)] || state.menus[0];

      // 단골 후보 중 아직 매장에 없는 손님 우선 선택
      const candidates = VISITOR_POOL.filter(v => !activeCustomers.some(c => c.visitor.id === v.id));
      const visitor = (candidates.length ? candidates : VISITOR_POOL)[Math.floor(Math.random() * (candidates.length ? candidates.length : VISITOR_POOL.length))];
      const seatX = activeCustomers.some(c => Math.abs(c.seatX - 0.60) < 0.08) ? 0.76 : 0.60;

      activeCustomers.push({
        visitor,
        menu: chosenMenu,
        x: 0.07,
        targetX: 0.36,
        seatX,
        state: "entering", // entering -> ordering -> sitting -> leaving
        timer: 0,
        orderOrdered: false,
        bubbleText: "안녕하세용! 입장 ✨"
      });
    }

    function updateCustomers(dt) {
      for (let i = activeCustomers.length - 1; i >= 0; i--) {
        const c = activeCustomers[i];
        c.timer += dt;

        if (c.state === "entering") {
          const dir = Math.sign(c.targetX - c.x);
          c.x += dir * 0.055 * dt;
          if (Math.abs(c.targetX - c.x) <= 0.008) {
            c.x = c.targetX;
            c.state = "ordering";
            c.timer = 0;
            c.bubbleText = `${c.menu.name} 주세요!`;
          }
        } else if (c.state === "ordering") {
          if (!c.orderOrdered && c.timer >= 2.2) {
            c.orderOrdered = true;
            processCustomerOrder(c);
          }
          if (c.timer >= 4.2) {
            c.state = "sitting";
            c.targetX = c.seatX;
            c.timer = 0;
            c.bubbleText = "창가 자리에서 한 모금 ☕";
          }
        } else if (c.state === "sitting") {
          if (Math.abs(c.targetX - c.x) > 0.008) {
            c.x += Math.sign(c.targetX - c.x) * 0.05 * dt;
          } else {
            c.x = c.targetX;
            if (c.timer > 8 && c.timer < 8.2) {
              c.bubbleText = "창밖 풍경이랑 딱이네요 😊";
            }
            if (c.timer >= 20) {
              c.state = "leaving";
              c.targetX = 0.06;
              c.timer = 0;
              c.bubbleText = "잘 마셨습니다! 다음에 또 올게요 👋";
            }
          }
        } else if (c.state === "leaving") {
          c.x += Math.sign(c.targetX - c.x) * 0.055 * dt;
          if (Math.abs(c.targetX - c.x) <= 0.012) {
            activeCustomers.splice(i, 1);
          }
        }
      }
    }

    // ==================== 게임 로직 & 수익 계산 ====================


// 게임 시간 · 날씨 · 경제 연결 · HUD
    function getCurrentLocation() {
      return METRO_LOCATIONS.find(l => l.id === state.hqLocationId) || METRO_LOCATIONS[0];
    }

    const economy = createEconomySystem({
      getState: () => state,
      getCurrentLocation,
      visitorPool: VISITOR_POOL,
      showToast,
      spawnFloatingText,
      updateHUD,
      renderPhoneApp,
      renderPosModal,
      getPendingRegularOffer: () => pendingRegularOffer,
      setPendingRegularOffer: (value) => { pendingRegularOffer = value; }
    });

    function calculateMenuSalePrice(menu) { return economy.calculateMenuSalePrice(menu); }
    function tickAutoBrew() { return economy.tickAutoBrew(); }
    function processCustomerOrder(customer) { return economy.processCustomerOrder(customer); }

    function advanceDayAndWeather() {
      state.day += 1;

      if ((state.day - 1) % 7 === 0) {
        state.seasonIdx = (state.seasonIdx + 1) % 4;
        const s = SEASONS[state.seasonIdx];
        showToast(`${s.icon} 계절이 '${s.name}'(으)로 바뀌었습니다!`, "amber");
      }

      const r = Math.random();
      if (state.seasonIdx === 3) {
        if (r < 0.65) state.weather = "clear";
        else if (r < 0.82) state.weather = "cloudy";
        else state.weather = "snow";
      } else {
        if (r < 0.68) state.weather = "clear";
        else if (r < 0.85) state.weather = "cloudy";
        else state.weather = "rain";
      }

      SoundEngine.syncWeatherAudio();

      if (state.day % 28 === 0) {
        const loc = getCurrentLocation();
        const ownsHqBuilding = state.buildings.includes(state.hqLocationId);
        const rentCost = ownsHqBuilding ? 0 : loc.rent;

        let passiveIncome = 0;
        state.branches.forEach(bid => {
          const bLoc = METRO_LOCATIONS.find(l => l.id === bid);
          if (bLoc) passiveIncome += Math.round(bLoc.rent * 1.45);
        });
        state.buildings.forEach(bldId => {
          const bLoc = METRO_LOCATIONS.find(l => l.id === bldId);
          if (bLoc) passiveIncome += Math.round(bLoc.rent * 2.2);
        });
        state.stocks.forEach(st => {
          passiveIncome += Math.round(st.price * st.owned * st.div);
        });

        const netMonthly = passiveIncome - rentCost;
        state.cash += netMonthly;
        state.messages.unshift({
          sender: "월말 정산 알림",
          time: `${state.day}일차`,
          text: `월세 -${rentCost.toLocaleString()}원 / 지점·건물·배당 +${passiveIncome.toLocaleString()}원 (순수익 ${netMonthly >= 0 ? "+" : ""}${netMonthly.toLocaleString()}원)`
        });
        document.getElementById("phoneBadge").classList.remove("hidden");
        showToast(`📅 월말 정산 완료! 순변동 ${netMonthly >= 0 ? "+" : ""}${netMonthly.toLocaleString()}원`, "sky");
      }
    }

    function getWeatherLabel() {
      if (state.weather === "clear") return "☀️ 맑음";
      if (state.weather === "cloudy") return "⛅ 구름조금";
      if (state.weather === "rain") return "🌧️ 비 내림";
      return "❄️ 눈 내림";
    }

    function updateHUD() {
      const loc = getCurrentLocation();
      const season = SEASONS[state.seasonIdx];
      const h = String(Math.floor(state.minuteOfDay / 60)).padStart(2, "0");
      const m = String(state.minuteOfDay % 60).padStart(2, "0");

      document.getElementById("hudCafeName").textContent = state.cafeName || "내 카페";
      document.getElementById("hudLocationBadge").textContent = `${loc.region} ${loc.name}`;
      document.getElementById("hudSeasonWeather").innerHTML = `
        <span>${season.icon} ${season.name} · ${state.day}일차</span>
        <span>·</span>
        <span>${getWeatherLabel()}</span>
        <span>·</span>
        <span>${h}:${m}</span>
      `;
      document.getElementById("scenicBadgeText").textContent = `${season.icon} ${season.name} · ${getWeatherLabel()} (${h}:${m}) · 돌아가기`;
      document.getElementById("phoneClock").textContent = `${h}:${m}`;

      document.getElementById("hudCash").textContent = `${state.cash.toLocaleString()}원`;
      const repGrade = state.reputation < 30 ? "초보" : state.reputation < 80 ? "동네맛집" : state.reputation < 200 ? "핫플레이스" : "수도권명소";
      document.getElementById("hudReputation").textContent = `★ ${state.reputation} (${repGrade})`;
      document.getElementById("hudStock").textContent = `${state.stock}/${state.maxStock}잔`;
      document.getElementById("hudRegulars").textContent = `${state.regulars.length}/5명 · ${1 + state.branches.length}개점`;

      const autoLv = Math.max(1, state.upgrades.find(u => u.id === "auto_drip")?.level || 1);
      const autoStatusEl = document.getElementById("autoBrewStatusLabel");
      if (autoStatusEl) {
        autoStatusEl.textContent = `브루잉 머신 Lv.${autoLv} · 건당 +100 ~ 1,000원 자동 추출`;
      }

      document.getElementById("radioSeasonText").textContent = `${season.icon} ${season.name} (7일마다 계절 순환)`;
      document.getElementById("radioWeatherText").textContent = `${getWeatherLabel()}`;
    }



// 매장 UI · POS · 스마트폰 앱 · 홍보
    window.toggleScenicMode = (enable) => {
      scenicMode = enable;
      document.body.classList.toggle("scenic-mode", enable);
    };

    window.openModal = (id) => {
      document.getElementById(id).classList.remove("hidden");
      if (id === "posModal") renderPosModal();
      if (id === "phoneModal") {
        document.getElementById("phoneBadge").classList.add("hidden");
        renderPhoneApp();
      }
      if (id === "mapModal") {
        renderMetroPins();
        updateSelectedLocationPanel();
      }
      if (id === "ledgerModal") renderLedgerModal();
      if (id === "rankModal") loadRankings();
    };

    window.closeModal = (id) => {
      document.getElementById(id).classList.add("hidden");
    };

    window.switchPosTab = (tab) => {
      activePosTab = tab;
      ["menu", "staff", "regulars"].forEach(t => {
        const btn = document.getElementById(`posTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        btn.className = t === tab ? "py-2 rounded-xl bg-amber-600 text-white" : "py-2 rounded-xl text-stone-400";
      });
      renderPosModal();
    };

    function renderPosModal() {
      const box = document.getElementById("posContent");
      if (activePosTab === "menu") {
        box.innerHTML = state.menus.map((m, idx) => {
          const realPrice = calculateMenuSalePrice(m);
          return `
            <div class="bg-stone-950 border border-stone-800 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div>
                <div class="font-extrabold text-amber-200">${m.name} ${m.unlocked ? `<span class="text-emerald-400 text-xs">(${realPrice.toLocaleString()}원)</span>` : ""}</div>
                <div class="text-[11px] text-stone-400 mt-0.5">${m.desc}</div>
              </div>
              ${m.unlocked
                ? `<span class="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-700/40 text-xs font-bold shrink-0">판매중</span>`
                : `<button onclick="unlockMenu(${idx})" class="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shrink-0">개발 ${m.cost.toLocaleString()}원</button>`
              }
            </div>
          `;
        }).join("");
      } else if (activePosTab === "staff") {
        box.innerHTML = state.upgrades.map((u, idx) => {
          const cost = Math.round(u.baseCost * Math.pow(1.45, u.level));
          const isMax = u.level >= u.max;
          return `
            <div class="bg-stone-950 border border-stone-800 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div>
                <div class="font-extrabold text-white">${u.name} <span class="text-amber-400 text-xs">Lv.${u.level}/${u.max}</span></div>
                <div class="text-[11px] text-stone-400 mt-0.5">${u.desc}</div>
              </div>
              ${isMax
                ? `<span class="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-400 text-xs font-bold shrink-0">MAX</span>`
                : `<button onclick="buyUpgrade(${idx})" class="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shrink-0">${cost.toLocaleString()}원</button>`
              }
            </div>
          `;
        }).join("");
      } else {
        box.innerHTML = `
          <div class="text-xs text-stone-400 mb-2">손님이 매장에 여러 번 재방문해 목표 횟수를 채우면 단골로 맞이할 수 있습니다. (최대 5명)</div>
          ${VISITOR_POOL.map(v => {
            const visits = state.visitorCounts[v.id] || 0;
            const isReg = state.regulars.includes(v.id);
            return `
              <div class="bg-stone-950 border ${isReg ? "border-amber-500/60" : "border-stone-800"} rounded-2xl p-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${v.avatar}</span>
                  <div>
                    <div class="font-extrabold text-white">${v.name} ${isReg ? `<span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">💖 찐단골</span>` : ""}</div>
                    <div class="text-[11px] text-stone-400">${v.perk} · 최애: ${v.fav}</div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-xs font-extrabold ${isReg ? "text-amber-300" : "text-sky-300"}">${visits} / ${v.neededVisits}회 방문</div>
                </div>
              </div>
            `;
          }).join("")}
        `;
      }
    }

    window.unlockMenu = (idx) => economy.unlockMenu(idx);
    window.buyUpgrade = (idx) => economy.buyUpgrade(idx);

    window.respondRegularOffer = (accept) => {
      if (accept && pendingRegularOffer && state.regulars.length < 5) {
        state.regulars.push(pendingRegularOffer.id);
        showToast(`💖 '${pendingRegularOffer.name}'님이 우리 카페 찐단골이 되었습니다!`, "amber");
        saveCloudProgress(false);
      }
      pendingRegularOffer = null;
      document.getElementById("regularOfferModal").classList.add("hidden");
      updateHUD();
    };

    window.switchPhoneApp = (app) => {
      activePhoneApp = app;
      const map = { market: "Market", sns: "Sns", msg: "Msg", stock: "Stock", coin: "Coin" };
      Object.entries(map).forEach(([k, suffix]) => {
        const el = document.getElementById(`appBtn${suffix}`);
        el.className = k === app
          ? "py-1.5 rounded-xl flex flex-col items-center gap-0.5 bg-amber-500/20 text-amber-300"
          : "py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-stone-400";
      });
      renderPhoneApp();
    };

    function renderPhoneApp() {
      const titleEl = document.getElementById("phoneAppTitle");
      const bodyEl = document.getElementById("phoneBody");

      if (activePhoneApp === "market") {
        titleEl.textContent = "📦 카페마켓 식자재 새벽발주";
        const pct = Math.min(100, Math.round((state.stock / state.maxStock) * 100));
        bodyEl.innerHTML = `
          <div class="bg-stone-900 border border-emerald-700/40 rounded-2xl p-3.5">
            <div class="flex justify-between text-xs font-bold mb-1.5">
              <span class="text-emerald-300">현재 매장 원두·우유 재고</span>
              <span class="text-white">${state.stock} / ${state.maxStock} 잔분 (${pct}%)</span>
            </div>
            <div class="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style="width:${pct}%"></div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div class="text-xs font-extrabold text-white">소량 긴급 퀵배송 (+25잔)</div>
                <div class="text-[11px] text-stone-400">원두 500g + 멸균우유 3팩</div>
              </div>
              <button onclick="orderIngredients(25, 12000)" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold">12,000원 발주</button>
            </div>

            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div class="text-xs font-extrabold text-white">스탠다드 박스 발주 (+60잔)</div>
                <div class="text-[11px] text-stone-400">스페셜티 원두 1.5kg + 시럽 세트</div>
              </div>
              <button onclick="orderIngredients(60, 26000)" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold">26,000원 발주</button>
            </div>

            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div class="text-xs font-extrabold text-amber-200">창고 가득 대용량 발주 (+100잔)</div>
                <div class="text-[11px] text-stone-400">도매가 할인 적용 · 즉시 입고</div>
              </div>
              <button onclick="orderIngredients(100, 40000)" class="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold">40,000원 발주</button>
            </div>

            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div class="text-xs font-extrabold text-sky-300">업소용 냉장 창고 증설 (+50잔 한도)</div>
                <div class="text-[11px] text-stone-400">현재 최대 보관량 ${state.maxStock}잔</div>
              </div>
              <button onclick="expandStorage()" class="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold">350,000원</button>
            </div>
          </div>
        `;
      } else if (activePhoneApp === "sns") {
        titleEl.textContent = "📸 카페그램 (CafeGram)";
        bodyEl.innerHTML = `
          <button onclick="postPromoSns()" class="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-extrabold shadow">
            ✨ 오늘의 카페 감성 사진 올리기 (-30,000원 홍보 · 평판 +3)
          </button>
          <div class="space-y-2.5">
            ${state.snsPosts.map((p, i) => `
              <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-pink-300">${p.user}</span>
                  <span class="text-[10px] text-stone-500">방금 전</span>
                </div>
                <p class="text-xs text-stone-200 leading-relaxed">${p.text}</p>
                <div class="text-[11px] text-sky-400">${p.tag}</div>
                <button onclick="toggleLikeSns(${i})" class="text-xs font-bold ${p.liked ? "text-rose-400" : "text-stone-400"}">
                  ${p.liked ? "❤️" : "🤍"} 좋아요 ${p.likes}개
                </button>
              </div>
            `).join("")}
          </div>
        `;
      } else if (activePhoneApp === "msg") {
        titleEl.textContent = "💬 사장님 문자 메시지";
        bodyEl.innerHTML = state.messages.map(m => `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 space-y-1">
            <div class="flex justify-between text-[11px]">
              <span class="font-extrabold text-amber-300">${m.sender}</span>
              <span class="text-stone-500">${m.time}</span>
            </div>
            <p class="text-xs text-stone-200 leading-relaxed">${m.text}</p>
          </div>
        `).join("");
      } else if (activePhoneApp === "stock") {
        titleEl.textContent = "📈 한국증권 (배당주 거래)";
        bodyEl.innerHTML = state.stocks.map((s, i) => `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 space-y-2">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-xs font-extrabold text-white">${s.name} <span class="text-stone-500">${s.code}</span></div>
                <div class="text-[11px] text-emerald-400">월 배당 ${(s.div * 100).toFixed(1)}% · 보유 ${s.owned}주</div>
              </div>
              <div class="text-sm font-black text-amber-300">${s.price.toLocaleString()}원</div>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="tradeAsset('stock', ${i}, 1)" class="py-1.5 rounded-xl bg-rose-600/80 text-white text-xs font-bold">1주 매수</button>
              <button onclick="tradeAsset('stock', ${i}, -1)" class="py-1.5 rounded-xl bg-sky-600/80 text-white text-xs font-bold">1주 매도</button>
            </div>
          </div>
        `).join("");
      } else if (activePhoneApp === "coin") {
        titleEl.textContent = "🪙 업비트코인 (초고변동)";
        bodyEl.innerHTML = state.coins.map((c, i) => `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 space-y-2">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-xs font-extrabold text-white">${c.name} (${c.code})</div>
                <div class="text-[11px] text-purple-300">보유: ${c.owned.toFixed(3)} ${c.code}</div>
              </div>
              <div class="text-xs font-black text-yellow-300">${c.price.toLocaleString()}원</div>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="tradeAsset('coin', ${i}, 1)" class="py-1.5 rounded-xl bg-rose-600/80 text-white text-xs font-bold">10만원 매수</button>
              <button onclick="tradeAsset('coin', ${i}, -1)" class="py-1.5 rounded-xl bg-sky-600/80 text-white text-xs font-bold">전량 매도</button>
            </div>
          </div>
        `).join("");
      }
    }

    window.orderIngredients = (amount, cost) => economy.orderIngredients(amount, cost);
    window.expandStorage = () => economy.expandStorage();

    window.postPromoSns = () => {
      if (state.cash < 30000) return showToast("홍보비가 부족합니다!", "rose");
      state.cash -= 30000;
      state.reputation += 3;
      const loc = getCurrentLocation();
      const season = SEASONS[state.seasonIdx];
      state.snsPosts.unshift({
        user: `@${state.playerId || "cafe_owner"}`,
        tag: `#${loc.name.replace(/\s/g, "")} #${season.name}카페 #${state.cafeName.replace(/\s/g, "")}`,
        text: `${season.icon} ${season.name} 햇살 가득한 ${state.cafeName}! 오늘도 신선한 원두로 정성껏 내렸습니다.`,
        likes: Math.floor(Math.random() * 25) + 10,
        liked: true
      });
      showToast("📸 카페그램 홍보 게시 완료! 평판 +3", "amber");
      updateHUD();
      renderPhoneApp();
    };

    window.toggleLikeSns = (i) => {
      state.snsPosts[i].liked = !state.snsPosts[i].liked;
      state.snsPosts[i].likes += state.snsPosts[i].liked ? 1 : -1;
      renderPhoneApp();
    };

    window.tradeAsset = (type, idx, dir) => economy.tradeAsset(type, idx, dir);



// 수도권 지도 · 본점 · 지점 · 건물
    // ==================== 수도권 지도 핀치 줌 & 드래그 ====================
    const mapState = {
      x: -140,
      y: -120,
      scale: 0.72,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastPinchDist: 0
    };

    function applyMapTransform() {
      const el = document.getElementById("metroMapTransform");
      el.style.transform = `translate3d(${mapState.x}px, ${mapState.y}px, 0) scale(${mapState.scale})`;
      const invScale = Math.max(0.58, Math.min(1.12, 1 / Math.pow(mapState.scale, 0.75)));
      document.querySelectorAll(".metro-pin-btn").forEach(btn => {
        const isSel = btn.dataset.selected === "1";
        btn.style.transform = `translate(-50%, -50%) scale(${invScale * (isSel ? 1.15 : 1)})`;
      });
    }

    window.zoomMapBy = (delta) => {
      const vp = document.getElementById("metroMapViewport");
      const cx = vp.clientWidth / 2;
      const cy = vp.clientHeight / 2;
      const prevScale = mapState.scale;
      const nextScale = Math.min(2.2, Math.max(0.42, prevScale + delta));
      mapState.x = cx - ((cx - mapState.x) / prevScale) * nextScale;
      mapState.y = cy - ((cy - mapState.y) / prevScale) * nextScale;
      mapState.scale = nextScale;
      applyMapTransform();
    };

    window.focusMapRegion = (region) => {
      const vp = document.getElementById("metroMapViewport");
      const vw = vp.clientWidth || window.innerWidth;
      const vh = vp.clientHeight || window.innerHeight * 0.65;

      const presets = {
        all: { tx: 520, ty: 440, s: vw < 640 ? 0.48 : 0.75 },
        seoul: { tx: 550, ty: 385, s: vw < 640 ? 1.15 : 1.45 },
        incheon: { tx: 270, ty: 420, s: vw < 640 ? 1.0 : 1.3 },
        gyeonggi_south: { tx: 580, ty: 575, s: vw < 640 ? 0.95 : 1.25 },
        gyeonggi_north: { tx: 560, ty: 290, s: vw < 640 ? 0.95 : 1.25 }
      };
      const p = presets[region] || presets.all;
      mapState.scale = p.s;
      mapState.x = vw / 2 - p.tx * p.s;
      mapState.y = vh / 2 - p.ty * p.s;
      applyMapTransform();
    };

    (function initMapGestures() {
      const vp = document.getElementById("metroMapViewport");

      vp.addEventListener("mousedown", e => {
        if (e.target.closest("button")) return;
        mapState.isDragging = true;
        mapState.startX = e.clientX - mapState.x;
        mapState.startY = e.clientY - mapState.y;
      });
      window.addEventListener("mousemove", e => {
        if (!mapState.isDragging) return;
        mapState.x = e.clientX - mapState.startX;
        mapState.y = e.clientY - mapState.startY;
        applyMapTransform();
      });
      window.addEventListener("mouseup", () => { mapState.isDragging = false; });

      vp.addEventListener("wheel", e => {
        e.preventDefault();
        zoomMapBy(e.deltaY < 0 ? 0.14 : -0.14);
      }, { passive: false });

      vp.addEventListener("touchstart", e => {
        if (e.touches.length === 1) {
          mapState.isDragging = true;
          mapState.startX = e.touches[0].clientX - mapState.x;
          mapState.startY = e.touches[0].clientY - mapState.y;
        } else if (e.touches.length === 2) {
          mapState.isDragging = false;
          mapState.lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      vp.addEventListener("touchmove", e => {
        e.preventDefault();
        if (e.touches.length === 1 && mapState.isDragging) {
          mapState.x = e.touches[0].clientX - mapState.startX;
          mapState.y = e.touches[0].clientY - mapState.startY;
          applyMapTransform();
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (mapState.lastPinchDist > 0) {
            const diff = (dist - mapState.lastPinchDist) * 0.004;
            zoomMapBy(diff);
          }
          mapState.lastPinchDist = dist;
        }
      }, { passive: false });

      vp.addEventListener("touchend", () => {
        mapState.isDragging = false;
        mapState.lastPinchDist = 0;
      });
    })();

    function renderMetroPins() {
      const layer = document.getElementById("metroPinsLayer");
      layer.innerHTML = METRO_LOCATIONS.map(loc => {
        const isHq = state.hqLocationId === loc.id;
        const isBranch = state.branches.includes(loc.id);
        const isBld = state.buildings.includes(loc.id);
        const isSel = selectedMapLocId === loc.id;
        const isRecStart = isInitialLocationSelection && RECOMMENDED_START_IDS.includes(loc.id);

        let badgeBg = "bg-stone-900/95 border-stone-500 text-stone-100";
        let icon = "📍";
        if (isRecStart) {
          badgeBg = "bg-amber-950/95 border-amber-400 text-amber-200 font-extrabold pin-recommend-glow";
          icon = "✨";
        } else if (!isInitialLocationSelection && isHq) {
          badgeBg = "bg-amber-500 border-white text-stone-950 font-black";
          icon = "👑";
        } else if (!isInitialLocationSelection && isBld) {
          badgeBg = "bg-purple-600 border-purple-200 text-white";
          icon = "🏢";
        } else if (!isInitialLocationSelection && isBranch) {
          badgeBg = "bg-emerald-600 border-emerald-200 text-white";
          icon = "🏪";
        }

        return `
          <button onclick="selectMapLocation('${loc.id}')"
            data-selected="${isSel ? "1" : "0"}"
            style="left:${loc.x}px; top:${loc.y}px;"
            class="metro-pin-btn absolute px-2 py-1 rounded-full border-2 shadow-lg text-[11px] leading-tight whitespace-nowrap transition-colors ${badgeBg} ${isSel ? "ring-4 ring-white/80 z-30" : isRecStart ? "z-20" : "z-10"}">
            ${icon} ${loc.name} <span class="opacity-85">${loc.mult}x</span>
          </button>
        `;
      }).join("");
      applyMapTransform();
    }

    window.selectMapLocation = (locId) => {
      selectedMapLocId = locId;
      renderMetroPins();
      updateSelectedLocationPanel();
    };

    function updateSelectedLocationPanel() {
      const loc = METRO_LOCATIONS.find(l => l.id === selectedMapLocId) || METRO_LOCATIONS[0];
      const isHq = state.hqLocationId === loc.id;
      const isBranch = state.branches.includes(loc.id);
      const isBld = state.buildings.includes(loc.id);
      const isRecStart = isInitialLocationSelection && RECOMMENDED_START_IDS.includes(loc.id);

      document.getElementById("selLocRegion").textContent = loc.region;
      document.getElementById("selLocName").textContent = loc.name;
      document.getElementById("selLocOwned").textContent = isInitialLocationSelection
        ? (isRecStart ? "✨ 추천 초기 상권" : loc.deposit <= 8000000 ? "✅ 개업 가능 상권" : "🔒 초기 자본 초과")
        : (isHq ? "👑 본점 운영중" : isBld ? "🏢 건물주 소유" : isBranch ? "🏪 직영점 운영" : "미진출 상권");
      document.getElementById("selLocStats").textContent =
        `매출배율 ${loc.mult}배 · 보증금 ${(loc.deposit/10000).toLocaleString()}만 · 월세 ${(loc.rent/10000).toLocaleString()}만 · 지점인수 ${(loc.branchPrice/10000).toLocaleString()}만 · 통매입 ${(loc.buildingPrice/10000).toLocaleString()}만`;

      const actBox = document.getElementById("selLocActions");
      if (isInitialLocationSelection) {
        const canAfford = loc.deposit <= 8000000;
        const remainCash = 8000000 - loc.deposit;
        actBox.innerHTML = canAfford
          ? `<button onclick="confirmInitialLocation('${loc.id}')" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-stone-950 text-xs sm:text-sm font-black shadow-lg">
              ✨ 이 상권에서 카페 개업하기 (보증금 ${(loc.deposit/10000).toLocaleString()}만 · 잔여 ${(remainCash/10000).toLocaleString()}만)
             </button>`
          : `<span class="px-3 py-2 rounded-xl bg-stone-800 text-rose-400 text-xs font-bold">
              보증금 부족 (초기 자본 800만 원 이하 상권을 선택하세요)
             </span>`;
        return;
      }

      let btns = "";
      if (!isHq) {
        btns += `<button onclick="moveHq('${loc.id}')" class="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold">본점 이사 (${(loc.deposit/10000).toLocaleString()}만)</button>`;
      }
      if (!isHq && !isBranch) {
        btns += `<button onclick="buyBranch('${loc.id}')" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold">지점 인수 (${(loc.branchPrice/10000).toLocaleString()}만)</button>`;
      }
      if (!isBld) {
        btns += `<button onclick="buyBuilding('${loc.id}')" class="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold">건물 통매입 (${(loc.buildingPrice/10000).toLocaleString()}만)</button>`;
      }
      actBox.innerHTML = btns;
    }

    window.moveHq = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.deposit) return showToast("이사 보증금이 부족합니다!", "rose");
      state.cash -= loc.deposit;
      state.hqLocationId = locId;
      showToast(`🚚 '${loc.region} ${loc.name}' 상권으로 본점을 이전했습니다!`, "amber");
      updateHUD();
      renderMetroPins();
      updateSelectedLocationPanel();
      saveCloudProgress(false);
    };

    window.buyBranch = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.branchPrice) return showToast("지점 인수 자금이 부족합니다!", "rose");
      state.cash -= loc.branchPrice;
      state.branches.push(locId);
      showToast(`🏪 '${loc.name}' 직영 지점을 오픈했습니다!`, "emerald");
      updateHUD();
      renderMetroPins();
      updateSelectedLocationPanel();
      saveCloudProgress(false);
    };

    window.buyBuilding = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.buildingPrice) return showToast("건물 매입 자금이 부족합니다!", "rose");
      state.cash -= loc.buildingPrice;
      state.buildings.push(locId);
      showToast(`🏢 '${loc.name}' 상가 건물주가 되었습니다!`, "purple");
      updateHUD();
      renderMetroPins();
      updateSelectedLocationPanel();
      saveCloudProgress(false);
    };



// 계정 · Firebase 저장/불러오기 · 랭킹
    // ==================== Firebase 클라우드 저장 & 중복 방지 계정 시스템 ====================
    function calculateNetWorth() {
      let total = state.cash;
      state.branches.forEach(id => {
        const l = METRO_LOCATIONS.find(x => x.id === id);
        if (l) total += l.branchPrice;
      });
      state.buildings.forEach(id => {
        const l = METRO_LOCATIONS.find(x => x.id === id);
        if (l) total += l.buildingPrice;
      });
      state.stocks.forEach(s => { total += s.price * s.owned; });
      state.coins.forEach(c => { total += Math.round(c.price * c.owned); });
      return Math.round(total);
    }

    function renderLedgerModal() {
      const loc = getCurrentLocation();
      const ownsHqBuilding = state.buildings.includes(state.hqLocationId);
      document.getElementById("ledgerPlayerId").textContent = state.playerId || "-";
      document.getElementById("ledgerNickname").textContent = state.nickname || "-";
      document.getElementById("ledgerCash").textContent = `${state.cash.toLocaleString()}원`;
      document.getElementById("ledgerNetWorth").textContent = `${calculateNetWorth().toLocaleString()}원`;
      document.getElementById("ledgerRent").textContent = ownsHqBuilding ? "0원 (자가 건물)" : `-${loc.rent.toLocaleString()}원`;
    }

    window.switchOnboardTab = (tab) => {
      const isNew = tab === "new";
      document.getElementById("onboardNewForm").classList.toggle("hidden", !isNew);
      document.getElementById("onboardLoadForm").classList.toggle("hidden", isNew);
      document.getElementById("tabNewBtn").className = isNew
        ? "py-2 rounded-xl text-xs font-extrabold bg-amber-600 text-white transition"
        : "py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition";
      document.getElementById("tabLoadBtn").className = !isNew
        ? "py-2 rounded-xl text-xs font-extrabold bg-sky-600 text-white transition"
        : "py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition";
    };

    window.fillRandomCafeName = () => {
      const adj = ["달빛", "연남", "오후세시", "구름", "한강뷰", "골목길", "창가자리", "버터크림", "소금빵", "노을빛"];
      const noun = ["로스터스", "커피방앗간", "다방", "에스프레소바", "산책카페", "테라스", "브루잉하우스"];
      const name = `${adj[Math.floor(Math.random() * adj.length)]} ${noun[Math.floor(Math.random() * noun.length)]}`;
      document.getElementById("regCafeName").value = name;
    };

    window.handleVerifyAndOpenMap = async () => {
      const playerId = document.getElementById("regPlayerId").value.trim().toLowerCase();
      const nickname = document.getElementById("regNickname").value.trim();
      const pin = document.getElementById("regPin").value.trim();
      const cafeName = document.getElementById("regCafeName").value.trim();
      const errEl = document.getElementById("onboardNewError");
      const btn = document.getElementById("createCafeBtn");

      if (!/^[a-z0-9_]{4,16}$/.test(playerId)) {
        errEl.textContent = "고유 아이디는 영문 소문자·숫자·밑줄(_) 4~16자로 입력하세요.";
        return;
      }
      if (!nickname || nickname.length < 2) {
        errEl.textContent = "사장님 닉네임을 2글자 이상 입력하세요.";
        return;
      }
      if (!/^[0-9]{4}$/.test(pin)) {
        errEl.textContent = "비밀번호는 숫자 4자리로 입력하세요.";
        return;
      }
      if (!cafeName || cafeName.length < 2) {
        errEl.textContent = "카페 상호명을 2글자 이상 입력하세요.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "서버 중복 확인 중...";
      errEl.textContent = "";

      try {
        if (db) {
          const userSnap = await getDoc(doc(db, "cafeUsers", playerId));
          if (userSnap.exists()) {
            errEl.textContent = "이미 사용 중인 고유 아이디입니다. 다른 아이디를 입력하세요.";
            return;
          }
          const nameKey = cafeName.replace(/\s+/g, "").toLowerCase();
          const nameSnap = await getDoc(doc(db, "cafeNames", nameKey));
          if (nameSnap.exists()) {
            errEl.textContent = "이미 다른 사장님이 사용 중인 카페 상호명입니다.";
            return;
          }
        }

        pendingSignupData = { playerId, nickname, pin, cafeName };
        isInitialLocationSelection = true;
        selectedMapLocId = "incheon_guwol";

        document.getElementById("onboardingModal").classList.add("hidden");
        document.getElementById("initialMapBanner").classList.remove("hidden");
        document.getElementById("mapCloseBtn").classList.add("hidden");
        openModal("mapModal");
        focusMapRegion("all");
      } catch (e) {
        console.error(e);
        errEl.textContent = "서버 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      } finally {
        btn.disabled = false;
        btn.textContent = "중복 확인 후 지도에서 상권 고르기 →";
      }
    };

    window.confirmInitialLocation = async (locId) => {
      if (!pendingSignupData) return;
      const locObj = METRO_LOCATIONS.find(l => l.id === locId);
      if (!locObj || locObj.deposit > 8000000) {
        return showToast("초기 자본금(800만 원) 이내의 상권을 선택해 주세요!", "rose");
      }

      const { playerId, nickname, pin, cafeName } = pendingSignupData;
      state.playerId = playerId;
      state.nickname = nickname;
      state.pin = pin;
      state.cafeName = cafeName;
      state.hqLocationId = locObj.id;
      state.cash = 8000000 - locObj.deposit;
      selectedMapLocId = locObj.id;

      try {
        if (db) {
          const nameKey = cafeName.replace(/\s+/g, "").toLowerCase();
          await setDoc(doc(db, "cafeNames", nameKey), {
            cafeName,
            playerId,
            createdAt: Date.now()
          });
          await saveCloudProgress(false);
        }
      } catch (e) {
        console.warn("Initial cloud save warning:", e);
      }

      localStorage.setItem("metroCafeSession", JSON.stringify({ playerId, pin }));
      isInitialLocationSelection = false;
      pendingSignupData = null;

      document.getElementById("initialMapBanner").classList.add("hidden");
      document.getElementById("mapCloseBtn").classList.remove("hidden");
      closeModal("mapModal");

      updateHUD();
      showToast(`🎉 '${locObj.region} ${locObj.name}'에 '${state.cafeName}' 개업 완료!`, "amber");
      setTimeout(() => spawnCustomer(), 2500);
    };

    window.handleLoadCafe = async () => {
      const playerId = document.getElementById("loginPlayerId").value.trim().toLowerCase();
      const pin = document.getElementById("loginPin").value.trim();
      const errEl = document.getElementById("onboardLoadError");
      const btn = document.getElementById("loadCafeBtn");

      if (!playerId || !/^[0-9]{4}$/.test(pin)) {
        errEl.textContent = "아이디와 4자리 비밀번호를 정확히 입력하세요.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "클라우드 조회 중...";
      errEl.textContent = "";

      try {
        if (!db) throw new Error("DB not initialized");
        const userSnap = await getDoc(doc(db, "cafeUsers", playerId));
        if (!userSnap.exists()) {
          errEl.textContent = "존재하지 않는 사장님 아이디입니다.";
          return;
        }
        const data = userSnap.data();
        if (data.pin !== pin) {
          errEl.textContent = "4자리 비밀번호(PIN)가 일치하지 않습니다.";
          return;
        }

        if (data.saveState) {
          state = { ...state, ...JSON.parse(data.saveState) };
          selectedMapLocId = state.hqLocationId;
        }
        localStorage.setItem("metroCafeSession", JSON.stringify({ playerId, pin }));
        document.getElementById("onboardingModal").classList.add("hidden");
        SoundEngine.syncWeatherAudio();
        updateHUD();
        showToast(`☁️ '${state.cafeName}' 매장 데이터를 성공적으로 불러왔습니다!`, "sky");
      } catch (e) {
        console.error(e);
        errEl.textContent = "불러오기 실패: 네트워크 또는 권한을 확인해 주세요.";
      } finally {
        btn.disabled = false;
        btn.textContent = "☁️ 클라우드에서 매장 불러오기";
      }
    };

    async function saveCloudProgress(notify = false) {
      if (!state.playerId || !state.pin) return;
      localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));

      if (!db) return;
      try {
        const netWorth = calculateNetWorth();
        await setDoc(doc(db, "cafeUsers", state.playerId), {
          playerId: state.playerId,
          pin: state.pin,
          nickname: state.nickname,
          cafeName: state.cafeName,
          saveState: JSON.stringify(state),
          updatedAt: Date.now()
        }, { merge: true });

        await setDoc(doc(db, "rankings", state.playerId), {
          playerId: state.playerId,
          nickname: state.nickname,
          cafeName: state.cafeName,
          hqLocationId: state.hqLocationId,
          netWorth,
          updatedAt: Date.now()
        }, { merge: true });

        const statusEl = document.getElementById("cloudStatusText");
        if (statusEl) statusEl.textContent = `최근 클라우드 동기화: ${new Date().toLocaleTimeString()}`;
        if (notify) showToast("☁️ 클라우드에 안전하게 저장되었습니다!", "emerald");
      } catch (e) {
        console.warn("Cloud save error:", e);
      }
    }

    window.manualCloudSave = () => saveCloudProgress(true);

    window.logoutAndSwitchAccount = () => {
      localStorage.removeItem("metroCafeSession");
      closeModal("ledgerModal");
      document.getElementById("onboardingModal").classList.remove("hidden");
      switchOnboardTab("load");
    };

    async function loadRankings() {
      const listEl = document.getElementById("rankingList");
      listEl.innerHTML = `<div class="text-center text-stone-400 py-8">실시간 수도권 랭킹 불러오는 중...</div>`;
      try {
        if (!db) throw new Error("No DB");
        const snap = await getDocs(collection(db, "rankings"));
        const rows = [];
        snap.forEach(d => rows.push(d.data()));
        rows.sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0));

        if (rows.length === 0) {
          listEl.innerHTML = `<div class="text-center text-stone-400 py-8">아직 등록된 랭킹이 없습니다.</div>`;
          return;
        }

        listEl.innerHTML = rows.slice(0, 30).map((r, idx) => {
          const isMe = r.playerId === state.playerId;
          const loc = METRO_LOCATIONS.find(l => l.id === r.hqLocationId);
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}위`;
          return `
            <div class="bg-stone-950 border ${isMe ? "border-amber-500" : "border-stone-800"} rounded-2xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="font-black text-amber-300 w-7 text-center shrink-0">${medal}</span>
                <div class="truncate">
                  <div class="font-extrabold text-white truncate">${r.cafeName} ${isMe ? "<span class='text-amber-400'>(나)</span>" : ""}</div>
                  <div class="text-[11px] text-stone-400">${r.nickname} · ${loc ? loc.name : "수도권"}</div>
                </div>
              </div>
              <div class="font-black text-emerald-400 shrink-0">${(r.netWorth || 0).toLocaleString()}원</div>
            </div>
          `;
        }).join("");
      } catch (e) {
        listEl.innerHTML = `<div class="text-center text-rose-400 py-6">랭킹을 불러오지 못했습니다.</div>`;
      }
    }



// 알림 효과 · 자동 저장 · 게임 루프 · HTML onclick 호환
    function showToast(msg, tone = "amber") {
      const container = document.getElementById("toastContainer");
      const el = document.createElement("div");
      const colors = {
        amber: "bg-stone-900/95 border-amber-500/60 text-amber-100",
        emerald: "bg-stone-900/95 border-emerald-500/60 text-emerald-200",
        sky: "bg-stone-900/95 border-sky-500/60 text-sky-200",
        rose: "bg-stone-900/95 border-rose-500/60 text-rose-200",
        purple: "bg-stone-900/95 border-purple-500/60 text-purple-200"
      };
      el.className = `${colors[tone] || colors.amber} border backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl text-center transition-all`;
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 350);
      }, 3000);
    }

    function spawnFloatingText(text, x, y, color) {
      const el = document.createElement("div");
      el.className = "floating-coin text-xs sm:text-sm";
      el.style.left = `${Math.min(window.innerWidth - 110, Math.max(16, x - 35))}px`;
      el.style.top = `${y}px`;
      el.style.color = color;
      el.textContent = text;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }

    (async function tryAutoRestore() {
      const savedSession = localStorage.getItem("metroCafeSession");
      if (!savedSession) return;
      try {
        const { playerId, pin } = JSON.parse(savedSession);
        if (db && playerId && pin) {
          const snap = await getDoc(doc(db, "cafeUsers", playerId));
          if (snap.exists() && snap.data().pin === pin && snap.data().saveState) {
            state = { ...state, ...JSON.parse(snap.data().saveState) };
            selectedMapLocId = state.hqLocationId;
            document.getElementById("onboardingModal").classList.add("hidden");
            updateHUD();
            return;
          }
        }
        const localBackup = localStorage.getItem("metroCafeLocalSave");
        if (localBackup) {
          state = { ...state, ...JSON.parse(localBackup) };
          document.getElementById("onboardingModal").classList.add("hidden");
          updateHUD();
        }
      } catch (e) {
        console.warn("Session restore skipped:", e);
      }
    })();

    let secondCounter = 0;
    setInterval(() => {
      if (!state.playerId) return;
      secondCounter++;

      state.minuteOfDay += 8;
      if (state.minuteOfDay >= 1440) {
        state.minuteOfDay = 0;
        advanceDayAndWeather();
      }

      const interiorLv = state.upgrades.find(u => u.id === "interior")?.level || 0;
      let trafficBoost = 1.0;
      state.regulars.forEach(regId => {
        const v = VISITOR_POOL.find(item => item.id === regId);
        if (v && v.bonusType === "traffic") trafficBoost += v.bonusVal;
      });
      const spawnChance = Math.min(0.22, (0.025 + state.reputation * 0.001 + interiorLv * 0.015) * trafficBoost);
      if (Math.random() < spawnChance) {
        spawnCustomer();
      }

      if (secondCounter % 3 === 0) {
        tickAutoBrew();
      }

      if (secondCounter % 10 === 0) {
        state.stocks.forEach(s => {
          const chg = 1 + (Math.random() - 0.49) * 0.04;
          s.price = Math.max(5000, Math.round(s.price * chg));
        });
        state.coins.forEach(c => {
          const chg = 1 + (Math.random() - 0.49) * 0.12;
          c.price = Math.max(50, Math.round(c.price * chg));
        });
      }

      if (secondCounter % 25 === 0) {
        saveCloudProgress(false);
      }

      updateHUD();
    }, 1000);

    let lastFrameTime = performance.now();
    function mainLoop(now) {
      const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      updateCustomers(dt);
      cafeRenderer.draw(now);
      requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);


// Preserve compatibility with the existing HTML onclick="..." handlers.
Object.assign(window, {
  updateAudioUI,
  spawnCustomer,
  updateCustomers,
  getCurrentLocation,
  calculateMenuSalePrice,
  tickAutoBrew,
  processCustomerOrder,
  advanceDayAndWeather,
  getWeatherLabel,
  updateHUD,
  renderPosModal,
  renderPhoneApp,
  applyMapTransform,
  renderMetroPins,
  updateSelectedLocationPanel,
  calculateNetWorth,
  renderLedgerModal,
  saveCloudProgress,
  loadRankings,
  showToast,
  spawnFloatingText,
  mainLoop
});
