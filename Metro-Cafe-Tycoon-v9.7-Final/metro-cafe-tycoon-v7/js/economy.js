// 경제 시스템: 매출, 재료 창고·장바구니 배달, 나만의 메뉴 개발·SNS 흥행, 주식·코인 거래
import { INGREDIENT_CATALOG, getIngredientById, evaluateCustomRecipe } from "./ingredients.js";

export function createEconomySystem(deps) {
  const {
    getState, getCurrentLocation, visitorPool, showToast,
    spawnFloatingText, updateHUD, renderPhoneApp, renderPosModal,
    getPendingRegularOffer, setPendingRegularOffer, addReputation
  } = deps;

  function applyRep(rawDelta, opts = {}) {
    if (typeof addReputation === "function") return addReputation(rawDelta, opts);
    const state = getState();
    state.reputation = Math.max(1, Math.min(1000, Math.round((state.reputation || 10) + rawDelta)));
    return rawDelta;
  }

  function ensureIngredientState() {
    const state = getState();
    if (!state.ingredientStock || typeof state.ingredientStock !== "object") {
      // 개업 기본 지급 식자재 (우유 15, 바닐라시럽 10, 레몬청 10)
      state.ingredientStock = {
        milk: 15,
        vanilla_syrup: 10,
        lemon_syrup: 10
      };
    }
    if (!Array.isArray(state.ingredientCart)) state.ingredientCart = [];
    if (!Array.isArray(state.pendingDeliveries)) state.pendingDeliveries = [];
    if (!state.ingredientCaps || typeof state.ingredientCaps !== "object") state.ingredientCaps = {};
  }

  function ensureStorageUpgradeEntry() {
    const state = getState();
    if (Array.isArray(state.upgrades)) state.upgrades = state.upgrades.filter(upgrade => upgrade.id !== "storage");
  }

  function getMaxIngredientCapacity() {
    return INGREDIENT_CATALOG.length * 80;
  }

  function getIngredientCapacity(ingredientId) {
    const state = getState();
    if (!state.ingredientCaps || typeof state.ingredientCaps !== "object") state.ingredientCaps = {};
    const cap = Number(state.ingredientCaps[ingredientId]);
    return Number.isFinite(cap) && cap > 0 ? cap : 80;
  }

  function getCommittedIngredientUnits(ingredientId) {
    ensureIngredientState();
    const state = getState();
    const stock = Number(state.ingredientStock[ingredientId]) || 0;
    const incoming = (state.pendingDeliveries || []).reduce((sum, delivery) => {
      return sum + (delivery.items || []).filter(item => item.id === ingredientId)
        .reduce((itemSum, item) => itemSum + (Number(item.units) || 0), 0);
    }, 0);
    const cart = (state.ingredientCart || []).filter(item => item.id === ingredientId)
      .reduce((sum, item) => {
        const info = getIngredientById(item.id);
        return sum + (info ? info.packUnits * item.qty : 0);
      }, 0);
    return stock + incoming + cart;
  }

  function getIngredientPrice(ingredientId) {
    const info = getIngredientById(ingredientId);
    if (!info) return 0;
    const seasonal = {
      0: ["strawberry_base", "lemon_syrup"],
      1: ["mango_puree", "lemon_syrup", "sparkling_water"],
      2: ["cinnamon_powder", "red_bean", "caramel_sauce"],
      3: ["choco_sauce", "whipping_cream", "pistachio_paste"]
    };
    const inSeason = (seasonal[getState().seasonIdx] || []).includes(ingredientId);
    const seasonalIngredient = Object.values(seasonal).some(items => items.includes(ingredientId));
    if (!seasonalIngredient) return info.price;
    return Math.round(info.price * (inSeason ? 0.88 : 1.15));
  }

  function getSeasonalMenuBonus(menu) {
    const seasonal = {
      0: ["strawberry_base", "lemon_syrup"],
      1: ["mango_puree", "lemon_syrup", "sparkling_water"],
      2: ["cinnamon_powder", "red_bean", "caramel_sauce"],
      3: ["choco_sauce", "whipping_cream", "pistachio_paste"]
    };
    const preferred = seasonal[getState().seasonIdx] || [];
    return (menu.ingredients || []).some(id => preferred.includes(id)) ? 0.12 : 0;
  }

  function getTotalIngredientUnits() {
    ensureIngredientState();
    const state = getState();
    return Object.values(state.ingredientStock).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  function getPendingDeliveryUnits() {
    ensureIngredientState();
    const state = getState();
    return (state.pendingDeliveries || []).reduce((sum, d) => {
      const u = (d.items || []).reduce((s, it) => s + (Number(it.units) || 0), 0);
      return sum + u;
    }, 0);
  }

  function getCartUnits() {
    ensureIngredientState();
    const state = getState();
    return (state.ingredientCart || []).reduce((sum, c) => {
      const info = getIngredientById(c.id);
      return sum + (info ? info.packUnits * c.qty : 0);
    }, 0);
  }

  // 해당 메뉴를 현재 재료 창고 재고로 만들 수 있는지 확인 (원두는 항상 있음!)
  function canMakeMenu(menu) {
    ensureIngredientState();
    const state = getState();
    const reqs = menu.ingredients || [];
    if (reqs.length === 0) return true; // 아메리카노처럼 원두만 쓰는 메뉴는 항상 제조 가능
    return reqs.every(ingId => (state.ingredientStock[ingId] || 0) >= 1);
  }

  function consumeMenuIngredients(menu) {
    ensureIngredientState();
    const state = getState();
    const reqs = menu.ingredients || [];
    reqs.forEach(ingId => {
      if ((state.ingredientStock[ingId] || 0) > 0) {
        state.ingredientStock[ingId] -= 1;
      }
    });
  }

  function calculateMenuSalePrice(menu) {
    const state = getState();
    const loc = getCurrentLocation();
    const grinderLv = state.upgrades.find(u => u.id === "grinder")?.level || 0;
    let bonusMult = 1 + (grinderLv * 0.10);
    if (state.placedFurniture && typeof deps.getFurnitureCatalog === "function") {
      const cat = deps.getFurnitureCatalog();
      Object.values(state.placedFurniture).forEach(fid => {
        if (!fid) return;
        const item = cat.find(x => x.id === fid);
        if (item && item.tipBonus) bonusMult += item.tipBonus;
      });
    }
    if ((state.snsViralBoostTicks || 0) > 0) {
      bonusMult += 0.15;
    }
    // SNS 유행 히트 메뉴는 추가 프리미엄(+18%)
    if (menu.isTrending) {
      bonusMult += 0.18;
    }
    bonusMult += getSeasonalMenuBonus(menu);
    return Math.round(menu.price * loc.mult * bonusMult);
  }

  // 원두는 항상 상시 구비되어 있으므로 자동 추출 머신은 언제든 원두로 가동됨
  function tickAutoBrew() {
    const state = getState();
    const autoLv = Math.max(1, state.upgrades.find(u => u.id === "auto_drip")?.level || 1);
    if (Math.random() < Math.min(0.92, 0.35 + autoLv * 0.06)) {
      let randomEarned = Math.floor(Math.random() * 901) + 100;
      state.cash += randomEarned;
      if (typeof window.recordSeasonFinance === "function") window.recordSeasonFinance("sales", randomEarned);
      spawnFloatingText(`자동추출 +${randomEarned.toLocaleString()}원`, window.innerWidth * 0.36, window.innerHeight * 0.62, "#6ee7b7");
    }
  }

  function triggerCustomMenuViral(menu) {
    const state = getState();
    const loc = getCurrentLocation();
    menu.isTrending = true;
    menu.viralCount = (menu.viralCount || 0) + 1;
    state.snsViralBoostTicks = Math.min(90, (state.snsViralBoostTicks || 0) + 40);
    state.snsFollowers = (state.snsFollowers || 128) + Math.floor(Math.random() * 85) + 45;
    applyRep(3);

    const ingNames = (menu.ingredients || [])
      .map(id => getIngredientById(id)?.name)
      .filter(Boolean)
      .join(" + ");

    state.snsPosts.unshift({
      user: "@seoul_trend_pick",
      badge: "🔥 실시간 SNS 떡상",
      mood: `🏆 '${menu.name}' 대박 유행중!`,
      photoTheme: "viral",
      timeLabel: "방금 전",
      tag: `#${menu.name.replace(/\s/g, "")} #${loc.name.replace(/\s/g, "")} #카페신메뉴떡상`,
      text: `요즘 ${loc.name}에서 난리 난 '${menu.name}' 드셔보셨나요?! (${ingNames || "시그니처 블렌드"}) 비주얼이랑 맛 조합이 미쳐서 오픈런 해야 함 🔥`,
      likes: Math.floor(Math.random() * 220) + 110,
      comments: [
        "@coffee_zip: 이거 진짜 인생음료 등극함 ㅠㅠ",
        "@dessert_queen: 오늘 퇴근하고 바로 달려갑니다!"
      ],
      liked: false,
      replied: false
    });
    if (state.snsPosts.length > 15) state.snsPosts.pop();

    showToast(`🔥 대박! '${menu.name}' 메뉴가 카페그램에서 유행하기 시작했습니다! (팔로워 급증 · 단가 UP)`, "amber");
  }

  function processCustomerOrder(customer) {
    const state = getState();
    ensureIngredientState();

    // 해당 메뉴의 재료가 다 떨어졌는지 확인 (원두만 쓰는 메뉴는 항상 가능)
    if (!canMakeMenu(customer.menu)) {
      const missingNames = (customer.menu.ingredients || [])
        .filter(id => (state.ingredientStock[id] || 0) <= 0)
        .map(id => getIngredientById(id)?.name || id);
      applyRep(-1);
      customer.bubbleText = `${missingNames[0] || "재료"} 품절이네요 😢 (-★1)`;
      spawnFloatingText(`품절 실망 (-★1)`, window.innerWidth * customer.x, window.innerHeight * 0.56, "#fb7185");
      updateHUD();
      showToast(`⚠️ '${customer.menu.name}' 재료(${missingNames.join(", ")}) 품절로 손님이 발길을 돌렸습니다! (평판 -1)`, "rose");
      return;
    }

    // 재료 차감 및 판매 정산
    consumeMenuIngredients(customer.menu);
    const earned = calculateMenuSalePrice(customer.menu);
    state.cash += earned;
    if (typeof window.recordSeasonFinance === "function") window.recordSeasonFinance("sales", earned);
    customer.menu.soldCount = (customer.menu.soldCount || 0) + 1;

    // 진행 중인 단체 케이터링/납품 의뢰 카운트 반영
    if (state.activeCateringOrder && state.activeCateringOrder.status === "accepted") {
      const catOrd = state.activeCateringOrder;
      if (!catOrd.menuId || customer.menu.id === catOrd.menuId) {
        catOrd.delivered = (catOrd.delivered || 0) + 1;
        if (catOrd.delivered >= catOrd.targetQty) {
          catOrd.status = "completed";
          state.cash += catOrd.rewardCash;
          applyRep(catOrd.rewardRep);
          const msgObj = (state.messages || []).find(m => m.id === catOrd.msgId);
          if (msgObj) {
            msgObj.resolved = true;
            msgObj.resultText = `✅ 납품 완료! 보수 +${catOrd.rewardCash.toLocaleString()}원 · 평판 상승`;
          }
          showToast(`🎉 단체 납품 의뢰 완료! 보수 +${catOrd.rewardCash.toLocaleString()}원이 입금되었습니다!`, "emerald");
          state.activeCateringOrder = null;
        }
      }
    }

    // 맛 등급에 따른 평판·SNS 바이럴·반응 분기 (구간별 체감 적용)
    if (customer.menu.tier === "flop") {
      // 맛이 없어서 혹평 & 평판 하락
      applyRep(-2);
      customer.mood = "sad";
      customer.bubbleText = `+${earned.toLocaleString()}원... 음, 다시는 안 시킬 듯 🤢`;
      spawnFloatingText(`+${earned.toLocaleString()}원 (혹평 -★2)`, window.innerWidth * customer.x, window.innerHeight * 0.56, "#fb7185");
      if (customer.menu.soldCount === 1 || Math.random() < 0.35) {
        showToast(`📉 '${customer.menu.name}' 맛 평가가 최악입니다! 손님들이 외면해 평판이 떨어집니다.`, "rose");
      }
    } else {
      const baseRepGain = customer.menu.tier === "hit" ? 0.42 : 0.14;
      applyRep(baseRepGain);
      const viralProb = customer.menu.viralChance || 0;
      if (viralProb > 0 && Math.random() < viralProb) {
        triggerCustomMenuViral(customer.menu);
      }

      if (customer.visitor.isGeneral) {
        customer.bubbleText = customer.menu.isTrending
          ? `+${earned.toLocaleString()}원 · SNS 유행 메뉴 역시 최고! 🔥`
          : `+${earned.toLocaleString()}원 · 맛있게 마실게요!`;
        spawnFloatingText(`+${earned.toLocaleString()}원`, window.innerWidth * customer.x, window.innerHeight * 0.56, "#34d399");
      } else {
        const vid = customer.visitor.id;
        state.visitorCounts[vid] = (state.visitorCounts[vid] || 0) + 1;
        const visits = state.visitorCounts[vid];
        customer.bubbleText = `+${earned.toLocaleString()}원 (${customer.visitor.name} ${visits}회차)`;
        spawnFloatingText(`+${earned.toLocaleString()}원`, window.innerWidth * customer.x, window.innerHeight * 0.56, "#34d399");

      }
    }
    updateHUD();
  }

  function unlockMenu(idx) {
    const state = getState();
    const m = state.menus[idx];
    if (!m) return;
    if (state.cash < m.cost) {
      if (typeof window.showFundsWarning === "function") window.showFundsWarning(`메뉴 개발비 ${m.cost.toLocaleString()}원이 부족합니다.`);
      return showToast("자금이 부족합니다!", "rose");
    }
    state.cash -= m.cost;
    m.unlocked = true;
    applyRep(5);
    showToast(`☕ 기본 메뉴 '${m.name}' 출시 완료!`, "emerald");
    updateHUD();
    renderPosModal();
  }

  // 사장님이 직접 재료를 조합해 나만의 신메뉴 출시
  function createCustomMenu({ name, ingredientIds, useCoffee, customPrice }) {
    const state = getState();
    const cleanName = (name || "").trim();
    if (!cleanName || cleanName.length < 2) {
      return showToast("신메뉴 이름을 2글자 이상 입력해 주세요!", "rose");
    }
    if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
      return showToast("최소 1가지 이상의 재료를 선택해 주세요!", "rose");
    }
    if (state.menus.some(m => m.name === cleanName)) {
      return showToast("이미 같은 이름의 메뉴가 존재합니다!", "rose");
    }

    const devCost = 150000;
    if (state.cash < devCost) {
      return showToast(`신메뉴 레시피 개발비(${devCost.toLocaleString()}원)가 부족합니다!`, "rose");
    }

    const evalRes = evaluateCustomRecipe(ingredientIds, useCoffee);
    const salePrice = Math.max(1500, Math.min(15000, Math.round(Number(customPrice) || evalRes.suggestedPrice)));
    const ingNames = ingredientIds.map(id => getIngredientById(id)?.name).filter(Boolean).join(" + ");

    state.cash -= devCost;
    const newMenu = {
      id: `custom_${Date.now()}`,
      name: cleanName,
      price: salePrice,
      cost: devCost,
      unlocked: true,
      isCustom: true,
      useCoffee: Boolean(useCoffee),
      ingredients: [...ingredientIds],
      tier: evalRes.tier, // hit | normal | flop
      tierBadge: evalRes.badge,
      popularity: evalRes.popularity,
      viralChance: evalRes.viralChance,
      isTrending: false,
      soldCount: 0,
      desc: `${useCoffee ? "에스프레소 원두 + " : ""}${ingNames} · ${evalRes.summary}`
    };

    state.menus.unshift(newMenu);

    if (evalRes.tier === "hit") {
      applyRep(4);
      showToast(`✨ 황금 레시피 탄생! '${cleanName}' 출시! SNS 유행 가능성이 매우 높습니다!`, "emerald");
    } else if (evalRes.tier === "flop") {
      showToast(`⚠️ '${cleanName}' 출시 완료... 하지만 재료 궁합이 심상치 않습니다!`, "rose");
    } else {
      applyRep(2);
      showToast(`☕ 나만의 신메뉴 '${cleanName}' 출시 완료!`, "sky");
    }

    updateHUD();
    renderPosModal();
    return true;
  }

  function deleteCustomMenu(menuId) {
    const state = getState();
    const idx = state.menus.findIndex(m => m.id === menuId && m.isCustom);
    if (idx === -1) return;
    const removed = state.menus.splice(idx, 1)[0];
    showToast(`🗑️ '${removed.name}' 메뉴를 메뉴판에서 내렸습니다.`, "amber");
    updateHUD();
    renderPosModal();
  }

  function buyUpgrade(idx) {
    const state = getState();
    const u = state.upgrades[idx];
    if (!u) return;
    if (u.id === "storage") {
      return showToast("식자재는 전체 창고 제한 없이 재료별 보유 상한으로 관리합니다.", "sky");
    }
    const cost = Math.round(u.baseCost * Math.pow(1.45, u.level));
    if (state.cash < cost) {
      if (typeof window.showFundsWarning === "function") window.showFundsWarning(`업그레이드 비용 ${cost.toLocaleString()}원이 부족합니다.`);
      return showToast("자금이 부족합니다!", "rose");
    }
    u.level += 1;
    state.cash -= cost;
    if (u.id === "interior") applyRep(6);
    if (u.id === "storage") {
      showToast(`🧊 창고 확장 완료! Lv.${u.level} (최대 보관 용량 ${getMaxIngredientCapacity()}잔)`, "emerald");
    } else {
      showToast(`⚙️ '${u.name}' Lv.${u.level} 강화 완료!`, "sky");
    }
    updateHUD();
    renderPosModal();
    if (typeof renderPhoneApp === "function") renderPhoneApp();
  }

  function upgradeWarehouseFromPhone() {
    showToast("창고 확장 업그레이드는 제거되었습니다. 재료별 최대 보유량을 확인하세요.", "sky");
  }

  // 장바구니 담기 / 수량 변경 / 비우기
  function addToIngredientCart(ingId, delta = 1) {
    ensureIngredientState();
    const state = getState();
    const item = getIngredientById(ingId);
    if (!item) return;

    if (delta > 0) {
      const usedAfter = getCommittedIngredientUnits(ingId) + (item.packUnits * delta);
      const cap = getIngredientCapacity(ingId);
      if (usedAfter > cap) {
        const remain = Math.max(0, cap - getCommittedIngredientUnits(ingId));
        showToast(`🧊 ${item.name} 보유 상한에 도달합니다. (남은 ${remain}잔 / 상한 ${cap}잔)`, "rose");
        return;
      }
    }

    const existing = state.ingredientCart.find(c => c.id === ingId);
    if (existing) {
      existing.qty += delta;
      if (existing.qty <= 0) {
        state.ingredientCart = state.ingredientCart.filter(c => c.id !== ingId);
      }
    } else if (delta > 0) {
      state.ingredientCart.push({ id: ingId, qty: delta });
    }
    renderPhoneApp();
  }

  function clearIngredientCart() {
    ensureIngredientState();
    const state = getState();
    state.ingredientCart = [];
    renderPhoneApp();
  }

  // 장바구니 일괄 결제 -> 즉시 입고되지 않고 배달 트럭이 출발(약 18~28초 소요)
  function checkoutIngredientCart() {
    ensureIngredientState();
    const state = getState();
    if (state.ingredientCart.length === 0) {
      return showToast("장바구니가 비어 있습니다! 재료를 담아주세요.", "amber");
    }

    let subtotal = 0;
    const orderItems = [];
    state.ingredientCart.forEach(entry => {
      const info = getIngredientById(entry.id);
      if (info && entry.qty > 0) {
        subtotal += getIngredientPrice(entry.id) * entry.qty;
        orderItems.push({
          id: info.id,
          name: info.name,
          icon: info.icon,
          qty: entry.qty,
          units: info.packUnits * entry.qty
        });
      }
    });

    const overCap = orderItems.find(item => getCommittedIngredientUnits(item.id) > getIngredientCapacity(item.id));
    if (overCap) {
      return showToast(`🧊 ${overCap.name} 재료의 개별 보유 상한(${getIngredientCapacity(overCap.id)}잔)을 초과합니다.`, "rose");
    }

    if (getState().employees && getState().employees.inventory) subtotal = Math.round(subtotal * 0.9);
    const deliveryFee = subtotal >= 30000 ? 0 : 2500;
    const totalCost = subtotal + deliveryFee;

    if (state.cash < totalCost) {
      if (typeof window.showFundsWarning === "function") window.showFundsWarning(`식자재 발주에 ${totalCost.toLocaleString()}원이 필요합니다.`);
      return showToast(`발주 결제 금액(${totalCost.toLocaleString()}원)이 부족합니다!`, "rose");
    }

    state.cash -= totalCost;
    if (typeof window.recordSeasonFinance === "function") window.recordSeasonFinance("supplies", -totalCost);
    state.ingredientCart = [];
    state.ingredientOrdersMade = (state.ingredientOrdersMade || 0) + 1;

    // 현실감 있는 배달 시간 (18~26초, 게임 2배속이면 체감 더 빠름)
    const deliverySeconds = Math.floor(Math.random() * 9) + 18;
    const orderNo = `DLV-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    state.pendingDeliveries.push({
      orderNo,
      items: orderItems,
      totalCost,
      remainingSec: deliverySeconds,
      totalSec: deliverySeconds
    });

    showToast(`🚚 식자재 발주 완료! (${orderItems.length}종 · 약 ${deliverySeconds}초 후 매장 도착 예정)`, "sky");
    updateHUD();
    renderPhoneApp();

    if (typeof window.showPurchaseConfirmModal === "function") {
      const itemSummary = orderItems.map(it => `${it.icon} ${it.name} ${it.qty}팩`).join(", ");
      window.showPurchaseConfirmModal({
        icon: "🚚",
        title: "식자재 발주 결제 완료!",
        summary: `주문 내역: <b>${itemSummary}</b><br/>총 결제 금액: <b>-${totalCost.toLocaleString()}원</b> (약 ${deliverySeconds}초 후 도착)`,
        promptText: "부족한 다른 식자재도 계속 추가 주문하시겠습니까?",
        stayLabel: "📦 추가 발주하기",
        doneLabel: "확인 (닫기)"
      });
    }
  }

  // 매 초마다 호출되어 배송중인 식자재 도착 처리
  function tickDeliveries() {
    ensureIngredientState();
    const state = getState();
    if (state.pendingDeliveries.length === 0) return false;

    let arrivedAny = false;
    for (let i = state.pendingDeliveries.length - 1; i >= 0; i--) {
      const d = state.pendingDeliveries[i];
      d.remainingSec -= 1;
      if (d.remainingSec <= 0) {
        d.items.forEach(it => {
          state.ingredientStock[it.id] = (state.ingredientStock[it.id] || 0) + it.units;
        });
        const summary = d.items.map(it => `${it.icon}${it.name} +${it.units}잔`).join(", ");
        showToast(`📦 [배달 도착] 주문(${d.orderNo}) 식자재가 냉장 창고에 입고되었습니다! (${summary})`, "emerald");
        if (typeof window.pushPhoneNotification === "function") {
          window.pushPhoneNotification("market", "📦 식자재 도착");
        }
        state.pendingDeliveries.splice(i, 1);
        arrivedAny = true;
      }
    }
    return arrivedAny;
  }

  // 매매: 주식/코인
  function tradeAsset(type, idx, dir, amt) {
    const state = getState();
    const isStock = type === "stock";
    const a = isStock ? state.stocks[idx] : state.coins[idx];
    if (!a) return;
    if (typeof a.cost !== "number") a.cost = a.price * a.owned;
    if (typeof a.realized !== "number") a.realized = 0;

    if (dir > 0) {
      if (isStock) {
        const qty = Math.max(1, Math.floor(Number(amt) || 1));
        const total = a.price * qty;
        if (state.cash < total) {
          if (typeof window.showFundsWarning === "function") window.showFundsWarning(`주식 매수에 ${total.toLocaleString()}원이 필요합니다.`);
          return showToast("현금이 부족합니다!", "rose");
        }
        state.cash -= total;
        a.owned += qty;
        a.cost += total;
        showToast(`📈 ${a.name} ${qty}주 매수 (${total.toLocaleString()}원)`, "rose");
      } else {
        const won = Math.max(1000, Math.floor(Number(amt) || 100000));
        if (state.cash < won) {
          if (typeof window.showFundsWarning === "function") window.showFundsWarning(`코인 매수에 ${won.toLocaleString()}원이 필요합니다.`);
          return showToast(`현금이 부족합니다! (필요 ${won.toLocaleString()}원)`, "rose");
        }
        state.cash -= won;
        a.owned += won / a.price;
        a.cost += won;
        showToast(`🪙 ${a.name} ${won.toLocaleString()}원 매수`, "rose");
      }
    } else {
      if (a.owned <= 0) return showToast(isStock ? "보유 주식이 없습니다!" : "보유 코인이 없습니다!", "rose");
      let sellQty;
      if (isStock) {
        sellQty = amt === "all" ? a.owned : Math.min(a.owned, Math.max(1, Math.floor(Number(amt) || 1)));
      } else {
        const ratio = Math.min(1, Math.max(0.01, Number(amt) || 1));
        sellQty = ratio >= 0.999 ? a.owned : a.owned * ratio;
      }
      const proceeds = Math.round(sellQty * a.price);
      const costPart = a.owned > 0 ? a.cost * (sellQty / a.owned) : 0;
      const profit = Math.round(proceeds - costPart);
      state.cash += proceeds;
      a.realized += profit;
      a.cost = Math.max(0, a.cost - costPart);
      a.owned = isStock ? a.owned - sellQty : (a.owned - sellQty < 1e-9 ? 0 : a.owned - sellQty);
      if (a.owned === 0) a.cost = 0;
      const sign = profit >= 0 ? "+" : "";
      showToast(`${profit >= 0 ? "🔴" : "🔵"} ${a.name} 매도 · 실현손익 ${sign}${profit.toLocaleString()}원`, profit >= 0 ? "rose" : "sky");
    }
    updateHUD();
    renderPhoneApp();
  }

  return {
    ensureIngredientState,
    ensureStorageUpgradeEntry,
    getMaxIngredientCapacity,
    getIngredientCapacity,
    getCommittedIngredientUnits,
    getIngredientPrice,
    getSeasonalMenuBonus,
    getTotalIngredientUnits,
    getPendingDeliveryUnits,
    getCartUnits,
    upgradeWarehouseFromPhone,
    canMakeMenu,
    calculateMenuSalePrice,
    tickAutoBrew,
    processCustomerOrder,
    unlockMenu,
    createCustomMenu,
    deleteCustomMenu,
    buyUpgrade,
    addToIngredientCart,
    clearIngredientCart,
    checkoutIngredientCart,
    tickDeliveries,
    tradeAsset
  };
}
