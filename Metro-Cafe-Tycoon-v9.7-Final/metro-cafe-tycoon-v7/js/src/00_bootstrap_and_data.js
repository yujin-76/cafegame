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

