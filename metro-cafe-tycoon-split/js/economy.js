// 경제 시스템: 매출, 재고, 메뉴/업그레이드 구매, 주식·코인 거래
// 게임 상태와 UI 함수는 game.js에서 주입받아 기존 동작을 유지합니다.
export function createEconomySystem(deps) {
  const {
    getState, getCurrentLocation, visitorPool, showToast,
    spawnFloatingText, updateHUD, renderPhoneApp, renderPosModal,
    getPendingRegularOffer, setPendingRegularOffer
  } = deps;

  function calculateMenuSalePrice(menu) {
    const state = getState();
    const loc = getCurrentLocation();
    const grinderLv = state.upgrades.find(u => u.id === "grinder")?.level || 0;
    let bonusMult = 1 + (grinderLv * 0.10);
    state.regulars.forEach(regId => {
      const v = visitorPool.find(item => item.id === regId);
      if (v && v.bonusType === "price") bonusMult += v.bonusVal;
    });
    return Math.round(menu.price * loc.mult * bonusMult);
  }

  function tickAutoBrew() {
    const state = getState();
    const autoLv = Math.max(1, state.upgrades.find(u => u.id === "auto_drip")?.level || 1);
    if (state.stock <= 0) return;
    if (Math.random() < Math.min(0.92, 0.35 + autoLv * 0.06)) {
      state.stock = Math.max(0, state.stock - 1);
      let randomEarned = Math.floor(Math.random() * 901) + 100;
      state.regulars.forEach(regId => {
        const v = visitorPool.find(item => item.id === regId);
        if (v && v.bonusType === "auto") randomEarned += v.bonusVal;
      });
      state.cash += randomEarned;
      spawnFloatingText(`자동추출 +${randomEarned.toLocaleString()}원`, window.innerWidth * 0.36, window.innerHeight * 0.62, "#6ee7b7");
    }
  }

  function processCustomerOrder(customer) {
    const state = getState();
    if (state.stock <= 0) {
      customer.bubbleText = "원두가 떨어졌네요 😢";
      showToast("⚠️ 원두 재고가 부족합니다! 스마트폰 [재료발주] 앱에서 주문하세요.", "rose");
      return;
    }
    state.stock = Math.max(0, state.stock - 1);
    const earned = calculateMenuSalePrice(customer.menu);
    state.cash += earned;
    state.reputation = Math.min(999, state.reputation + 1);

    const vid = customer.visitor.id;
    state.visitorCounts[vid] = (state.visitorCounts[vid] || 0) + 1;
    const visits = state.visitorCounts[vid];
    customer.bubbleText = `+${earned.toLocaleString()}원 (${visits}회차 방문)`;
    spawnFloatingText(`+${earned.toLocaleString()}원`, window.innerWidth * customer.x, window.innerHeight * 0.56, "#34d399");

    if (!state.regulars.includes(vid) && state.regulars.length < 5 && visits >= customer.visitor.neededVisits && !getPendingRegularOffer()) {
      setPendingRegularOffer(customer.visitor);
      document.getElementById("offerAvatar").textContent = customer.visitor.avatar;
      document.getElementById("offerName").textContent = `${customer.visitor.name} (${visits}회 방문 달성!)`;
      document.getElementById("offerPerk").textContent = `✨ 특수 효과: ${customer.visitor.perk}`;
      document.getElementById("offerFav").textContent = `☕ 최애 메뉴: ${customer.visitor.fav}`;
      document.getElementById("regularOfferModal").classList.remove("hidden");
    }
    updateHUD();
  }

  function unlockMenu(idx) {
    const state = getState();
    const m = state.menus[idx];
    if (!m) return;
    if (state.cash < m.cost) return showToast("자금이 부족합니다!", "rose");
    state.cash -= m.cost;
    m.unlocked = true;
    state.reputation += 8;
    showToast(`☕ 신메뉴 '${m.name}' 출시 완료!`, "emerald");
    updateHUD();
    renderPosModal();
  }

  function buyUpgrade(idx) {
    const state = getState();
    const u = state.upgrades[idx];
    if (!u) return;
    const cost = Math.round(u.baseCost * Math.pow(1.45, u.level));
    if (state.cash < cost) return showToast("자금이 부족합니다!", "rose");
    u.level += 1;
    state.cash -= cost;
    if (u.id === "interior") state.reputation += 10;
    showToast(`⚙️ '${u.name}' Lv.${u.level} 강화 완료!`, "sky");
    updateHUD();
    renderPosModal();
  }

  function orderIngredients(amount, cost) {
    const state = getState();
    if (state.cash < cost) return showToast("발주 자금이 부족합니다!", "rose");
    if (state.stock >= state.maxStock) return showToast("이미 창고 재고가 가득 찼습니다!", "amber");
    state.cash -= cost;
    state.stock = Math.min(state.maxStock, state.stock + amount);
    showToast(`📦 식자재 발주 완료! 재고가 ${state.stock}잔분이 되었습니다.`, "emerald");
    updateHUD();
    renderPhoneApp();
  }

  function expandStorage() {
    const state = getState();
    if (state.cash < 350000) return showToast("자금이 부족합니다!", "rose");
    state.cash -= 350000;
    state.maxStock += 50;
    showToast(`🧊 냉장 창고 확장 완료! 최대 ${state.maxStock}잔 보관 가능`, "sky");
    updateHUD();
    renderPhoneApp();
  }

  function tradeAsset(type, idx, dir) {
    const state = getState();
    if (type === "stock") {
      const s = state.stocks[idx];
      if (!s) return;
      if (dir > 0) {
        if (state.cash < s.price) return showToast("현금이 부족합니다!", "rose");
        state.cash -= s.price;
        s.owned += 1;
      } else {
        if (s.owned <= 0) return showToast("보유 주식이 없습니다!", "rose");
        s.owned -= 1;
        state.cash += s.price;
      }
    } else {
      const c = state.coins[idx];
      if (!c) return;
      if (dir > 0) {
        if (state.cash < 100000) return showToast("최소 매수금 10만원이 부족합니다!", "rose");
        state.cash -= 100000;
        c.owned += 100000 / c.price;
      } else {
        if (c.owned <= 0) return showToast("보유 코인이 없습니다!", "rose");
        state.cash += Math.round(c.owned * c.price);
        c.owned = 0;
      }
    }
    updateHUD();
    renderPhoneApp();
  }

  return { calculateMenuSalePrice, tickAutoBrew, processCustomerOrder, unlockMenu, buyUpgrade, orderIngredients, expandStorage, tradeAsset };
}
