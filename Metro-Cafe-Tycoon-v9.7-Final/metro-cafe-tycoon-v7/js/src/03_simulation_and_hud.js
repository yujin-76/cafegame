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

