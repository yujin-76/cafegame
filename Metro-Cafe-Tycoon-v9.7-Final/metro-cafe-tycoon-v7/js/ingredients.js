// 카페 식자재 마켓 카탈로그 (원두는 기본 상시 구비 가정) & 나만의 시그니처 메뉴 레시피 평가 엔진

export const INGREDIENT_CATEGORIES = [
  { id: "all", label: "전체 재료" },
  { id: "base", label: "유제품·베이스" },
  { id: "syrup", label: "시럽·소스" },
  { id: "fruit", label: "과일·청·티" },
  { id: "topping", label: "크림·토핑" }
];

export const INGREDIENT_CATALOG = [
  // 유제품·베이스 (base)
  { id: "milk", name: "서울 1A등급 우유", category: "base", icon: "🥛", packUnits: 15, price: 6000, unitCost: 400, tags: ["dairy", "soft", "classic"], desc: "라떼와 밀크 베이스의 기본이 되는 고소한 신선 우유 (15잔분)" },
  { id: "oat_milk", name: "바리스타 귀리우유", category: "base", icon: "🌾", packUnits: 12, price: 9600, unitCost: 800, tags: ["dairy", "nutty", "trendy"], desc: "비건·고소함 열풍의 주역! 커피·말차와 찰떡궁합 (12잔분)" },
  { id: "condensed_milk", name: "달콤 연유", category: "base", icon: "🥫", packUnits: 15, price: 7500, unitCost: 500, tags: ["sweet", "dairy", "classic"], desc: "돌체라떼·베트남 연유커피의 묵직한 단맛 (15잔분)" },
  { id: "sparkling_water", name: "초정 강탄산수", category: "base", icon: "🫧", packUnits: 20, price: 7000, unitCost: 350, tags: ["sparkling", "fresh"], desc: "과일청과 만나 청량한 에이드를 만드는 탄산수 (20잔분)" },
  { id: "ice_cream", name: "바닐라 젤라또 아이스크림", category: "base", icon: "🍨", packUnits: 10, price: 11000, unitCost: 1100, tags: ["dairy", "sweet", "dessert"], desc: "아포가토와 플로트 음료의 핵심 토핑 베이스 (10잔분)" },

  // 시럽·소스 (syrup)
  { id: "vanilla_syrup", name: "마다가스카르 바닐라빈 시럽", category: "syrup", icon: "🌼", packUnits: 20, price: 10000, unitCost: 500, tags: ["sweet", "classic", "aromatic"], desc: "호불호 없는 카페 스테디셀러 천연 바닐라 시럽 (20잔분)" },
  { id: "caramel_sauce", name: "솔티드 카라멜 드리즐", category: "syrup", icon: "🍯", packUnits: 18, price: 10800, unitCost: 600, tags: ["sweet", "salty", "dessert"], desc: "단짠 매력의 진한 버터 카라멜 소스 (18잔분)" },
  { id: "choco_sauce", name: "벨기에 다크 초코소스", category: "syrup", icon: "🍫", packUnits: 18, price: 11700, unitCost: 650, tags: ["sweet", "choco", "dessert"], desc: "모카와 초코 라떼에 깊은 풍미를 더하는 카카오 소스 (18잔분)" },
  { id: "hazelnut_syrup", name: "로스티드 헤이즐넛 시럽", category: "syrup", icon: "🌰", packUnits: 20, price: 9500, unitCost: 475, tags: ["nutty", "sweet", "classic"], desc: "아메리카노·라떼 어디에나 어울리는 고소한 견과 향 (20잔분)" },
  { id: "pistachio_paste", name: "브론테 피스타치오 페이스트", category: "syrup", icon: "🟢", packUnits: 10, price: 16000, unitCost: 1600, tags: ["nutty", "trendy", "dessert"], desc: "SNS 인증샷 성지를 만드는 진한 피스타치오 스프레드 (10잔분)" },
  { id: "mint_syrup", name: "페퍼민트 쿨 시럽", category: "syrup", icon: "🌿", packUnits: 18, price: 9000, unitCost: 500, tags: ["mint", "fresh"], desc: "상쾌한 민트향! 초코와 만나면 민초파 대환호 (18잔분)" },

  // 과일·청·티 (fruit)
  { id: "strawberry_base", name: "논산 생딸기 과육청", category: "fruit", icon: "🍓", packUnits: 12, price: 13200, unitCost: 1100, tags: ["fruit", "sweet", "berry", "trendy"], desc: "딸기라떼·딸기에이드의 정석! 큼직한 과육이 살아있는 청 (12잔분)" },
  { id: "lemon_syrup", name: "시칠리아 레몬청", category: "fruit", icon: "🍋", packUnits: 16, price: 9600, unitCost: 600, tags: ["fruit", "sour", "fresh"], desc: "에이드와 아이스티에 상큼함을 폭발시키는 레몬청 (16잔분)" },
  { id: "grapefruit_syrup", name: "플로리다 자몽청", category: "fruit", icon: "🍊", packUnits: 15, price: 11250, unitCost: 750, tags: ["fruit", "sour", "fresh", "tea"], desc: "자몽에이드와 자몽허니블랙티의 쌉싸름한 매력 (15잔분)" },
  { id: "jeju_matcha", name: "제주 유기농 말차 파우더", category: "fruit", icon: "🍵", packUnits: 14, price: 14000, unitCost: 1000, tags: ["tea", "earthy", "trendy"], desc: "진한 녹빛의 쌉싸름하고 깊은 제주 첫물 말차 (14잔분)" },
  { id: "earl_grey", name: "베르가못 얼그레이 티백", category: "fruit", icon: "🫖", packUnits: 20, price: 9000, unitCost: 450, tags: ["tea", "aromatic", "classic"], desc: "밀크티와 하이볼 스타일 티 에이드에 쓰이는 홍차 (20잔분)" },
  { id: "mango_puree", name: "애플망고 퓨레", category: "fruit", icon: "🥭", packUnits: 12, price: 12600, unitCost: 1050, tags: ["fruit", "sweet", "tropical"], desc: "트로피컬 망고 스무디·에이드를 위한 진한 퓨레 (12잔분)" },

  // 크림·토핑 (topping)
  { id: "whipping_cream", name: "수제 마스카포네 크림", category: "topping", icon: "🍦", packUnits: 14, price: 11200, unitCost: 800, tags: ["cream", "dairy", "sweet", "trendy"], desc: "아인슈페너와 크림라떼 위에 쫀쫀하게 올리는 시그니처 크림 (14잔분)" },
  { id: "lotus_crumb", name: "로투스 비스코프 크럼블", category: "topping", icon: "🍪", packUnits: 16, price: 8800, unitCost: 550, tags: ["dessert", "sweet", "nutty"], desc: "크림 위에 뿌리면 비주얼과 바삭한 식감이 살아나는 토핑 (16잔분)" },
  { id: "tapioca_pearl", name: "흑당 타피오카 펄", category: "topping", icon: "🧋", packUnits: 14, price: 9800, unitCost: 700, tags: ["dessert", "sweet", "chewy"], desc: "밀크티·흑당라떼에 쫀득한 식감을 더하는 펄 토핑 (14잔분)" },
  { id: "cinnamon_powder", name: "실론 시나몬 파우더", category: "topping", icon: "🤎", packUnits: 25, price: 6250, unitCost: 250, tags: ["aromatic", "classic"], desc: "카푸치노·애플·바닐라 음료에 고급스러운 향을 입히는 스파이스 (25잔분)" },
  { id: "sea_salt", name: "게랑드 천일염 플레이크", category: "topping", icon: "🧂", packUnits: 25, price: 6500, unitCost: 260, tags: ["salty", "trendy"], desc: "소금크림라떼·단짠 카라멜 음료를 완성하는 미네랄 소금 (25잔분)" },
  { id: "red_bean", name: "국산 통단팥 토핑", category: "topping", icon: "🫘", packUnits: 14, price: 8400, unitCost: 600, tags: ["earthy", "sweet", "korean"], desc: "할매니얼 감성! 말차·우유·인절미 스타일과 잘 어울리는 팥 (14잔분)" },
  { id: "chili_flakes", name: "청양 매운 고춧가루", category: "topping", icon: "🌶️", packUnits: 20, price: 5000, unitCost: 250, tags: ["weird", "spicy"], desc: "실험정신 투철한 사장님을 위한 도전용 이색 토핑 (20잔분)" }
];

