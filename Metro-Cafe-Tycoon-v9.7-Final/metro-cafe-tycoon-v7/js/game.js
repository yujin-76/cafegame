// 초기화 · Firebase 연결 · 게임 데이터와 상태
import { createCafeRenderer } from "./graphics.js";
    import { createEconomySystem } from "./economy.js";
    import { FURNITURE_CATALOG, getFurnitureById } from "./furniture.js";
    import { INGREDIENT_CATALOG, INGREDIENT_CATEGORIES, getIngredientById, evaluateCustomRecipe } from "./ingredients.js";
    import { firebaseConfig } from "./firebase-config.js";

    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    let db = null;
    let firebaseConnectionState = "not-configured";

    function setCloudStatus(message, status = firebaseConnectionState) {
      firebaseConnectionState = status;
      const statusEl = document.getElementById("cloudStatusText");
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.dataset.firebaseStatus = status;
      }
    }

    function hasFirebaseWebConfig(config) {
      const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
      return requiredKeys.every(key => {
        const value = typeof config[key] === "string" ? config[key].trim() : "";
        return value && !/^(YOUR_|CHANGE_ME|DUMMY)/i.test(value);
      });
    }

    window.getFirebaseConnectionState = () => firebaseConnectionState;
    window.setCloudStatus = setCloudStatus;

    if (hasFirebaseWebConfig(firebaseConfig)) {
      try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        setCloudStatus("Firebase Firestore 연결 준비 완료", "initialized");
      } catch (e) {
        setCloudStatus("Firebase 초기화 실패 · 설정값을 확인하세요.", "error");
        console.error("Firebase initialization failed:", e);
      }
    } else {
      setCloudStatus("Firebase 설정 필요 · js/firebase-config.js를 입력하세요.", "not-configured");
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
      { id: "americano", name: "하우스 아메리카노", price: 1400, cost: 0, unlocked: true, useCoffee: true, ingredients: [], popularity: 1.15, desc: "상시 구비된 스페셜티 원두로 내린 깔끔한 아메리카노 (원두 상시 무료)" },
      { id: "latte", name: "고소한 카페라떼", price: 2200, cost: 350000, unlocked: false, useCoffee: true, ingredients: ["milk"], popularity: 1.1, desc: "에스프레소 + 서울 1A등급 우유가 어우러진 부드러운 라떼" },
      { id: "vanilla", name: "마다가스카르 바닐라라떼", price: 2900, cost: 900000, unlocked: false, useCoffee: true, ingredients: ["milk", "vanilla_syrup"], popularity: 1.15, desc: "우유 + 천연 바닐라빈 시럽으로 만든 스테디셀러" },
      { id: "einspanner", name: "수제 크림 아인슈페너", price: 3600, cost: 2200000, unlocked: false, useCoffee: true, ingredients: ["whipping_cream"], popularity: 1.2, desc: "진한 에스프레소 위에 쫀쫀한 수제 마스카포네 크림" },
      { id: "pistachio", name: "피스타치오 크림 라떼", price: 4600, cost: 5000000, unlocked: false, useCoffee: true, ingredients: ["milk", "pistachio_paste", "whipping_cream"], popularity: 1.3, desc: "우유 + 브론테 피스타치오 + 수제 크림의 프리미엄 메뉴" }
    ];

    const UPGRADE_CATALOG = [
      { id: "auto_drip", name: "소형 브루잉 머신 (자동 추출)", baseCost: 600000, level: 1, max: 10, desc: "주기적으로 자동 커피 추출 (100~1,000원 랜덤 매출)" },
      { id: "interior", name: "원목 감성 인테리어 & 좌석", baseCost: 800000, level: 0, max: 10, desc: "매장 평판 상승 및 손님 방문 빈도 증가" },
      { id: "grinder", name: "코니컬 버 정밀 그라인더", baseCost: 1200000, level: 0, max: 8, desc: "모든 메뉴 판매 단가 +10% 상승" },
      { id: "roaster", name: "자체 소형 로스터기", baseCost: 2500000, level: 0, max: 5, desc: "단골 승격 속도 및 분위기 보너스" }
    ];

    // 일반 수도권 유동인구 손님 외형 풀 (매번 다채로운 시민들이 방문)
    const CROWD_APPEARANCES = [
      { label: "출근길 직장인", hairStyle: "short", hairColor: "#1c1917", skinColor: "#fed7aa", topColor: "#334155", accessory: "glasses" },
      { label: "대학생", hairStyle: "messy", hairColor: "#292524", skinColor: "#ffedd5", topColor: "#2563eb", accessory: "none" },
      { label: "동네 산책객", hairStyle: "bob", hairColor: "#451a03", skinColor: "#fed7aa", topColor: "#16a34a", accessory: "none" },
      { label: "외근 비즈니스맨", hairStyle: "short", hairColor: "#0f172a", skinColor: "#fdba74", topColor: "#1e293b", accessory: "none" },
      { label: "쇼핑 나들이객", hairStyle: "long", hairColor: "#7c2d12", skinColor: "#ffedd5", topColor: "#e11d48", accessory: "ribbon" },
      { label: "카공족 수험생", hairStyle: "messy", hairColor: "#1c1917", skinColor: "#ffedd5", topColor: "#4f46e5", accessory: "glasses" },
      { label: "주말 데이트객", hairStyle: "long", hairColor: "#5c2d16", skinColor: "#fed7aa", topColor: "#d97706", accessory: "none" },
      { label: "동네 어르신", hairStyle: "silver", hairColor: "#e7e5e4", skinColor: "#fed7aa", topColor: "#57534e", accessory: "glasses" },
      { label: "패션 피플", hairStyle: "bob", hairColor: "#9a3412", skinColor: "#ffedd5", topColor: "#9333ea", accessory: "beret" },
      { label: "IT 개발자", hairStyle: "messy", hairColor: "#292524", skinColor: "#fdba74", topColor: "#0d9488", accessory: "glasses" },
      { label: "운동 후 휴식객", hairStyle: "short", hairColor: "#1c1917", skinColor: "#fdba74", topColor: "#ea580c", accessory: "none" },
      { label: "원두 애호가", hairStyle: "short", hairColor: "#44403c", skinColor: "#fed7aa", topColor: "#78350f", accessory: "beard" }
    ];

    // 엄격한 조건(누적 재방문 + 매장 평판 + 메뉴 해금)을 충족해야 승격되는 VIP 단골 유형 8종
    const VISITOR_POOL = [
      { id: "v_art", name: "미대생 단골", avatar: "🎨", hairStyle: "messy", hairColor: "#292524", skinColor: "#fed7aa", topColor: "#d97706", accessory: "beret", neededVisits: 10, minRep: 25, favMenuId: "einspanner", fav: "수제 크림 아인슈페너", perk: "메뉴 판매 단가 +10%", bonusType: "price", bonusVal: 0.10 },
      { id: "v_freelancer", name: "노트북 카공 단골", avatar: "💻", hairStyle: "long", hairColor: "#451a03", skinColor: "#ffedd5", topColor: "#0284c7", accessory: "glasses", neededVisits: 12, minRep: 35, favMenuId: "latte", fav: "고소한 카페라떼", perk: "손님 방문 속도 +14%", bonusType: "traffic", bonusVal: 0.14 },
      { id: "v_bookshop", name: "독립서점 단골", avatar: "📚", hairStyle: "short", hairColor: "#1c1917", skinColor: "#fdba74", topColor: "#059669", accessory: "beard", neededVisits: 14, minRep: 45, favMenuId: "americano", fav: "하우스 아메리카노", perk: "매장 평판 월 +4 보너스", bonusType: "rep", bonusVal: 4 },
      { id: "v_blogger", name: "디저트 리뷰어 단골", avatar: "📷", hairStyle: "bob", hairColor: "#7c2d12", skinColor: "#ffedd5", topColor: "#db2777", accessory: "ribbon", neededVisits: 16, minRep: 65, favMenuId: "pistachio", fav: "피스타치오 크림 라떼", perk: "SNS 바이럴 단가 +15%", bonusType: "price", bonusVal: 0.15 },
      { id: "v_barista", name: "원두 감별사 단골", avatar: "☕", hairStyle: "silver", hairColor: "#d6d3d1", skinColor: "#fed7aa", topColor: "#6d28d9", accessory: "apron", neededVisits: 18, minRep: 85, favMenuId: "vanilla", fav: "마다가스카르 바닐라라떼", perk: "자동 추출 수익 +300원 추가", bonusType: "auto", bonusVal: 300 },
      { id: "v_office", name: "대기업 팀장 단골", avatar: "💼", hairStyle: "short", hairColor: "#0f172a", skinColor: "#fdba74", topColor: "#1e3a8a", accessory: "glasses", neededVisits: 20, minRep: 110, favMenuId: "americano", fav: "하우스 아메리카노", perk: "단체 주문 단가 +12%", bonusType: "price", bonusVal: 0.12 },
      { id: "v_musician", name: "인디 뮤지션 단골", avatar: "🎸", hairStyle: "messy", hairColor: "#451a03", skinColor: "#ffedd5", topColor: "#b91c1c", accessory: "beret", neededVisits: 22, minRep: 140, favMenuId: "einspanner", fav: "수제 크림 아인슈페너", perk: "손님 유입 속도 +16%", bonusType: "traffic", bonusVal: 0.16 },
      { id: "v_sommelier", name: "미식 칼럼니스트 단골", avatar: "🏅", hairStyle: "silver", hairColor: "#cbd5e1", skinColor: "#fed7aa", topColor: "#0f766e", accessory: "glasses", neededVisits: 25, minRep: 180, favMenuId: "pistachio", fav: "피스타치오 크림 라떼", perk: "프리미엄 단가 +20%", bonusType: "price", bonusVal: 0.20 }
    ];


    // ==================== 평판 성장 & 등급 시스템 (상한 1000 · 구간별 감쇠 · 소수점 누적) ====================
    const MAX_REPUTATION = 1000;

    function getReputationGrade(rep = state.reputation) {
      const r = Number(rep) || 0;
      if (r < 40) return "초보카페";
      if (r < 120) return "동네맛집";
      if (r < 280) return "로컬핫플";
      if (r < 520) return "수도권명소";
      if (r < 800) return "메가랜드마크";
      return "전설의성지";
    }

    // 현재 평판이 높을수록 상승 효율이 완만해지는 체감 계수
    function getReputationGainMultiplier(rep = state.reputation) {
      const r = Number(rep) || 0;
      if (r < 100) return 1.0;
      if (r < 250) return 0.65;
      if (r < 450) return 0.42;
      if (r < 700) return 0.25;
      if (r < 900) return 0.14;
      return 0.08;
    }

    // 평판 증감 처리 (소수점 포인트를 누적해 정수 평판으로 반영)
    function addReputation(rawDelta, options = {}) {
      const { bypassDiminish = false, minFloor = 1 } = options;
      const cur = Math.max(minFloor, Math.min(MAX_REPUTATION, Math.floor(Number(state.reputation) || 10)));
      if (typeof state.repProgress !== "number" || Number.isNaN(state.repProgress)) {
        state.repProgress = 0;
      }

      if (rawDelta >= 0) {
        if (cur >= MAX_REPUTATION) {
          state.reputation = MAX_REPUTATION;
          state.repProgress = 0;
          return 0;
        }
        const mult = bypassDiminish ? 1.0 : getReputationGainMultiplier(cur);
        state.repProgress += rawDelta * mult;
        const gained = Math.floor(state.repProgress + 1e-9);
        if (gained > 0) {
          state.repProgress = Math.max(0, state.repProgress - gained);
          const nextRep = Math.min(MAX_REPUTATION, cur + gained);
          const actual = nextRep - cur;
          state.reputation = nextRep;
          if (nextRep >= MAX_REPUTATION) state.repProgress = 0;
          return actual;
        }
        state.reputation = cur;
        return 0;
      } else {
        // 감점은 그대로 반영
        const loss = Math.abs(rawDelta);
        state.repProgress = 0;
        const nextRep = Math.max(minFloor, Math.round(cur - loss));
        state.reputation = nextRep;
        return nextRep - cur;
      }
    }
    window.addReputation = addReputation;
    window.getReputationGrade = getReputationGrade;

    let state = {
      playerId: "",
      nickname: "",
      pin: "",
      cafeName: "",
      cash: 8000000,
      reputation: 10,
      tutorialCompleted: false,
      repProgress: 0,
      stock: 35,
      maxStock: 100,
      ingredientStock: { milk: 15, vanilla_syrup: 10, lemon_syrup: 10 },
      ingredientCaps: {},
      ingredientSubscriptions: {},
      ingredientOrdersMade: 0,
      employees: {},
      creatorReviewClaims: [],
      guideQuestStep: 0,
      seasonFinance: null,
      seasonReports: [],
      ingredientCart: [],
      pendingDeliveries: [],
      hqLocationId: "incheon_guwol",
      activeViewLocationId: null,
      branches: [],
      branchConcepts: {},
      buildings: [],
      menus: JSON.parse(JSON.stringify(MENU_CATALOG)),
      upgrades: JSON.parse(JSON.stringify(UPGRADE_CATALOG)),
      ownedFurniture: ["table_wood_2", "rug_warm_amber"],
      placedFurniture: {
        slotLeft: "table_wood_2",
        slotCenter: "table_wood_2",
        slotRight: "table_wood_2",
        slotFrontLeft: "table_wood_2",
        slotFrontCenter: null,
        slotFrontRight: "table_wood_2",
        decorLeft: null,
        decorRight: null,
        decorFrontLeft: null,
        decorFrontRight: null,
        hallRug: "rug_warm_amber"
      },
      visitorCounts: {},
      regulars: [],
      day: 1,
      minuteOfDay: 480,
      seasonIdx: 0,
      weather: "clear",
      stocks: [
        { code: "STAR", name: "별다방홀딩스", price: 42000, owned: 0, div: 0.015 },
        { code: "BEAN", name: "대한원두유통", price: 18500, owned: 0, div: 0.012 },
        { code: "HAN", name: "한강리츠부동산", price: 65000, owned: 0, div: 0.020 }
      ],
      coins: [
        { code: "BTC", name: "비트코인", price: 85000000, owned: 0 },
        { code: "CAFE", name: "카페토큰", price: 18000, owned: 0 },
        { code: "DOGE", name: "시바라떼코인", price: 12000, owned: 0 }
      ],
      marketPriceVersion: 2,
      market: { tick: 0, nid: 1, lastNewsTick: 0, news: [] },
      phoneAlerts: {
        lastTargetApp: "msg",
        lastLabel: "",
        unreadMsg: 0,
        unreadSns: false,
        unreadStock: false,
        unreadCoin: false,
        unreadMarket: false
      },
      activeCateringOrder: null,
      messages: [
        {
          id: "msg_welcome",
          category: "notice",
          unread: false,
          sender: "부동산 김실장",
          time: "개업일",
          text: "사장님 개업 축하드립니다! 처음엔 동네 손님들이 한두 분씩 천천히 찾아오실 거예요. 메뉴를 개발하고 평판을 쌓아보세요!"
        }
      ],
      snsFollowers: 128,
      snsViralBoostTicks: 0,
      snsPosts: [
        { user: "@metro_cafe_guide", badge: "수도권 핫플", mood: "✨ 감성", photoTheme: "sunset", tag: "#신상카페 #통유리뷰 #수도권카페", text: "창밖 노을이랑 따뜻한 원목 인테리어 조합이 미쳤어요… 커피 향까지 완벽한 아지트 발견 ☕", likes: 42, comments: ["분위기 대박이네요!", "주말에 바로 가봐야겠어요"], liked: false }
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
    let activePhoneApp = "msg";
    let selectedMapLocId = "incheon_guwol";
    let isInitialLocationSelection = false;
    let pendingSignupData = null;

    // 캔버스 및 손님·날씨 파티클 초기화
    let scenicMode = false;
    let gameSpeed = 1;
    let activeCustomers = [];
    const cafeRenderer = createCafeRenderer({
      canvas: document.getElementById("cafeSceneCanvas"),
      getState: () => state,
      getScenicMode: () => scenicMode,
      getCustomers: () => activeCustomers
    });



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


// 손님 생성 · 이동 · 주문 · 퇴장 (6개 홀 테이블 동선)
    const HALL_SEAT_SLOTS = [
      { id: "slotLeft", x: 0.23, yRatio: 0.615, label: "창가 왼쪽 자리" },
      { id: "slotCenter", x: 0.50, yRatio: 0.615, label: "창가 중앙 자리" },
      { id: "slotRight", x: 0.77, yRatio: 0.615, label: "창가 오른쪽 자리" },
      { id: "slotFrontLeft", x: 0.25, yRatio: 0.785, label: "홀 앞쪽 왼쪽 자리" },
      { id: "slotFrontCenter", x: 0.50, yRatio: 0.785, label: "홀 앞쪽 중앙 자리" },
      { id: "slotFrontRight", x: 0.75, yRatio: 0.785, label: "홀 앞쪽 오른쪽 자리" }
    ];

    function getActiveSeatSlots() {
      const placed = state.placedFurniture || {};
      const active = HALL_SEAT_SLOTS.filter(s => Boolean(placed[s.id]));
      return active.length ? active : HALL_SEAT_SLOTS.slice(0, 3);
    }

    function spawnCustomer() {
      const availableSeats = getActiveSeatSlots();
      const maxCap = Math.min(5, availableSeats.length);
      if (activeCustomers.length >= maxCap) return;

      const unlockedMenus = state.menus.filter(m => m.unlocked);
      // 재료가 준비된 메뉴 우선 + 맛/트렌드 인기도(popularity)에 따른 가중치 선택 (맛없는 괴식 메뉴는 거의 안 시킴!)
      const availableMenus = unlockedMenus.filter(m => typeof economy !== "undefined" ? economy.canMakeMenu(m) : true);
      const candidateMenus = availableMenus.length > 0 ? availableMenus : unlockedMenus;
      const weightedPool = candidateMenus.map(m => {
        let w = typeof m.popularity === "number" ? m.popularity : 1.0;
        if (m.isTrending) w *= 2.1; // SNS 유행 중이면 손님 주문 폭주!
        if (typeof economy !== "undefined" && economy.getSeasonalMenuBonus(m) > 0) w *= 1.35;
        return { menu: m, weight: Math.max(0.05, w) };
      });
      const totalWeight = weightedPool.reduce((s, x) => s + x.weight, 0);
      let rPick = Math.random() * totalWeight;
      let chosenMenu = weightedPool[0]?.menu || state.menus[0];
      for (const item of weightedPool) {
        rPick -= item.weight;
        if (rPick <= 0) {
          chosenMenu = item.menu;
          break;
        }
      }

      // 수도권의 수많은 일반 시민 손님(82%)과 단골 후보 손님(18%)이 자연스럽게 섞여 방문
      const isSpecialCandidate = Math.random() < 0.18;
      let visitor;
      if (isSpecialCandidate) {
        const candidates = VISITOR_POOL.filter(v => !activeCustomers.some(c => c.visitor.id === v.id));
        const pool = candidates.length ? candidates : VISITOR_POOL;
        visitor = pool[Math.floor(Math.random() * pool.length)];
      } else {
        // 현재 홀에 이미 있는 손님들과 겹치지 않는 외형을 우선 선택
        const usedLabels = new Set(activeCustomers.map(c => c.visitor?.name));
        const unusedApps = CROWD_APPEARANCES.filter(a => !usedLabels.has(a.label));
        const appPool = unusedApps.length > 0 ? unusedApps : CROWD_APPEARANCES;
        const app = appPool[Math.floor(Math.random() * appPool.length)];
        const appIdx = CROWD_APPEARANCES.indexOf(app);
        visitor = {
          id: `general_crowd_${appIdx >= 0 ? appIdx : Math.floor(Math.random() * 12)}`,
          appearanceIndex: appIdx >= 0 ? appIdx : 0,
          isGeneral: true,
          name: app.label,
          hairStyle: app.hairStyle,
          hairColor: app.hairColor,
          skinColor: app.skinColor,
          topColor: app.topColor,
          accessory: app.accessory
        };
      }

      // 비어 있는 테이블 슬롯 우선 배정
      const freeSlots = availableSeats.filter(s => !activeCustomers.some(c => c.slotId === s.id));
      const chosenSlot = (freeSlots.length ? freeSlots : availableSeats)[Math.floor(Math.random() * (freeSlots.length ? freeSlots.length : availableSeats.length))];

      const entranceGreetings = [
        "안녕하세용! 입장 ✨",
        "홀 인테리어가 너무 예뻐요~ ☕",
        "오늘도 들렀어요! 😊",
        "넓은 홀 자리 잡을게요! 🪑"
      ];

      activeCustomers.push({
        visitor,
        menu: chosenMenu,
        x: 0.06,
        yRatio: 0.68,
        targetX: chosenSlot.x,
        targetYRatio: chosenSlot.yRatio,
        seatX: chosenSlot.x,
        seatYRatio: chosenSlot.yRatio,
        slotId: chosenSlot.id,
        state: "entering", // entering -> ordering -> sitting -> leaving
        timer: 0,
        orderOrdered: false,
        isSipping: false,
        sipTimer: 0,
        mood: "happy",
        bubbleText: entranceGreetings[Math.floor(Math.random() * entranceGreetings.length)]
      });
    }

    function updateCustomers(rawDt) {
      const dt = rawDt * (typeof gameSpeed === "number" ? gameSpeed : 1);
      for (let i = activeCustomers.length - 1; i >= 0; i--) {
        const c = activeCustomers[i];
        c.timer += dt * (state.employees && state.employees.barista ? 1.3 : 1);
        if (typeof c.yRatio !== "number") c.yRatio = 0.62;
        if (typeof c.seatYRatio !== "number") c.seatYRatio = 0.62;

        if (c.state === "entering") {
          c.isSipping = false;
          const dx = c.targetX - c.x;
          const dy = (c.targetYRatio || c.seatYRatio) - c.yRatio;
          const dist = Math.hypot(dx, dy);
          if (dist <= 0.012) {
            c.x = c.targetX;
            c.yRatio = c.targetYRatio || c.seatYRatio;
            c.state = "ordering";
            c.timer = 0;
            c.mood = "excited";
            c.bubbleText = `${c.menu.name} 주문할게요! 🧾`;
          } else {
            c.x += (dx / dist) * 0.085 * dt;
            c.yRatio += (dy / dist) * 0.085 * dt;
          }
        } else if (c.state === "ordering") {
          c.isSipping = false;
          if (!c.orderOrdered && c.timer >= 1.8) {
            c.orderOrdered = true;
            processCustomerOrder(c);
          }
          if (c.timer >= 3.6) {
            c.state = "sitting";
            c.targetX = c.seatX;
            c.yRatio = c.seatYRatio;
            c.timer = 0;
            c.mood = "happy";
            c.bubbleText = "테이블에서 여유롭게 한 모금 ☕";
          }
        } else if (c.state === "sitting") {
          c.x = c.seatX;
          c.yRatio = c.seatYRatio;
          const cycle = c.timer % 4.5;
          c.isSipping = cycle > 1.5 && cycle < 3.3;

          if (c.timer > 6.5 && c.timer < 6.7) {
            c.mood = "love";
            const seasonComments = [
              "벚꽃 바람 보며 마시니 최고 🌸",
              "시원한 여름 하늘에 힐링돼요 🌿",
              "단풍 물든 창밖이 그림 같네요 🍁",
              "따뜻한 커피가 몸을 녹여줘요 ❄️"
            ];
            const weatherComments = {
              rain: "빗소리 들으며 마시는 커피 낭만 🌧️",
              snow: "눈 내리는 풍경이랑 딱이네요 ☃️",
              cloudy: "인테리어 가구가 아늑해서 좋아요 🕯️",
              clear: seasonComments[state.seasonIdx] || "창밖 풍경이랑 딱이네요 😊"
            };
            c.bubbleText = weatherComments[state.weather] || "인테리어가 정말 감성적이네요 😊";
          } else if (c.timer > 13.5 && c.timer < 13.7) {
            c.mood = "happy";
            c.bubbleText = `${c.menu.name} 풍미가 깊어요 😋`;
          }

          if (c.timer >= 19) {
            c.state = "leaving";
            c.isSipping = false;
            c.targetX = 0.05;
            c.targetYRatio = 0.68;
            c.timer = 0;
            c.mood = "happy";
            c.bubbleText = "잘 마셨습니다! 다음에 또 올게요 👋";
          }
        } else if (c.state === "leaving") {
          c.isSipping = false;
          const dx = c.targetX - c.x;
          const dy = (c.targetYRatio || 0.68) - c.yRatio;
          const dist = Math.hypot(dx, dy);
          if (dist <= 0.015) {
            activeCustomers.splice(i, 1);
          } else {
            c.x += (dx / dist) * 0.085 * dt;
            c.yRatio += (dy / dist) * 0.085 * dt;
          }
        }
      }
    }


// 게임 시간 · 날씨 · 경제 연결 · HUD

    // ==================== 스마트폰 통합 알림 & 배지 매니저 ====================
    function ensurePhoneAlerts() {
      if (!state.phoneAlerts || typeof state.phoneAlerts !== "object") {
        state.phoneAlerts = {
          lastTargetApp: "msg",
          lastLabel: "",
          unreadMsg: 0,
          unreadSns: false,
          unreadStock: false,
          unreadCoin: false,
          unreadMarket: false
        };
      }
      if (!Array.isArray(state.messages)) state.messages = [];
      state.phoneAlerts.unreadMsg = state.messages.filter(m => m && m.unread).length;
      return state.phoneAlerts;
    }

    function syncPhoneBadges() {
      const pa = ensurePhoneAlerts();
      const outerBadge = document.getElementById("phoneBadge");
      const badgeMsg = document.getElementById("badgeMsg");
      const badgeSns = document.getElementById("badgeSns");
      const badgeStock = document.getElementById("badgeStock");
      const badgeCoin = document.getElementById("badgeCoin");
      const badgeMarket = document.getElementById("badgeMarket");
      const tabletBadge = document.getElementById("tabletBadge");

      if (badgeMsg) {
        if (pa.unreadMsg > 0) {
          badgeMsg.textContent = pa.unreadMsg > 9 ? "9+" : String(pa.unreadMsg);
          badgeMsg.classList.remove("hidden");
        } else {
          badgeMsg.classList.add("hidden");
        }
      }
      if (badgeSns) badgeSns.classList.toggle("hidden", !pa.unreadSns);
      if (badgeStock) badgeStock.classList.toggle("hidden", !pa.unreadStock);
      if (badgeCoin) badgeCoin.classList.toggle("hidden", !pa.unreadCoin);
      if (badgeMarket) badgeMarket.classList.toggle("hidden", !pa.unreadMarket);

      const hasTabletAlerts = pa.unreadStock || pa.unreadCoin || pa.unreadMarket;
      if (tabletBadge) tabletBadge.classList.toggle("hidden", !hasTabletAlerts);
      const hasAny = pa.unreadMsg > 0 || pa.unreadSns;
      if (outerBadge) {
        if (hasAny) {
          let label = pa.lastLabel;
          if (!label) {
            if (pa.unreadMsg > 0) label = `💬 새 문자 ${pa.unreadMsg}`;
            else if (pa.unreadSns) label = "📸 카페그램";
          }
          outerBadge.textContent = label;
          outerBadge.classList.remove("hidden");
        } else {
          outerBadge.classList.add("hidden");
          pa.lastLabel = "";
        }
      }
    }

    function pushPhoneNotification(appKey, shortLabel) {
      const pa = ensurePhoneAlerts();
      const phoneEl = document.getElementById("phoneModal");
      const isPhoneOpen = phoneEl && !phoneEl.classList.contains("hidden");

      if (isPhoneOpen && activePhoneApp === appKey) {
        if (appKey === "msg") {
          state.messages.forEach(m => { m.unread = false; });
        }
        syncPhoneBadges();
        return;
      }

      pa.lastTargetApp = appKey;
      pa.lastLabel = shortLabel;
      if (appKey === "msg") pa.unreadMsg = state.messages.filter(m => m && m.unread).length;
      if (appKey === "sns") pa.unreadSns = true;
      if (appKey === "stock") pa.unreadStock = true;
      if (appKey === "coin") pa.unreadCoin = true;
      if (appKey === "market") pa.unreadMarket = true;
      syncPhoneBadges();
    }

    window.clearPhoneAppAlert = (appKey) => {
      const pa = ensurePhoneAlerts();
      if (appKey === "msg") {
        state.messages.forEach(m => { m.unread = false; });
        pa.unreadMsg = 0;
      } else if (appKey === "sns") {
        pa.unreadSns = false;
      } else if (appKey === "stock") {
        pa.unreadStock = false;
      } else if (appKey === "coin") {
        pa.unreadCoin = false;
      } else if (appKey === "market") {
        pa.unreadMarket = false;
      }
      if (pa.lastTargetApp === appKey) {
        pa.lastLabel = "";
      }
      syncPhoneBadges();
    };

    window.openPhoneFromAlert = () => {
      const pa = ensurePhoneAlerts();
      const target = pa.lastLabel ? pa.lastTargetApp : activePhoneApp;
      openModal("phoneModal");
      if (target) {
        switchPhoneApp(target);
      }
    };

    window.pushPhoneNotification = pushPhoneNotification;
    window.syncPhoneBadges = syncPhoneBadges;

    function getCurrentLocation() {
      return METRO_LOCATIONS.find(l => l.id === state.hqLocationId) || METRO_LOCATIONS[0];
    }

    // 현재 플레이어가 창밖으로 보고 있는 매장 위치를 반환합니다.
    // 방문 중인 지점이 없거나 저장된 위치 ID가 유효하지 않으면 본점으로 돌아갑니다.
    function getViewingLocation() {
      const viewLocationId = state.activeViewLocationId || state.hqLocationId;
      return METRO_LOCATIONS.find(l => l.id === viewLocationId) || getCurrentLocation();
    }

    const economy = createEconomySystem({
      getState: () => state,
      getFurnitureCatalog: () => FURNITURE_CATALOG,
      getCurrentLocation,
      visitorPool: VISITOR_POOL,
      showToast,
      spawnFloatingText,
      updateHUD,
      renderPhoneApp,
      renderPosModal,
      getPendingRegularOffer: () => pendingRegularOffer,
      setPendingRegularOffer: (value) => { pendingRegularOffer = value; },
      addReputation
    });

    function calculateMenuSalePrice(menu) { return economy.calculateMenuSalePrice(menu); }
    function tickAutoBrew() { return economy.tickAutoBrew(); }
    function processCustomerOrder(customer) { return economy.processCustomerOrder(customer); }

    function advanceDayAndWeather() {
      state.day += 1;
      let seasonChanged = false;

      if ((state.day - 1) % 16 === 0) {
        state.seasonIdx = (state.seasonIdx + 1) % 4;
        seasonChanged = true;
        const s = SEASONS[state.seasonIdx];
        showToast(`${s.icon} 계절이 '${s.name}'(으)로 바뀌었습니다! (16일 주기)`, "amber");
        addReputation(-1);
      }

      const prevWeather = state.weather || "clear";
      const r = Math.random();
      if (state.seasonIdx === 3) {
        const snowThresh = prevWeather === "snow" ? 0.34 : 0.20;
        const cloudThresh = snowThresh + (prevWeather === "cloudy" ? 0.34 : 0.24);
        if (r < snowThresh) state.weather = "snow";
        else if (r < cloudThresh) state.weather = "cloudy";
        else state.weather = "clear";
      } else if (state.seasonIdx === 1) {
        const rainThresh = prevWeather === "rain" ? 0.32 : 0.20;
        const cloudThresh = rainThresh + (prevWeather === "cloudy" ? 0.32 : 0.22);
        if (r < rainThresh) state.weather = "rain";
        else if (r < cloudThresh) state.weather = "cloudy";
        else state.weather = "clear";
      } else {
        const rainThresh = prevWeather === "rain" ? 0.26 : 0.15;
        const cloudThresh = rainThresh + (prevWeather === "cloudy" ? 0.34 : 0.24);
        if (r < rainThresh) state.weather = "rain";
        else if (r < cloudThresh) state.weather = "cloudy";
        else state.weather = "clear";
      }

      SoundEngine.syncWeatherAudio();

      if (seasonChanged) {
        const loc = getCurrentLocation();
        const ownsHqBuilding = state.buildings.includes(state.hqLocationId);
        const rentCost = ownsHqBuilding ? 0 : loc.rent;

        let rentalIncome = 0;
        let dividendIncome = 0;
        state.branches.forEach(bid => {
          const bLoc = METRO_LOCATIONS.find(l => l.id === bid);
          if (bLoc) {
            const conceptMult = typeof window.getBranchConceptMultiplier === "function"
              ? window.getBranchConceptMultiplier(bid)
              : 1.0;
            rentalIncome += Math.round(bLoc.rent * 1.45 * conceptMult);
          }
        });
        state.buildings.forEach(bldId => {
          const bLoc = METRO_LOCATIONS.find(l => l.id === bldId);
          if (bLoc) rentalIncome += Math.round(bLoc.rent * 2.2);
        });
        state.stocks.forEach(st => {
          dividendIncome += Math.round(st.price * st.owned * st.div);
        });
        const passiveIncome = rentalIncome + dividendIncome;

        const netMonthly = passiveIncome - rentCost;
        state.cash += netMonthly;
        if (typeof window.recordSeasonFinance === "function") {
          window.recordSeasonFinance("rentalIncome", rentalIncome);
          window.recordSeasonFinance("dividends", dividendIncome);
          window.recordSeasonFinance("rent", -rentCost);
        }
        state.messages.unshift({
          id: `msg_month_${state.day}_${Date.now()}`,
          category: "notice",
          unread: true,
          sender: "계절·월간 정산 알림",
          time: `${state.day}일차`,
          text: `월세 -${rentCost.toLocaleString()}원 / 지점·건물·배당 +${passiveIncome.toLocaleString()}원 (순수익 ${netMonthly >= 0 ? "+" : ""}${netMonthly.toLocaleString()}원)`
        });
        pushPhoneNotification("msg", "💬 월간·계절 정산 문자");
        showToast(`📅 16일 주기 월간·계절 정산 완료! 순변동 ${netMonthly >= 0 ? "+" : ""}${netMonthly.toLocaleString()}원`, "sky");
      }
      if (seasonChanged && typeof window.settleSeasonFinance === "function") {
        window.settleSeasonFinance();
      }
    }

    function formatAmPmTime(minuteOfDay) {
      const totalMins = ((Math.floor(Number(minuteOfDay) || 0) % 1440) + 1440) % 1440;
      const h24 = Math.floor(totalMins / 60);
      const m = String(totalMins % 60).padStart(2, "0");
      const period = h24 < 12 ? "AM" : "PM";
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${period} ${String(h12).padStart(2, "0")}:${m}`;
    }

    function getWeatherLabel() {
      if (state.weather === "clear") return "☀️ 맑음";
      if (state.weather === "cloudy") return "⛅ 구름조금";
      if (state.weather === "rain") return "🌧️ 비 내림";
      return "❄️ 눈 내림";
    }

    window.toggleGameSpeed = () => {
      gameSpeed = gameSpeed === 1 ? 2 : 1;
      const btn = document.getElementById("speedToggleBtn");
      const icon = document.getElementById("speedIcon");
      const label = document.getElementById("speedLabel");
      if (btn && icon && label) {
        if (gameSpeed === 2) {
          btn.className = "bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/70 text-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow transition";
          icon.textContent = "⏩";
          label.textContent = "2x";
        } else {
          btn.className = "bg-stone-800/85 hover:bg-stone-700 border border-stone-600/50 text-stone-200 px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition";
          icon.textContent = "▶️";
          label.textContent = "1x";
        }
      }
      showToast(gameSpeed === 2 ? "⏩ 2배속 모드 활성화! 시간과 손님이 빠르게 움직입니다." : "▶️ 기본 1배속 모드로 전환되었습니다.", gameSpeed === 2 ? "amber" : "sky");
    };

    function updateHUD() {
      const loc = getCurrentLocation();
      const season = SEASONS[state.seasonIdx];
      const amPmTime = formatAmPmTime(state.minuteOfDay);

      const viewLoc = getViewingLocation();
      const isBranchView = viewLoc.id !== loc.id;
      document.getElementById("hudCafeName").textContent = state.cafeName || "내 카페";
      document.getElementById("hudLocationBadge").textContent = isBranchView
        ? `🏪 ${viewLoc.region} ${viewLoc.name} (지점 창밖)`
        : `👑 ${loc.region} ${loc.name}`;
      document.getElementById("hudSeasonWeather").innerHTML = `
        <span>${season.icon} ${season.name} · ${state.day}일차</span>
        <span>·</span>
        <span>${getWeatherLabel()}</span>
        <span>·</span>
        <span class="font-bold text-amber-200">${amPmTime}</span>
      `;
      document.getElementById("scenicBadgeText").textContent = `${season.icon} ${season.name} · ${getWeatherLabel()} (${amPmTime}) · 돌아가기`;
      document.getElementById("phoneClock").textContent = amPmTime;

      document.getElementById("hudCash").textContent = `${state.cash.toLocaleString()}원`;
      const repGrade = getReputationGrade(state.reputation);
      const repEl = document.getElementById("hudReputation");
      repEl.textContent = `★ ${state.reputation.toLocaleString()} (${repGrade})`;
      repEl.title = state.reputation >= MAX_REPUTATION
        ? "최고 평판 ★1,000 달성!"
        : `상한 ★1,000 · 현재 구간 효율 ${Math.round(getReputationGainMultiplier(state.reputation) * 100)}%`;
      const totalUnits = economy.getTotalIngredientUnits();
      const maxCap = economy.getMaxIngredientCapacity();
      const dlvCount = (state.pendingDeliveries || []).length;
      document.getElementById("hudStock").textContent = dlvCount > 0
        ? `창고 ${totalUnits}/${maxCap}잔 (🚚${dlvCount})`
        : `창고 ${totalUnits}/${maxCap}잔 · 원두∞`;
      const hiredCount = state.employees ? Object.values(state.employees).filter(Boolean).length : 0;
      document.getElementById("hudRegulars").textContent = `${hiredCount}명 · ${1 + state.branches.length}개점`;

      const autoLv = Math.max(1, state.upgrades.find(u => u.id === "auto_drip")?.level || 1);
      const autoStatusEl = document.getElementById("autoBrewStatusLabel");
      if (autoStatusEl) {
        autoStatusEl.textContent = `브루잉 머신 Lv.${autoLv} · 건당 +100 ~ 1,000원 자동 추출`;
      }

      document.getElementById("radioSeasonText").textContent = `${season.icon} ${season.name} (16일마다 계절 순환)`;
      document.getElementById("radioWeatherText").textContent = `${getWeatherLabel()}`;
      SoundEngine.syncAuto();
      syncPhoneBadges();
      if (typeof window.renderGuideQuestBanner === "function") window.renderGuideQuestBanner();
    }



// 매장 UI · POS · 배팡 스타일 카페파트너스 가구몰 · 스마트폰 앱 · 홍보
    let shopState = {
      category: "all",       // all | table | decor | rug
      search: "",
      sort: "recommended",   // recommended | priceAsc | priceDesc | bonusDesc
      rocketOnly: false,
      unownedOnly: false,
      showPlacementDrawer: false,
      selectedProductId: null
    };

    let customMenuDraft = {
      open: false,
      name: "",
      useCoffee: true,
      selectedIngredients: [],
      customPrice: ""
    };

    let marketUiState = {
      category: "all",       // all | base | syrup | fruit | topping
      search: "",
      subTab: "shop"         // shop | stock | delivery
    };

    window.toggleScenicMode = (enable) => {
      scenicMode = enable;
      document.body.classList.toggle("scenic-mode", enable);
    };

    window.openModal = (id) => {
      document.getElementById(id).classList.remove("hidden");
      if (id === "posModal") renderPosModal();
      if (id === "phoneModal") {
        if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert(activePhoneApp);
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

    window.setShopCategory = (cat) => {
      shopState.category = cat;
      renderPosModal();
    };

    window.setShopSearch = (val) => {
      shopState.search = val;
      renderPosModal();
      const inp = document.getElementById("baepangSearchInput");
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    };

    window.setShopSort = (val) => {
      shopState.sort = val;
      renderPosModal();
    };

    window.toggleShopFilter = (key) => {
      shopState[key] = !shopState[key];
      renderPosModal();
    };

    window.togglePlacementDrawer = () => {
      shopState.showPlacementDrawer = !shopState.showPlacementDrawer;
      renderPosModal();
    };

    window.openProductDetail = (fid) => {
      shopState.selectedProductId = fid;
      renderPosModal();
    };

    window.closeProductDetail = () => {
      shopState.selectedProductId = null;
      renderPosModal();
    };

    function renderStarRating(rating) {
      const full = Math.floor(rating);
      return "★".repeat(full) + (rating - full >= 0.5 ? "½" : "");
    }

    function renderBaepangFurnitureMall() {
      ensureFurnitureState();

      const ownedTables = FURNITURE_CATALOG.filter(f => f.category === "table" && state.ownedFurniture.includes(f.id));
      const ownedDecors = FURNITURE_CATALOG.filter(f => f.category === "decor" && state.ownedFurniture.includes(f.id));
      const ownedRugs = FURNITURE_CATALOG.filter(f => f.category === "rug" && state.ownedFurniture.includes(f.id));

      // 필터 및 정렬 적용
      let filtered = FURNITURE_CATALOG.filter(item => {
        if (shopState.category !== "all" && item.category !== shopState.category) return false;
        if (shopState.rocketOnly && !item.rocket) return false;
        if (shopState.unownedOnly && state.ownedFurniture.includes(item.id)) return false;
        if (shopState.search.trim()) {
          const q = shopState.search.trim().toLowerCase();
          const hay = `${item.name} ${item.brand || ""} ${item.desc} ${item.badge || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      if (shopState.sort === "priceAsc") {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
      } else if (shopState.sort === "priceDesc") {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
      } else if (shopState.sort === "bonusDesc") {
        filtered = [...filtered].sort((a, b) => b.tipBonus - a.tipBonus);
      }

      const detailItem = shopState.selectedProductId
        ? FURNITURE_CATALOG.find(f => f.id === shopState.selectedProductId)
        : null;

      // 상품 상세 모달 뷰 (배팡 상품 상세페이지 감성)
      const detailOverlayHtml = detailItem ? (() => {
        const owned = state.ownedFurniture.includes(detailItem.id);
        const catName = detailItem.category === "table" ? "테이블·소파" : detailItem.category === "decor" ? "조명·플랜트·오브제" : "홀 러그·카펫";
        return `
          <div class="bg-white text-slate-900 rounded-2xl border-2 border-[#346aff] shadow-xl overflow-hidden mb-3">
            <div class="bg-[#346aff] text-white px-3.5 py-2 flex items-center justify-between">
              <span class="text-xs font-black tracking-tight">Baepang <span class="text-amber-300">카페파트너스</span> 상품상세</span>
              <button onclick="closeProductDetail()" class="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full font-bold">← 목록으로</button>
            </div>
            <div class="p-3.5 space-y-2.5">
              <div class="flex gap-3 items-start">
                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-amber-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 relative">
                  <span class="text-3xl">${detailItem.icon || "🛋️"}</span>
                  <span class="text-[9px] font-extrabold text-slate-500 mt-1">${catName}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] font-bold text-[#346aff]">${detailItem.brand || "메트로리빙"} &gt;</span>
                    ${detailItem.badge ? `<span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">${detailItem.badge}</span>` : ""}
                  </div>
                  <h4 class="font-black text-sm text-slate-900 mt-0.5 leading-snug">${detailItem.name}</h4>
                  <div class="flex items-center gap-1.5 text-[11px] mt-1">
                    <span class="text-amber-400 font-black">${renderStarRating(detailItem.rating || 4.8)}</span>
                    <span class="font-bold text-slate-700">${(detailItem.rating || 4.8).toFixed(1)}</span>
                    <span class="text-slate-400">(${(detailItem.reviews || 120).toLocaleString()}개 상품평)</span>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                ${detailItem.price > 0 ? `
                  <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span class="font-extrabold text-rose-600">${detailItem.discountRate || 20}%</span>
                    <span class="line-through">${(detailItem.originalPrice || Math.round(detailItem.price * 1.25)).toLocaleString()}원</span>
                    <span class="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">와우회원가</span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-lg font-black text-[#ae0000]">${detailItem.price.toLocaleString()}<span class="text-xs font-bold">원</span></span>
                    <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e8f1ff] text-[#0073e9] text-[10px] font-black">🚀 로켓설치 · 내일(새벽) 도착보장</span>
                  </div>
                ` : `
                  <div class="text-base font-black text-emerald-700">0원 (개업 기본 제공 상품)</div>
                `}
                <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div class="bg-white rounded-lg px-2 py-1 border border-slate-200">
                    <span class="text-slate-500">메뉴 단가 보너스</span>
                    <div class="font-black text-[#0073e9]">+${Math.round((detailItem.tipBonus || 0) * 100)}% 상승</div>
                  </div>
                  <div class="bg-white rounded-lg px-2 py-1 border border-slate-200">
                    <span class="text-slate-500">매장 평판 상승</span>
                    <div class="font-black text-amber-600">+${detailItem.rep || 0} 점</div>
                  </div>
                </div>
              </div>

              <p class="text-xs text-slate-700 leading-relaxed bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">
                📋 <b>상품 요약:</b> ${detailItem.desc}
              </p>

              <div class="flex gap-2">
                ${owned
                  ? `<button disabled class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs">✅ 구매 완료 (창고 보유중 · 배치 가능)</button>`
                  : `<button onclick="buyFurniture('${detailItem.id}', event)" class="flex-1 py-2.5 rounded-xl bg-[#346aff] hover:bg-[#2356e8] text-white font-black text-xs shadow">🚀 로켓설치 바로구매 (${detailItem.price.toLocaleString()}원)</button>`
                }
              </div>
            </div>
          </div>
        `;
      })() : "";

      // 홀 가구 배치 패널 (접이식 토글)
      const placementPanelHtml = shopState.showPlacementDrawer ? `
        <div class="bg-slate-900 text-white border-2 border-[#346aff] rounded-2xl p-3 space-y-2.5 mb-3 shadow-lg">
          <div class="flex items-center justify-between gap-2">
            <span class="font-extrabold text-amber-300 text-xs">🏠 내 카페 홀 실시간 가구 배치 (총 11개 구역)</span>
            <button onclick="autoFillBestFurniture()" class="px-2.5 py-1 rounded-lg bg-[#346aff] hover:bg-blue-500 text-[10px] font-black text-white shrink-0">✨ 보유 최고급 자동배치</button>
          </div>

          <div class="text-[10px] text-slate-300 font-bold">🪟 안쪽 창가 라인 테이블 (3개 존)</div>
          <div class="grid grid-cols-3 gap-1.5 text-[11px]">
            ${[
              { key: "slotLeft", label: "창가 왼쪽" },
              { key: "slotCenter", label: "창가 중앙" },
              { key: "slotRight", label: "창가 오른쪽" }
            ].map(s => `
              <div class="bg-slate-800 border border-slate-700 rounded-xl p-2">
                <div class="text-slate-400 text-[10px] mb-1">${s.label}</div>
                <select onchange="placeFurniture('${s.key}', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-1.5 py-1 text-[11px] text-amber-100 outline-none">
                  <option value="">(비워두기)</option>
                  ${ownedTables.map(t => `<option value="${t.id}" ${state.placedFurniture[s.key] === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
                </select>
              </div>
            `).join("")}
          </div>

          <div class="text-[10px] text-slate-300 font-bold">🪑 앞쪽 홀 플로어 테이블 (3개 존)</div>
          <div class="grid grid-cols-3 gap-1.5 text-[11px]">
            ${[
              { key: "slotFrontLeft", label: "앞쪽 왼쪽" },
              { key: "slotFrontCenter", label: "앞쪽 중앙" },
              { key: "slotFrontRight", label: "앞쪽 오른쪽" }
            ].map(s => `
              <div class="bg-slate-800 border border-slate-700 rounded-xl p-2">
                <div class="text-slate-400 text-[10px] mb-1">${s.label}</div>
                <select onchange="placeFurniture('${s.key}', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-1.5 py-1 text-[11px] text-amber-100 outline-none">
                  <option value="">(비워두기)</option>
                  ${ownedTables.map(t => `<option value="${t.id}" ${state.placedFurniture[s.key] === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
                </select>
              </div>
            `).join("")}
          </div>

          <div class="text-[10px] text-slate-300 font-bold">🌿 코너 소품·조명·오브제 (4개 존) & 메인 러그</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px]">
            ${[
              { key: "decorLeft", label: "안쪽 좌측 코너" },
              { key: "decorRight", label: "안쪽 우측 코너" },
              { key: "decorFrontLeft", label: "앞쪽 좌측 포인트" },
              { key: "decorFrontRight", label: "앞쪽 우측 포인트" }
            ].map(s => `
              <div class="bg-slate-800 border border-slate-700 rounded-xl p-2">
                <div class="text-slate-400 text-[10px] mb-1">${s.label}</div>
                <select onchange="placeFurniture('${s.key}', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-1.5 py-1 text-[11px] text-emerald-200 outline-none">
                  <option value="">(비워두기)</option>
                  ${ownedDecors.map(d => `<option value="${d.id}" ${state.placedFurniture[s.key] === d.id ? "selected" : ""}>${d.name}</option>`).join("")}
                </select>
              </div>
            `).join("")}
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-2 text-[11px]">
            <div class="text-slate-400 text-[10px] mb-1">🧶 홀 중앙 메인 러그 · 카펫</div>
            <select onchange="placeFurniture('hallRug', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-2 py-1 text-[11px] text-sky-200 outline-none">
              <option value="">(러그 없이 원목 마루만 표시)</option>
              ${ownedRugs.map(r => `<option value="${r.id}" ${state.placedFurniture.hallRug === r.id ? "selected" : ""}>${r.name}</option>`).join("")}
            </select>
          </div>
        </div>
      ` : "";

      // 배팡 헤더 & 검색바 & 카테고리 바
      const baepangHeaderHtml = `
        <div class="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-md overflow-hidden mb-3">
          <!-- 상단 로고 & 보유가구 배치 버튼 -->
          <div class="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-slate-100">
            <div class="flex items-center gap-1.5">
              <span class="font-black text-base tracking-tighter">
                <span class="text-[#5c2d16]">Bae</span><span class="text-[#e60012]">p</span><span class="text-[#ff9900]">a</span><span class="text-[#8cc63f]">n</span><span class="text-[#00a0e9]">g</span>
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#346aff] text-white">카페파트너스</span>
              <span class="text-[10px] text-slate-500 font-bold hidden sm:inline">보유 ${state.ownedFurniture.length}/${FURNITURE_CATALOG.length}종</span>
            </div>
            <button onclick="togglePlacementDrawer()"
              class="px-2.5 py-1.5 rounded-xl ${shopState.showPlacementDrawer ? "bg-slate-900 text-amber-300" : "bg-[#346aff] hover:bg-blue-600 text-white"} text-[11px] font-black flex items-center gap-1 shadow-sm transition">
              <span>🏠</span>
              <span>${shopState.showPlacementDrawer ? "배치창 닫기" : `홀 가구배치 (${state.ownedFurniture.length}보유)`}</span>
            </button>
          </div>

          <!-- 배팡 블루 검색창 -->
          <div class="px-3 py-2 bg-slate-50">
            <div class="flex items-center bg-white border-2 border-[#346aff] rounded-xl px-2.5 py-1.5 shadow-inner">
              <span class="text-[#346aff] text-sm mr-1.5">🔍</span>
              <input id="baepangSearchInput" type="text" value="${shopState.search.replace(/"/g, "&quot;")}"
                oninput="setShopSearch(this.value)"
                placeholder="카페 인테리어 가구 215종 검색 (예: 마블, 소파, 피아노, 벚꽃...)"
                class="w-full text-xs text-slate-900 placeholder-slate-400 outline-none bg-transparent font-medium" />
              ${shopState.search ? `<button onclick="setShopSearch('')" class="text-slate-400 hover:text-slate-700 text-xs font-bold px-1">✕</button>` : ""}
            </div>
          </div>

          <!-- 카테고리 탭 -->
          <div class="grid grid-cols-4 border-t border-slate-200 bg-white text-[11px] font-extrabold">
            ${[
              { id: "all", label: `전체 (${FURNITURE_CATALOG.length})` },
              { id: "table", label: `테이블·소파 (${FURNITURE_CATALOG.filter(f => f.category === "table").length})` },
              { id: "decor", label: `조명·소품 (${FURNITURE_CATALOG.filter(f => f.category === "decor").length})` },
              { id: "rug", label: `러그·카펫 (${FURNITURE_CATALOG.filter(f => f.category === "rug").length})` }
            ].map(c => `
              <button onclick="setShopCategory('${c.id}')"
                class="py-2 text-center border-b-2 transition ${shopState.category === c.id ? "border-[#346aff] text-[#346aff] bg-blue-50/50" : "border-transparent text-slate-600 hover:bg-slate-50"}">
                ${c.label}
              </button>
            `).join("")}
          </div>

          <!-- 로켓 필터 & 정렬 바 -->
          <div class="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5 flex-wrap text-[11px]">
            <div class="flex items-center gap-1.5">
              <button onclick="toggleShopFilter('rocketOnly')"
                class="px-2 py-1 rounded-full border font-extrabold transition ${shopState.rocketOnly ? "bg-[#e8f1ff] border-[#0073e9] text-[#0073e9]" : "bg-white border-slate-300 text-slate-600"}">
                🚀 로켓설치만
              </button>
              <button onclick="toggleShopFilter('unownedOnly')"
                class="px-2 py-1 rounded-full border font-extrabold transition ${shopState.unownedOnly ? "bg-amber-100 border-amber-500 text-amber-800" : "bg-white border-slate-300 text-slate-600"}">
                🛒 미보유만
              </button>
            </div>
            <select onchange="setShopSort(this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none">
              <option value="recommended" ${shopState.sort === "recommended" ? "selected" : ""}>배팡 랭킹순</option>
              <option value="priceAsc" ${shopState.sort === "priceAsc" ? "selected" : ""}>낮은 가격순</option>
              <option value="priceDesc" ${shopState.sort === "priceDesc" ? "selected" : ""}>높은 가격순</option>
              <option value="bonusDesc" ${shopState.sort === "bonusDesc" ? "selected" : ""}>매출보너스 높은순</option>
            </select>
          </div>
        </div>
      `;

      // 배팡 2열 그리드 상품 카드 리스트
      const productGridHtml = filtered.length === 0 ? `
        <div class="bg-white text-slate-600 rounded-2xl p-6 text-center text-xs font-bold border border-slate-200">
          검색 조건에 맞는 가구가 없습니다. 검색어나 필터를 초기화해 보세요!
        </div>
      ` : `
        <div class="grid grid-cols-2 gap-2.5">
          ${filtered.map(f => {
            const owned = state.ownedFurniture.includes(f.id);
            const bonusPct = Math.round((f.tipBonus || 0) * 100);
            const catLabel = f.category === "table" ? "테이블" : f.category === "decor" ? "소품·조명" : "러그";
            return `
              <div class="bg-white text-slate-900 rounded-2xl border ${owned ? "border-emerald-500 ring-1 ring-emerald-400/40" : "border-slate-200 hover:border-[#346aff]"} shadow-sm overflow-hidden flex flex-col justify-between transition">
                <!-- 상품 썸네일 영역 (터치 시 상세보기) -->
                <div onclick="openProductDetail('${f.id}')" class="cursor-pointer">
                  <div class="relative h-24 bg-gradient-to-br from-slate-100 via-amber-50/60 to-slate-100 flex items-center justify-center border-b border-slate-100">
                    <span class="text-4xl drop-shadow-sm">${f.icon || "🛋️"}</span>
                    ${f.badge ? `<span class="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-sm">${f.badge}</span>` : ""}
                    <span class="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-white">${catLabel}</span>
                    ${bonusPct > 0 ? `<span class="absolute bottom-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">단가 +${bonusPct}%</span>` : ""}
                  </div>

                  <!-- 상품 정보 영역 -->
                  <div class="p-2.5 pb-1.5">
                    <div class="text-[10px] text-slate-400 font-bold truncate">${f.brand || "메트로홈"}</div>
                    <div class="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug min-h-[2rem] mt-0.5">${f.name}</div>

                    <!-- 할인율 & 배팡가 -->
                    <div class="mt-1">
                      ${f.price > 0 ? `
                        <div class="flex items-center gap-1 text-[10px] leading-none">
                          <span class="font-black text-rose-600">${f.discountRate || 20}%</span>
                          <span class="text-slate-400 line-through">${(f.originalPrice || Math.round(f.price * 1.25)).toLocaleString()}원</span>
                        </div>
                        <div class="font-black text-sm text-[#ae0000] leading-tight mt-0.5">
                          ${f.price.toLocaleString()}<span class="text-[11px] font-bold">원</span>
                        </div>
                      ` : `
                        <div class="font-black text-sm text-emerald-700 leading-tight mt-1">기본 무료제공</div>
                      `}
                    </div>

                    <!-- 로켓설치 배지 -->
                    <div class="flex items-center gap-1 mt-1">
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e8f1ff] text-[#0073e9] text-[9px] font-black">🚀 로켓설치</span>
                      <span class="text-[9px] text-emerald-700 font-bold">내일 도착</span>
                    </div>

                    <!-- 별점 & 리뷰 수 -->
                    <div class="flex items-center gap-1 text-[10px] mt-1">
                      <span class="text-amber-400 font-black">★★★★★</span>
                      <span class="text-slate-500 font-semibold">(${(f.reviews || 100).toLocaleString()})</span>
                    </div>
                  </div>
                </div>

                <!-- 하단 구매/배치 버튼 -->
                <div class="px-2.5 pb-2.5 pt-1">
                  ${owned
                    ? `<button onclick="openQuickPlaceFor('${f.id}')" class="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition">✅ 보유중 · 홀에 배치</button>`
                    : `<button onclick="buyFurniture('${f.id}', event)" class="w-full py-1.5 rounded-xl bg-[#346aff] hover:bg-blue-600 text-white text-[11px] font-black shadow-sm transition">🛒 로켓설치 구매</button>`
                  }
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      economy.ensureStorageUpgradeEntry();
      // 매장 설비 업그레이드 섹션
      const upgradesHtml = `
        <div class="bg-stone-950 border border-stone-800 rounded-2xl p-3 mt-3 space-y-2">
          <div class="font-extrabold text-xs text-sky-300">⚙️ 매장 자동화 · 추출 설비 업그레이드</div>
          ${state.upgrades.map((u, idx) => {
            const cost = Math.round(u.baseCost * Math.pow(1.45, u.level));
            const isMax = u.level >= u.max;
            return `
              <div class="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div>
                  <div class="font-extrabold text-white text-xs">${u.name} <span class="text-amber-400 text-[11px]">Lv.${u.level}/${u.max}</span></div>
                  <div class="text-[11px] text-stone-400 mt-0.5">${u.desc}</div>
                </div>
                ${isMax
                  ? `<span class="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-400 text-[11px] font-bold shrink-0">MAX</span>`
                  : `<button onclick="buyUpgrade(${idx})" class="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold shrink-0">${cost.toLocaleString()}원</button>`
                }
              </div>
            `;
          }).join("")}
        </div>
      `;

      return baepangHeaderHtml + detailOverlayHtml + placementPanelHtml + productGridHtml + upgradesHtml;
    }

    window.openQuickPlaceFor = (fid) => {
      ensureFurnitureState();
      const item = FURNITURE_CATALOG.find(f => f.id === fid);
      if (!item) return;
      if (item.category === "table") {
        const tableKeys = ["slotLeft", "slotCenter", "slotRight", "slotFrontLeft", "slotFrontCenter", "slotFrontRight"];
        const empty = tableKeys.find(k => !state.placedFurniture[k]);
        if (empty) {
          state.placedFurniture[empty] = fid;
          showToast(`🚀 '${item.name}' 빈 테이블 구역에 즉시 배치 완료!`, "emerald");
          updateHUD();
          renderPosModal();
          saveCloudProgress(false);
          return;
        }
      } else if (item.category === "decor") {
        const decorKeys = ["decorLeft", "decorRight", "decorFrontLeft", "decorFrontRight"];
        const empty = decorKeys.find(k => !state.placedFurniture[k]);
        if (empty) {
          state.placedFurniture[empty] = fid;
          showToast(`🚀 '${item.name}' 코너 포인트에 즉시 배치 완료!`, "emerald");
          updateHUD();
          renderPosModal();
          saveCloudProgress(false);
          return;
        }
      } else if (item.category === "rug") {
        state.placedFurniture.hallRug = fid;
        showToast(`🚀 '${item.name}' 홀 중앙 러그로 교체 완료!`, "emerald");
        updateHUD();
        renderPosModal();
        saveCloudProgress(false);
        return;
      }
      shopState.showPlacementDrawer = true;
      renderPosModal();
      const box = document.getElementById("posContent");
      if (box) box.scrollTop = 0;
      showToast("🏠 상단 배치창에서 원하는 구역을 선택해 교체하세요!", "sky");
    };

    function renderPosModal() {
      const box = document.getElementById("posContent");
      const subSwitcher = document.getElementById("mobilePosSubSwitcher");
      if (subSwitcher) {
        subSwitcher.style.display = activePosTab === "menu" ? "" : "none";
      }
      if (activePosTab === "menu") {
        economy.ensureIngredientState();
        const previewEval = customMenuDraft.selectedIngredients.length > 0
          ? evaluateCustomRecipe(customMenuDraft.selectedIngredients, customMenuDraft.useCoffee)
          : null;

        const builderHtml = `
          <div class="bg-gradient-to-br from-stone-950 via-amber-950/25 to-stone-950 border border-amber-500/50 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                  <span>🧪 나만의 시그니처 메뉴 레시피 연구소</span>
                </div>
                <div class="text-[11px] text-stone-400 mt-0.5">원두는 항상 상시 구비! 재료를 조합해 출시하면 SNS 대박 유행 또는 혹평 판매부진이 갈립니다.</div>
              </div>
              <button onclick="toggleCustomMenuBuilder()"
                class="px-3 py-1.5 rounded-xl ${customMenuDraft.open ? "bg-stone-800 text-stone-300" : "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950"} text-xs font-black shrink-0 shadow">
                ${customMenuDraft.open ? "접기 ▲" : "+ 직접 만들기"}
              </button>
            </div>

            ${customMenuDraft.open ? `
              <div class="pt-2 border-t border-stone-800 space-y-2.5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] font-bold text-amber-200 mb-1">1. 신메뉴 이름</label>
                    <input id="customMenuNameInput" type="text" maxlength="18"
                      value="${customMenuDraft.name.replace(/"/g, "&quot;")}"
                      oninput="setCustomMenuName(this.value)"
                      placeholder="예: 소금크림 피스타치오 라떼"
                      class="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-amber-200 mb-1">2. 기본 에스프레소 원두</label>
                    <button type="button" onclick="toggleCustomMenuCoffee()"
                      class="w-full py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition ${customMenuDraft.useCoffee ? "bg-amber-950/60 border-amber-500 text-amber-200" : "bg-stone-900 border-stone-700 text-stone-400"}">
                      <span>☕ 에스프레소 샷 ${customMenuDraft.useCoffee ? "포함 (상시무료)" : "미포함 (논커피)"}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/40">${customMenuDraft.useCoffee ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[11px] font-bold text-amber-200">3. 들어갈 재료 선택 (최대 4가지 · 보유 재고 표시)</label>
                    <span class="text-[10px] text-stone-400">${customMenuDraft.selectedIngredients.length}/4개 선택됨</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    ${INGREDIENT_CATALOG.map(ing => {
                      const picked = customMenuDraft.selectedIngredients.includes(ing.id);
                      const stockQty = state.ingredientStock[ing.id] || 0;
                      return `
                        <button type="button" onclick="toggleCustomIngredient('${ing.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between gap-1 ${picked ? "bg-amber-500/20 border-amber-400 text-amber-100" : "bg-stone-900/90 border-stone-800 hover:border-stone-600 text-stone-300"}">
                          <div class="min-w-0">
                            <div class="text-[11px] font-extrabold truncate">${ing.icon} ${ing.name}</div>
                            <div class="text-[10px] ${stockQty > 0 ? "text-emerald-400" : "text-rose-400"}">창고 ${stockQty}잔</div>
                          </div>
                          <span class="text-xs font-black shrink-0">${picked ? "✓" : "+"}</span>
                        </button>
                      `;
                    }).join("")}
                  </div>
                </div>

                ${previewEval ? `
                  <div class="bg-stone-900/95 border ${previewEval.tier === "hit" ? "border-emerald-500/60" : previewEval.tier === "flop" ? "border-rose-500/60" : "border-sky-500/50"} rounded-xl p-2.5 space-y-1.5">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="text-xs font-black ${previewEval.tier === "hit" ? "text-emerald-300" : previewEval.tier === "flop" ? "text-rose-300" : "text-sky-300"}">
                        🔬 시음 테스트 결과: ${previewEval.badge}
                      </span>
                      <span class="text-[11px] font-bold text-stone-400">잔당 원가 약 ${previewEval.unitCost.toLocaleString()}원</span>
                    </div>
                    <p class="text-[11px] text-stone-300 leading-relaxed">${previewEval.summary}</p>
                    <div class="flex items-center gap-2 pt-1">
                      <label class="text-[11px] font-bold text-amber-200 shrink-0">판매가 설정:</label>
                      <input id="customMenuPriceInput" type="number" step="100" min="1500" max="15000"
                        value="${customMenuDraft.customPrice || previewEval.suggestedPrice}"
                        oninput="setCustomMenuPrice(this.value)"
                        class="w-28 bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-extrabold text-emerald-300 outline-none" />
                      <span class="text-[10px] text-stone-400">(추천 ${previewEval.suggestedPrice.toLocaleString()}원)</span>
                    </div>
                  </div>
                ` : `
                  <div class="text-[11px] text-stone-400 bg-stone-900/70 rounded-xl p-2.5 text-center">
                    위에서 재료를 1~4가지 터치하면 바리스타 시음 예상과 추천 판매가가 즉시 분석됩니다!
                  </div>
                `}

                <div id="customMenuFeedback" class="hidden rounded-xl border border-rose-500/60 bg-rose-950/80 px-3 py-2 text-xs font-bold text-rose-200"></div>

                <button type="button" onclick="submitCustomMenu()"
                  class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 transition text-stone-950 font-black text-xs shadow-lg">
                  ✨ 레시피 확정 및 신메뉴 출시하기 (개발비 150,000원)
                </button>
              </div>
            ` : ""}
          </div>
        `;

        const menuListHtml = state.menus.map((m, idx) => {
          const realPrice = calculateMenuSalePrice(m);
          const reqs = m.ingredients || [];
          const canMake = economy.canMakeMenu(m);
          const reqBadges = reqs.length === 0
            ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/40">☕ 상시 원두만 사용</span>`
            : reqs.map(ingId => {
                const info = getIngredientById(ingId);
                const qty = state.ingredientStock[ingId] || 0;
                return `<button onclick="selectOrderIngredient('${ingId}')" class="text-[10px] px-1.5 py-0.5 rounded ${qty > 0 ? "bg-stone-900 text-stone-200 border border-stone-700" : "bg-rose-950/80 text-rose-300 border border-rose-600/50"}">${info ? info.icon + info.name : ingId} (${qty}잔) · 발주</button>`;
              }).join(" ");

          return `
            <div class="bg-stone-950 border ${m.isTrending ? "border-pink-500/70 ring-1 ring-pink-500/30" : m.tier === "flop" ? "border-rose-900/60" : "border-stone-800"} rounded-2xl p-3 space-y-1.5">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-extrabold text-amber-200 flex items-center gap-1.5 flex-wrap">
                    <span>${m.name}</span>
                    ${m.unlocked ? `<span class="text-emerald-400 text-xs">(${realPrice.toLocaleString()}원)</span>` : ""}
                    ${m.isTrending ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-black">🔥 SNS 유행중</span>` : ""}
                    ${m.isCustom && m.tierBadge ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">${m.tierBadge}</span>` : ""}
                  </div>
                  <div class="text-[11px] text-stone-400 mt-0.5">${m.desc}</div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  ${m.unlocked
                    ? `<span class="px-2.5 py-1 rounded-xl ${canMake ? "bg-emerald-950 text-emerald-300 border border-emerald-700/40" : "bg-rose-950 text-rose-300 border border-rose-700/40"} text-xs font-bold">${canMake ? "판매중" : "재료부족"}</span>`
                    : `<button onclick="unlockMenu(${idx})" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold">개발 ${m.cost.toLocaleString()}원</button>`
                  }
                  ${m.isCustom ? `<button onclick="deleteCustomMenu('${m.id}')" title="메뉴 내리기" class="px-2 py-1 rounded-xl bg-stone-800 hover:bg-rose-900 text-stone-400 hover:text-white text-xs font-bold">✕</button>` : ""}
                </div>
              </div>
              <div class="flex items-center justify-between flex-wrap gap-1 pt-1 border-t border-stone-900">
                <div class="flex flex-wrap gap-1">${reqBadges}</div>
                ${m.unlocked ? `<span class="text-[10px] text-stone-500">누적 판매 ${m.soldCount || 0}잔</span>` : ""}
              </div>
            </div>
          `;
        }).join("");

        box.innerHTML = `<div class="pos-management-grid"><div class="pos-menu-column">${builderHtml}${menuListHtml}</div>${renderPosOrderPanel()}</div>`;
      } else if (activePosTab === "staff") {
        box.innerHTML = renderBaepangFurnitureMall();
      } else if (activePosTab === "regulars") {
        box.innerHTML = renderCreatorReviewPanel();
      } else {
        box.innerHTML = `
          <div class="bg-stone-950 border border-amber-800/40 rounded-2xl p-3 text-xs text-stone-300 mb-2 leading-relaxed">
            수도권의 수많은 일반 손님 중 <b>① 누적 재방문 횟수</b>, <b>② 매장 최소 평판</b>, <b>③ 최애 시그니처 메뉴 개발</b> 조건을 모두 충족해야 VIP 단골로 승격됩니다. (보유 ${state.regulars.length}/8명)
          </div>
          ${VISITOR_POOL.map(v => {
            const visits = state.visitorCounts[v.id] || 0;
            const isReg = state.regulars.includes(v.id);
            const minRep = v.minRep || 30;
            const repOk = state.reputation >= minRep;
            const menuOk = !v.favMenuId || Boolean(state.menus.find(m => m.id === v.favMenuId && m.unlocked));
            return `
              <div class="bg-stone-950 border ${isReg ? "border-amber-500/60" : "border-stone-800"} rounded-2xl p-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-2xl shrink-0">${v.avatar}</span>
                  <div class="min-w-0">
                    <div class="font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                      <span>${v.name}</span>
                      ${isReg ? `<span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">💖 VIP 단골</span>` : ""}
                    </div>
                    <div class="text-[11px] text-amber-300/90 mt-0.5">${v.perk}</div>
                    <div class="flex flex-wrap gap-1 mt-1 text-[10px]">
                      <span class="px-1.5 py-0.5 rounded ${repOk ? "bg-emerald-950 text-emerald-300" : "bg-stone-900 text-stone-400"}">평판 ★${minRep} ${repOk ? "✓" : ""}</span>
                      <span class="px-1.5 py-0.5 rounded ${menuOk ? "bg-emerald-950 text-emerald-300" : "bg-stone-900 text-stone-400"}">${v.fav} ${menuOk ? "✓" : "미개발"}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-xs font-extrabold ${isReg ? "text-amber-300" : "text-sky-300"}">${visits} / ${v.neededVisits}회</div>
                  <div class="text-[10px] text-stone-500 mt-0.5">누적 방문</div>
                </div>
              </div>
            `;
          }).join("")}
        `;
      }
    }


    function ensureFurnitureState() {
      if (!state.ownedFurniture) state.ownedFurniture = ["table_wood_2", "rug_warm_amber"];
      if (!state.ownedFurniture.includes("rug_warm_amber")) state.ownedFurniture.push("rug_warm_amber");
      if (!state.placedFurniture) {
        state.placedFurniture = {
          slotLeft: "table_wood_2",
          slotCenter: "table_wood_2",
          slotRight: "table_wood_2",
          slotFrontLeft: "table_wood_2",
          slotFrontCenter: null,
          slotFrontRight: "table_wood_2",
          decorLeft: null,
          decorRight: null,
          decorFrontLeft: null,
          decorFrontRight: null,
          hallRug: "rug_warm_amber"
        };
      }
      if (!("slotFrontLeft" in state.placedFurniture)) state.placedFurniture.slotFrontLeft = "table_wood_2";
      if (!("slotFrontCenter" in state.placedFurniture)) state.placedFurniture.slotFrontCenter = null;
      if (!("slotFrontRight" in state.placedFurniture)) state.placedFurniture.slotFrontRight = "table_wood_2";
      if (!("decorFrontLeft" in state.placedFurniture)) state.placedFurniture.decorFrontLeft = null;
      if (!("decorFrontRight" in state.placedFurniture)) state.placedFurniture.decorFrontRight = null;
      if (!("hallRug" in state.placedFurniture)) state.placedFurniture.hallRug = "rug_warm_amber";
    }


    // ==================== 인터랙티브 문자 이벤트 & 대응 처리 ====================

    // ==================== 초보자 튜토리얼 & '?' 도움말 시스템 ====================
    const TUTORIAL_STEPS = [
      {
        icon: "☕",
        badge: "기본 운영 · 상단 HUD",
        title: "1. 카페 개업과 매장 핵심 지표",
        summary: "손님이 찾아와 음료를 주문하면 자동으로 매출과 평판이 쌓입니다.",
        points: [
          { icon: "💰", title: "보유 자금 & 월말 정산", desc: "매 28일차마다 본점 월세가 빠져나가고, 지점·건물 임대수익과 주식 배당금이 정산됩니다." },
          { icon: "★", title: "매장 평판 (최대 ★1,000)", desc: "기본 음료만으로는 평판이 천천히 오릅니다. 시그니처·제철 메뉴와 좋은 리뷰를 쌓아 미식 평가단 심사를 열어보세요." },
          { icon: "⏩", title: "1x / 2x 배속 & 🪟 감상 모드", desc: "상단 버튼으로 시간 속도를 2배로 높이거나, UI를 숨기고 창밖 풍경과 카페를 감상할 수 있습니다." }
        ],
        tip: "초반에 지급되는 하우스 아메리카노는 본사 원두가 무료로 상시 공급되어 재료가 떨어지지 않습니다!"
      },
      {
        icon: "🧾",
        badge: "POS & 배팡 상점",
        title: "2. 신메뉴 개발 · 가구 배치 · 설비 강화",
        summary: "하단 [POS·메뉴]와 [배팡 상점]에서 카페의 수익성과 매력을 키우세요.",
        points: [
          { icon: "🍹", title: "기본 메뉴 해금 & 나만의 레시피", desc: "POS에서 라떼·아인슈페너를 열거나, 재료를 직접 조합해 나만의 신메뉴를 출시할 수 있습니다. 황금 레시피는 SNS 떡상 확률이 높습니다!" },
          { icon: "🪑", title: "가구 구매 & 홀 배치", desc: "배팡 상점에서 테이블·소품·러그를 구매해 배치하면 매장 평판과 팁 보너스가 올라갑니다." },
          { icon: "⚙️", title: "자동 추출 & 정밀 그라인더", desc: "브루잉 머신은 자동으로 수익을 벌어주고, 정밀 그라인더는 모든 메뉴 판매 단가를 올려줍니다." }
        ],
        tip: "궁합이 최악인 실패 레시피(flop)를 팔면 손님 혹평으로 평판이 깎이니 신중하게 조합해 보세요."
      },
      {
        icon: "📦",
        badge: "POS · 재료발주 & 자동 구독",
        title: "3. 메뉴와 식자재를 함께 운영",
        summary: "POS 우측 발주 패널에서 부족 재료를 바로 주문하고, 태블릿에서 자동 보충 구독을 설정하세요.",
        points: [
          { icon: "🧊", title: "전체 창고 한도 폐지", desc: "전체 용량 제한 없이 재료마다 최대 80잔까지 보유할 수 있습니다." },
          { icon: "🔁", title: "재료별 자동 보충 구독", desc: "태블릿 발주·구독 탭에서 기준 재고를 정하면 자동 주문합니다. 계절마다 구독료가 정산됩니다." },
          { icon: "🚚", title: "즉시 발주와 배송", desc: "POS에서 메뉴 재료 배지를 누르면 발주 패널이 해당 재료를 선택합니다. 결제하면 배송으로 입고됩니다." }
        ],
        tip: "3만 원 이상 한 번에 발주하면 배송비(2,500원)가 무료입니다."
      },
      {
        icon: "💬",
        badge: "스마트폰 · 문자함 & 카페그램",
        title: "4. 문자 이벤트 대응과 SNS 홍보",
        summary: "스마트폰 버튼 위에 뜨는 알림 라벨을 보고 새 소식에 바로 대응하세요.",
        points: [
          { icon: "🕵️", title: "문자 눈치게임 (선택형 보너스)", desc: "문자는 꼭 확인하지 않아도 불이익이 없지만, 발신번호와 내용을 보고 진짜 지원금과 사칭 스미싱을 구별하거나 단체 의뢰를 수락하면 쏠쏠한 보너스를 얻습니다." },
          { icon: "📦", title: "단체 납품 의뢰 & 쿠폰 답장", desc: "회사 단체 주문을 수락해 기한 내 판매량을 채우면 큰 보수를 받고, 손님 문의에 쿠폰을 보내면 평판 보너스를 얻습니다." },
          { icon: "📸", title: "카페그램 홍보 & 답글", desc: "홍보 캠페인(하루 최대 2회)을 열면 45초간 전 메뉴 판매 단가가 +15% 상승합니다." }
        ],
        tip: "알림 배지가 떠 있을 때 스마트폰 버튼을 누르면 해당 알림이 온 앱 탭으로 바로 열립니다."
      },
      {
        icon: "📈",
        badge: "태블릿 · 주식 & 코인",
        title: "5. 전 플레이어 공통 주식·코인 투자",
        summary: "모든 플레이어가 똑같은 실시간 시세와 속보를 보며 투자 경쟁을 펼칩니다.",
        points: [
          { icon: "🌐", title: "전 서버 실시간 동기화 시세", desc: "10초마다 갱신되는 가격, 최근 10분 차트, 속보와 루머가 모든 접속자에게 동일하게 적용됩니다." },
          { icon: "🔴", title: "차트 보는 법 (빨간점·파란점·노란선)", desc: "빨간점은 호재 뉴스, 파란점은 악재 뉴스 발생 시점입니다. 노란 가로 점선(내 평단)보다 현재가가 위에 있으면 수익 구간입니다." },
          { icon: "📣", title: "루머 주의", desc: "루머 뉴스는 사실로 밝혀지면 크게 움직이지만, 헛소문이면 반대로 급변할 수 있습니다." }
        ],
        tip: "배당주를 보유하면 매 28일차 월말 정산 때 배당금이 현금으로 들어옵니다."
      },
      {
        icon: "🗺️",
        badge: "상권 지도 · 경영장부 · 랭킹",
        title: "6. 수도권 확장과 실시간 순자산 랭킹",
        summary: "자금을 모아 수도권 주요 상권으로 확장하고 랭킹 상위권에 도전하세요.",
        points: [
          { icon: "🏢", title: "지점 개설 & 건물 매입", desc: "하단 [상권지도]에서 다른 역세권에 지점을 내거나 건물을 통째로 매입해 매달 임대 수익을 얻을 수 있습니다." },
          { icon: "⭐", title: "미식 평가단 & 크리에이터 심사", desc: "평판이 오르면 시그니처 메뉴·제철 메뉴·인테리어 미션이 열립니다. 심사를 완료해 보상과 평판을 받으세요." },
          { icon: "🏆", title: "실시간 랭킹 & 클라우드 저장", desc: "현금, 지점·건물 가치, 주식·코인 평가금액을 합산한 총 순자산으로 다른 사장님들과 순위를 겨룹니다." }
        ],
        tip: "언제든 상단 오른쪽 [?] 버튼을 누르면 이 가이드를 다시 열어볼 수 있습니다!"
      }
    ];

    let currentTutorialStep = 0;
    let isMandatoryOnboardingTutorial = false;

    function renderTutorialStep() {
      const step = TUTORIAL_STEPS[currentTutorialStep] || TUTORIAL_STEPS[0];
      const total = TUTORIAL_STEPS.length;

      const subEl = document.getElementById("tutStepSubtitle");
      if (subEl) {
        subEl.textContent = `STEP ${currentTutorialStep + 1} / ${total} · ${step.badge}`;
      }
      const counterEl = document.getElementById("tutCounterText");
      if (counterEl) {
        counterEl.textContent = `${currentTutorialStep + 1} / ${total}`;
      }

      const dotsEl = document.getElementById("tutStepDots");
      if (dotsEl) {
        dotsEl.innerHTML = TUTORIAL_STEPS.map((s, idx) => `
          <button onclick="goTutorialStep(${idx})"
            class="h-2 rounded-full transition-all ${idx === currentTutorialStep ? "w-7 bg-amber-400" : "w-2 bg-stone-700 hover:bg-stone-500"}"
            title="${s.title}"></button>
        `).join("");
      }

      const bodyEl = document.getElementById("tutBody");
      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-900 border border-amber-500/40 rounded-2xl p-3.5 flex items-start gap-3">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
              ${step.icon}
            </div>
            <div>
              <div class="text-sm sm:text-base font-black text-white leading-snug">${step.title}</div>
              <p class="text-[11px] sm:text-xs text-amber-200/90 mt-1 leading-relaxed">${step.summary}</p>
            </div>
          </div>

          <div class="space-y-2">
            ${step.points.map(pt => `
              <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex items-start gap-2.5">
                <span class="text-base sm:text-lg shrink-0 mt-0.5">${pt.icon}</span>
                <div>
                  <div class="text-xs font-extrabold text-amber-300">${pt.title}</div>
                  <div class="text-[11px] text-stone-300 leading-relaxed mt-0.5">${pt.desc}</div>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="bg-emerald-950/50 border border-emerald-700/50 rounded-2xl p-2.5 text-[11px] text-emerald-200 leading-relaxed">
            💡 <b>사장님 꿀팁:</b> ${step.tip}
          </div>
        `;
        bodyEl.scrollTop = 0;
      }

      const prevBtn = document.getElementById("tutPrevBtn");
      if (prevBtn) {
        prevBtn.disabled = currentTutorialStep === 0;
        prevBtn.className = currentTutorialStep === 0
          ? "px-3.5 py-2 rounded-xl bg-stone-900 text-stone-600 text-xs font-extrabold cursor-not-allowed"
          : "px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-extrabold transition";
      }

      const nextBtn = document.getElementById("tutNextBtn");
      const closeTopBtn = document.getElementById("tutCloseTopBtn");
      const isLast = currentTutorialStep === total - 1;
      if (nextBtn) {
        nextBtn.textContent = isLast ? "🎉 이해했어요! 시작하기" : "다음 →";
      }
      if (closeTopBtn) {
        // 처음 시작하는 필수 튜토리얼일 때는 끝까지 넘겨보도록 상단 닫기 숨김 (도움말 '?'로 연 경우엔 언제든 닫기 가능)
        closeTopBtn.classList.toggle("hidden", isMandatoryOnboardingTutorial && !isLast);
      }
    }

    window.openTutorialModal = (voluntary = true) => {
      isMandatoryOnboardingTutorial = !voluntary;
      currentTutorialStep = 0;
      renderTutorialStep();
      const modal = document.getElementById("tutorialModal");
      if (modal) modal.classList.remove("hidden");
    };

    window.closeTutorialModal = () => {
      if (isMandatoryOnboardingTutorial && currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        return showToast("가이드 마지막 페이지까지 넘겨 확인해 주세요!", "amber");
      }
      isMandatoryOnboardingTutorial = false;
      const modal = document.getElementById("tutorialModal");
      if (modal) modal.classList.add("hidden");
      if (typeof state === "object" && state) {
        state.tutorialCompleted = true;
      }
    };

    window.goTutorialStep = (idx) => {
      currentTutorialStep = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, idx));
      renderTutorialStep();
    };

    window.prevTutorialStep = () => {
      if (currentTutorialStep > 0) {
        currentTutorialStep -= 1;
        renderTutorialStep();
      }
    };

    window.nextTutorialStep = () => {
      if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        currentTutorialStep += 1;
        renderTutorialStep();
      } else {
        closeTutorialModal();
      }
    };

    window.resolveSmsAction = (msgId, action) => {
      const m = (state.messages || []).find(x => x.id === msgId);
      if (!m || m.resolved) return;

      if (action === "verify_open") {
        if (m.category === "scam") {
          const loss = Math.min(state.cash, m.scamLoss || 150000);
          state.cash = Math.max(0, state.cash - loss);
          m.resolved = true;
          m.resultText = `💸 피싱/사칭 사기 피해! (-${loss.toLocaleString()}원 인출됨)`;
          showToast(`🚨 사칭 링크/계좌에 속아 ${loss.toLocaleString()}원이 빠져나갔습니다!`, "rose");
        } else if (m.category === "legit_promo") {
          const bonus = m.rewardCash || 50000;
          state.cash += bonus;
          if (m.rewardRep) addReputation(m.rewardRep);
          m.resolved = true;
          m.resultText = `🎁 정상 지원·페이백 수령 완료 (+${bonus.toLocaleString()}원 입금)`;
          showToast(`🎁 정상 지원금/페이백 +${bonus.toLocaleString()}원이 입금되었습니다!`, "emerald");
        }
      } else if (action === "verify_block") {
        if (m.category === "scam") {
          const reward = 20000;
          state.cash += reward;
          addReputation(0.5);
          m.resolved = true;
          m.resultText = `🛡️ 피싱 사칭 간파 및 신고 포상 (+${reward.toLocaleString()}원)`;
          showToast(`🛡️ 사칭 문자를 정확히 걸러냈습니다! 신고 포상금 +${reward.toLocaleString()}원`, "emerald");
        } else if (m.category === "legit_promo") {
          m.resolved = true;
          m.resultText = "😅 정상 안내 문자를 차단해 혜택을 놓쳤습니다";
          showToast("앗, 실제 공식 지원금/거래처 안내 문자를 차단해 버렸습니다!", "amber");
        }
      } else if (action === "spam_delete") {
        state.messages = state.messages.filter(x => x.id !== msgId);
        showToast("🗑️ 광고 문자를 정리했습니다.", "sky");
      } else if (action === "order_accept") {
        if (state.activeCateringOrder && state.activeCateringOrder.status === "accepted") {
          return showToast("이미 진행 중인 단체 납품 의뢰가 있습니다! 먼저 완료해 주세요.", "rose");
        }
        const targetMenu = state.menus.find(x => x.id === m.menuId) || state.menus[0];
        if (!targetMenu.unlocked) {
          return showToast(`먼저 POS [메뉴 개발]에서 '${targetMenu.name}' 메뉴를 해금해야 수락할 수 있습니다!`, "rose");
        }
        state.activeCateringOrder = {
          msgId: m.id,
          menuId: targetMenu.id,
          menuName: targetMenu.name,
          targetQty: m.targetQty || 8,
          delivered: 0,
          rewardCash: m.rewardCash || 120000,
          rewardRep: m.rewardRep || 3,
          dueDay: state.day + 2,
          status: "accepted"
        };
        m.resolved = true;
        m.resultText = `✅ 의뢰 수락됨 (${targetMenu.name} ${m.targetQty}잔 판매 시 보수 +${(m.rewardCash || 120000).toLocaleString()}원)`;
        showToast(`📦 단체 의뢰 수락! '${targetMenu.name}' ${m.targetQty}잔을 판매하면 보수가 지급됩니다!`, "amber");
      } else if (action === "order_decline") {
        m.resolved = true;
        m.resultText = "패스함 (영향 없음)";
        showToast("단체 납품 의뢰를 넘겼습니다.", "sky");
      } else if (action === "claim_coupon") {
        const cost = 10000;
        if (state.cash < cost) return showToast("쿠폰 보상 자금(10,000원)이 부족합니다!", "rose");
        state.cash -= cost;
        addReputation(2);
        m.resolved = true;
        m.resultText = `🎟️ 쿠폰 발송 완료 (-10,000원 · 감사 후기로 평판 보너스!)`;
        showToast(`🎟️ 정중한 쿠폰 답장에 손님이 감동해 좋은 후기를 남겼습니다!`, "emerald");
      } else if (action === "claim_ignore") {
        m.resolved = true;
        m.resultText = "그냥 넘김 (변동 없음)";
        showToast("문자를 그냥 넘겼습니다.", "sky");
      }

      updateHUD();
      renderPhoneApp();
    };

    window.triggerRandomSmsEvent = () => {
      if (!Array.isArray(state.messages)) state.messages = [];
      const unlockedMenus = state.menus.filter(m => m.unlocked);
      const pickMenu = unlockedMenus[Math.floor(Math.random() * unlockedMenus.length)] || state.menus[0];

      const templates = [
        // 1) 사칭/피싱 (외부 단축 URL, 070 번호, 긴급 계좌변경 유도 등 단서가 본문 안에만 존재)
        () => ({
          category: "scam",
          sender: "070-8912-4410",
          shortAlert: "💬 새 문자 도착",
          scamLoss: 180000,
          text: "[국세청] 소상공인 부가세 과오납 환급금 482,000원 조회됨. 금일 18시까지 미확인 시 국고 환수: http://tax-refund-kr.site"
        }),
        () => ({
          category: "scam",
          sender: "010-9311-0824",
          shortAlert: "💬 새 문자 도착",
          scamLoss: 240000,
          text: "[카페 식자재 마켓] 전산 장애로 정산 입금 계좌가 긴급 변경되었습니다. 기존 계좌 입금 시 배송이 보류되니 안내 링크에서 확인해 주세요."
        }),
        // 2) 진짜 공식 지원금 / 진짜 거래처 페이백 (외부 수상한 링크 없음, 공식 대표번호/내부 정산)
        () => ({
          category: "legit_promo",
          sender: "1357 (중소기업통합콜센터)",
          shortAlert: "💬 새 문자 도착",
          rewardCash: 65000,
          rewardRep: 0.5,
          text: "[중소벤처기업부] 영세 소상공인 전기·가스요금 특별지원금 65,000원 지급 대상자로 선정되었습니다. 별도 사이트 접속 없이 즉시 계좌로 수령 가능합니다."
        }),
        () => ({
          category: "legit_promo",
          sender: "카페 식자재 마켓",
          shortAlert: "💬 새 문자 도착",
          rewardCash: 40000,
          rewardRep: 0,
          text: `[카페 식자재 마켓] '${state.cafeName}' 사장님, 우수 거래 매장 감사 페이백 40,000원이 적립되었습니다. 수령 버튼을 누르면 매장 자금으로 바로 입금됩니다.`
        }),
        // 3) 일반 광고 스팸 (누르든 말든 상관없는 배경 소음)
        () => ({
          category: "spam",
          sender: "(광고) 황금대출파트너",
          shortAlert: "💬 새 문자 도착",
          text: "(광고) 사장님! 서류 없이 5분 만에 최대 5천만 원 당일 승인! 무료수신거부 080-000-0000"
        }),
        // 4) 선택형 단체 납품 의뢰 (수락해서 달성하면 큰 이득, 패스해도 손해 없음)
        () => {
          const qty = 6 + Math.floor(Math.random() * 5);
          const reward = Math.round(pickMenu.price * qty * 1.65 / 1000) * 1000 + 35000;
          return {
            category: "order",
            sender: "인근 스타트업 총무팀",
            shortAlert: "💬 새 문자 도착",
            menuId: pickMenu.id,
            targetQty: qty,
            rewardCash: reward,
            rewardRep: 3,
            text: `안녕하세요 사장님! 저희 회사 회의 간식으로 '${pickMenu.name}' ${qty}잔 주문하고 싶습니다. 수락하시면 매장 판매 실적으로 집계 후 보수 +${reward.toLocaleString()}원을 드릴게요!`
          };
        },
        // 5) 손님 아쉬움 문자 (쿠폰 보내면 평판 보너스, 넘겨도 감점 없음)
        () => ({
          category: "claim",
          sender: "010-4821-7730",
          shortAlert: "💬 새 문자 도착",
          text: "방금 포장해 간 음료 얼음이 조금 많이 녹아서 싱거웠어요 ㅠㅠ 다음엔 얼음 조금만 덜 넣어주시면 감사하겠습니다!"
        }),
        // 6) 미식 평가단 방문 힌트
        () => {
          const reg = VISITOR_POOL[Math.floor(Math.random() * VISITOR_POOL.length)];
          return {
            category: "regular",
            sender: `${reg.avatar} ${reg.name}`,
            shortAlert: "💬 새 문자 도착",
            text: `사장님, 카페 리뷰 콘텐츠를 준비 중이에요. 평판 ★${reg.minRep}을 달성하고 시그니처 메뉴와 인테리어를 다듬으면 미식 평가단 심사가 열립니다.`
          };
        },
        () => {
          const tips = [
            "여의도 쪽 지인한테 들었는데 곧 '별다방홀딩스' 관련 얘기가 돌 거라네요. 물론 헛소문일 수도 있으니 태블릿 주식 탭에서 확인해 보세요!",
            "요즘 커뮤니티에서 '시바라떼코인'이 조용히 꿈틀댄다는 말이 있더라고요. 태블릿 코인 차트 흐름 한 번 체크해 보세요!"
          ];
          return {
            category: "tip",
            sender: "010-2940-XXXX",
            shortAlert: "💬 새 문자 도착",
            text: tips[Math.floor(Math.random() * tips.length)]
          };
        }
      ];

      // 단체 의뢰가 이미 진행 중이면 order 템플릿 제외
      const pool = (state.activeCateringOrder && state.activeCateringOrder.status === "accepted")
        ? templates.filter((_, i) => i !== 5)
        : templates;

      const built = pool[Math.floor(Math.random() * pool.length)]();
      const msgObj = {
        id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        unread: true,
        resolved: false,
        time: `${state.day}일차 ${formatAmPmTime(state.minuteOfDay)}`,
        ...built
      };

      state.messages.unshift(msgObj);
      if (state.messages.length > 25) state.messages.length = 25;

      if (typeof pushPhoneNotification === "function") {
        pushPhoneNotification("msg", built.shortAlert || "💬 새 문자 도착");
      }
    };

    window.showPurchaseConfirmModal = ({
      icon = "🛍️",
      title = "구매가 완료되었습니다!",
      summary = "",
      promptText = "다른 상품도 계속해서 추가 구매하시겠습니까?",
      stayLabel = "🛒 계속 추가 구매",
      doneLabel = "확인 (창 닫기)",
      onStay = null,
      onDone = null
    } = {}) => {
      const modal = document.getElementById("purchaseConfirmModal");
      if (!modal) return;
      const iconEl = document.getElementById("pcIcon");
      const titleEl = document.getElementById("pcTitle");
      const sumEl = document.getElementById("pcSummary");
      const balEl = document.getElementById("pcBalance");
      const promptEl = document.getElementById("pcPromptText");
      const stayBtn = document.getElementById("pcStayBtn");
      const doneBtn = document.getElementById("pcDoneBtn");

      if (iconEl) iconEl.textContent = icon;
      if (titleEl) titleEl.textContent = title;
      if (sumEl) sumEl.innerHTML = summary;
      if (balEl) balEl.textContent = `남은 보유 자금: ${(state.cash || 0).toLocaleString()}원`;
      if (promptEl) promptEl.textContent = promptText;
      if (stayBtn) stayBtn.textContent = stayLabel;
      if (doneBtn) doneBtn.textContent = doneLabel;

      if (stayBtn) {
        stayBtn.onclick = () => {
          modal.classList.add("hidden");
          if (typeof onStay === "function") onStay();
        };
      }
      if (doneBtn) {
        doneBtn.onclick = () => {
          modal.classList.add("hidden");
          if (typeof onDone === "function") onDone();
        };
      }
      modal.classList.remove("hidden");
    };

    window.buyFurniture = (fid, evt) => {
      const item = FURNITURE_CATALOG.find(f => f.id === fid);
      if (!item) return;
      ensureFurnitureState();
      if (state.ownedFurniture.includes(fid)) return;
      if (state.cash < item.price) return showToast("가구 구매 자금이 부족합니다!", "rose");
      state.cash -= item.price;
      state.ownedFurniture.push(fid);
      addReputation(item.rep);

      if (item.category === "table") {
        const tableKeys = ["slotLeft", "slotCenter", "slotRight", "slotFrontLeft", "slotFrontCenter", "slotFrontRight"];
        const targetSlot = tableKeys.find(k => !state.placedFurniture[k])
          || tableKeys.find(k => state.placedFurniture[k] === "table_wood_2")
          || "slotCenter";
        state.placedFurniture[targetSlot] = fid;
      } else if (item.category === "decor") {
        const decorKeys = ["decorLeft", "decorRight", "decorFrontLeft", "decorFrontRight"];
        const emptyDecor = decorKeys.find(k => !state.placedFurniture[k]) || "decorLeft";
        state.placedFurniture[emptyDecor] = fid;
      } else if (item.category === "rug") {
        state.placedFurniture.hallRug = fid;
      }

      showToast(`🚀 로켓설치 완료! '${item.name}' 홀 자동 배치 (평판 +${item.rep})`, "emerald");
      if (typeof window.flyToCartMotion === "function") {
        window.flyToCartMotion(evt, "#hudReputation", item.icon || "🪑", `+${item.rep}★`);
      }
      updateHUD();
      renderPosModal();
      saveCloudProgress(false);

      window.showPurchaseConfirmModal({
        icon: item.icon || "🪑",
        title: `'${item.name}' 구매 및 배치 완료!`,
        summary: `결제 금액: <b>-${item.price.toLocaleString()}원</b> · 매장 평판 <b>+${item.rep}</b> 상승<br/>카페 홀 슬롯에 자동으로 배치되었습니다.`,
        promptText: "배팡 상점에서 다른 가구나 인테리어를 계속 추가 구매하시겠습니까?",
        stayLabel: "🛒 계속 추가 구매",
        doneLabel: "홀 화면 보기",
        onStay: () => {
          shopState.detailId = null;
          renderPosModal();
        },
        onDone: () => {
          shopState.detailId = null;
          closeModal("posModal");
        }
      });
    };

    window.placeFurniture = (slotKey, fid) => {
      ensureFurnitureState();
      state.placedFurniture[slotKey] = fid || null;
      showToast("✨ 홀 가구 배치가 실시간 반영되었습니다!", "amber");
      updateHUD();
      saveCloudProgress(false);
    };

    window.autoFillBestFurniture = () => {
      ensureFurnitureState();
      const bestTables = FURNITURE_CATALOG
        .filter(f => f.category === "table" && state.ownedFurniture.includes(f.id))
        .sort((a, b) => b.tipBonus - a.tipBonus);
      const bestDecors = FURNITURE_CATALOG
        .filter(f => f.category === "decor" && state.ownedFurniture.includes(f.id))
        .sort((a, b) => b.tipBonus - a.tipBonus);
      const bestRugs = FURNITURE_CATALOG
        .filter(f => f.category === "rug" && state.ownedFurniture.includes(f.id))
        .sort((a, b) => b.tipBonus - a.tipBonus);

      const tableKeys = ["slotLeft", "slotCenter", "slotRight", "slotFrontLeft", "slotFrontCenter", "slotFrontRight"];
      tableKeys.forEach((k, idx) => {
        if (bestTables.length) {
          state.placedFurniture[k] = bestTables[idx % bestTables.length].id;
        }
      });

      const decorKeys = ["decorLeft", "decorRight", "decorFrontLeft", "decorFrontRight"];
      decorKeys.forEach((k, idx) => {
        state.placedFurniture[k] = bestDecors[idx] ? bestDecors[idx].id : (bestDecors[0] ? bestDecors[0].id : null);
      });

      if (bestRugs.length) state.placedFurniture.hallRug = bestRugs[0].id;
      showToast("✨ 보유한 최고급 가구로 홀 전체 배치를 완료했습니다!", "amber");
      updateHUD();
      renderPosModal();
      saveCloudProgress(false);
    };

    window.addIngredientWithFly = (id, delta, evt) => {
      const info = typeof getIngredientById === "function" ? getIngredientById(id) : null;
      economy.addToIngredientCart(id, delta);
      if (delta > 0 && typeof window.flyToCartMotion === "function") {
        window.flyToCartMotion(evt, "#tabletMarketCartBox", info ? info.icon : "🛒", "+1팩");
      }
    };

    window.unlockMenu = (idx) => {
      const m = state.menus[idx];
      const wasUnlocked = Boolean(m && m.unlocked);
      economy.unlockMenu(idx);
      if (m && !wasUnlocked && m.unlocked && typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: m.icon || "☕",
          title: `'${m.name}' 신메뉴 개발 완료!`,
          summary: `개발 비용: <b>-${m.unlockCost.toLocaleString()}원</b> · 판매가 <b>${m.price.toLocaleString()}원</b><br/>지금부터 손님들이 해당 메뉴를 주문합니다.`,
          promptText: "다른 신메뉴나 식자재도 계속 추가 구매·개발하시겠습니까?",
          stayLabel: "☕ 계속 추가 개발",
          doneLabel: "매장 보기",
          onDone: () => closeModal("posModal")
        });
      }
    };
    window.buyUpgrade = (idx) => {
      const u = state.upgrades[idx];
      const prevLv = u ? (u.level || 0) : 0;
      economy.buyUpgrade(idx);
      if (u && (u.level || 0) > prevLv && typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: "⚙️",
          title: `'${u.name}' Lv.${u.level} 업그레이드 완료!`,
          summary: `${u.desc}<br/>설비 성능이 매장 운영에 즉시 반영되었습니다.`,
          promptText: "다른 설비나 가구도 계속 추가 구매하시겠습니까?",
          stayLabel: "🛒 계속 추가 구매",
          doneLabel: "매장 보기",
          onDone: () => closeModal("posModal")
        });
      }
    };

    window.respondRegularOffer = (accept) => {
      if (accept && pendingRegularOffer && state.regulars.length < 8) {
        state.regulars.push(pendingRegularOffer.id);
        showToast(`💖 '${pendingRegularOffer.name}'님이 우리 카페 찐단골이 되었습니다!`, "amber");
        saveCloudProgress(false);
      }
      pendingRegularOffer = null;
      document.getElementById("regularOfferModal").classList.add("hidden");
      updateHUD();
    };

    window.switchPhoneApp = (app) => {
      if (activeDevice === "phone" && app !== "sns" && app !== "msg") {
        return window.openTabletApp(app === "market" ? "market" : app);
      }
      activePhoneApp = app;
      if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert(app);
      const body = document.getElementById(activeDevice === "tablet" ? "tabletBody" : "phoneBody");
      if (body) body.scrollTop = 0;
      const map = { market: "Market", sns: "Sns", msg: "Msg", stock: "Stock", coin: "Coin" };
      Object.entries(map).forEach(([k, suffix]) => {
        const el = document.getElementById(`${activeDevice === "tablet" ? "tApp" : "appBtn"}${suffix}`);
        if (el) el.className = k === app
          ? "py-1.5 rounded-xl flex flex-col items-center gap-0.5 bg-violet-600 text-white"
          : "py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-stone-400";
      });
      renderPhoneApp();
    };

    function renderPhoneApp() {
      const titleEl = document.getElementById(activeDevice === "tablet" ? "tabletAppTitle" : "phoneAppTitle");
      const bodyEl = document.getElementById(activeDevice === "tablet" ? "tabletBody" : "phoneBody");
      if (!titleEl || !bodyEl) return;

      if (activePhoneApp === "staff") {
        titleEl.textContent = "👥 직원 고용 · 급여 관리";
        bodyEl.innerHTML = renderStaffApp();
        return;
      } else if (activePhoneApp === "branch") {
        titleEl.textContent = "🏪 지점별 운영 컨셉 특화";
        bodyEl.innerHTML = typeof renderBranchConceptApp === "function" ? renderBranchConceptApp() : "";
        return;
      } else if (activePhoneApp === "report") {
        titleEl.textContent = "🧾 계절·월간 경영 정산";
        bodyEl.innerHTML = renderSeasonReports();
        return;
      }

      if (activePhoneApp === "market") {
        economy.ensureIngredientState();
        titleEl.textContent = "🛒 카페 식자재 마켓 · 배송";

        const cart = state.ingredientCart || [];
        const deliveries = state.pendingDeliveries || [];
        const cartCount = cart.reduce((s, c) => s + c.qty, 0);
        const cartSubtotal = cart.reduce((s, c) => {
          return s + economy.getIngredientPrice(c.id) * c.qty;
        }, 0);
        const deliveryFee = cartSubtotal === 0 ? 0 : (cartSubtotal >= 30000 ? 0 : 2500);
        const cartTotal = cartSubtotal + deliveryFee;

        // 배송 진행중 배너
        const deliveryBannerHtml = deliveries.length > 0 ? `
          <div class="bg-sky-950/80 border border-sky-500/60 rounded-2xl p-2.5 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-extrabold text-sky-200">
              <span>🚚 식자재 냉장탑차 배송중 (${deliveries.length}건)</span>
              <span class="text-[10px] text-sky-400">도착 시 자동 입고</span>
            </div>
            ${deliveries.map(d => {
              const pct = Math.min(100, Math.max(8, Math.round(((d.totalSec - d.remainingSec) / d.totalSec) * 100)));
              const itemText = d.items.map(it => `${it.icon}${it.name}×${it.qty}`).join(", ");
              return `
                <div class="bg-stone-950/90 rounded-xl p-2 space-y-1">
                  <div class="flex justify-between text-[10px]">
                    <span class="text-stone-200 font-bold truncate max-w-[195px]">${itemText}</span>
                    <span class="text-amber-300 font-black shrink-0">약 ${d.remainingSec}초 후 도착</span>
                  </div>
                  <div class="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        ` : "";

        economy.ensureStorageUpgradeEntry();
        const usedUnits = economy.getTotalIngredientUnits();
        const pendingUnits = economy.getPendingDeliveryUnits();
        const cartUnits = economy.getCartUnits();
        const maxCap = economy.getMaxIngredientCapacity();
        const committedUnits = usedUnits + pendingUnits + cartUnits;
        const fillPct = Math.min(100, Math.round((usedUnits / maxCap) * 100));
        const storageGaugeHtml = `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-[11px] font-extrabold text-sky-300">🧊 재료별 개별 보관 상한</div>
                <div class="text-[10px] text-stone-400">전체 용량 제한 없음 · 재료당 최대 80잔 · 보유 <b class="text-white">${usedUnits}</b>잔${pendingUnits > 0 ? ` + 배송중 <b class="text-sky-300">${pendingUnits}</b>잔` : ""}${cartUnits > 0 ? ` + 장바구니 <b class="text-amber-300">${cartUnits}</b>잔` : ""}</div>
              </div>
              <span class="px-2 py-1 rounded-lg bg-stone-800 text-stone-300 text-[10px] font-bold shrink-0">상한 없음(전체)</span>
            </div>
            <div class="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div class="h-full ${fillPct >= 90 ? "bg-rose-500" : fillPct >= 70 ? "bg-amber-400" : "bg-emerald-500"} transition-all" style="width:${fillPct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-stone-400">
              <span>☕ 원두는 본사 상시 공급</span>
              <span>☕ 본점 원두는 상시 공급</span>
            </div>
          </div>
        `;

        // 상단 안내 & 서브탭 (재료쇼핑 / 창고재고)
        const topNavHtml = storageGaugeHtml + renderIngredientSubscriptions() + `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-2 space-y-1.5">
            <div class="grid grid-cols-2 gap-1 bg-stone-950 p-1 rounded-xl text-[11px] font-extrabold">
              <button onclick="setMarketSubTab('shop')" class="py-1.5 rounded-lg transition ${marketUiState.subTab === "shop" ? "bg-emerald-600 text-white" : "text-stone-400"}">
                🛍️ 재료 장보기 (${INGREDIENT_CATALOG.length}종)
              </button>
              <button onclick="setMarketSubTab('stock')" class="py-1.5 rounded-lg transition ${marketUiState.subTab === "stock" ? "bg-amber-600 text-white" : "text-stone-400"}">
                🧊 창고 재고 (${usedUnits}/${maxCap}잔)
              </button>
            </div>
          </div>
        `;

        if (marketUiState.subTab === "stock") {
          bodyEl.innerHTML = deliveryBannerHtml + topNavHtml + `
            <div class="space-y-1.5">
              ${INGREDIENT_CATALOG.map(ing => {
                const qty = state.ingredientStock[ing.id] || 0;
                return `
                  <div class="bg-stone-900 border ${qty > 0 ? "border-stone-800" : "border-rose-900/50"} rounded-xl px-3 py-2 flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-lg">${ing.icon}</span>
                      <div class="truncate">
                        <div class="text-xs font-bold text-white truncate">${ing.name}</div>
                        <div class="text-[10px] text-stone-400">1팩 ${ing.packUnits}잔분 · ${economy.getIngredientPrice(ing.id).toLocaleString()}원 · 상한 80잔</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs font-black ${qty > 5 ? "text-emerald-400" : qty > 0 ? "text-amber-300" : "text-stone-500"}">${qty}잔</span>
                      <button onclick="addIngredientWithFly('${ing.id}', 1, event)" class="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-extrabold active:scale-95 transition">+담기</button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `;
          return;
        }

        // 카테고리 탭 + 검색
        const filteredIngs = INGREDIENT_CATALOG.filter(ing => {
          if (marketUiState.category !== "all" && ing.category !== marketUiState.category) return false;
          if (marketUiState.search.trim()) {
            const q = marketUiState.search.trim().toLowerCase();
            if (!`${ing.name} ${ing.desc}`.toLowerCase().includes(q)) return false;
          }
          return true;
        });

        const filterHtml = `
          <div class="space-y-1.5">
            <input id="marketSearchInput" type="text" value="${marketUiState.search.replace(/"/g, "&quot;")}"
              oninput="setMarketSearch(this.value)"
              placeholder="재료 검색 (우유, 말차, 딸기, 크림, 시럽...)"
              class="w-full bg-stone-900 border border-stone-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none" />
            <div class="flex gap-1 overflow-x-auto pb-0.5">
              ${INGREDIENT_CATEGORIES.map(c => `
                <button onclick="setMarketCategory('${c.id}')"
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 transition ${marketUiState.category === c.id ? "bg-emerald-600 text-white" : "bg-stone-900 text-stone-400 border border-stone-800"}">
                  ${c.label}
                </button>
              `).join("")}
            </div>
          </div>
        `;

        // 재료 상품 리스트 (장바구니 수량 조절 버튼 포함)
        const catalogHtml = `
          <div class="space-y-1.5">
            ${filteredIngs.map(ing => {
              const inCart = cart.find(c => c.id === ing.id);
              const cartQty = inCart ? inCart.qty : 0;
              const stockQty = state.ingredientStock[ing.id] || 0;
              return `
                <div class="bg-stone-900 border ${cartQty > 0 ? "border-emerald-500/70" : "border-stone-800"} rounded-2xl p-2.5 flex items-center justify-between gap-2">
                  <div class="flex items-start gap-2 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-lg shrink-0">${ing.icon}</div>
                    <div class="min-w-0">
                      <div class="text-xs font-extrabold text-white truncate">${ing.name}</div>
                      <div class="text-[10px] text-stone-400 line-clamp-1">${ing.desc}</div>
                      <div class="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span class="font-black text-emerald-300">${economy.getIngredientPrice(ing.id).toLocaleString()}원</span>
                        <span class="text-stone-500">(${ing.packUnits}잔분)</span>
                        <span class="text-sky-300 font-bold">보유 ${stockQty}잔</span>
                      </div>
                    </div>
                  </div>

                  <div class="shrink-0">
                    ${cartQty > 0 ? `
                      <div class="flex items-center gap-1 bg-stone-950 border border-emerald-500/50 rounded-xl px-1.5 py-1">
                        <button onclick="addToIngredientCart('${ing.id}', -1)" class="w-5 h-5 rounded-lg bg-stone-800 text-white font-black text-xs">−</button>
                        <span class="text-xs font-black text-emerald-300 w-4 text-center">${cartQty}</span>
                        <button onclick="addIngredientWithFly('${ing.id}', 1, event)" class="w-5 h-5 rounded-lg bg-emerald-600 text-white font-black text-xs active:scale-95 transition">+</button>
                      </div>
                    ` : `
                      <button onclick="addIngredientWithFly('${ing.id}', 1, event)"
                        class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow active:scale-95 transition">
                        + 담기
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;

        // 하단 장바구니 일괄 결제 카드
        const cartBoxHtml = `
          <div id="tabletMarketCartBox" class="sticky bottom-0 bg-stone-900/95 backdrop-blur-md border-2 ${cartCount > 0 ? "border-emerald-500" : "border-stone-800"} rounded-2xl p-3 space-y-2 shadow-2xl">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-white">🛒 발주 장바구니 (${cartCount}팩)</span>
              ${cartCount > 0 ? `<button onclick="clearIngredientCart()" class="text-[10px] text-rose-400 font-bold hover:underline">전체 비우기</button>` : ""}
            </div>

            ${cartCount > 0 ? `
              <div class="max-h-20 overflow-y-auto space-y-1 text-[11px] bg-stone-950/90 rounded-xl p-2 border border-stone-800">
                ${cart.map(c => {
                  const info = getIngredientById(c.id);
                  if (!info) return "";
                  return `
                    <div class="flex items-center justify-between">
                      <span class="text-stone-200 truncate">${info.icon} ${info.name} × ${c.qty}팩 (+${info.packUnits * c.qty}잔)</span>
                      <span class="font-bold text-emerald-300 shrink-0">${(economy.getIngredientPrice(info.id) * c.qty).toLocaleString()}원</span>
                    </div>
                  `;
                }).join("")}
              </div>
              <div class="flex items-center justify-between text-[11px] text-stone-400">
                <span>배송비 (${deliveryFee === 0 ? "3만원 이상 무료" : "3만원 미만"})</span>
                <span>${deliveryFee === 0 ? "0원" : `+${deliveryFee.toLocaleString()}원`}</span>
              </div>
              <button onclick="checkoutIngredientCart()"
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-stone-950 font-black text-xs shadow-lg">
                🚚 총 ${cartTotal.toLocaleString()}원 일괄 결제 및 배달 주문
              </button>
            ` : `
              <div class="text-[11px] text-stone-400 text-center py-1">
                필요한 재료를 여러 개 장바구니에 담아 한꺼번에 배달 주문하세요!
              </div>
            `}
          </div>
        `;

        bodyEl.innerHTML = deliveryBannerHtml + topNavHtml + filterHtml + catalogHtml + cartBoxHtml;
      } else if (activePhoneApp === "sns") {
        titleEl.textContent = "📸 카페그램 (CafeGram)";
        const followers = state.snsFollowers || 128;
        const viralSec = state.snsViralBoostTicks || 0;
        const loc = getCurrentLocation();
        const themeCards = {
          sunset: "from-amber-900/80 via-rose-900/70 to-purple-950",
          coffee: "from-stone-800 via-amber-950 to-stone-900",
          interior: "from-emerald-950 via-stone-900 to-amber-950",
          viral: "from-pink-900/80 via-purple-900/80 to-indigo-950"
        };
        bodyEl.innerHTML = `
          <!-- 카페 공식 계정 프로필 & 바이럴 현황 -->
          <div class="bg-stone-900 border border-pink-500/30 rounded-2xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                  <div class="w-full h-full rounded-full bg-stone-950 flex items-center justify-center text-sm">☕</div>
                </div>
                <div>
                  <div class="text-xs font-black text-white flex items-center gap-1">
                    <span>@${escapeHtml(state.playerId || "cafe_owner")}</span>
                    <span class="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full">공식</span>
                  </div>
                  <div class="text-[10px] text-stone-400">${loc.region} ${loc.name} · ${escapeHtml(state.cafeName)}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-black text-pink-300">${followers.toLocaleString()}명</div>
                <div class="text-[10px] text-stone-400">팔로워</div>
              </div>
            </div>

            ${viralSec > 0 ? `
              <div class="bg-gradient-to-r from-pink-500/20 to-amber-500/20 border border-pink-400/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                <span class="font-extrabold text-pink-200">🔥 실시간 알고리즘 떡상중!</span>
                <span class="font-black text-amber-300">전 메뉴 단가 +15% (${viralSec}초)</span>
              </div>
            ` : `
              <div class="text-[10px] text-stone-400 bg-stone-950/80 rounded-xl px-2.5 py-1.5">
                💡 캠페인을 집행하면 팔로워가 늘고 <b>45초간 전 메뉴 판매 단가 +15%</b> 떡상 효과가 발동됩니다!
              </div>
            `}

            <div class="grid grid-cols-2 gap-1.5 pt-0.5">
              <button onclick="postPromoSns('mood')" class="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-pink-600 hover:brightness-110 text-white text-[11px] font-extrabold shadow">
                🌅 창밖 감성샷 피드<br><span class="text-[9px] font-normal opacity-90">-30,000원 · 팔로워↑ · 평판 소폭↑</span>
              </button>
              <button onclick="postPromoSns('reels')" class="py-2 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[11px] font-extrabold shadow">
                🎬 숏폼 릴스 바이럴<br><span class="text-[9px] font-normal opacity-90">-80,000원 · 팔로워↑↑ · 평판↑</span>
              </button>
            </div>
            <div class="text-[10px] text-stone-400 text-right">오늘 홍보 집행: ${state.snsPromoDay === state.day ? (state.snsPromoCountToday || 0) : 0}/2회</div>
          </div>

          <!-- 피드 타임라인 -->
          <div class="space-y-2.5">
            ${state.snsPosts.map((p, i) => `
              <div class="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
                <div class="px-3 py-2 flex items-center justify-between border-b border-stone-800/70">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-extrabold text-pink-300">${escapeHtml(p.user)}</span>
                    ${p.badge ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">${escapeHtml(p.badge)}</span>` : ""}
                  </div>
                  <span class="text-[10px] text-stone-500">${escapeHtml(p.timeLabel || "방금 전")}</span>
                </div>

                <!-- 감성 스냅 배너 -->
                <div class="bg-gradient-to-r ${themeCards[p.photoTheme] || themeCards.coffee} px-3 py-2.5 flex items-center justify-between border-b border-stone-800/60">
                  <span class="text-xs font-bold text-amber-100">${escapeHtml(p.mood || "☕ 오늘의 한 잔")}</span>
                  <span class="text-[10px] text-white/80 font-semibold">📍 ${loc.name}</span>
                </div>

                <div class="p-3 space-y-1.5">
                  <p class="text-xs text-stone-200 leading-relaxed">${escapeHtml(p.text)}</p>
                  <div class="text-[11px] text-sky-400 font-medium">${escapeHtml(p.tag)}</div>

                  ${p.comments && p.comments.length ? `
                    <div class="bg-stone-950/80 rounded-xl p-2 space-y-1 text-[10px] text-stone-300 border border-stone-800/80">
                      ${p.comments.slice(0, 2).map(cm => `<div>💬 ${escapeHtml(cm)}</div>`).join("")}
                    </div>
                  ` : ""}

                  <div class="flex items-center justify-between pt-1">
                    <button onclick="toggleLikeSns(${i})" class="text-xs font-bold ${p.liked ? "text-rose-400" : "text-stone-400"}">
                      ${p.liked ? "❤️" : "🤍"} 좋아요 ${escapeHtml(p.likes)}개
                    </button>
                    <button onclick="replySnsPost(${i})" class="text-[10px] font-bold text-amber-300 hover:underline">
                      ✍️ 사장님 답글 (호감도↑)
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      } else if (activePhoneApp === "msg") {
        titleEl.textContent = "💬 사장님 문자 메시지함";
        if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert("msg");

        const catBanner = state.activeCateringOrder && state.activeCateringOrder.status === "accepted" ? (() => {
          const c = state.activeCateringOrder;
          const pct = Math.min(100, Math.round(((c.delivered || 0) / c.targetQty) * 100));
          return `
            <div class="bg-amber-950/80 border border-amber-500/60 rounded-2xl p-2.5 space-y-1.5">
              <div class="flex justify-between items-center text-[11px]">
                <span class="font-extrabold text-amber-200">📦 진행중 납품: ${c.menuName}</span>
                <span class="font-black text-emerald-300">${c.delivered || 0}/${c.targetQty}잔</span>
              </div>
              <div class="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 transition-all" style="width:${pct}%"></div>
              </div>
              <div class="text-[10px] text-stone-300 flex justify-between">
                <span>완료 보수: +${c.rewardCash.toLocaleString()}원</span>
                <span>마감: ${c.dueDay}일차까지</span>
              </div>
            </div>
          `;
        })() : "";

        const msgsHtml = (state.messages || []).map((m) => {
          let actionsHtml = "";
          if (m.resolved) {
            actionsHtml = `<div class="mt-2 pt-1.5 border-t border-stone-800 text-[11px] font-bold text-stone-400">${m.resultText || "처리 완료"}</div>`;
          } else if (m.category === "scam" || m.category === "legit_promo") {
            // 스미싱/사칭 문자와 실제 정부·거래처 혜택 문자가 완전히 동일한 버튼 UI를 가짐 (눈치게임!)
            actionsHtml = `
              <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'verify_open')" class="py-1.5 px-2 rounded-xl bg-sky-900/70 hover:bg-sky-800 text-sky-100 text-[11px] font-extrabold">🔗 안내 확인 / 수령</button>
                <button onclick="resolveSmsAction('${m.id}', 'verify_block')" class="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-extrabold">🛡️ 차단 / 신고</button>
              </div>`;
          } else if (m.category === "spam") {
            actionsHtml = `
              <div class="flex justify-end mt-2 pt-1.5 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'spam_delete')" class="py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px] font-bold">🗑️ 지우기</button>
              </div>`;
          } else if (m.category === "order") {
            actionsHtml = `
              <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'order_accept')" class="py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-[11px] font-black">✅ 의뢰 수락</button>
                <button onclick="resolveSmsAction('${m.id}', 'order_decline')" class="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold">패스하기</button>
              </div>`;
          } else if (m.category === "claim") {
            actionsHtml = `
              <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'claim_coupon')" class="py-1.5 px-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-[11px] font-extrabold">🎟️ 쿠폰 보내기 (-1만)</button>
                <button onclick="resolveSmsAction('${m.id}', 'claim_ignore')" class="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold">넘기기</button>
              </div>`;
          }

          return `
            <div class="bg-stone-900 border ${m.resolved ? "border-stone-800/80 opacity-80" : "border-stone-700"} rounded-2xl p-3 space-y-1">
              <div class="flex items-center justify-between gap-1 text-[11px]">
                <span class="font-extrabold text-amber-200 truncate">📩 ${m.sender}</span>
                <span class="text-stone-500 shrink-0">${m.time}</span>
              </div>
              <p class="text-xs text-stone-200 leading-relaxed whitespace-pre-line">${m.text}</p>
              ${actionsHtml}
            </div>
          `;
        }).join("");

        bodyEl.innerHTML = catBanner + (msgsHtml || `<div class="text-center text-xs text-stone-500 py-8">수신된 문자가 없습니다.</div>`);
      } else if (activePhoneApp === "stock") {
        titleEl.textContent = "📈 한국증권 (배당주 거래)";
        renderMarketApp("stock", bodyEl);
      } else if (activePhoneApp === "coin") {
        titleEl.textContent = "🪙 업비트코인 (초고변동)";
        renderMarketApp("coin", bodyEl);
      }
    }

    
    window.toggleCustomMenuBuilder = () => {
      customMenuDraft.open = !customMenuDraft.open;
      renderPosModal();
    };
    window.setCustomMenuName = (val) => {
      customMenuDraft.name = val;
    };
    window.toggleCustomMenuCoffee = () => {
      customMenuDraft.useCoffee = !customMenuDraft.useCoffee;
      renderPosModal();
    };
    window.toggleCustomIngredient = (ingId) => {
      const idx = customMenuDraft.selectedIngredients.indexOf(ingId);
      if (idx >= 0) {
        customMenuDraft.selectedIngredients.splice(idx, 1);
      } else {
        if (customMenuDraft.selectedIngredients.length >= 4) {
          return showToast("재료는 최대 4가지까지 조합할 수 있습니다!", "amber");
        }
        customMenuDraft.selectedIngredients.push(ingId);
      }
      customMenuDraft.customPrice = "";
      renderPosModal();
    };
    window.setCustomMenuPrice = (val) => {
      customMenuDraft.customPrice = val;
    };
    window.submitCustomMenu = () => {
      const nameEl = document.getElementById("customMenuNameInput");
      const priceEl = document.getElementById("customMenuPriceInput");
      const fbEl = document.getElementById("customMenuFeedback");
      const liveName = (nameEl ? nameEl.value : customMenuDraft.name) || "";
      const livePrice = priceEl ? priceEl.value : customMenuDraft.customPrice;
      customMenuDraft.name = liveName;
      customMenuDraft.customPrice = livePrice;

      const showInlineError = (msg, focusName = false) => {
        if (fbEl) {
          fbEl.textContent = "⚠️ " + msg;
          fbEl.classList.remove("hidden");
        }
        if (focusName && nameEl) {
          nameEl.focus();
          nameEl.classList.add("border-rose-500");
        }
      };

      const cleanName = liveName.trim();
      if (cleanName.length < 2) {
        showToast("신메뉴 이름을 2글자 이상 입력해 주세요!", "rose");
        return showInlineError("1번 항목에 신메뉴 이름을 2글자 이상 입력해 주세요!", true);
      }
      if (!customMenuDraft.selectedIngredients || customMenuDraft.selectedIngredients.length === 0) {
        showToast("최소 1가지 이상의 재료를 선택해 주세요!", "rose");
        return showInlineError("3번 항목에서 들어갈 재료를 1~4가지 선택해 주세요!");
      }
      if (state.menus.some(m => m.name === cleanName)) {
        showToast("이미 같은 이름의 메뉴가 존재합니다!", "rose");
        return showInlineError("이미 같은 이름의 메뉴가 있습니다. 다른 이름을 입력해 주세요!", true);
      }
      if ((state.cash || 0) < 150000) {
        showToast("신메뉴 레시피 개발비(150,000원)가 부족합니다!", "rose");
        return showInlineError("보유 자금이 부족합니다. (개발비 150,000원 필요)");
      }

      const ok = economy.createCustomMenu({
        name: cleanName,
        ingredientIds: customMenuDraft.selectedIngredients,
        useCoffee: customMenuDraft.useCoffee,
        customPrice: livePrice
      });
      if (ok) {
        const created = state.menus[0];
        customMenuDraft = { open: false, name: "", useCoffee: true, selectedIngredients: [], customPrice: "" };
        renderPosModal();
        saveCloudProgress(false);

        if (typeof window.showPurchaseConfirmModal === "function" && created) {
          window.showPurchaseConfirmModal({
            icon: "🧪",
            title: `'${created.name}' 시그니처 출시 완료!`,
            summary: `등급: <b>${created.tierBadge}</b> · 판매가 <b>${created.price.toLocaleString()}원</b> (개발비 -150,000원)<br/>메뉴판 최상단에 즉시 등록되어 손님 주문을 받기 시작합니다!`,
            promptText: "다른 시그니처 메뉴도 계속 추가로 만드시겠습니까?",
            stayLabel: "🧪 하나 더 만들기",
            doneLabel: "메뉴판 확인하기",
            onStay: () => {
              customMenuDraft.open = true;
              renderPosModal();
            }
          });
        }
      }
    };
    window.deleteCustomMenu = (menuId) => {
      economy.deleteCustomMenu(menuId);
      saveCloudProgress(false);
    };

    window.setMarketSubTab = (tab) => {
      marketUiState.subTab = tab;
      renderPhoneApp();
    };
    window.setMarketCategory = (cat) => {
      marketUiState.category = cat;
      renderPhoneApp();
    };
    window.setMarketSearch = (val) => {
      marketUiState.search = val;
      renderPhoneApp();
      const inp = document.getElementById("marketSearchInput");
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    };
    window.addToIngredientCart = (ingId, delta) => economy.addToIngredientCart(ingId, delta);
    window.clearIngredientCart = () => economy.clearIngredientCart();
    window.checkoutIngredientCart = () => economy.checkoutIngredientCart();
    window.upgradeWarehouse = () => economy.upgradeWarehouseFromPhone();


    window.postPromoSns = (mode = "mood") => {
      if (state.snsPromoDay !== state.day) {
        state.snsPromoDay = state.day;
        state.snsPromoCountToday = 0;
      }
      if ((state.snsPromoCountToday || 0) >= 2) {
        return showToast("📢 하루 최대 2회까지만 SNS 홍보 캠페인을 집행할 수 있습니다!", "rose");
      }

      const isReels = mode === "reels";
      const cost = isReels ? 80000 : 30000;
      const rawRepGain = isReels ? 4 : 1.5;
      const followerGain = isReels ? Math.floor(Math.random() * 90) + 75 : Math.floor(Math.random() * 35) + 20;

      if (state.cash < cost) {
        if (typeof window.showFundsWarning === "function") window.showFundsWarning(`카페그램 홍보비 ${cost.toLocaleString()}원이 부족합니다.`);
        return showToast("홍보비가 부족합니다!", "rose");
      }
      state.cash -= cost;
      state.snsPromoCountToday = (state.snsPromoCountToday || 0) + 1;
      const repGain = addReputation(rawRepGain);
      state.snsFollowers = (state.snsFollowers || 128) + followerGain;
      state.snsViralBoostTicks = Math.min(90, (state.snsViralBoostTicks || 0) + (isReels ? 45 : 25));

      const loc = getCurrentLocation();
      const season = SEASONS[state.seasonIdx];
      const unlocked = state.menus.filter(m => m.unlocked);
      const pickMenu = unlocked[Math.floor(Math.random() * unlocked.length)] || state.menus[0];

      state.snsPosts.unshift({
        user: `@${state.playerId || "cafe_owner"}`,
        badge: isReels ? "🔥 릴스 추천" : "사장님 피드",
        mood: isReels ? `🎬 ${pickMenu.name} 추출 ASMR` : `${season.icon} ${season.name} 통유리 채광맛집`,
        photoTheme: isReels ? "viral" : "sunset",
        timeLabel: "방금 전",
        tag: `#${loc.name.replace(/\s/g, "")} #${season.name}카페 #${state.cafeName.replace(/\s/g, "")} #카공추천`,
        text: isReels
          ? `크레마 쫀쫀하게 올라오는 '${pickMenu.name}' 한 잔! ${loc.name} 오시면 꼭 들러주세요 🔥`
          : `${season.icon} ${season.name} 하늘이 예쁜 오늘, ${state.cafeName} 창가 자리 비어있어요!`,
        likes: isReels ? Math.floor(Math.random() * 140) + 65 : Math.floor(Math.random() * 45) + 18,
        comments: isReels
          ? ["@coffee_holic: 와 크레마 미쳤다 당장 갈게요!", "@incheon_date: 여기 분위기 진짜 좋아요 강추!"]
          : ["@daily_latte: 창밖 풍경 보면서 힐링하기 딱이네요 ☕"],
        liked: true,
        replied: false
      });
      if (state.snsPosts.length > 15) state.snsPosts.pop();
      showToast(`📸 카페그램 게시 완료! 팔로워 +${followerGain}명${repGain > 0 ? ` · 평판 +${repGain}` : ""} · 떡상 보너스 발동!`, "amber");
      updateHUD();
      renderPhoneApp();
    };

    window.replySnsPost = (i) => {
      const post = state.snsPosts[i];
      if (!post) return;
      if (post.replied) return showToast("이미 정성스러운 사장님 답글을 남겼습니다!", "sky");
      post.replied = true;
      post.comments = post.comments || [];
      post.comments.push(`👑 ${state.cafeName}: 소중한 방문과 후기 진심으로 감사드립니다! ☕`);
      const gainedRep = addReputation(0.6);
      state.snsFollowers = (state.snsFollowers || 128) + 6;
      showToast(gainedRep > 0 ? `💬 진심 어린 답글로 단골 호감도와 평판(+${gainedRep})이 올랐습니다!` : "💬 진심 어린 답글로 단골 호감도와 팔로워가 올랐습니다!", "emerald");
      updateHUD();
      renderPhoneApp();
    };

    window.toggleLikeSns = (i) => {
      state.snsPosts[i].liked = !state.snsPosts[i].liked;
      state.snsPosts[i].likes += state.snsPosts[i].liked ? 1 : -1;
      renderPhoneApp();
    };

    window.tradeAsset = (type, idx, dir, amt) => economy.tradeAsset(type, idx, dir, amt);


// 시장 엔진: 전 플레이어 실시간 동기화 시세 · 차트 · 뉴스 이벤트 · 손익 색상 표시 (주식/코인 공용)
    // 한국 시장 색상 규칙: 상승/이익 = 빨강, 하락/손실 = 파랑

    const MARKET_TICK_SECONDS = 10;   // 전 세계 공통 10초 단위 틱
    const MARKET_HIST_LEN = 60;       // 차트에 남기는 가격 기록 개수 (60개 × 10초 = 최근 10분)
    const MARKET_BASE_PRICES = {
      stock: { STAR: 42000, BEAN: 18500, HAN: 65000 },
      coin:  { BTC: 85000000, CAFE: 18000, DOGE: 12000 }
    };
    const MARKET_CFG = {
      stock: { noise: 0.025, floor: 5000, revert: 0.022, rumorRate: 0.20, pct: [0.03, 0.065], macroPct: [0.015, 0.03] },
      coin:  { noise: 0.075, floor: 50, floorRatio: 0.10, revert: 0.018, rumorRate: 0.30, pct: [0.08, 0.18], macroPct: [0.04, 0.09] }
    };
    const MARKET_UNIT_SPLITS = { CAFE: 15, DOGE: 50 };
    const MARKET_RUMOR_TRUE_RATE = 0.55;
    const MARKET_RUMOR_FAIL_BACKLASH = 0.4;
    const MARKET_BETA = { BTC: 0.7, CAFE: 1.0, DOGE: 1.4 };

    const MARKET_NEWS = {
      stock: {
        STAR: {
          up: [
            { h: "별다방홀딩스, 겨울 신메뉴 출시 첫 주 매출 역대 최고", b: "신메뉴 효과로 전 지점 방문객이 늘었다는 분석입니다." },
            { h: "별다방홀딩스 3분기 영업이익, 시장 예상치 상회", b: "어닝 서프라이즈에 기관 매수세가 몰릴 수 있습니다." },
            { h: "별다방, 해외 100호점 계약 체결", b: "해외 확장 모멘텀이 부각되고 있습니다." }
          ],
          down: [
            { h: "별다방 매장 위생 논란 확산… SNS 불매 움직임", b: "단기 매출 감소 우려가 커지고 있습니다." },
            { h: "별다방홀딩스, 원가 상승에 4분기 실적 하향 전망", b: "증권사들이 목표주가를 잇따라 낮추고 있습니다." }
          ]
        },
        BEAN: {
          up: [
            { h: "브라질 원두 대풍작… 대한원두유통 매입 단가 급락", b: "원가 절감으로 마진 개선이 기대됩니다." },
            { h: "대한원두유통, 대형 프랜차이즈와 독점 납품 계약", b: "안정적인 매출처를 확보했습니다." }
          ],
          down: [
            { h: "에티오피아 가뭄으로 원두 수급 비상", b: "조달 비용이 급등해 수익성이 악화될 수 있습니다." },
            { h: "대한원두유통 평택 물류창고 화재", b: "출하 차질과 보상 비용이 우려됩니다." }
          ]
        },
        HAN: {
          up: [
            { h: "한강변 재개발 확정… 한강리츠 보유 자산 가치 재평가", b: "자산가치 상승으로 배당 여력이 커질 전망입니다." },
            { h: "한강리츠부동산, 오피스 공실률 역대 최저", b: "임대 수익이 안정적으로 늘고 있습니다." }
          ],
          down: [
            { h: "정부, 부동산 대출 규제 강화 발표", b: "리츠 투자심리가 위축될 수 있습니다." },
            { h: "한강리츠, 핵심 임차인 계약 해지 통보", b: "공실 확대 가능성이 제기됩니다." }
          ]
        },
        ALL: {
          up: [
            { h: "한국은행 기준금리 인하… 증시 전반 훈풍 기대", b: "유동성 확대 기대로 주식 전반이 강세를 보일 수 있습니다." },
            { h: "외국인 3일 연속 순매수… 코스피 강세", b: "수급 개선이 전 종목에 우호적입니다." }
          ],
          down: [
            { h: "미국 증시 급락 여파… 국내 증시 하락 출발 전망", b: "위험 회피 심리가 확산되고 있습니다." },
            { h: "원/달러 환율 급등, 외국인 매도세 우려", b: "증시 전반의 변동성이 커질 수 있습니다." }
          ]
        }
      },
      coin: {
        BTC: {
          up: [
            { h: "미국 현물 ETF에 대규모 자금 유입… 비트코인 신고가 도전", b: "기관 자금이 들어오며 매수 심리가 살아났습니다." },
            { h: "글로벌 기관, 비트코인 추가 매수 공시", b: "대형 투자자의 매수는 가격 지지선이 되곤 합니다." }
          ],
          down: [
            { h: "대형 거래소 해킹 의혹… 비트코인 투매 우려", b: "보안 불안이 커지며 매도 물량이 쏟아질 수 있습니다." },
            { h: "채굴업체 보유 물량 대량 이체 포착… 매도 압박 우려", b: "거래소 입금은 매도 신호로 해석됩니다." }
          ]
        },
        CAFE: {
          up: [
            { h: "카페토큰, 전국 프랜차이즈 결제 도입 발표", b: "실사용처가 늘어 수요 증가가 기대됩니다." },
            { h: "카페토큰, 대형 거래소 신규 상장 임박", b: "상장 직전에는 기대감에 가격이 오르는 경우가 많습니다." }
          ],
          down: [
            { h: "카페토큰 개발팀 지갑서 대량 이동 포착… 먹튀 의혹", b: "팀 물량 매도 가능성에 투자자들이 동요하고 있습니다." },
            { h: "카페토큰 스테이킹 보상 대폭 축소 공지", b: "보유 매력이 떨어져 이탈이 늘 수 있습니다." }
          ]
        },
        DOGE: {
          up: [
            { h: "유명 인플루언서, 시바라떼코인 언급… 거래량 폭증", b: "밈코인은 화제성에 따라 급등락이 큽니다." },
            { h: "시바라떼코인 '라떼아트 밈', SNS에서 대유행", b: "개인 투자자의 관심이 급격히 몰리고 있습니다." }
          ],
          down: [
            { h: "시바라떼코인 고래 지갑에서 대규모 매도 물량 출회", b: "큰손의 매도는 단기 급락으로 이어지기 쉽습니다." },
            { h: "밈코인 열풍 식는다… 시바라떼코인 거래량 급감", b: "관심이 빠지면 가격도 빠르게 식습니다." }
          ]
        },
        ALL: {
          up: [
            { h: "글로벌 가상자산 규제 완화 기대감 확산", b: "코인 시장 전반에 훈풍이 불 수 있습니다." },
            { h: "미 연준 금리 인하 시사… 위험자산 선호 회복", b: "위험자산인 코인에 자금이 유입될 수 있습니다." }
          ],
          down: [
            { h: "정부, 가상자산 과세 강화 검토 소식", b: "세금 부담 우려로 매도세가 나올 수 있습니다." },
            { h: "글로벌 거래소 출금 지연 사태… 투자심리 급랭", b: "코인 시장 전반이 흔들릴 수 있습니다." }
          ]
        }
      }
    };

    function marketList(kind) { return kind === "stock" ? state.stocks : state.coins; }

    function migrateMarketPriceUnits() {
      if ((Number(state.marketPriceVersion) || 0) >= 2) return;
      state.coins.forEach(asset => {
        const split = MARKET_UNIT_SPLITS[asset.code];
        if (!split) return;

        // Reverse-split old low-priced coin units without changing their invested cost.
        const oldPrice = Number(asset.price) || MARKET_BASE_PRICES.coin[asset.code] / split;
        const oldOwned = Number(asset.owned) || 0;
        const oldCost = Number.isFinite(asset.cost) ? asset.cost : oldPrice * oldOwned;
        asset.owned = oldOwned / split;
        asset.cost = oldCost;
        asset.price = oldPrice * split;
        asset.base = MARKET_BASE_PRICES.coin[asset.code];
        if (Array.isArray(asset.hist)) asset.hist = asset.hist.map(price => price * split);
      });
      state.marketPriceVersion = 2;
    }

    // 전 플레이어 동일 난수 생성기 (Mulberry32)
    function createSeededRng(seed) {
      let a = (seed >>> 0) || 1;
      return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function getGlobalMarketTick() {
      return Math.floor(Date.now() / (MARKET_TICK_SECONDS * 1000));
    }

    // 모든 플레이어에게 공통으로 적용되는 글로벌 시뮬레이션 엔진
    // 1시간(360틱) 단위로 기준가에서 출발해 현재 글로벌 틱까지 동일 시드로 계산하므로
    // 어떤 기기/계정에서 접속해도 100% 똑같은 시세, 차트, 속보, 루머 결과를 보게 됩니다.
    let sharedMarketCache = {
      computedTick: -1,
      announcedNewsIds: new Set(),
      announcedRumorResultIds: new Set(),
      snapshot: null
    };

    function computeSharedMarketSnapshot(targetTick) {
      if (sharedMarketCache.computedTick === targetTick && sharedMarketCache.snapshot) {
        return sharedMarketCache.snapshot;
      }

      const epochLen = 360; // 1시간(3600초) 주기 시드 리셋
      const startTick = Math.max(1, targetTick - (targetTick % epochLen));
      const prices = {
        stock: { ...MARKET_BASE_PRICES.stock },
        coin: { ...MARKET_BASE_PRICES.coin }
      };
      const hist = {
        stock: {
          STAR: [prices.stock.STAR],
          BEAN: [prices.stock.BEAN],
          HAN: [prices.stock.HAN]
        },
        coin: {
          BTC: [prices.coin.BTC],
          CAFE: [prices.coin.CAFE],
          DOGE: [prices.coin.DOGE]
        }
      };

      const news = [];
      let nid = 1;
      let lastNewsTick = startTick - 5;

      function spawnDeterministicEvent(t, rng, forceKind = null) {
        const kind = forceKind || (rng() < 0.5 ? "stock" : "coin");
        const cfg = MARKET_CFG[kind];
        const busy = new Set(news.filter(n => n.status !== "done" && n.kind === kind).map(n => n.code));
        const baseCodes = Object.keys(MARKET_BASE_PRICES[kind]).filter(c => !busy.has(c));
        if (!busy.has("ALL") && rng() < 0.2) baseCodes.push("ALL", "ALL", "ALL");
        if (!baseCodes.length) return;

        const code = baseCodes[Math.floor(rng() * baseCodes.length)];
        const dir = rng() < 0.5 ? 1 : -1;
        const pool = MARKET_NEWS[kind][code][dir > 0 ? "up" : "down"];
        const tpl = pool[Math.floor(rng() * pool.length)];
        const rumor = forceKind ? false : rng() < cfg.rumorRate;
        const real = rumor ? rng() < MARKET_RUMOR_TRUE_RATE : true;
        const range = code === "ALL" ? cfg.macroPct : cfg.pct;
        let pct = range[0] + rng() * (range[1] - range[0]);
        if (kind === "coin" && code === "BTC") pct *= 0.5;

        const delay = 1 + Math.floor(rng() * 2);
        const dur = 4 + Math.floor(rng() * 3);
        const nameMap = {
          STAR: "별다방홀딩스", BEAN: "대한원두유통", HAN: "한강리츠부동산",
          BTC: "비트코인", CAFE: "카페토큰", DOGE: "시바라떼코인",
          ALL: kind === "stock" ? "주식 시장 전체" : "코인 시장 전체"
        };

        news.unshift({
          id: `${startTick}_${nid++}`,
          kind,
          code,
          name: nameMap[code] || code,
          dir,
          rumor,
          real,
          pct,
          headline: tpl.h,
          body: rumor ? "출처가 불분명한 소문입니다. 사실이 아니면 오히려 반대로 움직일 수 있어요." : tpl.b,
          tick: t,
          delay,
          dur,
          left: dur,
          status: "pending",
          resolvedTick: null
        });
        if (news.length > 24) news.length = 24;
        lastNewsTick = t;
      }

      for (let t = startTick; t <= targetTick; t++) {
        const rng = createSeededRng((t * 2654435761) ^ 0x9e3779b9);

        // 1) 진행 중인 뉴스 영향
        const drift = {};
        news.forEach(ev => {
          if (ev.status === "done") return;
          if (ev.delay > 0) { ev.delay--; return; }
          ev.status = "active";
          const eff = ev.real ? ev.dir * ev.pct : -ev.dir * ev.pct * MARKET_RUMOR_FAIL_BACKLASH;
          const per = eff / ev.dur;
          Object.keys(prices[ev.kind]).forEach(c => {
            if (ev.code !== "ALL" && ev.code !== c) return;
            const beta = ev.code === "ALL" && ev.kind === "coin" ? (MARKET_BETA[c] || 1) : 1;
            const k = ev.kind + c;
            drift[k] = (drift[k] || 0) + per * beta;
          });
          ev.left--;
          if (ev.left <= 0) {
            ev.status = "done";
            ev.resolvedTick = t;
          }
        });

        // 2) 전 종목 가격 갱신
        ["stock", "coin"].forEach(kind => {
          const cfg = MARKET_CFG[kind];
          Object.keys(prices[kind]).forEach(code => {
            const baseP = MARKET_BASE_PRICES[kind][code];
            const curP = prices[kind][code];
            let chg = 1 + (rng() - 0.49) * cfg.noise + cfg.revert * (baseP / curP - 1) + (drift[kind + code] || 0);
            chg = Math.max(0.5, chg);
            const floor = cfg.floorRatio
              ? Math.max(cfg.floor, Math.round(baseP * cfg.floorRatio))
              : cfg.floor;
            const nextP = Math.max(floor, Math.round(curP * chg));
            prices[kind][code] = nextP;
            hist[kind][code].push(nextP);
            if (hist[kind][code].length > MARKET_HIST_LEN) hist[kind][code].shift();
          });
        });

        // 3) 글로벌 뉴스 생성
        const activeCount = news.filter(n => n.status !== "done").length;
        if (t === startTick + 1 && news.length === 0) {
          spawnDeterministicEvent(t, rng, "stock");
        } else if (activeCount < 3 && t - lastNewsTick >= 3 && (rng() < 0.16 || t - lastNewsTick >= 10)) {
          spawnDeterministicEvent(t, rng, null);
        }
      }

      const snap = { tick: targetTick, prices, hist, news };
      sharedMarketCache.computedTick = targetTick;
      sharedMarketCache.snapshot = snap;
      return snap;
    }

    function ensureMarket(notifyNewEvents = false) {
      migrateMarketPriceUnits();
      if (!state.market || typeof state.market !== "object") state.market = {};
      const globalTick = getGlobalMarketTick();
      const snap = computeSharedMarketSnapshot(globalTick);

      state.market.tick = snap.tick;
      state.market.news = snap.news;

      ["stock", "coin"].forEach(kind => {
        marketList(kind).forEach(a => {
          const sharedPrice = snap.prices[kind][a.code];
          const sharedHist = snap.hist[kind][a.code];
          if (typeof a.base !== "number") a.base = MARKET_BASE_PRICES[kind][a.code] || a.price;
          if (typeof a.cost !== "number") a.cost = a.price * a.owned;
          if (typeof a.realized !== "number") a.realized = 0;
          if (typeof sharedPrice === "number") a.price = sharedPrice;
          if (Array.isArray(sharedHist) && sharedHist.length >= 2) {
            a.hist = [...sharedHist];
          }
        });
      });

      // 최초 로드 시 이미 지나간 뉴스는 토스트 폭탄이 터지지 않도록 조용히 등록
      if (!notifyNewEvents) {
        snap.news.forEach(ev => {
          sharedMarketCache.announcedNewsIds.add(ev.id);
          if (ev.status === "done" && ev.rumor) {
            sharedMarketCache.announcedRumorResultIds.add(ev.id);
          }
        });
      } else {
        snap.news.forEach(ev => {
          if (ev.tick === globalTick && !sharedMarketCache.announcedNewsIds.has(ev.id)) {
            sharedMarketCache.announcedNewsIds.add(ev.id);
            const tag = ev.rumor ? "📣 공통 루머" : "📰 실시간 속보";
            if (typeof showToast === "function") {
              showToast(`${tag} ${ev.headline}`, ev.dir > 0 ? "rose" : "sky");
            }
            if (typeof pushPhoneNotification === "function") {
              const appTarget = ev.kind === "coin" ? "coin" : "stock";
              const shortLbl = ev.kind === "coin"
                ? (ev.rumor ? "🪙 코인 루머" : "🪙 코인 속보")
                : (ev.rumor ? "📈 증시 루머" : "📈 증시 속보");
              pushPhoneNotification(appTarget, shortLbl);
            }
          }
          if (ev.status === "done" && ev.rumor && ev.resolvedTick === globalTick && !sharedMarketCache.announcedRumorResultIds.has(ev.id)) {
            sharedMarketCache.announcedRumorResultIds.add(ev.id);
            if (typeof showToast === "function") {
              showToast(ev.real ? `✅ 루머 사실로 확인 · ${ev.name}` : `❌ 헛소문이었어요 · ${ev.name}`, ev.real ? "emerald" : "purple");
            }
          }
        });
      }

      return state.market;
    }

    let lastObservedGlobalTick = -1;
    function marketTick() {
      const gTick = getGlobalMarketTick();
      if (gTick === lastObservedGlobalTick) return;
      lastObservedGlobalTick = gTick;
      ensureMarket(true);

      const phone = document.getElementById("phoneModal");
      const tablet = document.getElementById("tabletModal");
      if ((phone && !phone.classList.contains("hidden") || tablet && !tablet.classList.contains("hidden")) && (activePhoneApp === "stock" || activePhoneApp === "coin")) {
        renderPhoneApp();
      }
    }

    // ---------- 표시용 도우미 ----------
    function mkTone(v) { return v > 0 ? "mk-up" : v < 0 ? "mk-down" : "mk-flat"; }
    function mkArrow(v) { return v > 0 ? "▲" : v < 0 ? "▼" : "–"; }
    function mkWon(n) { return Math.round(n).toLocaleString() + "원"; }
    function mkSigned(n) { const r = Math.round(n); return (r > 0 ? "+" : "") + r.toLocaleString() + "원"; }
    function mkPct(p) { return (p > 0 ? "+" : "") + p.toFixed(2) + "%"; }
    function mkAgo(tick) {
      const s = Math.max(0, (getGlobalMarketTick() - tick) * MARKET_TICK_SECONDS);
      return s < 15 ? "방금" : s < 60 ? `${s}초 전` : `${Math.floor(s / 60)}분 전`;
    }
    function mkQty(kind, a) { return kind === "stock" ? `${a.owned}주` : `${a.owned < 1 ? a.owned.toFixed(6) : a.owned.toFixed(3)} ${a.code}`; }

    function marketChartSVG(kind, a, m) {
      const W = 300, H = 88, padT = 9, padB = 7;
      const h = a.hist, n = h.length;
      let lo = Math.min(...h), hi = Math.max(...h);
      const avg = a.owned > 0 ? a.cost / a.owned : null;
      let span = hi - lo || a.price * 0.01;
      let showAvg = false;
      if (avg !== null && avg >= lo - span && avg <= hi + span) { showAvg = true; lo = Math.min(lo, avg); hi = Math.max(hi, avg); }
      span = hi - lo || 1;
      const X = i => 4 + (n > 1 ? (i * (W - 12)) / (n - 1) : W - 12);
      const Y = v => padT + (1 - (v - lo) / span) * (H - padT - padB);
      const line = h.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
      const col = h[n - 1] > h[0] ? "#f87171" : h[n - 1] < h[0] ? "#60a5fa" : "#a8a29e";
      const gid = `mkg_${kind}_${a.code}`;
      let svg = `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block" role="img" aria-label="${a.name} 가격 차트">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${col}" stop-opacity="0.32"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>`;
      [0.25, 0.5, 0.75].forEach(r => {
        const y = padT + r * (H - padT - padB);
        svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#44403c" stroke-width="0.6" stroke-dasharray="2 4"/>`;
      });
      svg += `<polygon points="${X(0)},${H} ${line} ${X(n - 1)},${H}" fill="url(#${gid})"/>`;
      svg += `<polyline points="${line}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
      m.news.filter(nw => nw.kind === kind && (nw.code === a.code || nw.code === "ALL")).forEach(nw => {
        const idx = n - 1 - (m.tick - nw.tick);
        if (idx < 0 || idx >= n) return;
        const x = X(idx), c = nw.dir > 0 ? "#f87171" : "#60a5fa";
        svg += `<line x1="${x}" y1="9" x2="${x}" y2="${H}" stroke="${c}" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.7"/><circle cx="${x}" cy="7" r="3.2" fill="${c}"/>`;
      });
      if (showAvg) {
        const y = Y(avg);
        svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fbbf24" stroke-width="1" stroke-dasharray="5 3"/><text x="${W - 2}" y="${y - 3}" font-size="9" text-anchor="end" fill="#fbbf24">내 평단</text>`;
      }
      svg += `<circle cx="${X(n - 1)}" cy="${Y(h[n - 1])}" r="3.4" fill="${col}"/><circle cx="${X(n - 1)}" cy="${Y(h[n - 1])}" r="6.5" fill="${col}" opacity="0.25"/></svg>`;
      return svg;
    }

    function marketSummaryHTML(kind, list) {
      let value = 0, cost = 0, realized = 0;
      list.forEach(a => { value += a.owned * a.price; cost += a.cost; realized += a.realized; });
      const pl = value - cost;
      const plPct = cost > 0 ? (pl / cost) * 100 : 0;
      const label = kind === "stock" ? "내 주식" : "내 코인";
      return `
        <div class="mk-panel space-y-2">
          <div class="flex justify-between items-center text-[11px]">
            <span class="font-extrabold text-amber-200">💼 ${label} 한눈에 보기</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 font-bold">🌐 전 서버 실시간 시세</span>
          </div>
          <div class="flex items-end justify-between">
            <div>
              <div class="text-[10px] text-stone-400">총 평가금액</div>
              <div class="text-lg font-black text-white leading-tight">${mkWon(value)}</div>
            </div>
            <div class="text-right ${mkTone(pl)}">
              <div class="text-[10px] text-stone-400">평가손익</div>
              <div class="text-sm font-black leading-tight">${mkArrow(pl)} ${mkSigned(pl)}</div>
              <div class="text-[11px] font-bold">${cost > 0 ? mkPct(plPct) : "보유 없음"}</div>
            </div>
          </div>
          <div class="flex justify-between text-[10px] border-t border-stone-800 pt-1.5 text-stone-400">
            <span>보유 현금 ${mkWon(state.cash)}</span>
            <span>투자 원금 ${mkWon(cost)} · 실현 <b class="${mkTone(realized)}">${mkSigned(realized)}</b></span>
          </div>
          <div class="text-[10px] text-stone-500 text-center">🔴 오르면 빨강 · 🔵 내리면 파랑 · 모든 플레이어 동일 차트</div>
        </div>`;
    }

    function marketNewsHTML(kind, m) {
      const items = m.news.filter(n => n.kind === kind).slice(0, 3);
      let html = `<div class="space-y-1.5">
        <div class="flex items-center justify-between px-0.5">
          <span class="text-xs font-extrabold text-amber-200">📰 ${kind === "stock" ? "증시" : "코인"} 실시간 속보</span>
          <span class="text-[10px] text-stone-500">전 플레이어 공통 뉴스</span>
        </div>`;
      if (!items.length) {
        html += `<div class="mk-panel text-[11px] text-stone-400 text-center">아직 들어온 뉴스가 없어요. 속보가 뜨면 알림이 울립니다!</div>`;
      }
      items.forEach(n => {
        const up = n.dir > 0;
        let status;
        if (n.status === "done") status = n.rumor ? (n.real ? "✅ 사실이었음" : "❌ 헛소문") : "✅ 반영 완료";
        else if (n.rumor) status = "🔍 사실 확인 중";
        else status = n.delay > 0 ? "⏳ 곧 반영 예상" : "🔥 반영 중";
        html += `
          <div class="mk-news ${up ? "mk-news-up" : "mk-news-down"}">
            <div class="flex items-center gap-1 flex-wrap text-[10px] font-bold">
              <span class="mk-chip ${up ? "mk-up-bg" : "mk-down-bg"}">${up ? "▲ 호재" : "▼ 악재"}</span>
              <span class="mk-chip ${n.rumor ? "mk-rumor" : "mk-flat-bg"}">${n.rumor ? "📣 루머" : "📰 속보"}</span>
              <span class="text-stone-300">${n.name}</span>
              <span class="ml-auto text-stone-500">${mkAgo(n.tick)}</span>
            </div>
            <div class="text-xs font-extrabold text-white leading-snug mt-1">${n.headline}</div>
            ${n.status === "done" ? "" : `<div class="text-[11px] text-stone-400 leading-snug mt-0.5">${n.body}</div>`}
            <div class="text-[10px] font-bold mt-1 ${n.status === "done" ? "text-stone-500" : "text-amber-300"}">${status}</div>
          </div>`;
      });
      return html + `</div>`;
    }

    function marketCardHTML(kind, a, i, m) {
      const h = a.hist, n = h.length;
      const prev = h[n - 2] !== undefined ? h[n - 2] : a.price;
      const diff = a.price - prev;
      const diffPct = prev ? (diff / prev) * 100 : 0;
      const winPct = h[0] ? ((a.price - h[0]) / h[0]) * 100 : 0;
      const trend = mkTone(a.price - h[0]);
      const hi = Math.max(...h), lo = Math.min(...h);
      const mins = Math.max(1, Math.round((n * MARKET_TICK_SECONDS) / 60));

      const live = m.news.find(nw => nw.kind === kind && nw.status !== "done" && (nw.code === a.code || nw.code === "ALL"));
      let liveChip = "";
      if (live) {
        const up = live.dir > 0;
        const txt = live.rumor ? `📣 루머 ${up ? "▲" : "▼"}?` : `📰 ${up ? "호재" : "악재"} ${live.delay > 0 ? "대기" : "반영 중"} ${up ? "▲" : "▼"}`;
        liveChip = `<span class="mk-chip ${up ? "mk-up-bg" : "mk-down-bg"} mk-pulse">${txt}</span>`;
      }

      let holding;
      if (a.owned > 0) {
        const value = a.owned * a.price;
        const pl = value - a.cost;
        const plPct = a.cost > 0 ? (pl / a.cost) * 100 : 0;
        holding = `
          <div class="mk-hold grid grid-cols-3 gap-1 text-center">
            <div><div class="mk-k">보유</div><div class="mk-v text-white">${mkQty(kind, a)}</div></div>
            <div><div class="mk-k">평균 단가</div><div class="mk-v text-stone-200">${mkWon(a.cost / a.owned)}</div></div>
            <div class="${mkTone(pl)}"><div class="mk-k">평가손익</div><div class="mk-v">${mkSigned(pl)}</div><div class="text-[10px] font-bold">${mkPct(plPct)}</div></div>
          </div>`;
      } else {
        holding = `<div class="mk-hold text-center text-[11px] text-stone-500">보유 수량 없음${a.realized ? ` · 누적 실현손익 <b class="${mkTone(a.realized)}">${mkSigned(a.realized)}</b>` : ""}</div>`;
      }

      const sellDim = a.owned > 0 ? "" : " opacity-40";
      let buttons;
      if (kind === "stock") {
        buttons = `
          <button onclick="tradeAsset('stock', ${i}, 1, 1)" class="mk-btn mk-buy">1주 매수</button>
          <button onclick="tradeAsset('stock', ${i}, 1, 10)" class="mk-btn mk-buy">10주 매수</button>
          <button onclick="tradeAsset('stock', ${i}, -1, 1)" class="mk-btn mk-sell${sellDim}">1주 매도</button>
          <button onclick="tradeAsset('stock', ${i}, -1, 'all')" class="mk-btn mk-sell${sellDim}">전량 매도</button>`;
      } else {
        buttons = `
          <button onclick="tradeAsset('coin', ${i}, 1, 100000)" class="mk-btn mk-buy">10만원 매수</button>
          <button onclick="tradeAsset('coin', ${i}, 1, 500000)" class="mk-btn mk-buy">50만원 매수</button>
          <button onclick="tradeAsset('coin', ${i}, -1, 0.5)" class="mk-btn mk-sell${sellDim}">절반 매도</button>
          <button onclick="tradeAsset('coin', ${i}, -1, 1)" class="mk-btn mk-sell${sellDim}">전량 매도</button>`;
      }

      const sub = kind === "stock"
        ? `<span class="text-emerald-400">월 배당 ${(a.div * 100).toFixed(1)}%</span>`
        : `<span class="text-purple-300">${a.code}</span>`;

      return `
        <div class="mk-panel space-y-2">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="text-xs font-extrabold text-white">${a.name} ${kind === "stock" ? `<span class="text-stone-500">${a.code}</span>` : ""}</div>
              <div class="text-[11px] flex items-center gap-1.5 flex-wrap">${sub}${liveChip}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-base font-black ${trend} leading-tight">${mkWon(a.price)}</div>
              <div class="text-[11px] font-bold ${mkTone(diff)}">${mkArrow(diff)} ${Math.abs(diff).toLocaleString()} (${mkPct(diffPct)})</div>
            </div>
          </div>
          <div class="mk-chart">${marketChartSVG(kind, a, m)}</div>
          <div class="flex justify-between text-[10px] text-stone-400">
            <span>최근 ${mins}분 <b class="${mkTone(winPct)}">${mkPct(winPct)}</b></span>
            <span><b class="mk-up">고 ${hi.toLocaleString()}</b> · <b class="mk-down">저 ${lo.toLocaleString()}</b></span>
          </div>
          ${holding}
          <div class="grid grid-cols-4 gap-1.5">${buttons}</div>
        </div>`;
    }

    function renderMarketApp(kind, bodyEl) {
      const m = ensureMarket(false);
      const list = marketList(kind);
      const scroll = bodyEl.scrollTop;
      bodyEl.innerHTML = `<div class="tablet-market-layout"><section class="tablet-market-assets">${marketSummaryHTML(kind, list)}${list.map((a, i) => marketCardHTML(kind, a, i, m)).join("")}</section><aside class="tablet-market-news"><h3 class="px-1 text-xs font-black text-amber-200">📰 실시간 뉴스 · 루머</h3>${marketNewsHTML(kind, m)}</aside></div>`;
      bodyEl.scrollTop = scroll;
    }


// 수도권 지도 · 본점 · 지점 · 건물
    // ==================== 수도권 지도 핀치 줌 & 드래그 ====================
    const MAP_BASE_W = 1200;
    const MAP_BASE_H = 900;

    const mapState = {
      x: -140,
      y: -120,
      scale: 0.78,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastPinchDist: 0
    };

    function getMinMapScale() {
      const vp = document.getElementById("metroMapViewport");
      const vw = (vp && vp.clientWidth) || window.innerWidth || 800;
      const vh = (vp && vp.clientHeight) || (window.innerHeight * 0.62) || 500;
      // 화면의 약 72% 이상을 채우도록 최소 축소 배율 제한 (너무 작게 축소되는 현상 방지)
      const fitScale = Math.max((vw * 0.72) / MAP_BASE_W, (vh * 0.72) / MAP_BASE_H);
      const floorScale = vw < 640 ? 0.58 : 0.72;
      return Math.min(1.4, Math.max(floorScale, Number(fitScale.toFixed(2))));
    }

    function getMaxMapScale() {
      return 2.0;
    }

    function clampMapPosition(scale) {
      const vp = document.getElementById("metroMapViewport");
      const vw = (vp && vp.clientWidth) || window.innerWidth || 800;
      const vh = (vp && vp.clientHeight) || (window.innerHeight * 0.62) || 500;
      const scaledW = MAP_BASE_W * scale;
      const scaledH = MAP_BASE_H * scale;
      const padX = Math.min(140, vw * 0.25);
      const padY = Math.min(110, vh * 0.22);

      if (scaledW <= vw) {
        mapState.x = (vw - scaledW) / 2;
      } else {
        const minX = vw - scaledW - padX;
        const maxX = padX;
        mapState.x = Math.min(maxX, Math.max(minX, mapState.x));
      }

      if (scaledH <= vh) {
        mapState.y = (vh - scaledH) / 2;
      } else {
        const minY = vh - scaledH - padY;
        const maxY = padY;
        mapState.y = Math.min(maxY, Math.max(minY, mapState.y));
      }
    }

    function snapPx(val) {
      return Math.round(val * 2) / 2;
    }

    function applyMapTransform() {
      const minScale = getMinMapScale();
      const maxScale = getMaxMapScale();
      mapState.scale = Math.min(maxScale, Math.max(minScale, mapState.scale));
      clampMapPosition(mapState.scale);

      const el = document.getElementById("metroMapTransform");
      if (!el) return;

      // 확대 시 글씨가 덜 뭉개지도록 핀 스케일은 과도하게 키우거나 줄이지 않고 깔끔한 범위 유지
      const pinScale = Math.max(0.78, Math.min(1.08, 1 / Math.pow(mapState.scale, 0.35)));
      const sx = snapPx(mapState.x);
      const sy = snapPx(mapState.y);
      const sc = Number(mapState.scale.toFixed(3));
      el.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${sc})`;

      document.querySelectorAll(".metro-pin-btn").forEach(btn => {
        const isSel = btn.dataset.selected === "1";
        const pScale = Number((pinScale * (isSel ? 1.08 : 1)).toFixed(3));
        btn.style.transform = `translate(-50%, -50%) scale(${pScale})`;
      });
    }

    window.zoomMapBy = (delta) => {
      const vp = document.getElementById("metroMapViewport");
      const cx = (vp && vp.clientWidth ? vp.clientWidth : window.innerWidth) / 2;
      const cy = (vp && vp.clientHeight ? vp.clientHeight : window.innerHeight * 0.65) / 2;
      const minScale = getMinMapScale();
      const maxScale = getMaxMapScale();
      const prevScale = mapState.scale;
      const nextScale = Math.min(maxScale, Math.max(minScale, prevScale + delta));
      if (Math.abs(nextScale - prevScale) < 0.0001) return;

      mapState.x = cx - ((cx - mapState.x) / prevScale) * nextScale;
      mapState.y = cy - ((cy - mapState.y) / prevScale) * nextScale;
      mapState.scale = nextScale;
      applyMapTransform();
    };

    window.focusMapRegion = (region) => {
      const vp = document.getElementById("metroMapViewport");
      const vw = (vp && vp.clientWidth) || window.innerWidth;
      const vh = (vp && vp.clientHeight) || window.innerHeight * 0.65;
      const minScale = getMinMapScale();

      const presets = {
        all: { tx: 520, ty: 440, s: Math.max(minScale, vw < 640 ? 0.62 : 0.8) },
        seoul: { tx: 550, ty: 385, s: vw < 640 ? 1.15 : 1.38 },
        incheon: { tx: 270, ty: 420, s: vw < 640 ? 1.0 : 1.25 },
        gyeonggi_south: { tx: 580, ty: 575, s: vw < 640 ? 0.95 : 1.2 },
        gyeonggi_north: { tx: 560, ty: 290, s: vw < 640 ? 0.95 : 1.2 }
      };
      const p = presets[region] || presets.all;
      mapState.scale = Math.max(minScale, p.s);
      mapState.x = vw / 2 - p.tx * mapState.scale;
      mapState.y = vh / 2 - p.ty * mapState.scale;
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

      window.addEventListener("resize", () => {
        applyMapTransform();
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
            class="metro-pin-btn absolute px-1.5 py-0.5 rounded-full border shadow-md text-[10px] leading-none whitespace-nowrap transition-colors ${badgeBg} ${isSel ? "ring-2 ring-white z-30" : isRecStart ? "z-20" : "z-10"}">
            ${icon} ${loc.name} <span class="opacity-80 text-[9px]">${loc.mult}x</span>
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

      const currentViewId = state.activeViewLocationId || state.hqLocationId;
      let btns = "";
      if ((isHq || isBranch) && currentViewId !== loc.id) {
        btns += `<button onclick="visitStoreView('${loc.id}')" class="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold">🪟 이 매장 창밖 보기</button>`;
      }
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

    window.visitStoreView = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (!loc) return;
      state.activeViewLocationId = locId;
      closeModal("mapModal");
      updateHUD();
      showToast(`🪟 '${loc.region} ${loc.name}' 매장 창밖 풍경으로 전환했습니다!`, "sky");
    };

    window.moveHq = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.deposit) return showToast("이사 보증금이 부족합니다!", "rose");
      state.cash -= loc.deposit;
      state.hqLocationId = locId;
      state.activeViewLocationId = locId;
      showToast(`🚚 '${loc.region} ${loc.name}' 상권으로 본점을 이전했습니다! 창밖 풍경이 바뀝니다.`, "amber");
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

      if (typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: "🏪",
          title: `'${loc.region} ${loc.name}' 직영 지점 인수 완료!`,
          summary: `인수 금액: <b>-${loc.branchPrice.toLocaleString()}원</b><br/>매 16일 정산마다 지점 수익이 자동 입금됩니다.`,
          promptText: "수도권 다른 상권의 지점이나 건물도 계속 추가 매입하시겠습니까?",
          stayLabel: "🗺️ 지도에서 추가 매입",
          doneLabel: "매장으로 돌아가기",
          onDone: () => closeModal("mapModal")
        });
      }
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

      if (typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: "🏢",
          title: `'${loc.region} ${loc.name}' 상가 건물 매입 완료!`,
          summary: `매입 금액: <b>-${loc.buildingPrice.toLocaleString()}원</b><br/>월세 면제 및 16일 주기 임대수익이 발생합니다.`,
          promptText: "다른 상권의 부동산이나 지점도 계속 추가 매입하시겠습니까?",
          stayLabel: "🗺️ 지도에서 추가 매입",
          doneLabel: "매장으로 돌아가기",
          onDone: () => closeModal("mapModal")
        });
      }
    };


// 계정 · Firebase Firestore 직접 저장/불러오기 · 랭킹 (4자리 PIN 방식)
    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);
    }

    function normalizedCafeNameKey(cafeName) {
      return String(cafeName || "").trim().replace(/\s+/g, "").toLowerCase();
    }

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
        errEl.textContent = "4자리 숫자 PIN을 입력하세요.";
        return;
      }
      if (!cafeName || cafeName.length < 2) {
        errEl.textContent = "카페 상호명을 2글자 이상 입력하세요.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "아이디 및 상호명 중복 확인 중...";
      errEl.textContent = "";

      try {
        if (db) {
          const userSnap = await getDoc(doc(db, "cafeUsers", playerId));
          if (userSnap.exists()) {
            errEl.textContent = "이미 사용 중인 사장님 아이디입니다. 다른 아이디를 입력해 주세요.";
            return;
          }
          const nameKey = normalizedCafeNameKey(cafeName);
          const nameSnap = await getDoc(doc(db, "cafeNames", nameKey));
          if (nameSnap.exists()) {
            errEl.textContent = "이미 등록된 카페 상호명입니다. 다른 이름을 입력해 주세요.";
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
        errEl.textContent = `중복 확인 중 오류가 발생했습니다: ${e && e.message ? e.message : "Firebase 설정을 확인하세요."}`;
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
      state.activeViewLocationId = locObj.id;
      state.cash = 8000000 - locObj.deposit;
      state.minuteOfDay = 480;
      selectedMapLocId = locObj.id;

      try {
        if (db) {
          const nameKey = normalizedCafeNameKey(cafeName);
          await setDoc(doc(db, "cafeNames", nameKey), {
            playerId,
            cafeName,
            createdAt: Date.now()
          }, { merge: true });
          await saveCloudProgress(false);
        } else {
          setCloudStatus("기기 로컬 저장 중 · Firebase 설정이 필요합니다.", "not-configured");
        }
      } catch (e) {
        console.error("Initial cloud save failed:", e);
        setCloudStatus("매장은 열었지만 Firebase 저장에 실패했습니다.", "error");
      }

      localStorage.setItem("metroCafeSession", JSON.stringify({ playerId }));
      localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));
      isInitialLocationSelection = false;
      pendingSignupData = null;

      document.getElementById("initialMapBanner").classList.add("hidden");
      document.getElementById("mapCloseBtn").classList.remove("hidden");
      closeModal("mapModal");

      updateHUD();
      showToast(`🎉 '${locObj.region} ${locObj.name}'에 '${state.cafeName}' 개업 완료!`, "amber");
      if (typeof openTutorialModal === "function") {
        openTutorialModal(false);
      }
      setTimeout(() => spawnCustomer(), 2500);
    };

    window.handleLoadCafe = async () => {
      const playerId = document.getElementById("loginPlayerId").value.trim().toLowerCase();
      const pin = document.getElementById("loginPin").value.trim();
      const errEl = document.getElementById("onboardLoadError");
      const btn = document.getElementById("loadCafeBtn");

      if (!/^[a-z0-9_]{4,16}$/.test(playerId) || !/^[0-9]{4}$/.test(pin)) {
        errEl.textContent = "사장님 아이디와 4자리 숫자 PIN을 정확히 입력하세요.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "클라우드 매장 확인 중...";
      errEl.textContent = "";

      try {
        let loaded = null;
        if (db) {
          const snap = await getDoc(doc(db, "cafeUsers", playerId));
          if (!snap.exists()) {
            errEl.textContent = "존재하지 않는 사장님 아이디입니다.";
            return;
          }
          const data = snap.data();
          if (String(data.pin || "") !== pin) {
            errEl.textContent = "4자리 PIN 번호가 일치하지 않습니다.";
            return;
          }
          loaded = data.saveState ? JSON.parse(data.saveState) : null;
        } else {
          const localRaw = localStorage.getItem("metroCafeLocalSave");
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (parsed.playerId === playerId && String(parsed.pin || "") === pin) {
              loaded = parsed;
            }
          }
        }

        if (!loaded) {
          errEl.textContent = "저장된 매장 데이터를 찾을 수 없습니다. Firebase 설정을 확인하세요.";
          return;
        }

        state = { ...state, ...loaded, playerId, pin };
        state.marketPriceVersion = Number(loaded.marketPriceVersion) || 0;
        if (!state.branchConcepts || typeof state.branchConcepts !== "object") state.branchConcepts = {};
        if (!state.ownedFurniture) state.ownedFurniture = ["table_wood_2"];
        if (!state.placedFurniture) {
          state.placedFurniture = { slotLeft: "table_wood_2", slotCenter: "table_wood_2", slotRight: "table_wood_2", decorLeft: null, decorRight: null };
        }
        if (state.minuteOfDay < 480 || state.minuteOfDay >= 1380) {
          state.minuteOfDay = 480;
        }
        selectedMapLocId = state.hqLocationId;

        localStorage.setItem("metroCafeSession", JSON.stringify({ playerId }));
        localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));
        document.getElementById("onboardingModal").classList.add("hidden");
        SoundEngine.syncWeatherAudio();
        updateHUD();
        setCloudStatus("클라우드 저장을 불러왔습니다.", "synced");
        showToast(`☁️ '${state.cafeName}' 매장 데이터를 성공적으로 불러왔습니다!`, "sky");
      } catch (e) {
        console.error(e);
        setCloudStatus("매장 불러오기 실패 · Firebase 설정을 확인하세요.", "error");
        errEl.textContent = `불러오기 실패: ${e && e.message ? e.message : "아이디와 PIN을 확인하세요."}`;
      } finally {
        btn.disabled = false;
        btn.textContent = "☁️ 클라우드에서 매장 불러오기";
      }
    };

    async function saveCloudProgress(notify = false) {
      if (!state.playerId) return;
      localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));

      if (!db) {
        setCloudStatus("기기에 저장됨 · Firebase 설정 후 클라우드 동기화 가능", "not-configured");
        if (notify) showToast("💾 이 기기에 저장했습니다. js/firebase-config.js 설정 시 클라우드 동기화됩니다.", "amber");
        return;
      }
      try {
        setCloudStatus("Firebase에 저장 중...", "saving");
        const netWorth = calculateNetWorth();
        await setDoc(doc(db, "cafeUsers", state.playerId), {
          playerId: state.playerId,
          pin: state.pin || "",
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

        setCloudStatus(`최근 클라우드 동기화: ${new Date().toLocaleTimeString()}`, "synced");
        if (notify) showToast("☁️ 클라우드에 안전하게 저장되었습니다!", "emerald");
      } catch (e) {
        console.error("Cloud save failed:", e);
        setCloudStatus("클라우드 저장 실패 · 기기 저장은 유지됩니다.", "error");
        if (notify) showToast("⚠️ 클라우드 저장에 실패했습니다. 네트워크와 Firestore 규칙을 확인하세요.", "rose");
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
                  <div class="font-extrabold text-white truncate">${escapeHtml(r.cafeName)} ${isMe ? "<span class='text-amber-400'>(나)</span>" : ""}</div>
                  <div class="text-[11px] text-stone-400">${escapeHtml(r.nickname)} · ${loc ? escapeHtml(loc.name) : "수도권"}</div>
                </div>
              </div>
              <div class="font-black text-emerald-400 shrink-0">${(r.netWorth || 0).toLocaleString()}원</div>
            </div>
          `;
        }).join("");
      } catch (e) {
        console.error("Ranking load failed:", e);
        setCloudStatus("랭킹 불러오기 실패 · 네트워크와 Firestore 규칙을 확인하세요.", "error");
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

    // 주소 접속 시 자동 로그인을 건너뛰고 항상 로그인/개업 화면부터 시작하도록 설정
    (function initAlwaysLoginScreen() {
      try {
        localStorage.removeItem("metroCafeSession");
      } catch (e) {
        console.warn("Session clear warning:", e);
      }
      const onboardEl = document.getElementById("onboardingModal");
      if (onboardEl) {
        onboardEl.classList.remove("hidden");
      }
      if (typeof switchOnboardTab === "function") {
        switchOnboardTab("load");
      }
    })();

    let secondCounter = 0;
    let simAccumulator = 0;

    function runOneSimStep() {
      secondCounter++;

      if ((state.snsViralBoostTicks || 0) > 0) {
        state.snsViralBoostTicks = Math.max(0, state.snsViralBoostTicks - 1);
      }

      if ((state.pendingDeliveries || []).length > 0) {
        const arrived = economy.tickDeliveries();
        if (activePhoneApp === "market" && !document.getElementById("phoneModal").classList.contains("hidden")) {
          renderPhoneApp();
        }
        if (arrived && activePosTab === "menu" && !document.getElementById("posModal").classList.contains("hidden")) {
          renderPosModal();
        }
      }

      const interiorLv = state.upgrades.find(u => u.id === "interior")?.level || 0;
      let trafficBoost = 1.0;
      if ((state.snsViralBoostTicks || 0) > 0) trafficBoost += 0.25;
      if (state.employees && state.employees.marketing) trafficBoost += 0.08;

      const spawnChance = Math.min(0.26, (0.028 + state.reputation * 0.001 + interiorLv * 0.015) * trafficBoost);
      if (Math.random() < spawnChance) {
        spawnCustomer();
      }

      if (secondCounter % 3 === 0) {
        tickAutoBrew();
      }
      if (typeof window.tickAutoSubscriptions === "function") window.tickAutoSubscriptions();
      if (typeof runEmployeeAutomation === "function") runEmployeeAutomation();

      // 손님 자발적 카페그램 후기 생성 (가끔씩 피드가 살아 숨쉬듯 갱신)
      if (secondCounter % 38 === 0 && state.reputation >= 12) {
        const loc = getCurrentLocation();
        const unlocked = state.menus.filter(m => m.unlocked);
        const m = unlocked[Math.floor(Math.random() * unlocked.length)] || state.menus[0];
        const handles = ["@seoul_cafe_log", "@incheon_foodie", "@gg_coffee_trip", "@latte_art_kr", "@weekend_brunch"];
        const reviews = [
          `${loc.name}에서 제일 아늑한 카페 발견! '${m.name}' 밸런스가 진짜 좋네요 ☕`,
          `통유리 창밖 보면서 멍때리기 최고인 ${state.cafeName}… 재방문 의사 200% ✨`,
          `사장님이 원두 관리에 진심이신 듯! ${m.name} 향이 너무 깊어요 👍`
        ];
        state.snsPosts.unshift({
          user: handles[Math.floor(Math.random() * handles.length)],
          badge: "손님 방문후기",
          mood: `☕ ${m.name} 인증샷`,
          photoTheme: "coffee",
          timeLabel: "방금 전",
          tag: `#${loc.name.replace(/\s/g, "")}맛집 #${state.cafeName.replace(/\s/g, "")}`,
          text: reviews[Math.floor(Math.random() * reviews.length)],
          likes: Math.floor(Math.random() * 28) + 8,
          comments: [],
          liked: false,
          replied: false
        });
        if (state.snsPosts.length > 15) state.snsPosts.pop();
        state.snsFollowers = (state.snsFollowers || 128) + Math.floor(Math.random() * 8) + 3;
        if (activePhoneApp === "sns" && !document.getElementById("phoneModal").classList.contains("hidden")) {
          renderPhoneApp();
        }
      }

      marketTick();

      // 주기적으로 문자 이벤트 수신 (개업 첫 문자는 빠르게, 이후 수신 간격은 완화)
      if ((secondCounter === 16 || (secondCounter > 20 && secondCounter % 105 === 0)) && typeof triggerRandomSmsEvent === "function") {
        triggerRandomSmsEvent();
      }

      // 단체 납품 의뢰 기한 초과 체크
      if (state.activeCateringOrder && state.activeCateringOrder.status === "accepted" && state.day > state.activeCateringOrder.dueDay) {
        const expired = state.activeCateringOrder;
        const msgObj = (state.messages || []).find(m => m.id === expired.msgId);
        if (msgObj) {
          msgObj.resolved = true;
          msgObj.resultText = "⏰ 납품 기한 초과로 의뢰 취소됨 (평판 -2)";
        }
        addReputation(-2);
        showToast(`⏰ 단체 납품 의뢰('${expired.menuName}') 기한이 지나 취소되었습니다. (평판 -2)`, "rose");
        state.activeCateringOrder = null;
      }

      if (secondCounter % 25 === 0) {
        saveCloudProgress(false);
      }

      updateHUD();
    }

    let isNightSkipping = false;
    let nightSkipTimer = 0;

    function triggerNightSkip() {
      if (isNightSkipping) return;
      isNightSkipping = true;
      nightSkipTimer = 0;
      // 마감 시 홀 손님 모두 퇴장 처리
      activeCustomers.forEach(c => {
        c.state = "leaving";
        c.isSipping = false;
        c.targetX = 0.05;
        c.targetYRatio = 0.68;
        c.bubbleText = "마감 시간이네요! 수고하세요 🌙";
      });
      const overlay = document.getElementById("nightSkipOverlay");
      const iconEl = document.getElementById("nightSkipIcon");
      const titleEl = document.getElementById("nightSkipTitle");
      const subEl = document.getElementById("nightSkipSub");
      if (overlay) {
        if (iconEl) iconEl.textContent = "🌙✨";
        if (titleEl) titleEl.textContent = "PM 11:00 영업 마감 · 새벽 시간 자동 스킵";
        if (subEl) subEl.textContent = "야경에서 아침 햇살로 빠르게 넘어가는 중...";
        overlay.classList.remove("hidden");
      }
    }

    let lastFrameTime = performance.now();
    function mainLoop(now) {
      const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      if (state.playerId) {
        const spd = typeof gameSpeed === "number" ? gameSpeed : 1;

        if (isNightSkipping) {
          nightSkipTimer += dt;
          // 1.6초 동안 밤 23:00(1380) -> 자정(1440) -> 다음 날 오전 08:00(480)까지 빠르게 하늘 연출 전환
          state.minuteOfDay += 340 * dt;
          if (state.minuteOfDay >= 1440) {
            state.minuteOfDay -= 1440;
            advanceDayAndWeather();
            const iconEl = document.getElementById("nightSkipIcon");
            const subEl = document.getElementById("nightSkipSub");
            if (iconEl) iconEl.textContent = "🌅☕";
            if (subEl) subEl.textContent = `${state.day}일차 오전 08:00 오픈 준비 완료!`;
          }
          if (nightSkipTimer >= 1.6 && state.minuteOfDay >= 480 && state.minuteOfDay < 1380) {
            state.minuteOfDay = 480;
            isNightSkipping = false;
            nightSkipTimer = 0;
            activeCustomers.length = 0;
            const overlay = document.getElementById("nightSkipOverlay");
            if (overlay) overlay.classList.add("hidden");
            updateHUD();
          }
        } else {
          if (state.minuteOfDay < 480) state.minuteOfDay = 480;
          // 영업시간(AM 08:00 ~ PM 23:00) 진행
          state.minuteOfDay += 8 * dt * spd;
          if (state.minuteOfDay >= 1380) {
            state.minuteOfDay = 1380;
            triggerNightSkip();
          }

          simAccumulator += dt * spd;
          while (simAccumulator >= 1.0) {
            simAccumulator -= 1.0;
            runOneSimStep();
          }
        }
      }

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
  marketTick,
  renderMarketApp,
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


// 매장 경영 태블릿 · 자동 구독 · 직원 · 계절 결산 · 미션
let activeDevice = "phone";
let selectedOrderIngredient = null;
let fundsWarningTimer = null;

const STAFF_CATALOG = [
  { id: "inventory", name: "창고·발주 매니저", role: "자동 발주 모니터링 · 식자재 원가 10% 절감", salary: 180000, icon: "📦" },
  { id: "marketing", name: "SNS 마케팅 매니저", role: "카페그램 홍보·댓글 대응 · 유입 및 평판 보조", salary: 220000, icon: "📸" },
  { id: "barista", name: "홀·바리스타 스태프", role: "음료 제조·응대 속도 30% 향상", salary: 260000, icon: "☕" }
];

const GUIDE_QUESTS = [
  { title: "새 메뉴 하나를 해금하세요", ready: () => state.menus.filter(menu => menu.unlocked).length > 1 },
  { title: "POS에서 식자재를 주문하세요", ready: () => (state.ingredientOrdersMade || 0) > 0 },
  { title: "시그니처 레시피를 연구·출시하세요", ready: () => state.menus.some(menu => menu.isCustom) },
  { title: "가구를 추가로 구매해 매장에 배치하세요", ready: () => (state.ownedFurniture || []).some(id => id !== "table_wood_2" && id !== "rug_warm_amber") },
  { title: "직원을 고용하거나 자동 보충 구독을 설정하세요", ready: () => Object.values(state.employees || {}).some(Boolean) || Object.values(state.ingredientSubscriptions || {}).some(item => item && item.enabled) },
  { title: "태블릿에서 주식 또는 코인을 매수하세요", ready: () => [...(state.stocks || []), ...(state.coins || [])].some(asset => asset.owned > 0) }
];

function ensureExpansionState() {
  if (!state.employees || typeof state.employees !== "object") state.employees = {};
  if (!state.branchConcepts || typeof state.branchConcepts !== "object") state.branchConcepts = {};
  if (!state.ingredientSubscriptions || typeof state.ingredientSubscriptions !== "object") state.ingredientSubscriptions = {};
  if (!Array.isArray(state.creatorReviewClaims)) state.creatorReviewClaims = [];
  if (!Array.isArray(state.seasonReports)) state.seasonReports = [];
  if (!state.seasonFinance || typeof state.seasonFinance !== "object") {
    state.seasonFinance = { sales: 0, supplies: 0, payroll: 0, subscriptionFees: 0, rent: 0, rentalIncome: 0, dividends: 0, insurance: 0 };
  }
  if (typeof state.guideQuestStep !== "number") state.guideQuestStep = 0;
  if (!state.ingredientCaps || typeof state.ingredientCaps !== "object") state.ingredientCaps = {};
  if (Array.isArray(state.upgrades) && state.upgrades.some(upgrade => upgrade.id === "storage")) {
    state.upgrades = state.upgrades.filter(upgrade => upgrade.id !== "storage");
  }
}

function recordSeasonFinance(key, amount) {
  ensureExpansionState();
  if (Object.prototype.hasOwnProperty.call(state.seasonFinance, key)) {
    state.seasonFinance[key] += Number(amount) || 0;
  }
}
window.recordSeasonFinance = recordSeasonFinance;

function showFundsWarning(message) {
  const banner = document.getElementById("fundsWarningBanner");
  const text = document.getElementById("fundsWarningText");
  if (!banner || !text) return;
  text.textContent = `⚠️ ${message || "자금이 부족합니다."}`;
  banner.classList.remove("hidden");
  if (fundsWarningTimer) clearTimeout(fundsWarningTimer);
  fundsWarningTimer = setTimeout(() => banner.classList.add("hidden"), 4500);
}
window.showFundsWarning = showFundsWarning;
window.hideFundsWarning = () => {
  const banner = document.getElementById("fundsWarningBanner");
  if (banner) banner.classList.add("hidden");
  if (fundsWarningTimer) clearTimeout(fundsWarningTimer);
};

function renderPosOrderPanel() {
  economy.ensureIngredientState();
  const suggested = selectedOrderIngredient || (state.menus.find(menu => menu.unlocked && menu.ingredients && menu.ingredients.some(id => (state.ingredientStock[id] || 0) <= 1)) || {}).ingredients?.find(id => (state.ingredientStock[id] || 0) <= 1);
  const selected = suggested || INGREDIENT_CATALOG[0].id;
  const info = getIngredientById(selected);
  const cart = state.ingredientCart || [];
  const totalPacks = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCost = cart.reduce((sum, item) => sum + economy.getIngredientPrice(item.id) * item.qty, 0);
  return `
    <aside class="pos-order-column">
      <div class="rounded-2xl border border-emerald-500/40 bg-stone-950 p-3">
        <div class="mb-2 flex items-center justify-between">
          <div><div class="text-sm font-black text-emerald-300">📦 식자재 발주</div><div class="text-[10px] text-stone-400">메뉴 재고 부족 배지를 누르면 재료가 선택됩니다.</div></div>
          <span class="rounded-full bg-stone-900 px-2 py-1 text-[10px] text-stone-300">개별 상한 80잔</span>
        </div>
        <div class="mb-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-2 text-xs font-bold text-amber-100">${info ? `${info.icon} ${info.name}` : "재료 선택"} <span class="text-stone-400">보유 ${state.ingredientStock[selected] || 0}잔</span></div>
        <button onclick="addPosOrderToCart('${selected}', event)" class="mb-3 w-full rounded-xl bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-500 active:scale-95 transition">+ 선택 재료 1팩 담기 (${info ? economy.getIngredientPrice(selected).toLocaleString() : 0}원)</button>
        <div class="max-h-64 space-y-1 overflow-y-auto">
          ${INGREDIENT_CATALOG.map(ingredient => {
            const missing = (state.ingredientStock[ingredient.id] || 0) <= 1;
            return `<button onclick="selectOrderIngredient('${ingredient.id}')" class="flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left text-[10px] ${selected === ingredient.id ? "border-emerald-400 bg-emerald-950/50" : missing ? "border-rose-900/70 bg-rose-950/20" : "border-stone-800 bg-stone-900"}"><span>${ingredient.icon} ${ingredient.name}</span><span class="${missing ? "text-rose-300" : "text-stone-400"}">${state.ingredientStock[ingredient.id] || 0}잔</span></button>`;
          }).join("")}
        </div>
        <div id="posCartTargetBox" class="mt-3 rounded-xl border border-emerald-500/30 bg-stone-900/80 p-2.5 transition">
          <div class="mb-2 flex justify-between text-[11px]"><span class="text-stone-300 font-bold">🛒 장바구니 ${totalPacks}팩</span><b class="text-emerald-300">${totalCost.toLocaleString()}원 + 배송비</b></div>
          <button onclick="checkoutPosOrder()" class="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-black text-stone-950">🚚 발주 결제하기</button>
        </div>
      </div>
    </aside>`;
}

window.setMobilePosView = (view) => {
  const modal = document.getElementById("posModal");
  const menuBtn = document.getElementById("mobilePosMenuViewBtn");
  const orderBtn = document.getElementById("mobilePosOrderViewBtn");
  const isOrder = view === "order";
  if (modal) modal.classList.toggle("mobile-pos-order", isOrder);
  if (menuBtn) {
    menuBtn.className = !isOrder
      ? "py-2 rounded-xl bg-emerald-600 text-white shadow"
      : "py-2 rounded-xl bg-stone-800 text-stone-300";
  }
  if (orderBtn) {
    orderBtn.className = isOrder
      ? "py-2 rounded-xl bg-emerald-600 text-white shadow"
      : "py-2 rounded-xl bg-stone-800 text-stone-300";
  }
};

window.selectOrderIngredient = (id) => {
  selectedOrderIngredient = id;
  renderPosModal();
  if (window.innerWidth <= 760 && typeof window.setMobilePosView === "function") {
    window.setMobilePosView("order");
  }
};
window.flyToCartMotion = (evt, targetSelector, icon = "🛒", badgeText = "+1") => {
  const sourceEl = evt && (evt.currentTarget || evt.target);
  const targetEl = typeof targetSelector === "string"
    ? document.querySelector(targetSelector)
    : targetSelector;
  if (!targetEl) return;

  const tRect = targetEl.getBoundingClientRect();
  if (tRect.width === 0 && tRect.height === 0) return;

  const sRect = sourceEl && sourceEl.getBoundingClientRect
    ? sourceEl.getBoundingClientRect()
    : { left: window.innerWidth * 0.4, top: window.innerHeight * 0.5, width: 20, height: 20 };

  const startX = sRect.left + sRect.width * 0.5;
  const startY = sRect.top + sRect.height * 0.5;
  const endX = tRect.left + tRect.width * 0.5;
  const endY = tRect.top + tRect.height * 0.5;

  const token = document.createElement("div");
  token.className = "fly-cart-token";
  token.innerHTML = `<span>${icon}</span><span>${badgeText}</span>`;
  token.style.left = `${startX}px`;
  token.style.top = `${startY}px`;
  document.body.appendChild(token);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      token.style.left = `${endX}px`;
      token.style.top = `${endY}px`;
      token.style.transform = "translate(-50%, -50%) scale(0.55)";
      token.style.opacity = "0.25";
    });
  });

  setTimeout(() => {
    token.remove();
    const freshTarget = typeof targetSelector === "string"
      ? document.querySelector(targetSelector)
      : targetEl;
    if (freshTarget) {
      freshTarget.classList.remove("cart-target-bounce");
      void freshTarget.offsetWidth;
      freshTarget.classList.add("cart-target-bounce");
    }
  }, 560);
};

window.addPosOrderToCart = (id, evt) => {
  selectedOrderIngredient = id;
  const info = typeof getIngredientById === "function" ? getIngredientById(id) : null;
  economy.addToIngredientCart(id, 1);
  renderPosModal();
  const targetSel = window.innerWidth <= 760 ? "#mobilePosOrderViewBtn" : "#posCartTargetBox";
  if (typeof window.flyToCartMotion === "function") {
    window.flyToCartMotion(evt, targetSel, info ? info.icon : "📦", "+1팩");
  }
};
window.checkoutPosOrder = () => {
  economy.checkoutIngredientCart();
  renderPosModal();
};

function renderIngredientSubscriptions() {
  ensureExpansionState();
  return `
    <section class="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-2.5">
      <div class="mb-2 flex items-center justify-between">
        <div><div class="text-[11px] font-black text-violet-200">🔁 식자재 자동 보충 구독</div><div class="text-[10px] text-stone-400">재고가 기준 이하이면 잔액 범위에서 자동 주문 (구독료는 계절 정산)</div></div>
        <span class="text-[10px] text-violet-300">개당 4,000원/주</span>
      </div>
      <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
        ${INGREDIENT_CATALOG.map(ingredient => {
          const sub = state.ingredientSubscriptions[ingredient.id] || { enabled: false, threshold: 8, target: 32 };
          return `<div class="flex items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/80 px-2 py-1.5 text-[10px]"><span class="min-w-0 truncate">${ingredient.icon} ${ingredient.name} <b class="text-stone-400">${state.ingredientStock[ingredient.id] || 0}</b></span><span class="flex shrink-0 items-center gap-1"><button onclick="adjustIngredientSubscription('${ingredient.id}','threshold',-4)" class="rounded bg-stone-800 px-1.5">−</button><span class="text-stone-300">≤${sub.threshold}</span><button onclick="adjustIngredientSubscription('${ingredient.id}','threshold',4)" class="rounded bg-stone-800 px-1.5">+</button><button onclick="toggleIngredientSubscription('${ingredient.id}')" class="rounded-lg px-2 py-1 font-black ${sub.enabled ? "bg-emerald-600 text-white" : "bg-stone-800 text-stone-400"}">${sub.enabled ? "ON" : "OFF"}</button></span></div>`;
        }).join("")}
      </div>
    </section>`;
}

window.toggleIngredientSubscription = (id) => {
  ensureExpansionState();
  const sub = state.ingredientSubscriptions[id] || { threshold: 8, target: 32, enabled: false };
  sub.enabled = !sub.enabled;
  state.ingredientSubscriptions[id] = sub;
  updateHUD();
  renderPhoneApp();
  saveCloudProgress(false);
};
window.adjustIngredientSubscription = (id, field, delta) => {
  ensureExpansionState();
  const sub = state.ingredientSubscriptions[id] || { threshold: 8, target: 32, enabled: false };
  sub[field] = Math.max(4, Math.min(72, (Number(sub[field]) || 0) + delta));
  if (sub.target <= sub.threshold) sub.target = Math.min(80, sub.threshold + 8);
  state.ingredientSubscriptions[id] = sub;
  renderPhoneApp();
};

function tickAutoSubscriptions() {
  ensureExpansionState();
  economy.ensureIngredientState();
  INGREDIENT_CATALOG.forEach(ingredient => {
    const sub = state.ingredientSubscriptions[ingredient.id];
    if (!sub || !sub.enabled) return;
    const stock = Number(state.ingredientStock[ingredient.id]) || 0;
    if (stock > sub.threshold) return;
    const incoming = (state.pendingDeliveries || []).some(delivery => delivery.items.some(item => item.id === ingredient.id));
    if (incoming) return;
    const cap = economy.getIngredientCapacity(ingredient.id);
    const current = economy.getCommittedIngredientUnits(ingredient.id);
    const desired = Math.min(cap, Math.max(current, sub.target));
    const packs = Math.ceil((desired - current) / ingredient.packUnits);
    if (packs <= 0) return;
    const subtotal = economy.getIngredientPrice(ingredient.id) * packs;
    const deliveryFee = subtotal >= 30000 ? 0 : 2500;
    let totalCost = subtotal + deliveryFee;
    if (state.employees.inventory) totalCost = Math.round(totalCost * 0.9);
    if (state.cash < totalCost) {
      showFundsWarning(`자동 구독 발주 실패: ${ingredient.name} 주문에 ${totalCost.toLocaleString()}원이 필요합니다.`);
      return;
    }
    state.cash -= totalCost;
    recordSeasonFinance("supplies", -totalCost);
    state.pendingDeliveries.push({
      orderNo: `SUB-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      items: [{ id: ingredient.id, name: ingredient.name, icon: ingredient.icon, qty: packs, units: ingredient.packUnits * packs }],
      totalCost,
      remainingSec: 8,
      totalSec: 8,
      subscription: true
    });
    showToast(`🔁 자동 구독 주문: ${ingredient.name} ${packs}팩`, "sky");
  });
}
window.tickAutoSubscriptions = tickAutoSubscriptions;

function toggleStaff(id) {
  ensureExpansionState();
  const staff = STAFF_CATALOG.find(item => item.id === id);
  if (!staff) return;
  if (state.employees[id]) {
    state.employees[id] = false;
    showToast(`${staff.name} 계약을 종료했습니다. 다음 정산부터 급여가 중단됩니다.`, "sky");
  } else {
    if (state.cash < 50000) {
      showFundsWarning(`직원 고용 선급금 50,000원이 부족합니다.`);
      return;
    }
    state.cash -= 50000;
    recordSeasonFinance("supplies", -50000);
    state.employees[id] = true;
    showToast(`${staff.name} 고용 완료 · 월급 ${staff.salary.toLocaleString()}원`, "emerald");
  }
  updateHUD();
  renderPhoneApp();
  saveCloudProgress(false);
}
window.toggleStaff = toggleStaff;

function renderStaffApp() {
  ensureExpansionState();
  const hired = STAFF_CATALOG.filter(staff => state.employees[staff.id]).length;
  return `<div class="grid gap-3 md:grid-cols-2">
    <section class="rounded-2xl border border-violet-500/40 bg-stone-900 p-4 md:col-span-2"><div class="flex items-center justify-between"><div><h3 class="font-black text-violet-200">👥 매장 직원 관리</h3><p class="mt-1 text-[11px] text-stone-400">직원 급여는 16일(1계절 · 1개월) 정산 주기마다 월급 기준으로 정산됩니다.</p></div><b class="text-xs text-violet-300">${hired}/3명 고용</b></div></section>
    ${STAFF_CATALOG.map(staff => `<article class="rounded-2xl border ${state.employees[staff.id] ? "border-emerald-500/50" : "border-stone-800"} bg-stone-900 p-4"><div class="mb-3 flex items-start justify-between gap-2"><div><div class="font-black text-white">${staff.icon} ${staff.name}</div><div class="mt-1 text-[11px] text-stone-400">${staff.role}</div></div><span class="rounded-full ${state.employees[staff.id] ? "bg-emerald-950 text-emerald-300" : "bg-stone-800 text-stone-400"} px-2 py-1 text-[10px] font-bold">${state.employees[staff.id] ? "근무 중" : "미고용"}</span></div><div class="mb-3 text-xs text-stone-300">16일 주기 정산 급여 <b class="text-amber-200">${staff.salary.toLocaleString()}원</b></div><button onclick="toggleStaff('${staff.id}')" class="w-full rounded-xl ${state.employees[staff.id] ? "bg-stone-800 text-stone-200" : "bg-violet-600 text-white"} py-2 text-xs font-black">${state.employees[staff.id] ? "계약 종료" : "고용하기 (선급금 50,000원)"}</button></article>`).join("")}
  </div>`;
}

function settleSeasonFinance() {
  ensureExpansionState();
  const employeeCost = STAFF_CATALOG.reduce((sum, staff) => sum + (state.employees[staff.id] ? staff.salary : 0), 0);
  const subscriptionCount = Object.values(state.ingredientSubscriptions).filter(sub => sub && sub.enabled).length;
  const subscriptionFee = subscriptionCount * 4000;
  const insuranceFee = 25000;
  state.cash -= employeeCost + subscriptionFee + insuranceFee;
  recordSeasonFinance("payroll", -employeeCost);
  recordSeasonFinance("subscriptionFees", -subscriptionFee);
  recordSeasonFinance("insurance", -insuranceFee);
  const oldSeason = SEASONS[(state.seasonIdx + 3) % 4];
  const report = {
    season: oldSeason.name,
    day: state.day,
    ...state.seasonFinance,
    net: Object.values(state.seasonFinance).reduce((sum, value) => sum + (Number(value) || 0), 0)
  };
  state.seasonReports.unshift(report);
  state.seasonReports = state.seasonReports.slice(0, 8);
  state.seasonFinance = { sales: 0, supplies: 0, payroll: 0, subscriptionFees: 0, rent: 0, rentalIncome: 0, dividends: 0, insurance: 0 };
  const target = document.getElementById("seasonLedgerContent");
  if (target) {
    const rows = [
      ["매장 매출", report.sales], ["식자재·고용 선급 지출", report.supplies],
      ["직원 월급", report.payroll], ["자동 구독료", report.subscriptionFees],
      ["본점·지점 월세", report.rent], ["부동산 임대수익", report.rentalIncome],
      ["주식 배당금", report.dividends], ["보험료", report.insurance]
    ];
    target.innerHTML = `<div class="mb-2 rounded-xl bg-stone-900 px-3 py-2 text-xs text-stone-300">${report.season} 운영 · ${Math.max(1, report.day - 16)}~${report.day}일차 · 급여 ${employeeCost.toLocaleString()}원 · 구독료 ${subscriptionFee.toLocaleString()}원</div>${rows.map(([label, amount]) => `<div class="flex justify-between rounded-lg border-b border-stone-800 px-2 py-1.5 text-xs"><span class="text-stone-300">${label}</span><b class="${amount < 0 ? "text-sky-300" : "text-amber-200"}">${Number(amount).toLocaleString()}원</b></div>`).join("")}<div class="mt-2 flex justify-between rounded-xl bg-amber-950/50 px-3 py-2 text-sm"><b>순 정산</b><b class="${report.net < 0 ? "text-rose-300" : "text-emerald-300"}">${report.net.toLocaleString()}원</b></div>`;
    document.getElementById("seasonLedgerModal").classList.remove("hidden");
  }
  if (state.cash < 0) showFundsWarning("계절 정산으로 자금이 부족해졌습니다. 지출과 자동 구독을 점검하세요.");
  updateHUD();
  saveCloudProgress(false);
}
window.settleSeasonFinance = settleSeasonFinance;

function renderSeasonReports() {
  ensureExpansionState();
  if (!state.seasonReports.length) return `<div class="rounded-2xl border border-stone-800 bg-stone-900 p-5 text-center text-sm text-stone-400">첫 계절 전환(16일차) 후 월간·계절 운영 정산서가 여기에 쌓입니다.</div>`;
  return `<div class="space-y-3">${state.seasonReports.map(report => `  <article class="rounded-2xl border border-stone-800 bg-stone-900 p-4"><div class="mb-2 flex justify-between"><b class="text-amber-200">${report.season} 운영 정산</b><span class="text-[10px] text-stone-500">${report.day}일차</span></div><div class="grid grid-cols-2 gap-2 text-xs">${[["매출", report.sales], ["식자재·기타", report.supplies], ["직원 급여", report.payroll], ["구독료", report.subscriptionFees], ["월세", report.rent], ["임대수익", report.rentalIncome], ["배당", report.dividends], ["보험료", report.insurance]].map(([label, amount]) => `<div class="rounded-lg bg-stone-950 px-2 py-1.5"><span class="text-stone-500">${label}</span><b class="float-right text-stone-200">${Number(amount).toLocaleString()}원</b></div>`).join("")}</div><div class="mt-2 flex justify-between border-t border-stone-800 pt-2 text-sm font-black"><span>순 정산</span><span class="${report.net < 0 ? "text-rose-300" : "text-emerald-300"}">${report.net.toLocaleString()}원</span></div></article>`).join("")}</div>`;
}

function renderCreatorReviewPanel() {
  ensureExpansionState();
  const reviews = [
    { id: "local_blogger", icon: "✍️", name: "수도권 카페 크리에이터", minRep: 25, reward: 80000, rep: 2, test: () => state.menus.some(menu => menu.isCustom && menu.unlocked), criterion: "시그니처 메뉴 1종 출시" },
    { id: "season_critic", icon: "🍽️", name: "제철 미식 평가단", minRep: 55, reward: 160000, rep: 4, test: () => state.menus.some(menu => menu.unlocked && getSeasonalReviewBonus(menu)), criterion: `${SEASONS[state.seasonIdx].name} 제철 재료 메뉴 판매` },
    { id: "interior_creator", icon: "🏠", name: "인테리어 전문 리뷰어", minRep: 100, reward: 280000, rep: 6, test: () => Object.values(state.placedFurniture || {}).filter(Boolean).length >= 5, criterion: "가구·인테리어 5곳 이상 배치" }
  ];
  return `<div class="mb-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-stone-300">단골 수집은 종료되었습니다. 평판 조건을 달성하면 크리에이터·미식 평가단이 방문해 신메뉴와 인테리어를 심사합니다.</div><div class="grid gap-2 md:grid-cols-2">${reviews.map(review => {
    const unlocked = state.reputation >= review.minRep;
    const done = state.creatorReviewClaims.includes(review.id);
    const ready = unlocked && review.test();
    return `<article class="rounded-2xl border ${done ? "border-emerald-500/40" : "border-stone-800"} bg-stone-950 p-3"><div class="flex justify-between gap-2"><b>${review.icon} ${review.name}</b><span class="text-[10px] text-amber-300">평판 ★${review.minRep}</span></div><div class="my-2 text-[11px] text-stone-400">${review.criterion}</div><div class="mb-2 text-[10px] text-stone-500">보상 ${review.reward.toLocaleString()}원 · 평판 +${review.rep}</div><button onclick="claimCreatorReview('${review.id}')" ${!ready || done ? "disabled" : ""} class="w-full rounded-xl py-2 text-xs font-black ${done ? "bg-emerald-950 text-emerald-300" : ready ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-500"}">${done ? "심사 완료" : !unlocked ? "평판 조건 미달" : ready ? "심사 보상 받기" : "평가 조건을 먼저 달성하세요"}</button></article>`;
  }).join("")}</div>`;
}

function getSeasonalReviewBonus(menu) {
  const seasonal = {
    0: ["strawberry_base", "lemon_syrup"], 1: ["mango_puree", "lemon_syrup", "sparkling_water"],
    2: ["cinnamon_powder", "red_bean", "caramel_sauce"], 3: ["choco_sauce", "whipping_cream", "pistachio_paste"]
  };
  return (menu.ingredients || []).some(id => (seasonal[state.seasonIdx] || []).includes(id));
}
window.claimCreatorReview = (id) => {
  const review = {
    local_blogger: { minRep: 25, reward: 80000, rep: 2, test: () => state.menus.some(menu => menu.isCustom && menu.unlocked) },
    season_critic: { minRep: 55, reward: 160000, rep: 4, test: () => state.menus.some(menu => menu.unlocked && getSeasonalReviewBonus(menu)) },
    interior_creator: { minRep: 100, reward: 280000, rep: 6, test: () => Object.values(state.placedFurniture || {}).filter(Boolean).length >= 5 }
  }[id];
  if (!review || state.creatorReviewClaims.includes(id) || state.reputation < review.minRep || !review.test()) return;
  state.creatorReviewClaims.push(id);
  state.cash += review.reward;
  addReputation(review.rep);
  showToast(`⭐ 미식 평가단 심사 완료 · ${review.reward.toLocaleString()}원 보상`, "amber");
  updateHUD();
  renderPosModal();
  saveCloudProgress(false);
};

function renderGuideQuestBanner() {
  ensureExpansionState();
  const banner = document.getElementById("guideQuestBanner");
  const step = Math.min(state.guideQuestStep, GUIDE_QUESTS.length);
  if (!banner) return;
  if (step >= GUIDE_QUESTS.length) {
    banner.textContent = "✅ 핵심 경영 가이드 완료 · 태블릿에서 직원·투자·정산을 관리하세요.";
    banner.classList.remove("hidden");
    banner.disabled = true;
    return;
  }
  const quest = GUIDE_QUESTS[step];
  const ready = quest.ready();
  banner.textContent = `${ready ? "🎁 보상 받기" : `가이드 ${step + 1}/${GUIDE_QUESTS.length}`} · ${quest.title}${ready ? "  (+75,000원)" : ""}`;
  banner.classList.remove("hidden");
  banner.disabled = !ready;
  banner.classList.toggle("opacity-60", !ready);
}
window.renderGuideQuestBanner = renderGuideQuestBanner;
window.claimGuideQuest = () => {
  ensureExpansionState();
  const quest = GUIDE_QUESTS[state.guideQuestStep];
  if (!quest || !quest.ready()) return;
  state.cash += 75000;
  state.guideQuestStep += 1;
  showToast("🎁 가이드 미션 완료 · 정착 지원금 75,000원 지급", "emerald");
  updateHUD();
  saveCloudProgress(false);
};

function runEmployeeAutomation() {
  ensureExpansionState();
  if (state.employees.marketing && secondCounter % 75 === 0) {
    state.snsFollowers = (state.snsFollowers || 128) + 8;
    const recentPost = state.snsPosts && state.snsPosts[0];
    if (recentPost) {
      recentPost.comments = recentPost.comments || [];
      recentPost.comments.push(`👑 ${state.cafeName}: 방문해 주셔서 감사합니다! 다음엔 제철 시그니처도 꼭 맛보세요 ☕`);
      recentPost.comments = recentPost.comments.slice(-4);
    }
    addReputation(0.12);
    showToast("📸 마케팅 매니저가 카페그램 댓글에 답하고 팔로워를 모았습니다.", "sky");
  }
}


const BRANCH_CONCEPTS = [
  {
    id: "standard",
    icon: "☕",
    name: "기본 밸런스형",
    desc: "상권 특성에 무난하게 대응하는 표준 직영점 운영",
    matchRegions: [],
    matchKeywords: []
  },
  {
    id: "takeout",
    icon: "🥤",
    name: "테이크아웃 회전형",
    desc: "역세권·오피스·대학가 상권에서 회전율을 극대화 (적합 시 수익 +25%)",
    matchKeywords: ["강남", "여의도", "을지로", "신촌", "건대", "부평", "구월", "수원", "분당", "판교", "안양", "부천"]
  },
  {
    id: "premium_study",
    icon: "🛋️",
    name: "카공·프리미엄 라운지형",
    desc: "신도시·한강뷰·감성 상권에서 높은 객단가와 체류 만족 확보 (적합 시 수익 +28%)",
    matchKeywords: ["송도", "청라", "영종", "홍대", "성수", "압구정", "잠실", "이태원", "삼청", "마곡", "목동", "일산", "광교", "동탄", "하남", "김포"]
  },
  {
    id: "dessert_specialty",
    icon: "🍰",
    name: "디저트·시그니처 특화형",
    desc: "관광·전통·나들이 핫플레이스에서 시그니처 디저트 세트 매출 극대화 (적합 시 수익 +30%)",
    matchKeywords: ["익선", "강화", "헤이리", "파주", "양평", "가평", "남양주", "의정부", "용인", "화성", "시흥", "오이도"]
  }
];

function getBranchConceptMultiplier(locId) {
  ensureExpansionState();
  const conceptId = state.branchConcepts[locId] || "standard";
  if (conceptId === "standard") return 1.0;
  const concept = BRANCH_CONCEPTS.find(c => c.id === conceptId);
  const loc = METRO_LOCATIONS.find(l => l.id === locId);
  if (!concept || !loc) return 1.0;
  const label = `${loc.region} ${loc.name}`;
  const isMatched = (concept.matchKeywords || []).some(kw => label.includes(kw));
  if (isMatched) {
    return conceptId === "dessert_specialty" ? 1.30 : conceptId === "premium_study" ? 1.28 : 1.25;
  }
  return 0.95;
}
window.getBranchConceptMultiplier = getBranchConceptMultiplier;

window.setBranchConcept = (locId, conceptId) => {
  ensureExpansionState();
  if (!state.branches.includes(locId)) return;
  state.branchConcepts[locId] = conceptId;
  const loc = METRO_LOCATIONS.find(l => l.id === locId);
  const concept = BRANCH_CONCEPTS.find(c => c.id === conceptId);
  const mult = getBranchConceptMultiplier(locId);
  if (loc && concept) {
    const bonusPct = Math.round((mult - 1) * 100);
    showToast(
      `🏪 ${loc.name} 지점 컨셉을 '${concept.name}'(으)로 설정했습니다. (수익 보정 ${bonusPct >= 0 ? "+" : ""}${bonusPct}%)`,
      bonusPct > 0 ? "emerald" : "sky"
    );
  }
  renderPhoneApp();
  saveCloudProgress(false);
};

function renderBranchConceptApp() {
  ensureExpansionState();
  if (!state.branches || state.branches.length === 0) {
    return `
      <div class="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-center space-y-2">
        <div class="text-3xl">🏪</div>
        <div class="text-sm font-black text-amber-200">아직 오픈한 직영 지점이 없습니다</div>
        <p class="text-xs text-stone-400">하단 <b>[수도권 지도]</b>에서 다른 상권의 지점을 인수하면, 이곳에서 지점별 운영 컨셉을 설정해 정산 수익을 극대화할 수 있습니다.</p>
      </div>
    `;
  }
  return `
    <div class="space-y-3">
      <section class="rounded-2xl border border-emerald-500/40 bg-stone-900 p-4">
        <h3 class="font-black text-emerald-300 text-sm">🏪 직영 지점별 운영 컨셉 특화</h3>
        <p class="mt-1 text-[11px] text-stone-400">각 지점 상권 성격에 맞는 운영 컨셉을 배정하면 16일 정산 시 지점 수익 배율이 최대 +30%까지 상승합니다.</p>
      </section>
      <div class="grid gap-3 md:grid-cols-2">
        ${state.branches.map(bid => {
          const loc = METRO_LOCATIONS.find(l => l.id === bid);
          if (!loc) return "";
          const curConcept = state.branchConcepts[bid] || "standard";
          const mult = getBranchConceptMultiplier(bid);
          const expectedIncome = Math.round(loc.rent * 1.45 * mult);
          const bonusPct = Math.round((mult - 1) * 100);
          return `
            <article class="rounded-2xl border border-stone-800 bg-stone-900 p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="text-xs text-emerald-400 font-bold">${loc.region}</div>
                  <div class="text-sm font-black text-white">🏪 ${loc.name} 지점</div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-stone-400">16일 정산 예상 수익</div>
                  <div class="text-xs font-black text-amber-300">+${expectedIncome.toLocaleString()}원 <span class="${bonusPct > 0 ? "text-emerald-400" : bonusPct < 0 ? "text-rose-400" : "text-stone-400"}">(${bonusPct >= 0 ? "+" : ""}${bonusPct}%)</span></div>
                </div>
              </div>
              <div class="space-y-1.5">
                ${BRANCH_CONCEPTS.map(c => {
                  const selected = curConcept === c.id;
                  const label = `${loc.region} ${loc.name}`;
                  const fit = c.id !== "standard" && (c.matchKeywords || []).some(kw => label.includes(kw));
                  return `
                    <button onclick="setBranchConcept('${bid}', '${c.id}')"
                      class="w-full text-left rounded-xl border px-3 py-2 transition ${selected ? "border-emerald-400 bg-emerald-950/50 text-white" : "border-stone-800 bg-stone-950 text-stone-300 hover:border-stone-700"}">
                      <div class="flex items-center justify-between text-xs font-extrabold">
                        <span>${c.icon} ${c.name}</span>
                        ${fit ? '<span class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">✨ 상권 추천</span>' : ""}
                      </div>
                      <div class="mt-0.5 text-[10px] text-stone-400">${c.desc}</div>
                    </button>
                  `;
                }).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
window.renderBranchConceptApp = renderBranchConceptApp;

const previousOpenModalForTablet = window.openModal;
window.openModal = (id) => {
  if (id === "phoneModal") {
    activeDevice = "phone";
    if (!["msg", "sns"].includes(activePhoneApp)) activePhoneApp = "msg";
    const tablet = document.getElementById("tabletModal");
    if (tablet) tablet.classList.add("hidden");
  }
  if (id === "tabletModal") {
    activeDevice = "tablet";
    if (!["stock", "coin", "market", "staff", "branch", "report"].includes(activePhoneApp)) activePhoneApp = "stock";
    const phone = document.getElementById("phoneModal");
    if (phone) phone.classList.add("hidden");
  }
  previousOpenModalForTablet(id);
  if (id === "tabletModal") renderPhoneApp();
};

window.openTabletApp = (tab = "stock") => {
  activeDevice = "tablet";
  activePhoneApp = ["stock", "coin", "market", "staff", "branch", "report"].includes(tab) ? tab : "stock";
  const phone = document.getElementById("phoneModal");
  if (phone) phone.classList.add("hidden");
  if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert(activePhoneApp);
  const badge = document.getElementById("tabletBadge");
  if (badge) badge.classList.add("hidden");
  const modal = document.getElementById("tabletModal");
  if (modal) modal.classList.remove("hidden");
  ["stock", "coin", "market", "staff", "branch", "report"].forEach(name => {
    const button = document.getElementById(`tApp${name.charAt(0).toUpperCase()}${name.slice(1)}`);
    if (button) button.className = name === activePhoneApp ? "rounded-xl bg-violet-600 py-2 text-white" : "rounded-xl py-2 text-stone-400";
  });
  renderPhoneApp();
};

window.switchPhoneApp = (app) => {
  if (activeDevice === "phone" && app !== "sns" && app !== "msg") {
    return window.openTabletApp(app === "market" ? "market" : app);
  }
  activePhoneApp = app;
  if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert(app);
  const suffix = app === "sns" ? "Sns" : "Msg";
  ["Sns", "Msg"].forEach(key => {
    const button = document.getElementById(`appBtn${key}`);
    if (button) button.className = key === suffix
      ? "relative py-1.5 rounded-xl flex flex-col items-center gap-0.5 bg-amber-500/20 text-amber-300"
      : "relative py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-stone-400";
  });
  renderPhoneApp();
};

window.openPhoneFromAlert = () => {
  const pa = ensurePhoneAlerts();
  const target = pa.unreadMsg > 0
    ? "msg"
    : pa.unreadSns
      ? "sns"
      : (activeDevice === "phone" && ["msg", "sns"].includes(activePhoneApp) ? activePhoneApp : "msg");
  activeDevice = "phone";
  activePhoneApp = target === "sns" ? "sns" : "msg";
  window.openModal("phoneModal");
  window.switchPhoneApp(activePhoneApp);
};

window.openTabletFromAlert = () => {
  const pa = ensurePhoneAlerts();
  const tabletTarget = pa.unreadMarket
    ? "market"
    : pa.unreadStock
      ? "stock"
      : pa.unreadCoin
        ? "coin"
        : (activeDevice === "tablet" && ["stock", "coin", "market", "staff", "branch", "report"].includes(activePhoneApp) ? activePhoneApp : "stock");
  window.openTabletApp(tabletTarget);
};

window.addEventListener("DOMContentLoaded", () => {
  ensureExpansionState();
  renderGuideQuestBanner();
});
