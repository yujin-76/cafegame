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