export function getIngredientById(id) {
  return INGREDIENT_CATALOG.find(item => item.id === id) || null;
}

// 선택한 재료 조합(1~4종) + 원두 사용 여부에 따른 레시피 맛·트렌드·흥행성 평가
export function evaluateCustomRecipe(ingredientIds, useCoffee = true) {
  const items = ingredientIds.map(getIngredientById).filter(Boolean);
  const ids = new Set(items.map(i => i.id));
  const tags = items.flatMap(i => i.tags || []);
  const unitCost = items.reduce((sum, i) => sum + (i.unitCost || 500), 0) + (useCoffee ? 200 : 0);

  // 1. 명백한 괴식/충돌 조합 판정 (SNS 밈화 또는 혹평으로 아무도 안 사먹음)
  const hasChili = ids.has("chili_flakes");
  const hasSparklingAndMilk = ids.has("sparkling_water") && (ids.has("milk") || ids.has("oat_milk") || ids.has("condensed_milk"));
  const hasCoffeeAndSour = useCoffee && (ids.has("lemon_syrup") || ids.has("grapefruit_syrup")) && !ids.has("sparkling_water");
  const hasMintAndRedBean = ids.has("mint_syrup") && ids.has("red_bean");
  const hasMintAndSour = ids.has("mint_syrup") && (ids.has("lemon_syrup") || ids.has("grapefruit_syrup"));

  if (hasChili && !ids.has("choco_sauce")) {
    return {
      tier: "flop",
      badge: "💀 괴식 경보 · 혹평 속출",
      score: 18,
      suggestedPrice: Math.max(2000, Math.round((unitCost * 2.1) / 100) * 100),
      unitCost,
      popularity: 0.08, // 거의 안 사먹음
      viralChance: 0.01,
      summary: "첫 모금에 목이 칼칼해지는 충격적인 매운맛! 손님들이 1점 리뷰를 남기며 외면합니다."
    };
  }

  if (hasSparklingAndMilk) {
    return {
      tier: "flop",
      badge: "🤢 몽글몽글 분리됨 · 판매부진",
      score: 22,
      suggestedPrice: Math.max(2200, Math.round((unitCost * 2.2) / 100) * 100),
      unitCost,
      popularity: 0.10,
      viralChance: 0.01,
      summary: "탄산수와 우유가 만나 컵 속에서 순두부처럼 응고되었습니다. 손님들이 주문 후 당황해합니다."
    };
  }

  if (hasCoffeeAndSour || hasMintAndRedBean || hasMintAndSour) {
    return {
      tier: "flop",
      badge: "😵 호불호 극심 · 외면받는 메뉴",
      score: 28,
      suggestedPrice: Math.max(2400, Math.round((unitCost * 2.3) / 100) * 100),
      unitCost,
      popularity: 0.14,
      viralChance: 0.02,
      summary: "재료끼리 향이 심하게 충돌해 무슨 맛인지 알 수 없다는 평이 지배적입니다. 거의 팔리지 않습니다."
    };
  }

  // 2. 황금 시너지(SNS 대박 떡상 후보!) 판정
  let synergyBonus = 0;
  let synergyReason = "";

  // 황금 조합 리스트
  if (useCoffee && ids.has("whipping_cream") && (ids.has("sea_salt") || ids.has("caramel_sauce") || ids.has("lotus_crumb"))) {
    synergyBonus = 34;
    synergyReason = "쫀쫀한 수제 크림에 단짠·바삭한 토핑이 더해져 인스타 인증샷 성지로 등극할 환상 조합!";
  } else if (ids.has("pistachio_paste") && (ids.has("whipping_cream") || ids.has("milk") || ids.has("oat_milk"))) {
    synergyBonus = 36;
    synergyReason = "진한 피스타치오와 부드러운 크림·우유의 만남! 요즘 MZ세대가 줄 서서 마시는 트렌드 정조준!";
  } else if (ids.has("strawberry_base") && (ids.has("milk") || ids.has("oat_milk") || ids.has("jeju_matcha"))) {
    synergyBonus = 33;
    synergyReason = "비주얼부터 압도적인 층 분리 색감! 달콤 상큼한 생딸기 조합이 폭발적 반응을 부릅니다.";
  } else if (ids.has("jeju_matcha") && (ids.has("oat_milk") || ids.has("whipping_cream") || ids.has("red_bean"))) {
    synergyBonus = 32;
    synergyReason = "깊고 쌉싸름한 제주 말차와 고소함의 완벽한 밸런스! 단골들이 매일 찾는 시그니처 후보!";
  } else if (ids.has("sparkling_water") && (ids.has("lemon_syrup") || ids.has("grapefruit_syrup") || ids.has("mango_puree") || ids.has("strawberry_base"))) {
    synergyBonus = 30;
    synergyReason = "톡 쏘는 탄산수와 진한 과일청의 청량감! 맑고 화창한 날 불티나게 팔릴 효자 메뉴입니다.";
  } else if (ids.has("choco_sauce") && ids.has("mint_syrup")) {
    synergyBonus = 29;
    synergyReason = "강력한 팬덤을 거느린 민트초코 조합! 민초단 성지로 소문나며 바이럴 가능성이 높습니다.";
  } else if (ids.has("earl_grey") && (ids.has("milk") || ids.has("tapioca_pearl") || ids.has("grapefruit_syrup"))) {
    synergyBonus = 31;
    synergyReason = "향긋한 베르가못 홍차 베이스에 쫀득·상큼한 포인트가 어우러진 카페 전문점 퀄리티!";
  } else if (useCoffee && ids.has("ice_cream")) {
    synergyBonus = 28;
    synergyReason = "진한 에스프레소와 차가운 바닐라 젤라또의 대비가 일품인 디저트형 시그니처!";
  } else if (useCoffee && (ids.has("vanilla_syrup") || ids.has("condensed_milk") || ids.has("hazelnut_syrup")) && (ids.has("milk") || ids.has("oat_milk"))) {
    synergyBonus = 25;
    synergyReason = "누구나 사랑하는 클래식 라떼 변주! 안정적인 회전율과 높은 재주문율이 기대됩니다.";
  }

  // 기본 점수 계산
  const baseScore = 48 + Math.min(18, items.length * 5) + synergyBonus + (Math.floor(Math.random() * 11) - 5);
  const clampedScore = Math.max(30, Math.min(99, baseScore));

  if (clampedScore >= 76) {
    return {
      tier: "hit",
      badge: "🔥 SNS 떡상 유망주 · 황금 레시피",
      score: clampedScore,
      suggestedPrice: Math.max(3200, Math.round((unitCost * 3.4) / 100) * 100),
      unitCost,
      popularity: 1.65, // 손님 주문 선택 가중치 높음
      viralChance: 0.24, // 판매 시 SNS 바이럴 자동 발동 확률 높음
      summary: synergyReason || "재료 간의 풍미와 색감 밸런스가 완벽합니다! 카페그램 릴스 떡상이 기대됩니다."
    };
  }

  if (clampedScore >= 52) {
    return {
      tier: "normal",
      badge: "☕ 무난한 데일리 신메뉴",
      score: clampedScore,
      suggestedPrice: Math.max(2500, Math.round((unitCost * 2.8) / 100) * 100),
      unitCost,
      popularity: 1.0,
      viralChance: 0.06,
      summary: synergyReason || "호불호 없이 깔끔하게 즐기기 좋은 무난한 레시피입니다. 꾸준한 판매가 예상됩니다."
    };
  }

  return {
    tier: "flop",
    badge: "📉 밋밋한 맛 · 주문 저조 예상",
    score: clampedScore,
    suggestedPrice: Math.max(2000, Math.round((unitCost * 2.2) / 100) * 100),
    unitCost,
    popularity: 0.22,
    viralChance: 0.01,
    summary: "임팩트가 부족하고 재료 조화가 애매해 손님들의 선택을 거의 받지 못할 것 같습니다."
  };
}
