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
