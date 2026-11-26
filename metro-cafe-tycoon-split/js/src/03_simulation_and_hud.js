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

